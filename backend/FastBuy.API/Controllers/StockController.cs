// Importações necessárias para o controller de estoque
using Microsoft.AspNetCore.Authorization; // [Authorize] para exigir autenticação JWT
using Microsoft.AspNetCore.Mvc;           // Base para controllers REST
using FastBuy.API.Services;              // Interface IStockService — inversão de dependência

namespace FastBuy.API.Controllers;

/// <summary>
/// Controller responsável pelo controle de estoque e movimentações.
/// Todos os endpoints exigem autenticação ([Authorize] no nível da classe).
/// Implementa três operações fundamentais de gestão de estoque:
/// - Consulta de movimentações (com filtro opcional por produto)
/// - Registro de novas movimentações (entrada, saída, ajuste)
/// - Alerta de estoque baixo (produtos abaixo do estoque mínimo)
/// Cada movimentação é vinculada ao usuário autenticado via JWT para rastreabilidade.
/// </summary>
[ApiController]            // Habilita binding automático de JSON e validação de ModelState
[Route("api/stock")]       // Rota base: /api/stock
[Authorize]                // Exige token JWT válido em todos os endpoints deste controller
public class StockController : ControllerBase
{
    // Serviço de estoque injetado via construtor — padrão de inversão de dependência (DIP/SOLID)
    // O controller delega toda lógica de negócio ao serviço, mantendo-se como orquestrador HTTP
    private readonly IStockService _stockService;

    // Injeção de dependência com expression body — resolvido pelo container IoC do ASP.NET Core
    public StockController(IStockService stockService) => _stockService = stockService;

    /// <summary>
    /// Lista movimentações de estoque com filtro opcional por produto.
    /// Se productId for informado via query string, retorna apenas movimentações daquele produto.
    /// Se omitido, retorna todas as movimentações — útil para visão gerencial.
    /// Usa expression body (=>) por ser um endpoint simples sem lógica condicional.
    /// </summary>
    [HttpGet("movements")]     // GET /api/stock/movements?productId=123 (productId opcional)
    public async Task<IActionResult> GetMovements([FromQuery] int? productId)
        => Ok(await _stockService.GetMovements(productId)); // int? nullable — null = sem filtro

    /// <summary>
    /// Registra uma nova movimentação de estoque (entrada, saída ou ajuste).
    /// Vincula automaticamente o userId do operador autenticado via this.GetUserId(),
    /// método de extensão que extrai o claim de identidade do token JWT.
    /// Isso garante rastreabilidade: toda movimentação tem autor identificado.
    /// Retorna HTTP 201 Created com URI do recurso e dados da movimentação criada.
    /// </summary>
    [HttpPost("movement")]     // POST /api/stock/movement — criação de recurso (nova movimentação)
    public async Task<IActionResult> AddMovement([FromBody] StockMovementRequest request)
    {
        // Cria a movimentação delegando ao serviço — que atualiza o estoque do produto e persiste o registro
        // this.GetUserId() extrai o ID do JWT para vincular quem realizou a movimentação (auditoria)
        var movement = await _stockService.AddMovement(request.ProductId, request.Type, request.Quantity, request.Reason, this.GetUserId());

        // HTTP 201 Created — padrão REST indicando que o recurso foi criado com sucesso
        return Created($"api/stock/movements/{movement.Id}", movement);
    }

    /// <summary>
    /// Retorna lista de produtos com estoque abaixo do mínimo configurado.
    /// Endpoint de alerta: permite ao gestor identificar rapidamente produtos que precisam de reposição.
    /// A comparação CurrentStock <= MinStock é feita no serviço/repositório.
    /// Usa expression body por ser uma operação direta sem lógica condicional.
    /// </summary>
    [HttpGet("low-stock")]     // GET /api/stock/low-stock — endpoint de monitoramento/alerta
    public async Task<IActionResult> GetLowStock()
        => Ok(await _stockService.GetLowStock()); // Retorna HTTP 200 com lista de produtos em estoque crítico
}

/// <summary>
/// DTO (Data Transfer Object) para requisição de movimentação de estoque.
/// Definido inline (mesmo arquivo) por ser usado exclusivamente pelo StockController.
/// Separa a representação HTTP do modelo de domínio — o campo UserId NÃO está no DTO
/// porque é extraído do JWT automaticamente (segurança: impede que o cliente forje o autor).
/// </summary>
public class StockMovementRequest
{
    public int ProductId { get; set; }       // ID do produto que sofrerá a movimentação
    public string Type { get; set; } = string.Empty; // Tipo: "Entrada", "Saída" ou "Ajuste"
    public int Quantity { get; set; }        // Quantidade movimentada (sempre positiva — o tipo define a direção)
    public string? Reason { get; set; }      // Motivo opcional — nullable para movimentações de rotina (ex: venda)
}
