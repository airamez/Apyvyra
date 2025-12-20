
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;


namespace backend.Controllers;

// Place at the end of the file:
public record ProductUrlResponse
{
    public int Id { get; init; }
    public int ProductId { get; init; }
    public string Url { get; init; } = string.Empty;
    public string UrlType { get; init; } = string.Empty;
    public string? AltText { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsPrimary { get; init; }
}

[ApiController]
[Route("api/product")]
public class ProductController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductController> _logger;

    public ProductController(AppDbContext context, ILogger<ProductController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts(
        [FromQuery] int? categoryId,
        [FromQuery] string? brand,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUrls)
                .AsQueryable();

            // Apply filters
            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId);

            if (!string.IsNullOrEmpty(brand))
                query = query.Where(p => p.Brand == brand);

            if (isActive.HasValue)
                query = query.Where(p => p.IsActive == isActive);

            // Pagination only if more than 1000
            var total = await query.CountAsync();
            List<Product> products;
            if (total > 1000)
            {
                products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                Response.Headers.Append("X-Page", page.ToString());
                Response.Headers.Append("X-Page-Size", pageSize.ToString());
            }
            else
            {
                products = await query.ToListAsync();
            }

            var response = products.Select(p => MapToResponse(p)).ToList();
            Response.Headers.Append("X-Total-Count", total.ToString());
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new { message = "An error occurred while retrieving products" });
        }
    }

    // GET: api/products/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponse>> GetProduct(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUrls)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(MapToResponse(product));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the product" });
        }
    }

    // POST: api/products
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> CreateProduct(CreateProductRequest request)
    {
        try
        {
            // Check if SKU already exists
            if (await _context.Products.AnyAsync(p => p.Sku == request.Sku))
            {
                return Conflict(new { message = "SKU already exists" });
            }

            var product = new Product
            {
                Sku = request.Sku,
                Name = request.Name,
                Description = request.Description,
                ShortDescription = request.ShortDescription,
                CategoryId = request.CategoryId,
                Price = request.Price,
                CostPrice = request.CostPrice,
                CompareAtPrice = request.CompareAtPrice,
                StockQuantity = request.StockQuantity,
                LowStockThreshold = request.LowStockThreshold,
                SkuBarcode = request.SkuBarcode,
                Brand = request.Brand,
                Manufacturer = request.Manufacturer,
                Weight = request.Weight,
                WeightUnit = request.WeightUnit,
                Dimensions = request.Dimensions,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.UserId, // From authenticated user
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Reload with includes
            var createdProduct = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUrls)
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            return CreatedAtAction(
                nameof(GetProduct),
                new { id = product.Id },
                MapToResponse(createdProduct!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { message = "An error occurred while creating the product" });
        }
    }

    // PUT: api/products/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductResponse>> UpdateProduct(int id, UpdateProductRequest request)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            // Check SKU uniqueness if changed
            if (request.Sku != product.Sku && await _context.Products.AnyAsync(p => p.Sku == request.Sku && p.Id != id))
            {
                return Conflict(new { message = "SKU already exists" });
            }

            // Update fields
            product.Sku = request.Sku;
            product.Name = request.Name;
            product.Description = request.Description;
            product.ShortDescription = request.ShortDescription;
            product.CategoryId = request.CategoryId;
            product.Price = request.Price;
            product.CostPrice = request.CostPrice;
            product.CompareAtPrice = request.CompareAtPrice;
            product.StockQuantity = request.StockQuantity;
            product.LowStockThreshold = request.LowStockThreshold;
            product.SkuBarcode = request.SkuBarcode;
            product.Brand = request.Brand;
            product.Manufacturer = request.Manufacturer;
            product.Weight = request.Weight;
            product.WeightUnit = request.WeightUnit;
            product.Dimensions = request.Dimensions;
            product.IsActive = request.IsActive;
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = request.UserId; // From authenticated user

            await _context.SaveChangesAsync();

            // Reload with includes
            var updatedProduct = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUrls)
                .FirstOrDefaultAsync(p => p.Id == id);

            return Ok(MapToResponse(updatedProduct!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the product" });
        }
    }

    // DELETE: api/products/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the product" });
        }
    }


    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            ProductUrls = product.ProductUrls.Select(u => new ProductUrlResponse
            {
                Id = u.Id,
                ProductId = u.ProductId,
                Url = u.Url,
                UrlType = u.UrlType,
                AltText = u.AltText,
                DisplayOrder = u.DisplayOrder ?? 0,
                IsPrimary = u.IsPrimary ?? false
            }).ToList(),
            Brand = product.Brand,
            Manufacturer = product.Manufacturer,
            Weight = product.Weight ?? 0,
            WeightUnit = product.WeightUnit,
            Dimensions = product.Dimensions,
            IsActive = product.IsActive ?? false,
            CreatedAt = product.CreatedAt ?? DateTime.MinValue,
            UpdatedAt = product.UpdatedAt ?? DateTime.MinValue
        };
    }
}

// DTOs
public record CreateProductRequest(
    string Sku,
    string Name,
    string? Description,
    string? ShortDescription,
    int? CategoryId,
    decimal Price,
    decimal? CostPrice,
    decimal? CompareAtPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? SkuBarcode,
    string? Brand,
    string? Manufacturer,
    decimal? Weight,
    string? WeightUnit,
    string? Dimensions,
    bool IsActive,
    int? UserId
);

public record UpdateProductRequest(
    string Sku,
    string Name,
    string? Description,
    string? ShortDescription,
    int? CategoryId,
    decimal Price,
    decimal? CostPrice,
    decimal? CompareAtPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? SkuBarcode,
    string? Brand,
    string? Manufacturer,
    decimal? Weight,
    string? WeightUnit,
    string? Dimensions,
    bool IsActive,
    int? UserId
);

public record ProductResponse
{
    public int Id { get; init; }
    public string Sku { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public List<ProductUrlResponse> ProductUrls { get; init; } = new();
    public string? ShortDescription { get; init; }
    public int? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public decimal Price { get; init; }
    public decimal? CostPrice { get; init; }
    public decimal? CompareAtPrice { get; init; }
    public int StockQuantity { get; init; }
    public int LowStockThreshold { get; init; }
    public string? SkuBarcode { get; init; }
    public string? Brand { get; init; }
    public string? Manufacturer { get; init; }
    public decimal? Weight { get; init; }
    public string? WeightUnit { get; init; }
    public string? Dimensions { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}


