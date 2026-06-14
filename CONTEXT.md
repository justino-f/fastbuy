# CONTEXT.md - FastBuy SGS (Sistema de Gestao de Supermercado)

Documentacao tecnica completa do MVP implementado.

---

## Visao Geral

Sistema de gestao de supermercado com tres camadas:

| Camada | Tecnologia | Porta | Funcao |
|--------|-----------|-------|--------|
| Backend API | ASP.NET Core 9 | 5000 | Regras de negocio, autenticacao, dados |
| Frontend Web | React 18 + TypeScript | 3000 | Administracao, cadastros, relatorios |
| Desktop | Tauri v2 + React | 1420 | PDV operacional, funciona offline |
| Banco de Dados | PostgreSQL 16 | 5432 | Persistencia |

---

## Como Executar

### Docker Compose (recomendado)
```bash
cd E:\Shared\projects\fastbuy
docker-compose up -d
```
Acesso: http://localhost:3000
API: http://localhost:5000/swagger

### Manual

**Banco:**
```bash
# PostgreSQL rodando em localhost:5432
# Database: fastbuy | User: postgres | Password: postgres123
```

**Backend:**
```bash
cd backend/FastBuy.API
dotnet restore
dotnet run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Desktop:**
```bash
cd desktop
npm install
npm run tauri dev
```

### Login Padrao
- Email: `admin@fastbuy.com`
- Senha: `admin123`
- Role: Administrador

---

## Arquitetura do Projeto

```
fastbuy/
├── backend/FastBuy.API/        # ASP.NET Core 9 Web API
│   ├── Models/                 # 11 entidades EF Core
│   ├── Data/                   # DbContext + seed
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Services/               # Logica de negocio (23 arquivos)
│   ├── Controllers/            # 12 controllers REST
│   ├── DataStructures/         # Estruturas de dados academicas
│   ├── Program.cs              # Configuracao e DI
│   └── Dockerfile
├── frontend/                   # React 18 + TypeScript + Vite
│   ├── src/types/              # Interfaces TypeScript
│   ├── src/services/           # Camada de API (Axios)
│   ├── src/contexts/           # AuthContext
│   ├── src/components/         # Layout, Sidebar, PrivateRoute
│   ├── src/pages/              # 15 paginas
│   ├── Dockerfile
│   └── nginx.conf
├── desktop/                    # Tauri v2 + React
│   ├── src-tauri/              # Configuracao Rust/Tauri
│   ├── src/services/           # API com fallback offline
│   ├── src/pages/              # 6 paginas (PDV-focused)
│   └── package.json
├── docker-compose.yml
├── changelog.txt
└── README.md
```

---

## Banco de Dados

### Tabelas (11)

| Tabela | Descricao | Indices Unicos |
|--------|-----------|----------------|
| Users | Usuarios do sistema | Email |
| Products | Catalogo de produtos | Barcode, SKU |
| Categories | Categorias de produtos | - |
| Clients | Clientes cadastrados | CPF |
| Suppliers | Fornecedores | CNPJ |
| StockMovements | Historico de movimentacoes de estoque | - |
| Sales | Vendas realizadas | - |
| SaleItems | Itens de cada venda | - |
| Payments | Pagamentos das vendas | - |
| CashRegisters | Controle de caixa | - |
| CancelledCoupons | Cupons fiscais cancelados | - |

### Relacionamentos

```
Category 1──N Product
Client 1──N Sale
Sale 1──N SaleItem
Sale 1──1 Payment
SaleItem N──1 Product
StockMovement N──1 Product
```

### Seed Inicial

**Usuario admin:**
- Id: 1, Email: admin@fastbuy.com, Senha: admin123, Role: Administrador

**Categorias:**
1. Bebidas
2. Hortifruti
3. Padaria
4. Limpeza
5. Acougue
6. Laticinios
7. Mercearia
8. Frios

### Configuracao EF Core

- Precisao decimal: 18,2 para todos os campos monetarios
- Indices unicos: Email (User), Barcode/SKU (Product), CPF (Client), CNPJ (Supplier)
- Cascade delete padrao do EF Core
- `ReferenceHandler.IgnoreCycles` para evitar loops de serializacao

---

## Backend - API REST

### Seguranca

| Aspecto | Implementacao |
|---------|--------------|
| Autenticacao | JWT Bearer Token |
| Senhas | BCrypt hash |
| Autorizacao | RBAC (Administrador, Gerente, Operador) |
| CORS | AllowAny (desenvolvimento) |
| Token | Expiracao: 8 horas |

**JWT Claims:**
- `ClaimTypes.NameIdentifier` = User.Id
- `ClaimTypes.Email` = User.Email
- `ClaimTypes.Name` = User.Name
- `ClaimTypes.Role` = User.Role

### Endpoints da API (42 total)

---

#### AuthController `api/auth`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/login` | Nao | Autentica usuario, retorna JWT |
| POST | `/register` | Administrador | Cria novo usuario |

