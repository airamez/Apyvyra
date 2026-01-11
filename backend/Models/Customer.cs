using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class Customer
{
    public int Id { get; set; }

    public int AppUserId { get; set; }

    public string? Phone { get; set; }

    public int? AddressId { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public string? Notes { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;

    public virtual Address? Address { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual AppUser? UpdatedByNavigation { get; set; }

    public virtual ICollection<CustomerPhoneCall> PhoneCalls { get; set; } = new List<CustomerPhoneCall>();

    public virtual ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
}
