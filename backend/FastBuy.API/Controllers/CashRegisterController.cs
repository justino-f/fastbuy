// Importações necessárias para o controller de caixa
using Microsoft.AspNetCore.Authorization; // [Authorize] para exigir autenticação JWT em todos os endpoints
using Microsoft.AspNetCore.Mvc;           // Base para controllers REST (ControllerBase, IActionResult, atributos HTTP)
using FastBuy.API.Services;              // Interface ICashRegisterService — inversão de dependência

namespace FastBuy.API.Controllers;

/// <summary>
/// Controller responsável pelo ciclo de vida completo do caixa (PDV).
/// Todos os endpoints exigem autenticação ([Authorize] no nível da classe).
/// Implementa as operações essenciais de um caixa de varejo:
/// - Abertura com saldo inicial
/// - Fechamento com cálculo de saldo final
/// - Consulta do caixa atual do operador
/// - Histórico de caixas
/// - Sangria (retirada de dinheiro) e Suprimento (adição de dinheiro)
/// Utiliza o método de extensão GetUserId() para extrair o ID do usuário do token JWT,
/// garantindo que cada operação seja vinculada ao operador autenticado.
/// </summary>
[ApiController]                    // Habilita binding automático de JSON e validação de ModelState
[Route("api/cash-register")]       // Rota base: /api/cash-register
[Authorize]                        // Exige JWT válido em TODOS os endpoints — sem exceção neste controller
public class CashRegisterController : ControllerBase
{
    // Serviço injetado via construtor — contém toda a lógica de negócio do caixa
    // Padrão Repository/Service: controller apenas orquestra, não implementa regras
    private readonly ICashRegisterService _cashRegisterService;

    // Injeção de dependência via construtor com expression body — resolvido pelo container IoC
    public CashRegisterController(ICashRegisterService cashRegisterService) => _cashRegisterService = cashRegisterService;

    /// <summary>
    /// Retorna o histórico de caixas do operador autenticado.
    /// Usa this.GetUserId() — método de extensão definido em Extensions.cs que extrai
    /// o claim "nameid" (ou "sub") do token JWT decodificado pelo middleware de autenticação.
    /// Filtra apenas os caixas do usuário logado, garantindo isolamento de dados entre operadores.
    /// </summary>
    [HttpGet("history")]           // GET /api/cash-register/history
    public async Task<IActionResult> GetHistory()
    {
        // Extrai o ID do usuário autenticado diretamente do token JWT (claim do payload)
        var userId = this.GetUserId();

        // Busca todos os caixas (abertos e fechados) vinculados a este operador
        var registers = await _cashRegisterService.GetHistory(userId);
        return Ok(registers);      // HTTP 200 com a lista de registros
    }

    /// <summary>
    /// Abre um novo caixa para o operador autenticado.
    /// Recebe o saldo inicial (OpeningBalance) — valor em dinheiro físico no gaveta ao iniciar o turno.
    /// Regra de negócio: um operador só pode ter um caixa aberto por vez (validado no serviço).
    /// Retorna HTTP 201 Created com a URI do recurso e os dados do caixa criado.
    /// </summary>
    [HttpPost("open")]             // POST /api/cash-register/open — criação de recurso (novo caixa)
    public async Task<IActionResult> Open([FromBody] OpenCashRegisterRequest request)
    {
        var userId = this.GetUserId();

        // Cria o registro de caixa no banco associado ao operador com o saldo inicial informado
        var register = await _cashRegisterService.Open(userId, request.OpeningBalance);

        // HTTP 201 Created — padrão REST para recursos recém-criados
        return Created($"api/cash-register/{register.Id}", register);
    }

