using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/product_category")]
public class ProductCategoryController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductCategoryController> _logger;

    public ProductCategoryController(AppDbContext context, ILogger<ProductCategoryController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/productcategories
    // Supports dynamic filtering with operators: eq, ne, lt, lte, gt, gte, contains, startsWith, endsWith, between
    // Examples:
    //   ?name=electronics (contains)
    //   ?isActive=true (equals)
    //   ?parentId=5 (equals)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductCategoryResponse>>> GetCategories()
    {
        try
        {
            var query = _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .AsQueryable();

            // Apply dynamic filters from query parameters
            query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

            // Use modern filtering approach - limit results to MAX_RECORDS_QUERIES_COUNT
            // Headers X-Has-More-Records and X-Total-Count will be set automatically
            var categories = await ExecuteLimitedQueryAsync(query);
            var response = categories.Select(c => MapToResponse(c)).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product categories");
            return InternalServerErrorWithError("An error occurred while retrieving categories");
        }
    }

    // GET: api/productcategories/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductCategoryResponse>> GetCategory(int id)
    {
        try
        {
            var category = await _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFoundWithError("Category not found");
            }

            return Ok(MapToResponse(category));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category {CategoryId}", id);
            return InternalServerErrorWithError("An error occurred while retrieving the category");
        }
    }

    // POST: api/productcategories
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ProductCategoryResponse>> CreateCategory(CreateProductCategoryRequest request)
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            // Validate parent category exists if provided
            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _context.ProductCategories
                    .AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                
                if (!parentExists)
                {
                    return BadRequestWithErrors("Parent category not found");
                }
            }

            var category = new ProductCategory
            {
                Name = request.Name,
                Description = request.Description,
                ParentCategoryId = request.ParentCategoryId,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProductCategories.Add(category);
            await _context.SaveChangesAsync();

            // Reload with includes
            var createdCategory = await _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == category.Id);

            return CreatedAtAction(
                nameof(GetCategory),
                new { id = category.Id },
                MapToResponse(createdCategory!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return InternalServerErrorWithError("An error occurred while creating the category");
        }
    }

    // PUT: api/productcategories/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ProductCategoryResponse>> UpdateCategory(int id, UpdateProductCategoryRequest request)
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var category = await _context.ProductCategories.FindAsync(id);

            if (category == null)
            {
                return NotFoundWithError("Category not found");
            }

            // Prevent circular reference
            if (request.ParentCategoryId == id)
            {
                return BadRequestWithErrors("Category cannot be its own parent");
            }

            // Validate parent category exists if provided
            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _context.ProductCategories
                    .AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                
                if (!parentExists)
                {
                    return BadRequestWithErrors("Parent category not found");
                }

                // Check for circular reference in hierarchy
                if (await IsCircularReference(id, request.ParentCategoryId.Value))
                {
                    return BadRequestWithErrors("Cannot create circular category hierarchy");
                }
            }

            category.Name = request.Name;
            category.Description = request.Description;
            category.ParentCategoryId = request.ParentCategoryId;
            category.IsActive = request.IsActive;
            category.UpdatedAt = DateTime.UtcNow;
            category.UpdatedBy = userId;

            await _context.SaveChangesAsync();

            // Reload with includes
            var updatedCategory = await _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            return Ok(MapToResponse(updatedCategory!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {CategoryId}", id);
            return InternalServerErrorWithError("An error occurred while updating the category");
        }
    }

    // DELETE: api/productcategories/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var category = await _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFoundWithError("Category not found");
            }

            // Check if category has products
            if (category.Products != null && category.Products.Any())
            {
                return BadRequestWithErrors("Cannot delete category with associated products");
            }

            // Check if category has subcategories
            if (category.InverseParentCategory != null && category.InverseParentCategory.Any())
            {
                return BadRequestWithErrors("Cannot delete category with subcategories");
            }

            _context.ProductCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {CategoryId}", id);
            return InternalServerErrorWithError("An error occurred while deleting the category");
        }
    }

    // GET: api/productcategories/tree
    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<ProductCategoryResponse>>> GetCategoryTree()
    {
        try
        {
            var categories = await _context.ProductCategories
                .Include(c => c.InverseParentCategory)
                .Where(c => c.ParentCategoryId == null && (c.IsActive ?? false))
                .ToListAsync();

            var response = categories.Select(c => MapToResponse(c, includeChildren: true)).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category tree");
            return InternalServerErrorWithError("An error occurred while retrieving the category tree");
        }
    }

    private async Task<bool> IsCircularReference(int categoryId, int parentId)
    {
        var parent = await _context.ProductCategories.FindAsync(parentId);
        while (parent != null)
        {
            if (parent.Id == categoryId)
                return true;

            if (parent.ParentCategoryId.HasValue)
                parent = await _context.ProductCategories.FindAsync(parent.ParentCategoryId.Value);
            else
                break;
        }
        return false;
    }

    private static ProductCategoryResponse MapToResponse(ProductCategory category, bool includeChildren = false)
    {
        return new ProductCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ParentCategoryId = category.ParentCategoryId,
            ParentCategoryName = category.ParentCategory?.Name,
            IsActive = category.IsActive ?? false,
            SubCategories = includeChildren 
                ? category.InverseParentCategory.Select(sc => MapToResponse(sc, true)).ToList() 
                : new List<ProductCategoryResponse>(),
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt ?? DateTime.MinValue
        };
    }
}

// DTOs
public record CreateProductCategoryRequest(
    string Name,
    string? Description,
    int? ParentCategoryId,
    bool IsActive
);

public record UpdateProductCategoryRequest(
    string Name,
    string? Description,
    int? ParentCategoryId,
    bool IsActive
);

public record ProductCategoryResponse
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int? ParentCategoryId { get; init; }
    public string? ParentCategoryName { get; init; }
    public bool IsActive { get; init; }
    public List<ProductCategoryResponse> SubCategories { get; init; } = new();
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