**POST /login**
```json
// Request
{ "email": "string", "password": "string" }
// Response 200
{ "token": "jwt_string", "user": { "id": 1, "name": "...", "email": "...", "role": "..." } }
// Response 401
{ "message": "Credenciais invalidas" }
```

**POST /register**
```json
// Request
{ "name": "string", "email": "string", "password": "string", "role": "Operador" }
// Response 201
{ "id": 1, "name": "...", "email": "...", "role": "..." }
```

---

#### ProductsController `api/products`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Lista produtos (search, categoryId, sortBy, algorithm) |
| GET | `/{id}` | Sim | Produto por ID |
| GET | `/barcode/{barcode}` | Sim | Produto por codigo de barras |
| POST | `/` | Sim | Cria produto |
| PUT | `/{id}` | Sim | Atualiza produto |
| DELETE | `/{id}` | Sim | Remove produto (soft delete) |

**Query params GET /:**
- `search` (string): filtra por nome
- `categoryId` (int): filtra por categoria
- `sortBy` (string): "name", "price", "stock"
- `algorithm` (string): "bubble", "insertion", "quick", "merge"

**POST / PUT Body:**
```json
{
  "name": "Arroz 5kg",
  "barcode": "7891234567890",
  "sku": "ARR-001",
  "categoryId": 7,
  "brand": "Tio Joao",
  "unit": "UN",
  "costPrice": 18.90,
  "salePrice": 25.90,
  "minStock": 10,
  "currentStock": 50,
  "description": "Arroz branco tipo 1",
  "active": true,
  "imageUrl": null
}
```

---

#### CategoriesController `api/categories`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Lista categorias |
| POST | `/` | Sim | Cria categoria |
| PUT | `/{id}` | Sim | Atualiza categoria |
| DELETE | `/{id}` | Sim | Remove categoria |

---

#### ClientsController `api/clients`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Lista clientes (search) |
| GET | `/{id}` | Sim | Cliente por ID |
| GET | `/{id}/purchases` | Sim | Historico de compras |
| POST | `/` | Sim | Cria cliente |
| PUT | `/{id}` | Sim | Atualiza cliente |

**Body:**
```json
{ "name": "Joao Silva", "cpf": "12345678901", "phone": "11999999999", "email": "joao@email.com" }
```

---

#### SuppliersController `api/suppliers`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Lista fornecedores |
| POST | `/` | Sim | Cria fornecedor |
| PUT | `/{id}` | Sim | Atualiza fornecedor |
| DELETE | `/{id}` | Sim | Remove fornecedor |

**Body:**
```json
{
  "companyName": "Distribuidora ABC",
  "cnpj": "12345678000190",
  "phone": "1133334444",
  "email": "contato@abc.com",
  "address": "Rua X, 123"
}
```

---

