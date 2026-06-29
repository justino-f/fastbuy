// Entidade: Usuário do sistema (operador de caixa, gerente, admin)
// Controla acesso via role (papel) e status ativo/inativo
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;       // papel do usuário: 'admin', 'operator', etc. — define permissões no sistema
  active: boolean;    // flag de ativação — usuários inativos não podem fazer login
}

// Entidade: Produto disponível para venda no PDV
// Contém informações de estoque, preço, categoria e fornecedor
// É a entidade central do sistema — usada no carrinho, busca por código de barras e cache offline
export interface Product {
  id: number;
  name: string;
  barcode: string;       // código de barras EAN — usado na busca rápida do PDV via leitor ou digitação
  sku: string;           // código interno de referência do produto (Stock Keeping Unit)
  categoryId: number;    // FK para Category — agrupa produtos para relatórios e filtros
  category?: Category;   // relação opcional — populada pelo backend via JOIN quando necessário
  supplierId?: number;   // FK opcional para Supplier — nem todo produto tem fornecedor cadastrado
  supplier?: Supplier;   // relação opcional — populada pelo backend via JOIN
  brand: string;         // marca do produto — informativo para o operador
  unit: string;          // unidade de medida: 'un', 'kg', 'lt', etc.
  costPrice: number;     // preço de custo — usado para cálculo de margem (não exibido no PDV)
  salePrice: number;     // preço de venda — valor cobrado do cliente no PDV
  minStock: number;      // estoque mínimo — abaixo desse valor o dashboard emite alerta
  currentStock: number;  // estoque atual — decrementado automaticamente a cada venda
  description?: string;  // descrição detalhada opcional do produto
  active: boolean;       // produtos inativos não aparecem nas buscas do PDV
  imageUrl?: string;     // URL da imagem do produto — exibida no catálogo
}

// Entidade: Categoria de produtos (ex: Bebidas, Alimentos, Limpeza)
// Agrupa produtos para organização e relatórios
export interface Category {
  id: number;
  name: string;
  active: boolean;  // categorias inativas ocultam seus produtos das buscas
}

// Entidade: Cliente cadastrado no sistema
// Pode ser associado a uma venda para rastreabilidade e fidelização
// Também utilizado na Fila de Atendimento (estrutura FIFO) do PDV
export interface Client {
  id: number;
  name: string;
  cpf: string;       // CPF do cliente — identificação fiscal obrigatória no Brasil
  phone?: string;    // telefone de contato opcional
  email?: string;    // email opcional — pode ser usado para envio de cupom digital
}

// Entidade: Fornecedor de produtos
// Registra dados fiscais e de contato do fornecedor
export interface Supplier {
  id: number;
  companyName: string;  // razão social do fornecedor
  cnpj: string;         // CNPJ — identificação fiscal de pessoa jurídica
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

// Entidade: Movimentação de estoque (entrada ou saída manual)
// Registra ajustes de inventário fora do fluxo normal de vendas
export interface StockMovement {
  id: number;
  productId: number;
  product?: Product;     // relação opcional — populada via JOIN
  type: string;          // tipo: 'entrada' ou 'saida' — define se adiciona ou subtrai do estoque
  quantity: number;      // quantidade movimentada
  reason?: string;       // motivo da movimentação (ex: 'avaria', 'recontagem', 'devolução')
  createdAt: string;     // data/hora ISO da movimentação — auditoria
}

// Entidade: Venda realizada no PDV
// Agrega itens vendidos, pagamento, cliente e status
// É o registro principal de transação comercial do sistema
export interface Sale {
  id: number;
  clientId?: number;       // FK opcional — vendas avulsas (sem cliente identificado) não possuem
  client?: Client;         // relação opcional — populada via JOIN
  userId: number;          // FK do operador que realizou a venda — rastreabilidade
  total: number;           // soma dos subtotais dos itens (antes do desconto)
  discount: number;        // valor ou percentual de desconto aplicado
  finalTotal: number;      // total - desconto = valor efetivamente cobrado
  status: string;          // status da venda: 'completed', 'cancelled', 'pending'
  createdAt: string;       // data/hora ISO da venda — usado em relatórios e cupons
  items: SaleItem[];       // lista de itens vendidos — composição da venda
  payment?: Payment;       // dados do pagamento associado
}

// Entidade: Item individual de uma venda
// Cada produto adicionado ao carrinho gera um SaleItem ao finalizar
export interface SaleItem {
  id: number;
  productId: number;
  product?: Product;    // relação opcional — populada via JOIN para exibir nome/detalhes
  quantity: number;     // quantidade vendida deste produto
  unitPrice: number;    // preço unitário no momento da venda (snapshot — protege contra alterações futuras de preço)
  subtotal: number;     // unitPrice * quantity — calculado pelo backend
}

// Entidade: Pagamento associado a uma venda
// Registra método, valor pago e troco
export interface Payment {
  id: number;
  method: string;    // método: 'Dinheiro', 'Credito', 'Debito', 'PIX'
  amount: number;    // valor efetivamente pago pelo cliente
  change?: number;   // troco devolvido — só se aplica a pagamento em dinheiro
  status: string;    // status do pagamento: 'approved', 'pending', etc.
}

// Entidade: Caixa registradora (sessão de caixa)
// Controla abertura e fechamento do caixa com saldo inicial e final
// Toda venda deve estar vinculada a um caixa aberto — regra de negócio do PDV
export interface CashRegister {
  id: number;
  userId: number;           // FK do operador que abriu o caixa
  openingBalance: number;   // saldo de abertura (fundo de troco)
  closingBalance?: number;  // saldo de fechamento — preenchido ao fechar o caixa
  status: string;           // 'Aberto' ou 'Fechado'
  openedAt: string;         // data/hora ISO de abertura
  closedAt?: string;        // data/hora ISO de fechamento — null enquanto aberto
}

// Entidade: Dados agregados do dashboard gerencial
// Fornece métricas do dia para o painel administrativo
export interface DashboardData {
  totalSoldToday: number;                              // faturamento total do dia
  productsSoldToday: number;                           // quantidade de produtos vendidos hoje
  outOfStockCount: number;                             // produtos com estoque zerado ou abaixo do mínimo
  clientsServedToday: number;                          // clientes atendidos hoje
  salesByHour: { hour: number; total: number }[];      // vendas agrupadas por hora — gráfico de barras
  topProducts: { name: string; quantity: number }[];   // ranking dos produtos mais vendidos — gráfico
}

// DTO: Requisição de login — enviado ao endpoint /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

// DTO: Resposta de login — contém JWT token e dados básicos do usuário
// O token é armazenado no localStorage para autenticação nas requisições seguintes
export interface LoginResponse {
  token: string;   // JWT token — enviado via header Authorization: Bearer <token>
  name: string;
  email: string;
  role: string;    // papel do usuário — usado para controle de acesso no frontend
}

// Entidade: Cupom cancelado — representa uma venda que foi estornada
// Armazenado em uma Pilha (Stack, LIFO) no backend — estrutura de dados acadêmica
// O último cancelamento é sempre o primeiro a ser consultado
export interface CancelledCoupon {
  id: number;
  saleId: number;         // ID da venda original que foi cancelada
  total: number;          // valor total da venda cancelada
  reason: string;         // motivo do cancelamento — obrigatório para auditoria
  cancelledAt: string;    // data/hora ISO do cancelamento
}
