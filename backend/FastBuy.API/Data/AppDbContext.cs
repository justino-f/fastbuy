using Microsoft.EntityFrameworkCore;
using FastBuy.API.Models;

namespace FastBuy.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<CancelledCoupon> CancelledCoupons => Set<CancelledCoupon>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.HasIndex(p => p.Barcode).IsUnique();
            e.HasIndex(p => p.SKU).IsUnique();
            e.HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId);
            e.HasOne(p => p.Supplier).WithMany(s => s.Products).HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.SetNull);
            e.Property(p => p.CostPrice).HasPrecision(18, 2);
            e.Property(p => p.SalePrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Client>(e =>
        {
            e.HasIndex(c => c.CPF).IsUnique();
        });

        modelBuilder.Entity<Supplier>(e =>
        {
            e.HasIndex(s => s.CNPJ).IsUnique();
        });

        modelBuilder.Entity<Sale>(e =>
        {
            e.HasOne(s => s.Client).WithMany(c => c.Sales).HasForeignKey(s => s.ClientId);
            e.HasOne(s => s.Payment).WithOne(p => p.Sale).HasForeignKey<Payment>(p => p.SaleId);
            e.Property(s => s.Total).HasPrecision(18, 2);
            e.Property(s => s.Discount).HasPrecision(18, 2);
            e.Property(s => s.FinalTotal).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SaleItem>(e =>
        {
            e.HasOne(si => si.Sale).WithMany(s => s.Items).HasForeignKey(si => si.SaleId);
            e.HasOne(si => si.Product).WithMany().HasForeignKey(si => si.ProductId);
            e.Property(si => si.UnitPrice).HasPrecision(18, 2);
            e.Property(si => si.Subtotal).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.Property(p => p.Change).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CashRegister>(e =>
        {
            e.Property(c => c.OpeningBalance).HasPrecision(18, 2);
            e.Property(c => c.ClosingBalance).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CancelledCoupon>(e =>
        {
            e.Property(c => c.Total).HasPrecision(18, 2);
        });

        modelBuilder.Entity<StockMovement>(e =>
        {
            e.HasOne(sm => sm.Product).WithMany().HasForeignKey(sm => sm.ProductId);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Name = "Administrador",
            Email = "admin@fastbuy.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = "Administrador",
            Active = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        var categories = new[]
        {
            new Category { Id = 1, Name = "Bebidas", Active = true },
            new Category { Id = 2, Name = "Hortifruti", Active = true },
            new Category { Id = 3, Name = "Padaria", Active = true },
            new Category { Id = 4, Name = "Limpeza", Active = true },
            new Category { Id = 5, Name = "Açougue", Active = true },
            new Category { Id = 6, Name = "Laticínios", Active = true },
            new Category { Id = 7, Name = "Mercearia", Active = true },
            new Category { Id = 8, Name = "Frios", Active = true }
        };

        modelBuilder.Entity<Category>().HasData(categories);
    }
}