#### StockController `api/stock`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Lista movimentacoes (productId?) |
| POST | `/` | Sim | Registra movimentacao |
| GET | `/low` | Sim | Produtos com estoque baixo |

**POST Body:**
```json
{
  "productId": 1,
  "type": "Entrada",
  "quantity": 100,
  "reason": "Compra fornecedor"
}
```

Tipos validos: `Entrada`, `Saida`, `Ajuste`, `Perda`

Ao registrar movimentacao:
- Entrada: CurrentStock += Quantity
- Saida/Perda: CurrentStock -= Quantity
- Ajuste: CurrentStock = Quantity

---

#### SalesController `api/sales`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/` | Sim | Cria venda |
| PUT | `/{id}/cancel` | Sim | Cancela venda |
| GET | `/` | Sim | Lista vendas (date, status) |
| GET | `/{id}` | Sim | Venda por ID |

**POST / (Criar Venda):**
```json
{
  "clientId": 1,
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ],
  "discount": 5.00,
  "payment": {
    "method": "Dinheiro",
    "amount": 100.00
  }
}
```

Fluxo interno:
1. Cria Sale + SaleItems
2. Calcula Total (soma subtotais) e FinalTotal (Total - Discount)
3. Deduz estoque de cada produto (CurrentStock -= quantity)
4. Processa pagamento via IPaymentGateway (mock)
5. Cria Payment
6. Retorna Sale com items e payment

**PUT /{id}/cancel:**
```json
{ "reason": "Cliente desistiu" }
```

Fluxo de cancelamento:
1. Marca Sale.Status = "Cancelada"
2. Restaura estoque de cada item
3. Cria CancelledCoupon com resumo dos itens
4. Push do cupom na CouponStack (pilha em memoria)

---

#### CashRegisterController `api/cash-register`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/open` | Sim | Abre caixa |
| POST | `/close` | Sim | Fecha caixa |
| GET | `/current` | Sim | Caixa atual do usuario |

**POST /open:**
```json
{ "openingBalance": 200.00 }
```

---

#### DashboardController `api/dashboard`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Sim | Indicadores do dia |

**Response:**
```json
{
  "totalSoldToday": 1500.50,
  "productsSoldToday": 45,
  "outOfStockCount": 3,
  "clientsServedToday": 12,
  "salesByHour": [
    { "hour": 8, "total": 200.00 },
    { "hour": 9, "total": 350.00 }
  ],
  "topProducts": [
    { "name": "Arroz 5kg", "quantity": 15 },
    { "name": "Leite 1L", "quantity": 12 }
  ]
}
```

---

#### ReportsController `api/reports`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/sales` | Sim | Relatorio de vendas (period: daily/weekly/monthly) |
| GET | `/top-products` | Sim | Produtos mais vendidos |
| GET | `/low-stock` | Sim | Estoque baixo |
| GET | `/revenue` | Sim | Faturamento |

---

#### PaymentController `api/payment`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/process` | Sim | Processa pagamento (mock) |

**Body:**
```json
{ "saleId": 1, "method": "PIX", "amount": 150.00 }
```

Metodos: `Dinheiro`, `PIX`, `Credito`, `Debito`

Todos os gateways sao mock - retornam sucesso com transactionId simulado.

---

