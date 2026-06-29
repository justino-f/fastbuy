using Microsoft.EntityFrameworkCore;
using FastBuy.API.Models;

namespace FastBuy.API.Data;

// Contexto do Entity Framework Core — mapeia modelos para tabelas PostgreSQL
// Centraliza configuração de relacionamentos, índices e seed data
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSets: cada propriedade representa uma tabela no banco
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
        // Aplica precisão monetária (18,2) em todas as propriedades decimal automaticamente
        // Evita repetir .HasPrecision() em cada entidade individualmente
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
            foreach (var property in entity.GetProperties().Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            { property.SetPrecision(18); property.SetScale(2); }

        // Índice único no email do usuário — impede cadastros duplicados
        modelBuilder.Entity<User>(e => e.HasIndex(u => u.Email).IsUnique());

        // Configuração do Product: índices únicos em Barcode e SKU + relacionamentos
        modelBuilder.Entity<Product>(e =>
        {
            e.HasIndex(p => p.Barcode).IsUnique();
            e.HasIndex(p => p.SKU).IsUnique();
            // Product N:1 Category (obrigatório)
            e.HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId);
            // Product N:1 Supplier (opcional, ON DELETE SET NULL)
            e.HasOne(p => p.Supplier).WithMany(s => s.Products).HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.SetNull);
        });

        // Índices únicos para CPF e CNPJ
        modelBuilder.Entity<Client>(e => e.HasIndex(c => c.CPF).IsUnique());
        modelBuilder.Entity<Supplier>(e => e.HasIndex(s => s.CNPJ).IsUnique());

        // Configuração de Sale: relacionamento com Client e Payment
        modelBuilder.Entity<Sale>(e =>
        {
            // Sale N:1 Client (opcional)
            e.HasOne(s => s.Client).WithMany(c => c.Sales).HasForeignKey(s => s.ClientId);
            // Sale 1:1 Payment (FK no Payment)
            e.HasOne(s => s.Payment).WithOne(p => p.Sale).HasForeignKey<Payment>(p => p.SaleId);
        });

        // SaleItem: N:1 Sale e N:1 Product
        modelBuilder.Entity<SaleItem>(e =>
        {
            e.HasOne(si => si.Sale).WithMany(s => s.Items).HasForeignKey(si => si.SaleId);
            e.HasOne(si => si.Product).WithMany().HasForeignKey(si => si.ProductId);
        });

        // StockMovement N:1 Product
        modelBuilder.Entity<StockMovement>(e => e.HasOne(sm => sm.Product).WithMany().HasForeignKey(sm => sm.ProductId));

        SeedData(modelBuilder);
    }

    // Seed data: dados iniciais inseridos na criação do banco
    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Usuário administrador padrão (senha: admin123)
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

        // Categorias padrão de supermercado
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
