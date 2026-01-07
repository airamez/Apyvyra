using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
using BCrypt.Net;

namespace backend.Controllers;

[Route("api/app_user")]
public class AppUserController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ILogger<AppUserController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly IPasswordValidationService _passwordValidationService;
    private readonly ITranslationService _translationService;

    public AppUserController(AppDbContext context, ILogger<AppUserController> logger, IConfiguration configuration, IEmailService emailService, IPasswordValidationService passwordValidationService, ITranslationService translationService)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _emailService = emailService;
        _passwordValidationService = passwordValidationService;
        _translationService = translationService;
    }

    // POST: api/app_user
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<AppUser>> Register(RegisterRequest request)
    {
        try
        {
            // Validate password
            var passwordValidation = _passwordValidationService.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
            {
                return BadRequestWithErrors(passwordValidation.Errors);
            }

            if (await _context.AppUsers.AnyAsync(u => u.Email == request.Email))
            {
                return ConflictWithError(_translationService.Translate("Common", "EMAIL_ALREADY_EXISTS"));
            }

            var confirmationToken = GenerateConfirmationToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(24);

            var user = new AppUser
            {
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = request.UserType,
                Status = 0, // pending_confirmation
                ConfirmationToken = confirmationToken,
                ConfirmationTokenExpiresAt = tokenExpiry,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AppUsers.Add(user);
            await _context.SaveChangesAsync();

            // Set created_by and updated_by to the user's own ID (for self-registration)
            user.CreatedBy = user.Id;
            user.UpdatedBy = user.Id;
            user.UpdatedAt = DateTime.UtcNow;
            _context.AppUsers.Update(user);
            await _context.SaveChangesAsync();

            // Send confirmation email
            try
            {
                var confirmationUrl = $"{_configuration["BaseUrl"]}/confirm/{confirmationToken}";
                await _emailService.SendConfirmationEmailAsync(user.Email, confirmationUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send confirmation email to {Email}", user.Email);
                // Don't fail registration if email fails
            }

            // Return JSON with message indicating email confirmation required
            return Created(string.Empty, new { message = _translationService.Translate("Common", "REGISTRATION_SUCCESSFUL"), id = user.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return InternalServerErrorWithError(_translationService.Translate("Common", "ERROR_CREATING_USER"));
        }
    }

    // GET: api/app_user
    [Authorize(Roles = "0,1")] // Admin and Staff
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListResponse>>> GetUsers()
    {
        try
        {
            var query = _context.AppUsers
                .Select(u => new UserListResponse
                {
                    Id = u.Id,
                    Username = u.Email,
                    Email = u.Email,
                    UserType = u.UserType
                })
                .AsQueryable();

            // Apply filters from query parameters
            query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

            var users = await ExecuteLimitedQueryAsync(query);

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return InternalServerErrorWithError("An error occurred while retrieving users");
        }
    }

    // GET: api/app_user/{id}
    [Authorize(Roles = "0")] // Admin only
    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(int id)
    {
        var user = await _context.AppUsers.FindAsync(id);

        if (user == null)
        {
            return NotFoundWithError(_translationService.Translate("Common", "USER_NOT_FOUND"));
        }

        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email
        };
    }

    // POST: api/users/login
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        try
        {
            // Find user by email (case insensitive with citext)
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return BadRequestWithErrors(_translationService.Translate("Common", "INVALID_EMAIL_OR_PASSWORD"));
            }

            // Check user status
            if (user.Status == 0) // pending_confirmation
            {
                return Ok(new LoginResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = user.UserType,
                    Token = "",
                    Message = _translationService.Translate("Common", "EMAIL_CONFIRMATION_REQUIRED")
                });
            }

            if (user.Status == 2) // inactive
            {
                return BadRequestWithErrors(_translationService.Translate("Common", "ACCOUNT_DEACTIVATED"));
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Return success with JWT token
            return Ok(new LoginResponse
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.UserType,
                Token = token,
                Message = _translationService.Translate("Common", "LOGIN_SUCCESSFUL")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return InternalServerErrorWithError("An error occurred during login");
        }
    }

    // GET: api/users/me (Protected endpoint example)
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> GetCurrentUser()
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return BadRequestWithErrors("Invalid token");
            }

            var user = await _context.AppUsers.FindAsync(userId);

            if (user == null)
            {
                return NotFoundWithError(_translationService.Translate("Common", "USER_NOT_FOUND"));
            }

            return new UserResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user");
            return InternalServerErrorWithError("An error occurred");
        }
    }

    // PUT: api/users/me
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateCurrentUser(UpdateProfileRequest request)
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return BadRequestWithErrors("Invalid token");
            }

            var user = await _context.AppUsers.FindAsync(userId);

            if (user == null)
            {
                return NotFoundWithError(_translationService.Translate("Common", "USER_NOT_FOUND"));
            }

            // Update user profile
            if (request.FullName != null)
            {
                user.FullName = request.FullName;
                user.UpdatedAt = DateTime.UtcNow;
                user.UpdatedBy = userId;
            }

            await _context.SaveChangesAsync();

            return new UserResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current user");
            return InternalServerErrorWithError("An error occurred");
        }
    }

    private string GenerateJwtToken(AppUser user)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var expiresInMinutes = int.Parse(_configuration["Jwt:ExpiresInMinutes"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.UserType.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateConfirmationToken()
    {
        return Guid.NewGuid().ToString("N");
    }

    // GET: api/app_user/confirm
    [AllowAnonymous]
    [HttpGet("confirm")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        try
        {
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.ConfirmationToken == token);
            
            if (user == null)
            {
                return BadRequestWithErrors("Invalid confirmation token.");
            }

            if (user.ConfirmationTokenExpiresAt < DateTime.UtcNow)
            {
                return BadRequestWithErrors("Confirmation token has expired. Please request a new confirmation email.");
            }

            if (user.Status == 1) // already active
            {
                return Ok(new { message = "Email already confirmed. You can now log in." });
            }

            // Activate user account
            user.Status = 1; // active
            user.EmailConfirmedAt = DateTime.UtcNow;
            user.ConfirmationToken = null;
            user.ConfirmationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Email confirmed successfully! Your account is now active. You can log in." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming email");
            return InternalServerErrorWithError("An error occurred while confirming your email.");
        }
    }

    // POST: api/app_user/resend-confirmation
    [AllowAnonymous]
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmationEmail(ResendConfirmationRequest request)
    {
        try
        {
            // Find user by email (case insensitive with citext)
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null)
            {
                // Don't reveal that email doesn't exist
                return Ok("If an account with that email exists, a confirmation email has been sent.");
            }

            if (user.Status == 1) // already active
            {
                return Ok("Your email is already confirmed. You can log in.");
            }

            // Generate new token
            var confirmationToken = GenerateConfirmationToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(24);

            user.ConfirmationToken = confirmationToken;
            user.ConfirmationTokenExpiresAt = tokenExpiry;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            // Send confirmation email
            try
            {
                var confirmationUrl = $"{_configuration["BaseUrl"]}/confirm/{confirmationToken}";
                await _emailService.SendConfirmationEmailAsync(user.Email, confirmationUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send resend confirmation email to {Email}", user.Email);
                return StatusCode(500, "Failed to send confirmation email. Please try again later.");
            }

            return Ok("A new confirmation email has been sent. Please check your inbox.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending confirmation email");
            return StatusCode(500, "An error occurred while resending the confirmation email.");
        }
    }

    // ==================== PASSWORD RESET ENDPOINTS ====================

    // POST: api/app_user/forgot-password
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        try
        {
            // Find user by email (case insensitive with citext)
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null)
            {
                // Don't reveal that email doesn't exist
                return Ok("If an account with that email exists, a password reset link has been sent.");
            }

            // Generate new reset token
            var resetToken = GenerateConfirmationToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(1); // Reset tokens expire in 1 hour

            user.ConfirmationToken = resetToken;
            user.ConfirmationTokenExpiresAt = tokenExpiry;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            // Send password reset email
            try
            {
                var resetUrl = $"{_configuration["BaseUrl"]}/reset-password/{resetToken}";
                await _emailService.SendPasswordResetEmailAsync(user.Email, resetUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send password reset email to {Email}", user.Email);
                return InternalServerErrorWithError(_translationService.Translate("ForgotPassword", "SEND_ERROR"));
            }

            return Ok(new { message = _translationService.Translate("ForgotPassword", "SUCCESS_MESSAGE") });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing forgot password request");
            return InternalServerErrorWithError(_translationService.Translate("ForgotPassword", "SEND_ERROR"));
        }
    }

    // POST: api/app_user/reset-password
    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        try
        {
            // Find user by valid reset token
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ConfirmationToken == request.Token && 
                                       u.ConfirmationTokenExpiresAt > DateTime.UtcNow);

            if (user == null)
            {
                return BadRequestWithErrors(_translationService.Translate("PasswordReset", "INVALID_TOKEN"));
            }

            // Validate new password
            var passwordValidation = _passwordValidationService.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
            {
                return BadRequestWithErrors(passwordValidation.Errors);
            }

            // Update password and clear token
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.ConfirmationToken = null;
            user.ConfirmationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return Ok(new { message = _translationService.Translate("PasswordReset", "RESET_SUCCESS") });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return InternalServerErrorWithError(_translationService.Translate("PasswordReset", "FAILED_RESET"));
        }
    }

    // GET: api/app_user/validate-reset-token
    [AllowAnonymous]
    [HttpGet("validate-reset-token")]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
    {
        try
        {
            _logger.LogInformation("ValidateResetToken called with token: {Token}", token?.Substring(0, Math.Min(10, token?.Length ?? 0)) + "...");
            
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("Token is null or empty");
                var tokenRequiredMessage = _translationService.Translate("PasswordReset", "TOKEN_REQUIRED");
                HttpContext.Items["Errors"] = new List<string> { tokenRequiredMessage };
                return Ok(new { success = false, message = tokenRequiredMessage, errors = new[] { tokenRequiredMessage } });
            }

            // Find user by valid reset token
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ConfirmationToken == token && 
                                       u.ConfirmationTokenExpiresAt > DateTime.UtcNow);

            if (user == null)
            {
                _logger.LogWarning("No user found for token or token expired. Token: {Token}", token?.Substring(0, Math.Min(10, token?.Length ?? 0)) + "...");
                HttpContext.Items["Errors"] = new List<string> { _translationService.Translate("PasswordReset", "INVALID_TOKEN") };
                return Ok(new { success = false, message = _translationService.Translate("PasswordReset", "INVALID_TOKEN"), errors = new[] { _translationService.Translate("PasswordReset", "INVALID_TOKEN") } });
            }

            _logger.LogInformation("Token validated successfully for user: {Email}", user.Email);
            return OkWithSuccess(new { 
                isValid = true, 
                email = user.Email 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating reset token");
            return InternalServerErrorWithError(_translationService.Translate("PasswordReset", "TOKEN_ERROR"));
        }
    }

    // ==================== STAFF MANAGEMENT ENDPOINTS ====================

    // GET: api/app_user/staff
    [Authorize(Roles = "0")] // Admin only
    [HttpGet("staff")]
    public async Task<ActionResult<IEnumerable<StaffResponse>>> GetStaff()
    {
        try
        {
            var query = _context.AppUsers
                .Where(u => u.UserType == 1) // Staff only
                .OrderByDescending(u => u.CreatedAt)
                .AsQueryable();

            // Apply filters from query parameters
            query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

            var staffList = await ExecuteLimitedQueryAsync(query);

            // Get all user IDs for created_by and updated_by lookups
            var userIds = staffList
                .SelectMany(s => new[] { s.CreatedBy, s.UpdatedBy })
                .Where(id => id.HasValue || id != 0)
                .Select(id => id ?? 0)
                .Distinct()
                .ToList();

            var userNames = await _context.AppUsers
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName ?? u.Email);

            var response = staffList.Select(s => new StaffResponse
            {
                Id = s.Id,
                Email = s.Email,
                FullName = s.FullName,
                Status = s.Status,
                StatusName = GetStatusName(s.Status),
                EmailConfirmedAt = s.EmailConfirmedAt,
                CreatedAt = s.CreatedAt,
                CreatedBy = s.CreatedBy,
                CreatedByName = userNames.GetValueOrDefault(s.CreatedBy),
                UpdatedAt = s.UpdatedAt,
                UpdatedBy = s.UpdatedBy,
                UpdatedByName = s.UpdatedBy.HasValue ? userNames.GetValueOrDefault(s.UpdatedBy.Value) : null
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving staff list");
            return InternalServerErrorWithError("An error occurred while retrieving staff list");
        }
    }

    // GET: api/app_user/staff/{id}
    [Authorize(Roles = "0")] // Admin only
    [HttpGet("staff/{id}")]
    public async Task<ActionResult<StaffResponse>> GetStaffById(int id)
    {
        try
        {
            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.UserType == 1);

            if (staff == null)
            {
                return NotFoundWithError("Staff member not found");
            }

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == staff.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            var updatedByName = staff.UpdatedBy.HasValue
                ? await _context.AppUsers
                    .Where(u => u.Id == staff.UpdatedBy.Value)
                    .Select(u => u.FullName ?? u.Email)
                    .FirstOrDefaultAsync()
                : null;

            return Ok(new StaffResponse
            {
                Id = staff.Id,
                Email = staff.Email,
                FullName = staff.FullName,
                Status = staff.Status,
                StatusName = GetStatusName(staff.Status),
                EmailConfirmedAt = staff.EmailConfirmedAt,
                CreatedAt = staff.CreatedAt,
                CreatedBy = staff.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = staff.UpdatedAt,
                UpdatedBy = staff.UpdatedBy,
                UpdatedByName = updatedByName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving staff member {Id}", id);
            return InternalServerErrorWithError("An error occurred while retrieving staff member");
        }
    }

    // POST: api/app_user/staff
    [Authorize(Roles = "0")] // Admin only
    [HttpPost("staff")]
    public async Task<ActionResult<StaffResponse>> CreateStaff(CreateStaffRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequestWithErrors("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequestWithErrors("Full name is required");
            }

            if (await _context.AppUsers.AnyAsync(u => u.Email == request.Email))
            {
                return ConflictWithError("Email already exists");
            }

            // Get current user ID from JWT token
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return BadRequestWithErrors("Invalid token");
            }

            var confirmationToken = GenerateConfirmationToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(72); // 72 hours for staff invitation

            var staff = new AppUser
            {
                Email = request.Email,
                FullName = request.FullName,
                Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Temporary password
                UserType = 1, // Staff
                Status = 0, // pending_confirmation
                ConfirmationToken = confirmationToken,
                ConfirmationTokenExpiresAt = tokenExpiry,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId.Value,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = currentUserId.Value
            };

            _context.AppUsers.Add(staff);
            await _context.SaveChangesAsync();

            // Send staff invitation email
            try
            {
                var setupUrl = $"{_configuration["BaseUrl"]}/staff-setup/{confirmationToken}";
                await _emailService.SendStaffInvitationEmailAsync(staff.Email, staff.FullName ?? "", setupUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send staff invitation email to {Email}", staff.Email);
                // Don't fail creation if email fails
            }

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == staff.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Created($"/api/app_user/staff/{staff.Id}", new StaffResponse
            {
                Id = staff.Id,
                Email = staff.Email,
                FullName = staff.FullName,
                Status = staff.Status,
                StatusName = GetStatusName(staff.Status),
                EmailConfirmedAt = staff.EmailConfirmedAt,
                CreatedAt = staff.CreatedAt,
                CreatedBy = staff.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = staff.UpdatedAt,
                UpdatedBy = staff.UpdatedBy,
                UpdatedByName = createdByName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating staff member");
            return InternalServerErrorWithError($"An error occurred while creating staff member: {ex.Message}");
        }
    }

    // PUT: api/app_user/staff/{id}
    [Authorize(Roles = "0")] // Admin only
    [HttpPut("staff/{id}")]
    public async Task<ActionResult<StaffResponse>> UpdateStaff(int id, UpdateStaffRequest request)
    {
        try
        {
            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.UserType == 1);

            if (staff == null)
            {
                return NotFoundWithError("Staff member not found");
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return BadRequestWithErrors("Invalid token");
            }

            staff.FullName = request.FullName;
            staff.Status = request.Status;
            staff.UpdatedAt = DateTime.UtcNow;
            staff.UpdatedBy = currentUserId.Value;

            await _context.SaveChangesAsync();

            var createdByName = await _context.AppUsers
                .Where(u => u.Id == staff.CreatedBy)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            var updatedByName = await _context.AppUsers
                .Where(u => u.Id == currentUserId.Value)
                .Select(u => u.FullName ?? u.Email)
                .FirstOrDefaultAsync();

            return Ok(new StaffResponse
            {
                Id = staff.Id,
                Email = staff.Email,
                FullName = staff.FullName,
                Status = staff.Status,
                StatusName = GetStatusName(staff.Status),
                EmailConfirmedAt = staff.EmailConfirmedAt,
                CreatedAt = staff.CreatedAt,
                CreatedBy = staff.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = staff.UpdatedAt,
                UpdatedBy = staff.UpdatedBy,
                UpdatedByName = updatedByName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating staff member {Id}", id);
            return InternalServerErrorWithError("An error occurred while updating staff member");
        }
    }

    // DELETE: api/app_user/staff/{id}
    [Authorize(Roles = "0")] // Admin only
    [HttpDelete("staff/{id}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        try
        {
            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.UserType == 1);

            if (staff == null)
            {
                return NotFoundWithError("Staff member not found");
            }

            _context.AppUsers.Remove(staff);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting staff member {Id}", id);
            return InternalServerErrorWithError("An error occurred while deleting staff member");
        }
    }

    // POST: api/app_user/staff/resend-invitation/{id}
    [Authorize(Roles = "0")] // Admin only
    [HttpPost("staff/resend-invitation/{id}")]
    public async Task<IActionResult> ResendStaffInvitation(int id)
    {
        try
        {
            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.UserType == 1);

            if (staff == null)
            {
                return NotFoundWithError("Staff member not found");
            }

            if (staff.Status == 1) // already active
            {
                return BadRequestWithErrors("Staff member is already active");
            }

            // Generate new token
            var confirmationToken = GenerateConfirmationToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(72);

            staff.ConfirmationToken = confirmationToken;
            staff.ConfirmationTokenExpiresAt = tokenExpiry;
            staff.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send staff invitation email
            try
            {
                var setupUrl = $"{_configuration["BaseUrl"]}/staff-setup/{confirmationToken}";
                await _emailService.SendStaffInvitationEmailAsync(staff.Email, staff.FullName ?? "", setupUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to resend staff invitation email to {Email}", staff.Email);
                return StatusCode(500, "Failed to send invitation email. Please try again later.");
            }

            return Ok(new { message = "Invitation email has been resent." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending staff invitation for {Id}", id);
            return InternalServerErrorWithError("An error occurred while resending invitation");
        }
    }

    // GET: api/app_user/staff-setup/{token}
    [AllowAnonymous]
    [HttpGet("staff-setup/{token}")]
    public async Task<ActionResult<StaffSetupInfoResponse>> GetStaffSetupInfo(string token)
    {
        try
        {
            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ConfirmationToken == token && u.UserType == 1);

            if (staff == null)
            {
                return Ok(new StaffSetupInfoResponse
                {
                    IsValid = false,
                    ErrorMessage = "Invalid invitation token."
                });
            }

            if (staff.ConfirmationTokenExpiresAt < DateTime.UtcNow)
            {
                return Ok(new StaffSetupInfoResponse
                {
                    IsValid = false,
                    ErrorMessage = "Invitation token has expired. Please contact your administrator for a new invitation."
                });
            }

            if (staff.Status == 1) // already active
            {
                return Ok(new StaffSetupInfoResponse
                {
                    Email = staff.Email,
                    FullName = staff.FullName,
                    IsValid = false,
                    ErrorMessage = "Account is already active. You can log in."
                });
            }

            return Ok(new StaffSetupInfoResponse
            {
                Email = staff.Email,
                FullName = staff.FullName,
                IsValid = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staff setup info for token");
            return InternalServerErrorWithError("An error occurred while validating the invitation.");
        }
    }

    // POST: api/app_user/staff-setup
    [AllowAnonymous]
    [HttpPost("staff-setup")]
    public async Task<IActionResult> CompleteStaffSetup(StaffSetupRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequestWithErrors("Invalid token");
            }

            // Validate password using the password validation service
            var passwordValidation = _passwordValidationService.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
            {
                return BadRequestWithErrors(passwordValidation.Errors);
            }

            var staff = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ConfirmationToken == request.Token && u.UserType == 1);

            if (staff == null)
            {
                return BadRequestWithErrors("Invalid invitation token.");
            }

            if (staff.ConfirmationTokenExpiresAt < DateTime.UtcNow)
            {
                return BadRequestWithErrors("Invitation token has expired. Please contact your administrator for a new invitation.");
            }

            if (staff.Status == 1) // already active
            {
                return BadRequestWithErrors("Account is already active. You can log in.");
            }

            // Set password and activate account
            staff.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            staff.Status = 1; // active
            staff.EmailConfirmedAt = DateTime.UtcNow;
            staff.ConfirmationToken = null;
            staff.ConfirmationTokenExpiresAt = null;
            staff.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Account setup complete! You can now log in." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing staff setup");
            return InternalServerErrorWithError("An error occurred while setting up your account.");
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
        {
            return null;
        }
        return userId;
    }

    private static string GetStatusName(int status)
    {
        return status switch
        {
            0 => "Pending Confirmation",
            1 => "Active",
            2 => "Inactive",
            _ => "Unknown"
        };
    }
}

// DTOs
public record RegisterRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public int UserType { get; init; } = 2; // 0: admin, 1: staff, 2: customer
}

public record LoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public record UserResponse
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
}

public record UserListResponse
{
    public int Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public int UserType { get; init; }
}

public record LoginResponse
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public int Role { get; init; }
    public string Token { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public record ResendConfirmationRequest
{
    public string Email { get; init; } = string.Empty;
}

public record CreateStaffRequest
{
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
}

public record UpdateStaffRequest
{
    public string FullName { get; init; } = string.Empty;
    public int Status { get; init; }
}

public record StaffResponse
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public int Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public DateTime? EmailConfirmedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public int CreatedBy { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
}

public record StaffSetupRequest
{
    public string Token { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public record StaffSetupInfoResponse
{
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public bool IsValid { get; init; }
    public string? ErrorMessage { get; init; }
}

public record UpdateProfileRequest
{
    public string? FullName { get; init; }
}

public record ForgotPasswordRequest
{
    public string Email { get; init; } = string.Empty;
}

public record ResetPasswordRequest
{
    public string Token { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
