// Importações necessárias para autenticação e autorização
using Microsoft.AspNetCore.Authorization; // Fornece [Authorize] para proteger endpoints com RBAC
using Microsoft.AspNetCore.Mvc;           // Base para controllers da API REST (ControllerBase, IActionResult)
using FastBuy.API.DTOs;                   // DTOs compartilhados do projeto (LoginRequest)
using FastBuy.API.Services;              // Interface IAuthService para inversão de dependência

namespace FastBuy.API.Controllers;

/// <summary>
/// Controller responsável pela autenticação e registro de usuários.
/// Implementa o padrão RBAC (Role-Based Access Control) onde:
/// - Login é público (qualquer pessoa pode tentar autenticar)
/// - Registro é restrito a Administradores (somente admins criam novos usuários)
/// Segue o padrão de injeção de dependência via construtor para desacoplamento do serviço de autenticação.
/// </summary>
[ApiController]                // Habilita validação automática de ModelState e binding de JSON no body
[Route("api/auth")]            // Define a rota base — todos os endpoints começam com /api/auth
public class AuthController : ControllerBase
{
    // Dependência injetada via construtor — padrão de Inversão de Dependência (DIP/SOLID)
    // Usa interface IAuthService para permitir troca de implementação sem alterar o controller
    private readonly IAuthService _authService;

    // Construtor com expression body — injeção de dependência do container IoC do ASP.NET Core
    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>
    /// Endpoint de login — PÚBLICO, sem [Authorize].
    /// Recebe email e senha no body da requisição (JSON via [FromBody]).
    /// Retorna JWT token se credenciais válidas, ou 401 Unauthorized se inválidas.
    /// O padrão de retorno nulo para credenciais inválidas evita expor detalhes sobre qual campo está errado
    /// (prática de segurança contra enumeração de usuários).
    /// </summary>
    [HttpPost("login")]        // POST /api/auth/login — verbo POST porque envia dados sensíveis no body
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Delega a validação de credenciais ao serviço — o controller não conhece a lógica de hash/JWT
        var result = await _authService.Login(request.Email, request.Password);

        // Se o serviço retornar null, as credenciais são inválidas — retorna HTTP 401
        // Mensagem genérica "Credenciais inválidas" por segurança (não revela se é email ou senha errada)
        if (result == null) return Unauthorized(new { message = "Credenciais inválidas" });

        // Retorna HTTP 200 com o token JWT e dados do usuário para o frontend armazenar
        return Ok(result);
    }

    /// <summary>
    /// Endpoint de registro de novos usuários — PROTEGIDO por role "Administrador".
    /// Apenas usuários autenticados com JWT contendo a role "Administrador" podem acessar.
    /// Isso implementa RBAC: somente admins criam contas, impedindo auto-registro não autorizado.
    /// Retorna HTTP 201 Created com a URI do recurso criado (padrão REST).
    /// </summary>
    [HttpPost("register")]                     // POST /api/auth/register — criação de recurso via POST
    [Authorize(Roles = "Administrador")]        // RBAC — middleware JWT valida o token e verifica a claim "role"
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Delega criação do usuário ao serviço (hash de senha, persistência no banco, etc.)
        var user = await _authService.Register(request.Name, request.Email, request.Password, request.Role);

        // HTTP 201 Created — padrão REST para criação bem-sucedida
        // Retorna apenas dados públicos (Id, Name, Email, Role) — NUNCA retorna senha ou hash
        // O primeiro parâmetro é a URI do recurso criado (Location header)
        return Created($"api/auth/{user.Id}", new { user.Id, user.Name, user.Email, user.Role });
    }
}

/// <summary>
/// DTO (Data Transfer Object) inline para requisição de registro.
/// Definido no mesmo arquivo por simplicidade — usado apenas pelo AuthController.
/// Padrão DTO: separa a representação da requisição HTTP do modelo de domínio (entidade User),
/// evitando exposição direta da estrutura do banco e permitindo validação específica da API.
/// </summary>
public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;       // Nome completo do usuário
    public string Email { get; set; } = string.Empty;      // Email usado como identificador de login
    public string Password { get; set; } = string.Empty;   // Senha em texto plano — será hasheada pelo serviço
    public string Role { get; set; } = "Operador";         // Role padrão "Operador" — princípio do menor privilégio
}
