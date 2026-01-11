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

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerPhoneCall> CustomerPhoneCalls { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductCategory> ProductCategories { get; set; }

    public virtual DbSet<ProductUrl> ProductUrls { get; set; }

    public virtual DbSet<CustomerOrder> CustomerOrders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Address> Addresses { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
            optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("app_user_pkey");

            entity.ToTable("app_user");

            entity.HasIndex(e => e.Email, "app_user_email_key").IsUnique();

            entity.HasIndex(e => e.Email, "idx_app_user_email");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ConfirmationToken)
                .HasMaxLength(255)
                .HasColumnName("confirmation_token");
            entity.Property(e => e.ConfirmationTokenExpiresAt).HasColumnName("confirmation_token_expires_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email")
                .HasColumnType("citext");
            entity.Property(e => e.EmailConfirmedAt).HasColumnName("email_confirmed_at");
            entity.Property(e => e.FullName)
                .HasMaxLength(255)
                .HasColumnName("full_name");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.UserType)
                .HasDefaultValue(2)
                .HasColumnName("user_type");
        });

        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("address_pkey");

            entity.ToTable("address");

            entity.HasIndex(e => e.GooglePlaceId, "idx_address_google_place_id");
            entity.HasIndex(e => e.Country, "idx_address_country");
            entity.HasIndex(e => e.State, "idx_address_state");
            entity.HasIndex(e => e.City, "idx_address_city");
            entity.HasIndex(e => e.PostalCode, "idx_address_postal_code");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddressLine).HasColumnName("address_line");
            entity.Property(e => e.GooglePlaceId)
                .HasMaxLength(255)
                .HasColumnName("google_place_id");
            entity.Property(e => e.FormattedAddress).HasColumnName("formatted_address");
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasColumnName("country");
            entity.Property(e => e.CountryCode)
                .HasMaxLength(10)
                .HasColumnName("country_code");
            entity.Property(e => e.State)
                .HasMaxLength(100)
                .HasColumnName("state");
            entity.Property(e => e.StateCode)
                .HasMaxLength(10)
                .HasColumnName("state_code");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.PostalCode)
                .HasMaxLength(20)
                .HasColumnName("postal_code");
            entity.Property(e => e.StreetNumber)
                .HasMaxLength(50)
                .HasColumnName("street_number");
            entity.Property(e => e.Route)
                .HasMaxLength(255)
                .HasColumnName("route");
            entity.Property(e => e.IsValidated)
                .HasDefaultValue(false)
                .HasColumnName("is_validated");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("address_created_by_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany()
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("address_updated_by_fkey");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("customer_pkey");

            entity.ToTable("customer");

            entity.HasIndex(e => e.AppUserId, "idx_customer_app_user").IsUnique();
            entity.HasIndex(e => e.Phone, "idx_customer_phone");
            entity.HasIndex(e => e.AddressId, "idx_customer_address");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AppUserId).HasColumnName("app_user_id");
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .HasColumnName("phone");
            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.Notes).HasColumnName("notes");

            entity.HasOne(d => d.AppUser).WithOne()
                .HasForeignKey<Customer>(d => d.AppUserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("customer_app_user_id_fkey");

            entity.HasOne(d => d.Address).WithMany()
                .HasForeignKey(d => d.AddressId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("customer_address_id_fkey");

            entity.HasOne(d => d.CreatedByNavigation).WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_created_by_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany()
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("customer_updated_by_fkey");
        });

        modelBuilder.Entity<CustomerPhoneCall>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("customer_phone_call_pkey");

            entity.ToTable("customer_phone_call");

            entity.HasIndex(e => e.CustomerId, "idx_customer_phone_call_customer");
            entity.HasIndex(e => e.CallDate, "idx_customer_phone_call_date");
            entity.HasIndex(e => e.CallType, "idx_customer_phone_call_type");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.CallDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("call_date");
            entity.Property(e => e.CallType)
                .HasDefaultValue(0)
                .HasColumnName("call_type");
            entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Customer).WithMany(p => p.PhoneCalls)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("customer_phone_call_customer_id_fkey");

            entity.HasOne(d => d.CreatedByNavigation).WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_phone_call_created_by_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany()
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("customer_phone_call_updated_by_fkey");
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
                .HasColumnName("brand")
                .HasColumnType("citext");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CostPrice)
                .HasPrecision(19, 4)
                .HasColumnName("cost_price");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
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
                .HasColumnName("manufacturer")
                .HasColumnType("citext");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name")
                .HasColumnType("citext");
            entity.Property(e => e.Price)
                .HasPrecision(19, 4)
                .HasColumnName("price");
            entity.Property(e => e.TaxRate)
                .HasPrecision(5, 2)
                .HasDefaultValue(0m)
                .HasColumnName("tax_rate");
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .HasColumnName("sku");
            entity.Property(e => e.StockQuantity)
                .HasDefaultValue(0)
                .HasColumnName("stock_quantity");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
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
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name")
                .HasColumnType("citext");
            entity.Property(e => e.ParentCategoryId).HasColumnName("parent_category_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductCategoryCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
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
            entity.Property(e => e.UrlType).HasColumnName("url_type");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductUrls)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("product_url_created_by_fkey");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductUrls)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("product_url_product_id_fkey");
        });

        modelBuilder.Entity<CustomerOrder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("customer_order_pkey");

            entity.ToTable("customer_order");

            entity.HasIndex(e => e.OrderNumber, "idx_customer_order_number");
            entity.HasIndex(e => e.CustomerId, "idx_customer_order_customer");
            entity.HasIndex(e => e.Status, "idx_customer_order_status");
            entity.HasIndex(e => e.OrderDate, "idx_customer_order_date");
            entity.HasIndex(e => e.ShippingAddressId, "idx_customer_order_shipping_address");
            entity.HasIndex(e => e.OrderNumber, "customer_order_order_number_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderNumber)
                .HasMaxLength(50)
                .HasColumnName("order_number");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.Status)
                .HasDefaultValue(0)
                .HasColumnName("status");
            entity.Property(e => e.PaymentStatus)
                .HasDefaultValue(0)
                .HasColumnName("payment_status");
            entity.Property(e => e.ShippingAddressId).HasColumnName("shipping_address_id");
            entity.Property(e => e.Subtotal)
                .HasPrecision(19, 4)
                .HasColumnName("subtotal");
            entity.Property(e => e.TaxAmount)
                .HasPrecision(19, 4)
                .HasColumnName("tax_amount");
            entity.Property(e => e.TotalAmount)
                .HasPrecision(19, 4)
                .HasColumnName("total_amount");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.StripePaymentIntentId)
                .HasMaxLength(255)
                .HasColumnName("stripe_payment_intent_id");
            entity.Property(e => e.StripeClientSecret)
                .HasMaxLength(255)
                .HasColumnName("stripe_client_secret");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("order_date");
            entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
            entity.Property(e => e.ShippedAt).HasColumnName("shipped_at");
            entity.Property(e => e.DeliveredAt).HasColumnName("delivered_at");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Customer).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_order_customer_id_fkey");

            entity.HasOne(d => d.ShippingAddress).WithMany()
                .HasForeignKey(d => d.ShippingAddressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_order_shipping_address_id_fkey");

            entity.HasOne(d => d.CreatedByNavigation).WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("customer_order_created_by_fkey");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany()
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("customer_order_updated_by_fkey");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("order_item_pkey");

            entity.ToTable("order_item");

            entity.HasIndex(e => e.OrderId, "idx_order_item_order");
            entity.HasIndex(e => e.ProductId, "idx_order_item_product");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductName)
                .HasMaxLength(255)
                .HasColumnName("product_name");
            entity.Property(e => e.ProductSku)
                .HasMaxLength(100)
                .HasColumnName("product_sku");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice)
                .HasPrecision(19, 4)
                .HasColumnName("unit_price");
            entity.Property(e => e.TaxRate)
                .HasPrecision(5, 2)
                .HasColumnName("tax_rate");
            entity.Property(e => e.TaxAmount)
                .HasPrecision(19, 4)
                .HasColumnName("tax_amount");
            entity.Property(e => e.LineTotal)
                .HasPrecision(19, 4)
                .HasColumnName("line_total");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("order_item_order_id_fkey");

            entity.HasOne(d => d.Product).WithMany()
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("order_item_product_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    // Override SaveChanges to maintain the existing timestamp functionality
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
