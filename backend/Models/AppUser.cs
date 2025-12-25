using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class AppUser
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public int UserType { get; set; } = 2; // 0: admin, 1: staff, 2: customer

    public DateTime? CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<ProductCategory> ProductCategoryCreatedByNavigations { get; set; } = new List<ProductCategory>();

    public virtual ICollection<ProductCategory> ProductCategoryUpdatedByNavigations { get; set; } = new List<ProductCategory>();

    public virtual ICollection<Product> ProductCreatedByNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductUpdatedByNavigations { get; set; } = new List<Product>();

    public virtual ICollection<ProductUrl> ProductUrls { get; set; } = new List<ProductUrl>();
}