#### DataStructuresController `api/data-structures`

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/queue/enqueue` | Sim | Adiciona cliente na fila |
| POST | `/queue/dequeue` | Sim | Remove proximo da fila |
| GET | `/queue/peek` | Sim | Consulta proximo sem remover |
| GET | `/queue` | Sim | Lista fila completa |
| GET | `/stack` | Sim | Lista pilha de cupons cancelados |
| GET | `/stack/peek` | Sim | Consulta topo da pilha |
| POST | `/stack/pop` | Sim | Remove topo da pilha |
| GET | `/matrix` | Sim | Produtos como matriz bidimensional |
| GET | `/sort` | Sim | Ordena produtos (sortBy, algorithm) |

---

## Estruturas de Dados (Requisito Academico)

### 1. Vetor (List<>)

**Arquivo:** `Services/SaleService.cs`

Uso: `List<string> produtosVendidos` - armazena nomes dos produtos na venda atual.
Demonstra uso de vetor/lista para colecao de itens.

```csharp
List<string> produtosVendidos = new();
foreach (var item in request.Items)
{
    produtosVendidos.Add(product.Name);
}
```

### 2. Fila (Queue<Client>)

**Arquivo:** `DataStructures/ClientQueue.cs`

Estrutura FIFO (First In, First Out) para gerenciar ordem de atendimento.

```csharp
public class ClientQueue
{
    private readonly Queue<Client> _queue = new();
    public void EnqueueClient(Client client) => _queue.Enqueue(client);
    public Client DequeueClient() => _queue.Dequeue();
    public Client PeekClient() => _queue.Peek();
    public List<Client> GetQueue() => _queue.ToList();
    public int Count => _queue.Count;
}
```

Registrado como `Singleton` no DI - mantido em memoria durante execucao.

### 3. Pilha (Stack<CancelledCoupon>)

**Arquivo:** `DataStructures/CouponStack.cs`

Estrutura LIFO (Last In, First Out) para cupons cancelados.

```csharp
public class CouponStack
{
    private readonly Stack<CancelledCoupon> _stack = new();
    public void PushCoupon(CancelledCoupon coupon) => _stack.Push(coupon);
    public CancelledCoupon PopCoupon() => _stack.Pop();
    public CancelledCoupon PeekCoupon() => _stack.Peek();
    public List<CancelledCoupon> GetAll() => _stack.ToList();
    public int Count => _stack.Count;
}
```

O cancelamento de venda automaticamente faz Push na pilha.

### 4. Matriz (string[,])

**Arquivo:** `DataStructures/ProductMatrix.cs`

Array bidimensional representando produtos em formato tabular.

```csharp
public static string[,] ToMatrix(List<Product> products)
```

Colunas: Nome, Codigo, Categoria, Quantidade, Preco Custo, Preco Venda

### 5. Algoritmos de Ordenacao

**Arquivo:** `DataStructures/ProductSorter.cs`

4 algoritmos implementados manualmente (sem usar .Sort() ou LINQ OrderBy):

| Algoritmo | Complexidade | Metodo |
|-----------|-------------|--------|
| Bubble Sort | O(n^2) | Compara pares adjacentes e troca |
| Insertion Sort | O(n^2) | Insere cada elemento na posicao correta |
| Quick Sort | O(n log n) medio | Particiona por pivo recursivamente |
| Merge Sort | O(n log n) | Divide, ordena e intercala |

Criterios de ordenacao: `name`, `price`, `stock`

Cada algoritmo retorna nova lista sem modificar a original.

---

## Frontend Web

### Dependencias

| Pacote | Versao | Funcao |
|--------|--------|--------|
| react | 18.3.1 | UI framework |
| react-dom | 18.3.1 | DOM rendering |
| react-router-dom | 6.26.0 | Roteamento SPA |
| axios | 1.7.0 | HTTP client |
| recharts | 2.12.0 | Graficos |
| vite | 5.4.0 | Build tool |
| typescript | 5.5.0 | Tipagem |

### Rotas

| Rota | Componente | Acesso | Descricao |
|------|-----------|--------|-----------|
| `/login` | Login | Publico | Tela de autenticacao |
| `/` | Dashboard | Privado | Painel com indicadores e graficos |
| `/products` | Products | Privado | Lista de produtos com filtros e ordenacao |
| `/products/new` | ProductForm | Privado | Formulario de novo produto |
| `/products/:id/edit` | ProductForm | Privado | Edicao de produto |
| `/categories` | Categories | Privado | CRUD de categorias |
| `/clients` | Clients | Privado | Lista de clientes |
| `/clients/new` | ClientForm | Privado | Novo cliente |
| `/clients/:id/edit` | ClientForm | Privado | Edicao de cliente |
| `/suppliers` | Suppliers | Privado | CRUD de fornecedores |
| `/suppliers/new` | SupplierForm | Privado | Novo fornecedor |
| `/suppliers/:id/edit` | SupplierForm | Privado | Edicao de fornecedor |
| `/stock` | Stock | Privado | Movimentacoes de estoque |
| `/pdv` | PDV | Privado | Ponto de venda (caixa) |
| `/sales` | Sales | Privado | Historico de vendas |
| `/cash-register` | CashRegister | Privado | Controle de caixa |
| `/reports` | Reports | Privado | Relatorios |
| `/data-structures` | DataStructures | Privado | Demonstracao academica |

### Camada de API (services/api.ts)

Axios configurado com:
- `baseURL` de variavel de ambiente `VITE_API_URL`
- Interceptor de request: adiciona `Authorization: Bearer {token}` do localStorage
- Interceptor de response: redireciona para `/login` em 401

11 modulos exportados: `auth`, `products`, `categories`, `clients`, `suppliers`, `stock`, `sales`, `cashRegister`, `dashboard`, `reports`, `dataStructures`, `payment`

### Autenticacao (contexts/AuthContext.tsx)

- Estado: `user`, `token`, `isAuthenticated`, `loading`
- Persistencia em `localStorage` (keys: `token`, `user`)
- `login(email, password)`: chama API, salva token e user
- `logout()`: limpa localStorage e redireciona

### Componentes

**Layout.tsx:**
- Flexbox: Sidebar (250px) + conteudo (flex: 1)
- Usa `<Outlet />` do React Router para renderizar paginas filhas

**Sidebar.tsx:**
- 11 links de navegacao com `<NavLink>`
- Destaque visual no link ativo (fundo #2a2a4a)
- Cores: fundo #1a1a2e, texto branco

**PrivateRoute.tsx:**
- Verifica `isAuthenticated` do AuthContext
- Redireciona para `/login` se nao autenticado
- Exibe "Carregando..." durante loading

### Paginas - Detalhamento

**Dashboard.tsx:**
- 4 cards: Total vendido (R$), Produtos vendidos, Em falta, Clientes atendidos
- Grafico de barras: Vendas por hora (Recharts BarChart)
- Grafico de barras: Produtos mais vendidos (Recharts BarChart)

**Products.tsx:**
- Tabela: Nome, Codigo, Categoria, Preco, Estoque, Status
- Input de busca por nome
- Dropdown filtro por categoria
- Selecao de algoritmo de ordenacao (Bubble, Insertion, Quick, Merge)
- Selecao de criterio (Nome, Preco, Estoque)
- Botoes: Novo Produto, Editar, Excluir

**PDV.tsx (Ponto de Venda):**
- Layout 60/40 (itens | controles)
- Lado esquerdo: tabela de itens do carrinho com quantidade editavel
- Lado direito:
  - Campo de codigo de barras (auto-focus, Enter busca e adiciona)
  - Busca manual de produto
  - Selecao de cliente (opcional)
  - Campo de desconto (R$)
  - Total em destaque (fonte 32px, azul)
  - Selecao de pagamento (Dinheiro/PIX/Credito/Debito)
  - Campo valor recebido (para Dinheiro)
  - Calculo automatico de troco
  - Botao Finalizar Venda (verde)
  - Botao Cancelar (vermelho)
- Modal de cupom fiscal apos venda finalizada

**DataStructures.tsx:**
- Secao Fila: botoes Enqueue/Dequeue/Peek, lista da fila
- Secao Pilha: lista de cupons cancelados, botoes Pop/Peek
- Secao Matriz: tabela de produtos em formato matricial
- Secao Ordenacao: selecao de algoritmo + criterio, resultado ordenado

### Estilo Visual

- Cor primaria: #1976d2 (azul)
- Sidebar: #1a1a2e (azul escuro)
- Background: #f5f5f5
- Cards: branco com sombra `0 2px 8px rgba(0,0,0,0.1)`
- Tabelas: header azul, linhas zebradas
- Botoes: cores semanticas (verde=confirmar, vermelho=cancelar, azul=acao)
- Estilizacao inline (sem CSS framework)

---

## Desktop (Tauri v2)

### Funcao

Aplicacao desktop focada no PDV (Ponto de Venda) para operacao de caixa. Funciona offline quando a rede esta indisponivel.

### Rotas

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/login` | Login | Autenticacao |
| `/pdv` | PDV | Ponto de venda (rota padrao) |
| `/cash-register` | CashRegister | Controle de caixa |
| `/sales` | Sales | Historico de vendas |
| `/data-structures` | DataStructures | Demonstracao academica |
| `/sync` | SyncPage | Sincronizacao de dados |

