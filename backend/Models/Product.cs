using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class Product
{
    public int Id { get; set; }

    public string Sku { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int? CategoryId { get; set; }

    public decimal Price { get; set; }

    public decimal? CostPrice { get; set; }

    public decimal TaxRate { get; set; }

    public int? StockQuantity { get; set; }

    public int? LowStockThreshold { get; set; }

    public string? Brand { get; set; }

    public string? Manufacturer { get; set; }

    public string? Weight { get; set; }

    public string? Dimensions { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ProductCategory? Category { get; set; }

    public virtual AppUser? CreatedByNavigation { get; set; }

    public virtual ICollection<ProductUrl> ProductUrls { get; set; } = new List<ProductUrl>();

    public virtual AppUser? UpdatedByNavigation { get; set; }
}
