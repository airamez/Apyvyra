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

    public AppUserController(AppDbContext context, ILogger<AppUserController> logger, IConfiguration configuration, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _emailService = emailService;
    }

    // POST: api/app_user
    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<AppUser>> Register(RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.AppUsers.AnyAsync(u => u.Email == request.Email))
            {
                return ConflictWithError("Email already exists");
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
                await _emailService.SendConfirmationEmailAsync(user.Email, user.Email, confirmationUrl, false);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send confirmation email to {Email}", user.Email);
                // Don't fail registration if email fails
            }

            // Return JSON with message indicating email confirmation required
            return Created(string.Empty, new { message = "Registration successful. Please check your email to confirm your account.", id = user.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return InternalServerErrorWithError($"An error occurred while creating the user: {ex.Message}");
        }
    }

    // GET: api/app_user
    [Authorize(Roles = "0")] // Admin only
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListResponse>>> GetUsers()
    {
        try
        {
            var users = await _context.AppUsers
                .Select(u => new UserListResponse
                {
                    Id = u.Id,
                    Username = u.Email,
                    Email = u.Email
                })
                .ToListAsync();

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
            return NotFoundWithError("User not found");
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
            // Find user by email
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return BadRequestWithErrors("Invalid email or password");
            }

            // Check user status
            if (user.Status == 0) // pending_confirmation
            {
                return BadRequestWithErrors("Please confirm your email address before logging in. Check your inbox for the confirmation email.");
            }

            if (user.Status == 2) // inactive
            {
                return BadRequestWithErrors("Your account has been deactivated. Please contact support.");
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
                Message = "Login successful"
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
                return NotFoundWithError("User not found");
            }

            return new UserResponse
            {
                Id = user.Id,
                Email = user.Email
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user");
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
                await _emailService.SendConfirmationEmailAsync(user.Email, user.Email, confirmationUrl, true);
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
}

public record UserListResponse
{
    public int Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
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
