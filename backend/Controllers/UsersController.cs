using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(AppDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST: api/users
    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(CreateUserRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return Conflict(new { message = "Email already exists" });
            }

            var user = new User
            {
                Email = request.Email,
                Password = request.Password // TODO: Hash the password before storing
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return user without password
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponse
            {
                Id = user.Id,
                Email = user.Email
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "An error occurred while creating the user" });
        }
    }

    // GET: api/users/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email
        };
    }
}

// DTOs
public record CreateUserRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public record UserResponse
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
}
