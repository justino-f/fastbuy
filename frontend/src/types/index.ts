// Representa o usuário autenticado no sistema (operador de caixa, gerente, etc.)
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;    // papel do usuário: define permissões (ex: "admin", "operador")
  active: boolean; // soft delete — permite desativar sem remover do banco
}

// Produto cadastrado no sistema — entidade central do domínio de estoque e vendas
export interface Product {
  id: number;
  name: string;
  barcode: string;       // código de barras EAN para leitura via scanner
  sku: string;           // código interno de controle (Stock Keeping Unit)
  categoryId: number;    // FK para a categoria do produto
  category?: Category;   // objeto categoria populado via JOIN (opcional pois depende do endpoint)
  supplierId?: number;   // FK para fornecedor (opcional — nem todo produto tem fornecedor vinculado)
  supplier?: Supplier;   // objeto fornecedor populado via JOIN
  brand: string;         // marca comercial do produto
  unit: string;          // unidade de medida (un, kg, lt, etc.)
  costPrice: number;     // preço de custo — base para cálculo de margem
  salePrice: number;     // preço de venda ao consumidor
  minStock: number;      // estoque mínimo — abaixo disso gera alerta de reposição
  currentStock: number;  // quantidade atual em estoque
  description?: string;  // descrição detalhada (opcional)
  active: boolean;       // soft delete — produto inativo não aparece no PDV
  imageUrl?: string;     // URL da imagem do produto (opcional)
}

// Categoria de produto — usada para organizar e filtrar o catálogo
export interface Category {
  id: number;
  name: string;
  active: boolean; // soft delete
}

// Cliente cadastrado — vinculado a vendas para histórico de compras
export interface Client {
  id: number;
  name: string;
  cpf: string;     // CPF — documento único do cliente (obrigatório)
  phone?: string;  // telefone de contato (opcional)
  email?: string;  // email para comunicação (opcional)
}

// Fornecedor — empresa que abastece o estoque de produtos
export interface Supplier {
  id: number;
  companyName: string; // razão social do fornecedor
  cnpj: string;        // CNPJ — documento único de pessoa jurídica (obrigatório)
  phone?: string;
  email?: string;
  address?: string;    // endereço para logística de entrega
  active: boolean;     // soft delete
}

// Movimentação de estoque — registra entradas, saídas, ajustes e perdas
export interface StockMovement {
  id: number;
  productId: number;    // FK do produto movimentado
  product?: Product;    // objeto produto populado via JOIN
  type: string;         // tipo: "Entrada", "Saída", "Ajuste", "Perda"
  quantity: number;     // quantidade movimentada (sempre positiva; tipo define o sentido)
  reason?: string;      // justificativa da movimentação (auditoria)
  createdAt: string;    // data/hora da movimentação (ISO 8601)
}

// Venda — representa uma transação completa no PDV
export interface Sale {
  id: number;
  clientId?: number;    // FK do cliente (opcional — venda pode ser avulsa, sem cliente identificado)
  client?: Client;      // objeto cliente populado via JOIN
  userId: number;       // FK do operador que realizou a venda
  total: number;        // soma bruta dos itens (antes do desconto)
  discount: number;     // valor do desconto aplicado
  finalTotal: number;   // total líquido (total - discount) — valor efetivamente cobrado
  status: string;       // status da venda: "Concluída", "Cancelada"
  createdAt: string;    // data/hora da venda
  items: SaleItem[];    // lista de itens vendidos (relação 1:N)
  payment?: Payment;    // dados do pagamento vinculado
}

// Item individual de uma venda — cada linha do cupom fiscal
export interface SaleItem {
  id: number;
  productId: number;    // FK do produto vendido
  product?: Product;    // objeto produto populado via JOIN
  quantity: number;     // quantidade vendida deste item
  unitPrice: number;    // preço unitário no momento da venda (snapshot — não muda se o preço mudar depois)
  subtotal: number;     // quantity * unitPrice — calculado no backend para consistência
}

// Pagamento vinculado a uma venda
export interface Payment {
  id: number;
  method: string;   // forma de pagamento: "Dinheiro", "Cartão", "Pix", etc.
  amount: number;   // valor pago pelo cliente
  change?: number;  // troco devolvido (só se aplica a pagamento em dinheiro)
  status: string;   // status do pagamento: "Aprovado", "Cancelado"
}

// Caixa registradora — controla abertura e fechamento de turno financeiro
export interface CashRegister {
  id: number;
  userId: number;          // FK do operador que abriu o caixa
  openingBalance: number;  // saldo inicial (fundo de troco)
  closingBalance?: number; // saldo final (calculado no fechamento)
  status: string;          // "Aberto" ou "Fechado"
  openedAt: string;        // data/hora da abertura
  closedAt?: string;       // data/hora do fechamento (null enquanto aberto)
}

// Dados agregados do dashboard — KPIs e dados para gráficos
export interface DashboardData {
  totalSoldToday: number;       // valor total vendido hoje (R$)
  productsSoldToday: number;    // quantidade de itens vendidos hoje
  outOfStockCount: number;      // produtos com estoque zerado ou abaixo do mínimo
  clientsServedToday: number;   // clientes únicos atendidos hoje
  salesByHour: { hour: number; total: number }[];      // distribuição de vendas por hora (gráfico de barras)
  topProducts: { name: string; quantity: number }[];   // ranking dos produtos mais vendidos (gráfico de barras)
}

// Payload de requisição de login — credenciais do usuário
export interface LoginRequest {
  email: string;
  password: string;
}

// Resposta do endpoint de login — contém JWT e dados do usuário autenticado
export interface LoginResponse {
  token: string; // JWT para autenticação nas requisições subsequentes
  user: User;    // dados do usuário logado
}

// Cupom cancelado — representa uma venda que foi estornada (estrutura de pilha acadêmica)
export interface CancelledCoupon {
  id: number;
  saleId: number;       // FK da venda original que foi cancelada
  total: number;        // valor total da venda cancelada
  reason: string;       // motivo do cancelamento (obrigatório para auditoria)
  cancelledAt: string;  // data/hora do cancelamento
}
