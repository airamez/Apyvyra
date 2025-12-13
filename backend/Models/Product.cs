using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("products")]
public class Product
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("sku")]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(1000)]
    [Column("short_description")]
    public string? ShortDescription { get; set; }

    [Column("category_id")]
    public int? CategoryId { get; set; }

    [Required]
    [Column("price", TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column("cost_price", TypeName = "decimal(18,2)")]
    public decimal? CostPrice { get; set; }

    [Column("compare_at_price", TypeName = "decimal(18,2)")]
    public decimal? CompareAtPrice { get; set; }

    [Column("stock_quantity")]
    public int StockQuantity { get; set; } = 0;

    [Column("low_stock_threshold")]
    public int LowStockThreshold { get; set; } = 10;

    [MaxLength(100)]
    [Column("sku_barcode")]
    public string? SkuBarcode { get; set; }

    [MaxLength(255)]
    [Column("brand")]
    public string? Brand { get; set; }

    [MaxLength(255)]
    [Column("manufacturer")]
    public string? Manufacturer { get; set; }

    [Column("weight", TypeName = "decimal(18,2)")]
    public decimal? Weight { get; set; }

    [MaxLength(20)]
    [Column("weight_unit")]
    public string? WeightUnit { get; set; }

    [Column("dimensions", TypeName = "jsonb")]
    public string? Dimensions { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    // Auditing fields
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("CategoryId")]
    public ProductCategory? Category { get; set; }

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }

    [ForeignKey("UpdatedBy")]
    public User? UpdatedByUser { get; set; }
}
