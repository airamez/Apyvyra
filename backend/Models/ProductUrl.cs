using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class ProductUrl
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string Url { get; set; } = null!;

    public int UrlType { get; set; }

    public string? AltText { get; set; }

    public int? DisplayOrder { get; set; }

    public bool? IsPrimary { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
