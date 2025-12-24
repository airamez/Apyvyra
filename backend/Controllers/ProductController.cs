
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;


namespace backend.Controllers;

public class ValidUrlAttribute : ValidationAttribute
{
    private static readonly Regex UrlRegex = new Regex(
        @"^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return new ValidationResult("URL is required");
        }

        var url = value.ToString()!;
        if (!UrlRegex.IsMatch(url))
        {
            return new ValidationResult("Please enter a valid URL (must start with http:// or https://)");
        }

        return ValidationResult.Success;
    }
}

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

[Route("api/product")]
public class ProductController : BaseApiController
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
        [FromQuery] string? search,
        [FromQuery] string? sku,
        [FromQuery] string? manufacturer)
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
                query = query.Where(p => p.Brand != null && p.Brand.Contains(brand));

            if (isActive.HasValue)
                query = query.Where(p => p.IsActive == isActive);

            // Search filter - searches across name, description, SKU
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p => 
                    (p.Name != null && p.Name.ToLower().Contains(searchLower)) ||
                    (p.Description != null && p.Description.ToLower().Contains(searchLower)) ||
                    (p.Sku != null && p.Sku.ToLower().Contains(searchLower)));
            }

            // SKU exact match filter
            if (!string.IsNullOrEmpty(sku))
                query = query.Where(p => p.Sku != null && p.Sku.Contains(sku));

            // Manufacturer filter
            if (!string.IsNullOrEmpty(manufacturer))
                query = query.Where(p => p.Manufacturer != null && p.Manufacturer.Contains(manufacturer));

            // Use modern filtering approach - limit results to MAX_RECORDS_QUERIES_COUNT
            // Headers X-Has-More-Records and X-Total-Count will be set automatically
            var products = await ExecuteLimitedQueryAsync(query);

            var response = products.Select(p => MapToResponse(p)).ToList();
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return InternalServerErrorWithError("An error occurred while retrieving products");
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
                return ConflictWithError("SKU already exists");
            }

            var product = new Product
            {
                Sku = request.Sku,
                Name = request.Name,
                Description = request.Description,
                CategoryId = request.CategoryId,
                Price = request.Price,
                CostPrice = request.CostPrice,
                StockQuantity = request.StockQuantity,
                LowStockThreshold = request.LowStockThreshold,
                Brand = request.Brand,
                Manufacturer = request.Manufacturer,
                Weight = request.Weight,
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
            return InternalServerErrorWithError("An error occurred while creating the product");
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
                return NotFoundWithError("Product not found");
            }

            // Check SKU uniqueness if changed
            if (request.Sku != product.Sku && await _context.Products.AnyAsync(p => p.Sku == request.Sku && p.Id != id))
            {
                return ConflictWithError("SKU already exists");
            }

            // Update fields
            product.Sku = request.Sku;
            product.Name = request.Name;
            product.Description = request.Description;
            product.CategoryId = request.CategoryId;
            product.Price = request.Price;
            product.CostPrice = request.CostPrice;
            product.StockQuantity = request.StockQuantity;
            product.LowStockThreshold = request.LowStockThreshold;
            product.Brand = request.Brand;
            product.Manufacturer = request.Manufacturer;
            product.Weight = request.Weight;
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

    // GET: api/product/{id}/urls
    [HttpGet("{id}/urls")]
    public async Task<ActionResult<IEnumerable<ProductUrlResponse>>> GetProductUrls(int id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var urls = await _context.ProductUrls
                .Where(u => u.ProductId == id)
                .OrderBy(u => u.DisplayOrder)
                .ToListAsync();

            var response = urls.Select(u => new ProductUrlResponse
            {
                Id = u.Id,
                ProductId = u.ProductId,
                Url = u.Url,
                UrlType = u.UrlType,
                AltText = u.AltText,
                DisplayOrder = u.DisplayOrder ?? 0,
                IsPrimary = u.IsPrimary ?? false
            }).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving URLs for product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving product URLs" });
        }
    }

    // POST: api/product/{id}/urls
    [HttpPost("{id}/urls")]
    public async Task<ActionResult<ProductUrlResponse>> AddProductUrl(int id, CreateProductUrlRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var productUrl = new ProductUrl
            {
                ProductId = id,
                Url = request.Url,
                UrlType = request.UrlType,
                AltText = request.AltText,
                DisplayOrder = request.DisplayOrder,
                IsPrimary = request.IsPrimary,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.UserId
            };

            _context.ProductUrls.Add(productUrl);
            await _context.SaveChangesAsync();

            var response = new ProductUrlResponse
            {
                Id = productUrl.Id,
                ProductId = productUrl.ProductId,
                Url = productUrl.Url,
                UrlType = productUrl.UrlType,
                AltText = productUrl.AltText,
                DisplayOrder = productUrl.DisplayOrder ?? 0,
                IsPrimary = productUrl.IsPrimary ?? false
            };

            return CreatedAtAction(nameof(GetProductUrls), new { id = id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding URL to product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while adding the product URL" });
        }
    }

    // DELETE: api/urls/{urlId}
    [HttpDelete("/api/urls/{urlId}")]
    public async Task<IActionResult> DeleteProductUrl(int urlId)
    {
        try
        {
            var productUrl = await _context.ProductUrls.FindAsync(urlId);
            if (productUrl == null)
            {
                return NotFound(new { message = "Product URL not found" });
            }

            _context.ProductUrls.Remove(productUrl);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product URL {UrlId}", urlId);
            return StatusCode(500, new { message = "An error occurred while deleting the product URL" });
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
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            Price = product.Price,
            CostPrice = product.CostPrice,
            StockQuantity = product.StockQuantity ?? 0,
            LowStockThreshold = product.LowStockThreshold ?? 10,
            Brand = product.Brand,
            Manufacturer = product.Manufacturer,
            Weight = product.Weight,
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
    int? CategoryId,
    decimal Price,
    decimal? CostPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? Brand,
    string? Manufacturer,
    string? Weight,
    string? Dimensions,
    bool IsActive,
    int? UserId
);

public record UpdateProductRequest(
    string Sku,
    string Name,
    string? Description,
    int? CategoryId,
    decimal Price,
    decimal? CostPrice,
    int StockQuantity,
    int LowStockThreshold,
    string? Brand,
    string? Manufacturer,
    string? Weight,
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
    public string? Description { get; init; }
    public int? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public decimal Price { get; init; }
    public decimal? CostPrice { get; init; }
    public int StockQuantity { get; init; }
    public int LowStockThreshold { get; init; }
    public string? Brand { get; init; }
    public string? Manufacturer { get; init; }
    public string? Weight { get; init; }
    public string? Dimensions { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateProductUrlRequest(
    [Required(ErrorMessage = "URL is required")]
    [ValidUrl]
    string Url,
    
    [Required(ErrorMessage = "URL type is required")]
    string UrlType,
    
    string? AltText,
    int DisplayOrder,
    bool IsPrimary,
    int? UserId
);


