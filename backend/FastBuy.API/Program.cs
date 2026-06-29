using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FastBuy.API.Data;
using FastBuy.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ========================
// BANCO DE DADOS — PostgreSQL via EF Core (Npgsql)
// ========================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ========================
// AUTENTICAÇÃO JWT — Bearer Token
// Valida issuer, audience, lifetime e chave de assinatura HMAC-SHA256
// ========================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Configura serialização JSON ignorando ciclos de referência (Navigation Properties)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// ========================
// SWAGGER — Documentação interativa da API com suporte a JWT
// ========================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FastBuy API", Version = "v1" });
    // Configura campo de autorização Bearer no Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Ex: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS aberto — modo desenvolvimento (em produção, restringir origens)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// ========================
// INJEÇÃO DE DEPENDÊNCIA — Services com ciclo de vida Scoped (por requisição)
// ========================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<ICashRegisterService, CashRegisterService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Strategy Pattern: múltiplas implementações de IPaymentGateway
// SaleService recebe IEnumerable<IPaymentGateway> e seleciona pelo Method
builder.Services.AddScoped<IPaymentGateway, CashGateway>();
builder.Services.AddScoped<IPaymentGateway>(sp => new SimpleGateway("PIX", "PIX"));
builder.Services.AddScoped<IPaymentGateway>(sp => new SimpleGateway("Credito", "CC"));
builder.Services.AddScoped<IPaymentGateway>(sp => new SimpleGateway("Debito", "DC"));

var app = builder.Build();

// ========================
// INICIALIZAÇÃO DO BANCO — cria tabelas e seed data na primeira execução
// ========================
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // EnsureCreated cria o banco e tabelas se não existirem (sem migrations)
    db.Database.EnsureCreated();

    // Migração manual: adiciona coluna SupplierId se não existir
    try
    {
        db.Database.ExecuteSqlRaw(@"
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Products' AND column_name='SupplierId') THEN
                    ALTER TABLE ""Products"" ADD COLUMN ""SupplierId"" INTEGER REFERENCES ""Suppliers""(""Id"") ON DELETE SET NULL;
                END IF;
            END $$;");
    }
    catch { }
}
catch (Exception ex)
{
    app.Logger.LogWarning("Banco de dados indisponivel: {Message}. A API iniciara sem seed.", ex.Message);
}

// ========================
// PIPELINE HTTP — ordem importa: CORS → Auth → Routing
// ========================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
// Autenticação antes de autorização — valida JWT em cada requisição
app.UseAuthentication();
app.UseAuthorization();
// Mapeia controllers com atributos [Route] para endpoints HTTP
app.MapControllers();

app.Run();