### Suporte Offline (services/offlineStore.ts)

Cache em `localStorage`:

| Funcao | Descricao |
|--------|-----------|
| `saveProducts(products)` | Salva produtos no cache local |
| `getProducts()` | Retorna produtos do cache |
| `getProductByBarcode(barcode)` | Busca produto offline por codigo de barras |
| `savePendingSale(sale)` | Salva venda feita offline |
| `getPendingSales()` | Lista vendas pendentes de sincronizacao |
| `clearPendingSales()` | Limpa vendas pendentes apos sync |
| `isOnline()` | Verifica conectividade (fetch /health com timeout 3s) |
| `getLastSyncTime()` | Timestamp da ultima sincronizacao |
| `setLastSyncTime()` | Atualiza timestamp de sync |

### Fluxo Offline

1. PDV tenta buscar produto via API
2. Se falhar, busca no cache local (`offlineStore.getProductByBarcode`)
3. Ao finalizar venda offline, salva em `pendingSales` no localStorage
4. Na pagina Sync, usuario pode sincronizar vendas pendentes quando reconectar

### Configuracao Tauri

- App: "FastBuy PDV"
- Janela: 1280x800, redimensionavel
- Frontend dist: `../dist`
- Dev URL: `http://localhost:1420`
- Identifier: `com.fastbuy.pdv`

