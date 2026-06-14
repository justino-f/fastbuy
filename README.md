# FastBuy - Sistema de Gestao de Supermercado

Sistema completo para gestao de supermercado com PDV desktop, painel web e API REST.

## Stack

- **Backend:** .NET 9 (API REST)
- **Frontend Web:** React 18 + TypeScript
- **Desktop PDV:** Tauri v2
- **Banco de Dados:** PostgreSQL 16

## Inicio Rapido com Docker

```bash
docker-compose up -d
```

Servicos disponiveis:

| Servico   | URL                    |
|-----------|------------------------|
| API       | http://localhost:5000   |
| Web       | http://localhost:3000   |
| Postgres  | localhost:5432          |

## Execucao Manual

### Backend

```bash
cd backend/FastBuy.API
dotnet restore
dotnet run
```

API disponivel em `http://localhost:5000`.

### Frontend Web

```bash
cd frontend
npm install
npm run dev
```

Disponivel em `http://localhost:5173`.

### Desktop PDV (Tauri)

```bash
cd frontend
npm install
npm run tauri dev
```

## Login Padrao

- **Email:** admin@fastbuy.com
- **Senha:** admin123

## Estrutura do Projeto

```
fastbuy/
├── backend/
│   └── FastBuy.API/        # API .NET 9
├── frontend/               # React 18 + Tauri v2
├── docker-compose.yml
└── README.md
```

## Banco de Dados

Conexao padrao (Docker):

- Host: localhost
- Porta: 5432
- Database: fastbuy
- Usuario: postgres
- Senha: postgres123
