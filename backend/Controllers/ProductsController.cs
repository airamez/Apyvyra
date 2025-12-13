using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(AppDbContext context, ILogger<ProductsController> logger)
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
                .Include(p => p.Images)
                .AsQueryable();

            // Apply filters
            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId);

            if (!string.IsNullOrEmpty(brand))
                query = query.Where(p => p.Brand == brand);

            if (isActive.HasValue)
                query = query.Where(p => p.IsActive == isActive);

            // Pagination
            var total = await query.CountAsync();
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = products.Select(p => MapToResponse(p)).ToList();

            Response.Headers.Add("X-Total-Count", total.ToString());
            Response.Headers.Add("X-Page", page.ToString());
            Response.Headers.Add("X-Page-Size", pageSize.ToString());

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
                .Include(p => p.Images)
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
                .Include(p => p.Images)
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
                .Include(p => p.Images)
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

    // POST: api/products/{id}/images
    [HttpPost("{id}/images")]
    public async Task<ActionResult<ProductImageResponse>> AddProductImage(int id, CreateProductImageRequest request)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var image = new ProductImage
            {
                ProductId = id,
                ImageUrl = request.ImageUrl,
                AltText = request.AltText,
                DisplayOrder = request.DisplayOrder,
                IsPrimary = request.IsPrimary,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.UserId
            };

            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync();

            return Ok(new ProductImageResponse
            {
                Id = image.Id,
                ProductId = image.ProductId,
                ImageUrl = image.ImageUrl,
                AltText = image.AltText,
                DisplayOrder = image.DisplayOrder,
                IsPrimary = image.IsPrimary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding product image");
            return StatusCode(500, new { message = "An error occurred while adding the image" });
        }
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            ShortDescription = product.ShortDescription,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            Price = product.Price,
            CostPrice = product.CostPrice,
            CompareAtPrice = product.CompareAtPrice,
            StockQuantity = product.StockQuantity,
            LowStockThreshold = product.LowStockThreshold,
            SkuBarcode = product.SkuBarcode,
            Brand = product.Brand,
            Manufacturer = product.Manufacturer,
            Weight = product.Weight,
            WeightUnit = product.WeightUnit,
            Dimensions = product.Dimensions,
            IsActive = product.IsActive,
            Images = product.Images.Select(i => new ProductImageResponse
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary
            }).ToList(),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
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
    public string? Description { get; init; }
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
    public List<ProductImageResponse> Images { get; init; } = new();
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateProductImageRequest(
    string ImageUrl,
    string? AltText,
    int DisplayOrder,
    bool IsPrimary,
    int? UserId
);

public record ProductImageResponse
{
    public int Id { get; init; }
    public int ProductId { get; init; }
    public string ImageUrl { get; init; } = string.Empty;
    public string? AltText { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsPrimary { get; init; }
}
