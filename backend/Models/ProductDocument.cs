using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("product_documents")]
public class ProductDocument
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("product_id")]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(1000)]
    [Column("document_url")]
    public string DocumentUrl { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Column("document_type")]
    public string DocumentType { get; set; } = "image"; // image, video, manual

    [MaxLength(500)]
    [Column("alt_text")]
    public string? AltText { get; set; }

    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;

    [Column("is_primary")]
    public bool IsPrimary { get; set; } = false;

    // Auditing fields
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    // Navigation properties
    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }
}