    /// <summary>
    /// Fecha um caixa existente pelo ID.
    /// O fechamento calcula automaticamente o saldo final com base nas vendas, sangrias e suprimentos.
    /// Retorna 404 se o caixa não existir — tratamento defensivo para IDs inválidos.
    /// </summary>
    [HttpPut("{id}/close")]        // PUT /api/cash-register/{id}/close — atualização de estado (aberto → fechado)
    public async Task<IActionResult> Close(int id)
    {
        // Tenta fechar o caixa — retorna null se não encontrado
        var register = await _cashRegisterService.Close(id);

        // Tratamento de caixa inexistente — HTTP 404 Not Found
        if (register == null) return NotFound();

        // HTTP 200 com os dados do caixa fechado (inclui saldo final calculado)
        return Ok(register);
    }

    /// <summary>
    /// Retorna o caixa atualmente aberto do operador autenticado.
    /// Essencial para o frontend saber se o operador já tem caixa aberto antes de permitir vendas.
    /// Retorna 404 com mensagem amigável se não houver caixa aberto.
    /// </summary>
    [HttpGet("current")]           // GET /api/cash-register/current
    public async Task<IActionResult> GetCurrent()
    {
        var userId = this.GetUserId();

        // Busca caixa com status "Aberto" para este operador
        var register = await _cashRegisterService.GetCurrent(userId);

        // Se não há caixa aberto, retorna 404 com mensagem descritiva para o frontend exibir
        if (register == null) return NotFound(new { message = "Nenhum caixa aberto" });

        return Ok(register);
    }

    /// <summary>
    /// Realiza uma sangria (retirada de dinheiro do caixa).
    /// Sangria é uma operação contábil onde dinheiro é removido do caixa fisicamente
    /// (ex: depósito bancário, pagamento de fornecedor em espécie).
    /// Exige valor (Amount) e motivo (Reason) para auditoria e rastreabilidade.
    /// O ID do caixa vem pela rota — o DTO CashAdjustmentRequest traz valor e justificativa.
    /// </summary>
    [HttpPost("{id}/sangria")]     // POST /api/cash-register/{id}/sangria — ação sobre recurso existente
    public async Task<IActionResult> Sangria(int id, [FromBody] CashAdjustmentRequest request)
    {
        // Registra a sangria no caixa — debita o valor e persiste o motivo para auditoria
        await _cashRegisterService.Sangria(id, request.Amount, request.Reason);
        return Ok(new { message = "Sangria realizada" }); // Confirmação textual para o frontend
    }

    /// <summary>
    /// Realiza um suprimento (adição de dinheiro ao caixa).
    /// Suprimento é o inverso da sangria — dinheiro é adicionado ao caixa fisicamente
    /// (ex: troco adicional, reforço de caixa para o turno).
    /// Mesma estrutura da sangria: valor + motivo para rastreabilidade completa.
    /// </summary>
    [HttpPost("{id}/suprimento")]  // POST /api/cash-register/{id}/suprimento — ação sobre recurso existente
    public async Task<IActionResult> Suprimento(int id, [FromBody] CashAdjustmentRequest request)
    {
        // Registra o suprimento no caixa — credita o valor e persiste o motivo
        await _cashRegisterService.Suprimento(id, request.Amount, request.Reason);
        return Ok(new { message = "Suprimento realizado" }); // Confirmação textual
    }
}

/// <summary>
/// DTO para abertura de caixa.
/// Contém apenas o saldo inicial — campo obrigatório para iniciar um turno.
/// Definido inline (mesmo arquivo) por ser usado exclusivamente neste controller.
/// </summary>
public class OpenCashRegisterRequest
{
    public decimal OpeningBalance { get; set; }  // Saldo inicial em reais — valor físico na gaveta
}

/// <summary>
/// DTO reutilizado por sangria e suprimento.
/// Ambas as operações têm a mesma estrutura: valor monetário + motivo/justificativa.
/// Padrão DRY (Don't Repeat Yourself): um único DTO atende dois endpoints com mesma forma de dados.
/// </summary>
public class CashAdjustmentRequest
{
    public decimal Amount { get; set; }              // Valor monetário da operação (sempre positivo)
    public string Reason { get; set; } = string.Empty; // Justificativa obrigatória — necessário para auditoria
}