---

## Infraestrutura Docker

### docker-compose.yml

3 servicos:

| Servico | Imagem | Container | Porta |
|---------|--------|-----------|-------|
| postgres | postgres:16-alpine | fastbuy-db | 5432 |
| backend | Build local | fastbuy-api | 5000->8080 |
| frontend | Build local | fastbuy-web | 3000->80 |

**Postgres:**
- Volume persistente: `pgdata`
- Healthcheck: `pg_isready` a cada 5s

**Backend:**
- Dockerfile multi-stage (SDK 9.0 -> ASP.NET 9.0)
- Depende do postgres (condition: service_healthy)
- Variaveis: connection string, ASPNETCORE_URLS, ASPNETCORE_ENVIRONMENT

**Frontend:**
- Dockerfile multi-stage (Node 20 -> Nginx)
- nginx.conf com SPA routing e proxy reverso `/api/` -> backend:8080

---

## Pacotes NuGet (Backend)

| Pacote | Versao | Funcao |
|--------|--------|--------|
| Microsoft.AspNetCore.Authentication.JwtBearer | 9.0.0 | Autenticacao JWT |
| Microsoft.EntityFrameworkCore | 9.0.0 | ORM |
| Microsoft.EntityFrameworkCore.Design | 9.0.0 | Migrations/tooling |
| Npgsql.EntityFrameworkCore.PostgreSQL | 9.0.0 | Provider PostgreSQL |
| BCrypt.Net-Next | 4.0.3 | Hash de senhas |
| Swashbuckle.AspNetCore | 7.2.0 | Swagger/OpenAPI |

