using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductDocument> ProductDocuments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Configure ProductCategory entity
        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.ParentCategoryId);

            entity.HasOne(e => e.ParentCategory)
                .WithMany(e => e.SubCategories)
                .HasForeignKey(e => e.ParentCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure Product entity
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.Brand);
            entity.HasIndex(e => e.IsActive);

            entity.HasOne(e => e.Category)
                .WithMany(e => e.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure ProductDocument entity
        modelBuilder.Entity<ProductDocument>(entity =>
        {
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.DocumentType);
            entity.HasIndex(e => e.IsPrimary);

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Documents)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
