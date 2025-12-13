using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductCategoriesController> _logger;

    public ProductCategoriesController(AppDbContext context, ILogger<ProductCategoriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/productcategories
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductCategoryResponse>>> GetCategories(
        [FromQuery] bool? isActive,
        [FromQuery] int? parentId)
    {
        try
        {
            var query = _context.ProductCategories
                .Include(c => c.SubCategories)
                .AsQueryable();

            // Apply filters
            if (isActive.HasValue)
                query = query.Where(c => c.IsActive == isActive);

            if (parentId.HasValue)
                query = query.Where(c => c.ParentCategoryId == parentId);

            var categories = await query.ToListAsync();
            var response = categories.Select(c => MapToResponse(c)).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product categories");
            return StatusCode(500, new { message = "An error occurred while retrieving categories" });
        }
    }

    // GET: api/productcategories/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductCategoryResponse>> GetCategory(int id)
    {
        try
        {
            var category = await _context.ProductCategories
                .Include(c => c.SubCategories)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            return Ok(MapToResponse(category));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the category" });
        }
    }

    // POST: api/productcategories
    [HttpPost]
    public async Task<ActionResult<ProductCategoryResponse>> CreateCategory(CreateProductCategoryRequest request)
    {
        try
        {
            // Validate parent category exists if provided
            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _context.ProductCategories
                    .AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                
                if (!parentExists)
                {
                    return BadRequest(new { message = "Parent category not found" });
                }
            }

            var category = new ProductCategory
            {
                Name = request.Name,
                Description = request.Description,
                ParentCategoryId = request.ParentCategoryId,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.UserId,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProductCategories.Add(category);
            await _context.SaveChangesAsync();

            // Reload with includes
            var createdCategory = await _context.ProductCategories
                .Include(c => c.SubCategories)
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
            return StatusCode(500, new { message = "An error occurred while creating the category" });
        }
    }

    // PUT: api/productcategories/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductCategoryResponse>> UpdateCategory(int id, UpdateProductCategoryRequest request)
    {
        try
        {
            var category = await _context.ProductCategories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            // Prevent circular reference
            if (request.ParentCategoryId == id)
            {
                return BadRequest(new { message = "Category cannot be its own parent" });
            }

            // Validate parent category exists if provided
            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _context.ProductCategories
                    .AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                
                if (!parentExists)
                {
                    return BadRequest(new { message = "Parent category not found" });
                }

                // Check for circular reference in hierarchy
                if (await IsCircularReference(id, request.ParentCategoryId.Value))
                {
                    return BadRequest(new { message = "Cannot create circular category hierarchy" });
                }
            }

            category.Name = request.Name;
            category.Description = request.Description;
            category.ParentCategoryId = request.ParentCategoryId;
            category.IsActive = request.IsActive;
            category.UpdatedAt = DateTime.UtcNow;
            category.UpdatedBy = request.UserId;

            await _context.SaveChangesAsync();

            // Reload with includes
            var updatedCategory = await _context.ProductCategories
                .Include(c => c.SubCategories)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            return Ok(MapToResponse(updatedCategory!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the category" });
        }
    }

    // DELETE: api/productcategories/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var category = await _context.ProductCategories
                .Include(c => c.SubCategories)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            // Check if category has products
            if (category.Products.Any())
            {
                return BadRequest(new { message = "Cannot delete category with associated products" });
            }

            // Check if category has subcategories
            if (category.SubCategories.Any())
            {
                return BadRequest(new { message = "Cannot delete category with subcategories" });
            }

            _context.ProductCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the category" });
        }
    }

    // GET: api/productcategories/tree
    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<ProductCategoryResponse>>> GetCategoryTree()
    {
        try
        {
            var categories = await _context.ProductCategories
                .Include(c => c.SubCategories)
                .Where(c => c.ParentCategoryId == null && c.IsActive)
                .ToListAsync();

            var response = categories.Select(c => MapToResponse(c, includeChildren: true)).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category tree");
            return StatusCode(500, new { message = "An error occurred while retrieving the category tree" });
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
            IsActive = category.IsActive,
            SubCategories = includeChildren 
                ? category.SubCategories.Select(sc => MapToResponse(sc, true)).ToList() 
                : new List<ProductCategoryResponse>(),
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }
}

// DTOs
public record CreateProductCategoryRequest(
    string Name,
    string? Description,
    int? ParentCategoryId,
    bool IsActive,
    int? UserId
);

public record UpdateProductCategoryRequest(
    string Name,
    string? Description,
    int? ParentCategoryId,
    bool IsActive,
    int? UserId
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
