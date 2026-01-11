using System;

namespace backend.Models;

public partial class Address
{
    public int Id { get; set; }

    public string AddressLine { get; set; } = null!;

    public string? GooglePlaceId { get; set; }

    public string? FormattedAddress { get; set; }

    public string? Country { get; set; }

    public string? CountryCode { get; set; }

    public string? State { get; set; }

    public string? StateCode { get; set; }

    public string? City { get; set; }

    public string? PostalCode { get; set; }

    public string? StreetNumber { get; set; }

    public string? Route { get; set; }

    public bool IsValidated { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual AppUser? UpdatedByNavigation { get; set; }
}