---

## Configuracao (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=fastbuy;Username=postgres;Password=postgres123"
  },
  "Jwt": {
    "Key": "FastBuySecretKey2024SuperSecretKeyThatIsLongEnough",
    "Issuer": "FastBuy",
    "Audience": "FastBuy",
    "ExpirationHours": 8
  }
}
```

---

## Dependency Injection (Program.cs)

| Servico | Lifetime | Descricao |
|---------|----------|-----------|
| AppDbContext | Scoped | Contexto EF Core |
| IAuthService -> AuthService | Scoped | Autenticacao |
| IProductService -> ProductService | Scoped | Produtos |
| ICategoryService -> CategoryService | Scoped | Categorias |
| IClientService -> ClientService | Scoped | Clientes |
| ISupplierService -> SupplierService | Scoped | Fornecedores |
| IStockService -> StockService | Scoped | Estoque |
| ISaleService -> SaleService | Scoped | Vendas |
| ICashRegisterService -> CashRegisterService | Scoped | Caixa |
| IDashboardService -> DashboardService | Scoped | Dashboard |
| ClientQueue | Singleton | Fila de atendimento (em memoria) |
| CouponStack | Singleton | Pilha de cupons cancelados (em memoria) |
| IPaymentGateway -> CashGateway | Scoped | Gateway dinheiro |
| IPaymentGateway -> PixGateway | Scoped | Gateway PIX |
| IPaymentGateway -> CreditCardGateway | Scoped | Gateway credito |
| IPaymentGateway -> DebitCardGateway | Scoped | Gateway debito |

---

## Payment Gateways (Mock)

Interface: `IPaymentGateway`

```csharp
public interface IPaymentGateway
{
    string Method { get; }
    PaymentResult ProcessPayment(decimal amount, decimal? amountPaid);
}

public class PaymentResult
{
    public bool Success { get; set; }
    public decimal Change { get; set; }
    public string TransactionId { get; set; }
}
```

4 implementacoes mock:
- `CashGateway`: calcula troco (amountPaid - amount)
- `PixGateway`: retorna sucesso com ID simulado
- `CreditCardGateway`: retorna sucesso com ID simulado
- `DebitCardGateway`: retorna sucesso com ID simulado

---

## Perfis de Acesso (RBAC)

| Perfil | Descricao | Restricoes |
|--------|-----------|------------|
| Administrador | Acesso total | Unico que pode registrar novos usuarios |
| Gerente | Gestao operacional | Acesso a todos os modulos exceto registro de usuarios |
| Operador | Caixa | Foco no PDV e operacoes de venda |

---

## MVP - Checklist Implementado

- [x] Login com JWT
- [x] Cadastro de produtos (CRUD completo)
- [x] Cadastro de clientes (CRUD completo)
- [x] Controle de estoque (entradas, saidas, ajustes, perdas)
- [x] Registro de vendas (carrinho, pagamento, cupom)
- [x] Fila de clientes (Queue<Client> - FIFO)
- [x] Historico de cupons cancelados (Stack<CancelledCoupon> - LIFO)
- [x] Ordenacao de produtos (4 algoritmos manuais)
- [x] Dashboard simples (4 indicadores + 2 graficos)
- [x] Relatorios basicos (vendas, top produtos, estoque, faturamento)
- [x] Pagamento simulado (4 gateways mock)
- [x] Leitura de codigo de barras (input auto-focus + busca)
- [x] Aplicacao Web (React 18 + TypeScript)
- [x] Aplicacao Desktop (Tauri v2 + suporte offline)
- [x] Docker Compose
- [x] Swagger/OpenAPI
- [x] Matriz de produtos (array bidimensional)
- [x] Cadastro de fornecedores
- [x] Cadastro de categorias
- [x] Controle de caixa (abertura/fechamento)
