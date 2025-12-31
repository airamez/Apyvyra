using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class CustomerOrder
{
    public int Id { get; set; }

    public string OrderNumber { get; set; } = null!;

    public int CustomerId { get; set; }

    public int Status { get; set; }

    public int PaymentStatus { get; set; }

    public string ShippingAddress { get; set; } = null!;

    public decimal Subtotal { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Notes { get; set; }

    public string? StripePaymentIntentId { get; set; }

    public string? StripeClientSecret { get; set; }

    public string? GooglePlaceId { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime OrderDate { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual AppUser Customer { get; set; } = null!;

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual AppUser? UpdatedByNavigation { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
