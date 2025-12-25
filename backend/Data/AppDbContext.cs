using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductCategory> ProductCategories { get; set; }

    public virtual DbSet<ProductUrl> ProductUrls { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("app_user_pkey");

            entity.ToTable("app_user");

            entity.HasIndex(e => e.Email, "app_user_email_key").IsUnique();

            entity.HasIndex(e => e.Email, "idx_app_user_email");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.UserType)
                .HasDefaultValue(2)
                .HasColumnName("user_type");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("product_pkey");

            entity.ToTable("product");

            entity.HasIndex(e => e.Brand, "idx_product_brand");

            entity.HasIndex(e => e.CategoryId, "idx_product_category");

            entity.HasIndex(e => e.IsActive, "idx_product_is_active");

            entity.HasIndex(e => e.Name, "idx_product_name");

            entity.HasIndex(e => e.Sku, "idx_product_sku");

            entity.HasIndex(e => e.Sku, "product_sku_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Brand)
                .HasMaxLength(255)
                .HasColumnName("brand");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CostPrice)
                .HasPrecision(18, 2)
                .HasColumnName("cost_price");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Dimensions)
                .HasMaxLength(255)
                .HasColumnName("dimensions");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LowStockThreshold)
                .HasDefaultValue(10)
                .HasColumnName("low_stock_threshold");
            entity.Property(e => e.Manufacturer)
                .HasMaxLength(255)
                .HasColumnName("manufacturer");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
            entity.Property(e => e.Price)
                .HasPrecision(18, 2)
                .HasColumnName("price");
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .HasColumnName("sku");
            entity.Property(e => e.StockQuantity)
                .HasDefaultValue(0)
                .HasColumnName("stock_quantity");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.Weight)
                .HasMaxLength(255)
                .HasColumnName("weight");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("product_category_id_fkey");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("product_created_by_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProductUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("product_updated_by_fkey");
        });

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("product_category_pkey");

            entity.ToTable("product_category");

            entity.HasIndex(e => e.Name, "idx_product_category_name");

            entity.HasIndex(e => e.ParentCategoryId, "idx_product_category_parent");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.ParentCategoryId).HasColumnName("parent_category_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductCategoryCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("product_category_created_by_fkey");

            entity.HasOne(d => d.ParentCategory).WithMany(p => p.InverseParentCategory)
                .HasForeignKey(d => d.ParentCategoryId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("product_category_parent_category_id_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProductCategoryUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("product_category_updated_by_fkey");
        });

        modelBuilder.Entity<ProductUrl>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("product_url_pkey");

            entity.ToTable("product_url");

            entity.HasIndex(e => e.IsPrimary, "idx_product_url_primary");

            entity.HasIndex(e => e.ProductId, "idx_product_url_product");

            entity.HasIndex(e => e.UrlType, "idx_product_url_type");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AltText)
                .HasMaxLength(500)
                .HasColumnName("alt_text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false)
                .HasColumnName("is_primary");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Url)
                .HasMaxLength(1000)
                .HasColumnName("url");
            entity.Property(e => e.UrlType)
                .HasColumnName("url_type");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductUrls)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("product_url_created_by_fkey");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductUrls)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("product_url_product_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            var entity = entry.Entity;
            var createdAtProperty = entity.GetType().GetProperty("CreatedAt");
            var updatedAtProperty = entity.GetType().GetProperty("UpdatedAt");

            if (createdAtProperty != null && entry.State == EntityState.Added)
            {
                var value = (DateTime?)createdAtProperty.GetValue(entity);
                if (value.HasValue)
                {
                    createdAtProperty.SetValue(entity, DateTime.SpecifyKind(value.Value, DateTimeKind.Utc));
                }
                else
                {
                    createdAtProperty.SetValue(entity, DateTime.UtcNow);
                }
            }

            if (updatedAtProperty != null)
            {
                updatedAtProperty.SetValue(entity, DateTime.UtcNow);
            }
        }
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
