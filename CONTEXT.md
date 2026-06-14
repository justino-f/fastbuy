# CONTEXT.md

## Projeto

Sistema de Gestão de Supermercado (SGS)

Projeto acadêmico desenvolvido para demonstrar conceitos de Estruturas de Dados, Engenharia de Software, Banco de Dados, Desenvolvimento Web e Desktop, simulando um sistema de supermercado utilizado em operações reais de varejo.

O sistema deverá possuir módulos administrativos e operacionais, permitindo o gerenciamento completo de produtos, estoque, vendas, clientes, usuários e caixa.

---

# Objetivos Acadêmicos

O projeto deve obrigatoriamente demonstrar a aplicação dos seguintes conceitos:

## Vetor

Utilizado para armazenar os produtos presentes na venda atual.

Exemplo:

```csharp
List<string> produtosVendidos
```

Aplicação prática:

* Produtos adicionados ao carrinho
* Itens do cupom fiscal
* Histórico de itens vendidos

---

## Fila

Utilizada para gerenciamento de clientes aguardando atendimento.

Exemplo:

```csharp
Queue<Cliente>
```

Aplicação prática:

* Clientes aguardando no caixa
* Ordem de atendimento

Operações:

* Enqueue()
* Dequeue()
* Peek()

---

## Pilha

Utilizada para armazenamento de cupons cancelados.

Exemplo:

```csharp
Stack<CupomFiscal>
```

Aplicação prática:

* Cancelamento de vendas
* Recuperação do último cupom cancelado

Operações:

* Push()
* Pop()
* Peek()

---

## Matriz

Utilizada para representar visualmente produtos e seus atributos.

Exemplo:

| Produto | Quantidade | Preço |
| ------- | ---------- | ----- |
| Arroz   | 5          | 25.90 |
| Feijão  | 8          | 8.50  |

Aplicação prática:

* Relatórios
* Exportação de dados
* Estruturas bidimensionais para demonstração acadêmica

---

## Ordenação

Implementação manual de algoritmos de ordenação.

Possíveis algoritmos:

* Bubble Sort
* Insertion Sort
* Merge Sort
* Quick Sort

Critérios:

* Nome
* Preço
* Quantidade em estoque

---

# Arquitetura

## Backend

Tecnologia:

ASP.NET Core 9 Web API

Responsabilidades:

* Regras de negócio
* Autenticação
* Controle de estoque
* Controle de vendas
* Integração com pagamentos
* Geração de relatórios

Padrões:

* Clean Architecture
* Repository Pattern
* Service Layer
* Dependency Injection

---

## Banco de Dados

Tecnologia:

PostgreSQL

ORM:

Entity Framework Core

Migrações:

Entity Framework Migrations

---

## Aplicação Web

Tecnologia:

React + TypeScript

Responsável por:

* Administração
* Estoque
* Produtos
* Usuários
* Relatórios
* Dashboard

---

## Aplicação Desktop

Tecnologia recomendada:

Tauri + React

Alternativa:

Electron + React

Responsável por:

* PDV
* Operação de caixa
* Leitura de código de barras
* Pagamentos
* Emissão de comprovantes

Grande parte da interface será compartilhada com o frontend React.

---

# Módulos do Sistema

## Autenticação

Funcionalidades:

* Login
* Logout
* Controle de sessão
* Perfis de acesso

Perfis:

* Administrador
* Gerente
* Operador de Caixa

---

## Produtos

Cadastro completo:

* Nome
* Código de barras
* SKU
* Categoria
* Marca
* Unidade de medida
* Preço de custo
* Preço de venda
* Estoque mínimo
* Estoque atual
* Descrição
* Status ativo/inativo
* Imagem

Funcionalidades:

* CRUD completo
* Pesquisa
* Filtro
* Ordenação

---

## Categorias

Cadastro de categorias.

Exemplos:

* Bebidas
* Hortifruti
* Padaria
* Limpeza
* Açougue

---

## Estoque

Controle de:

* Entradas
* Saídas
* Ajustes
* Perdas
* Inventário

Movimentações registradas em histórico.

---

## Clientes

Cadastro:

* Nome
* CPF
* Telefone
* Email

Funcionalidades:

* Histórico de compras
* Consulta rápida

---

## Fornecedores

Cadastro:

* Razão social
* CNPJ
* Telefone
* Email
* Endereço

---

## PDV (Ponto de Venda)

Funcionalidades:

* Abrir caixa
* Fechar caixa
* Registrar venda
* Leitura de código de barras
* Pesquisa manual de produto
* Remoção de item
* Cancelamento de venda
* Desconto
* Cupom fiscal
* Histórico de vendas

Fluxo:

Cliente → Caixa → Pagamento → Cupom

---

## Caixa

Controle:

* Abertura
* Fechamento
* Sangria
* Suprimento

Relatórios:

* Total vendido
* Total cancelado
* Total recebido

---

## Gateway de Pagamento

Integração simulada para fins acadêmicos.

Métodos:

* Dinheiro
* PIX
* Crédito
* Débito

Implementação:

Mock Payment Gateway

Estrutura:

```csharp
IPaymentGateway
```

Implementações:

```csharp
PixGateway
CreditCardGateway
DebitCardGateway
CashGateway
```

Possível evolução futura:

* Mercado Pago
* PagSeguro
* Stone
* Cielo

---

## Código de Barras

Leitura via scanner USB.

Funcionamento:

Scanner → Campo de Entrada → Busca no Banco

Formatos:

* EAN-13
* UPC

Pesquisa automática após leitura.

---

## Relatórios

### Vendas

* Diário
* Semanal
* Mensal

### Produtos

* Mais vendidos
* Menos vendidos

### Estoque

* Estoque baixo
* Produtos sem movimentação

### Financeiro

* Faturamento
* Ticket médio

---

## Dashboard

Indicadores:

* Total vendido hoje
* Produtos vendidos
* Produtos em falta
* Clientes atendidos
* Vendas por hora

Gráficos:

* Barras
* Pizza
* Linha

---

# Banco de Dados

## Tabelas Principais

Usuarios

Produtos

Categorias

Clientes

Fornecedores

EstoqueMovimentacoes

Vendas

VendaItens

Pagamentos

Caixas

CuponsCancelados

---

# Segurança

Autenticação:

JWT

Senhas:

BCrypt

Permissões:

Role Based Access Control (RBAC)

Logs:

Registro de:

* Login
* Vendas
* Cancelamentos
* Alterações de estoque

---

# Funcionalidades Futuras

* NFC-e
* Integração fiscal
* Multiempresa
* Multi-filial
* Programa de fidelidade
* Aplicativo mobile
* Integração com balança
* Integração com impressora térmica
* Integração com ERP

---

# MVP Mínimo

Para entrega acadêmica, o sistema deverá possuir:

✓ Login

✓ Cadastro de produtos

✓ Cadastro de clientes

✓ Controle de estoque

✓ Registro de vendas

✓ Fila de clientes

✓ Histórico de cupons cancelados

✓ Ordenação de produtos

✓ Dashboard simples

✓ Relatórios básicos

✓ Pagamento simulado

✓ Leitura de código de barras

✓ Aplicação Web

✓ Aplicação Desktop

---

# Diferenciais para Apresentação

* Docker Compose para execução completa
* Interface moderna
* Dashboard em tempo real
* Arquitetura cliente-servidor
* API documentada via Swagger
* React compartilhado entre Web e Desktop
* Demonstração prática dos conceitos de Estruturas de Dados
