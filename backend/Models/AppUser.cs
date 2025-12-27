using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class AppUser
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string? FullName { get; set; }

    public int UserType { get; set; }

    public int Status { get; set; }

    public string? ConfirmationToken { get; set; }

    public DateTime? ConfirmationTokenExpiresAt { get; set; }

    public DateTime? EmailConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<ProductCategory> ProductCategoryCreatedByNavigations { get; set; } = new List<ProductCategory>();

    public virtual ICollection<ProductCategory> ProductCategoryUpdatedByNavigations { get; set; } = new List<ProductCategory>();

    public virtual ICollection<Product> ProductCreatedByNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductUpdatedByNavigations { get; set; } = new List<Product>();

    public virtual ICollection<ProductUrl> ProductUrls { get; set; } = new List<ProductUrl>();
}
