using System;

namespace backend.Models;

public partial class CustomerPhoneCall
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public DateTime CallDate { get; set; }

    public int CallType { get; set; }

    public int? DurationMinutes { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual AppUser? UpdatedByNavigation { get; set; }
}
