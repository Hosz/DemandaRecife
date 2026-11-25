# Demanda Recife

API e aplicação web para previsão de demanda, estoque, vendas, promoções e operação de pequenos
negócios.

## Estrutura e Tecnologias

- **`api/`**: Back-end em Java com Spring Boot e PostgreSQL (migrations em Flyway).
- **`app/`**: Front-end em Next.js (App Router), React, TypeScript e Tailwind CSS.

## Pré-requisitos

- Docker e Docker Compose
- Java (JDK) para rodar a API via Maven Wrapper (`mvnw` / `mvnw.cmd`)
- Node.js e npm para rodar o front-end

## Como executar

### 1. Variáveis de ambiente

Copie o arquivo de exemplo [`api/.env.example`](file:///c:/Users/adry4/OneDrive/Documentos/Estudos/Full-Stack/DemandaRecife/api/.env.example) para `api/.env` e preencha as variáveis necessárias (`GEMINI_API_KEY`, `OPENWEATHER_API_KEY`, `GOOGLE_CALENDAR_API_KEY`, `DB_USER`, `DB_PASSWORD`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`).

### 2. Banco de dados

O banco foi subido em **PostgreSQL executando no Docker**, com os seguintes
parâmetros usados pela API:

- Host: `localhost`
- Porta: `5432`
- Banco: `demandafacil`
- Usuário padrão: `postgres`
- Senha padrão: `postgres`

Exemplo para subir o banco com Docker Compose (usando [`docker-compose.yml`](file:///c:/Users/adry4/OneDrive/Documentos/Estudos/Full-Stack/DemandaRecife/docker-compose.yml)):

```bash
docker compose up -d
```

Ou manualmente via `docker run`:

```bash
docker run --name demanda-recife-postgres \
  -e POSTGRES_DB=demandafacil \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

As migrations continuam em
[`api/src/main/resources/db/migration`](C:/Users/adry4/OneDrive/Documentos/Estudos/Full-Stack/DemandaRecife/api/src/main/resources/db/migration).
Para criar um banco vazio como se todo o histórico tivesse sido aplicado em um
único comando, execute
[`api/src/main/resources/db/schema.sql`](C:/Users/adry4/OneDrive/Documentos/Estudos/Full-Stack/DemandaRecife/api/src/main/resources/db/schema.sql):

```bash
psql -h localhost -p 5432 -U postgres -d demandafacil \
  -f api/src/main/resources/db/schema.sql
```

O script consolidado inclui a extensão `pgcrypto`, as tabelas, índices, views
materializadas, constraints, dados iniciais de benchmarks e alterações das
migrations V1 até V17. Ele é executado em uma única transação.

### 3. Back-end (`api/`)

Na pasta `api/`, execute:

```bash
# Linux / macOS
./mvnw spring-boot:run

# Windows (PowerShell / CMD)
.\mvnw.cmd spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.

### 4. Front-end (`app/`)

Na pasta `app/`, instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

A aplicação web ficará disponível em `http://localhost:3000`.

Principais páginas da interface: `/login`, `/cadastro`, `/registro`, `/onboarding`, `/estoque`, `/compras`, `/previsoes`, `/promocoes`, `/equipe`, `/dados` e `/configuracoes`.

## API

Por padrão, a API é executada em `http://localhost:8080`. Os endpoints abaixo
foram extraídos dos controllers da aplicação.

### Autenticação e tenants

| Método | Endpoint                  | Descrição                    |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/api/auth/register`      | Cria usuário                 |
| POST   | `/api/auth/login`         | Autentica usuário            |
| POST   | `/api/auth/refresh`       | Atualiza tokens              |
| GET    | `/api/auth/me`            | Retorna usuário autenticado  |
| POST   | `/api/auth/onboard`       | Cria tenant e perfil inicial |
| POST   | `/api/tenants/onboarding` | Alias do onboarding          |
| POST   | `/api/tenants`            | Alias para criação de tenant |
| GET    | `/api/tenants/{id}`       | Consulta tenant              |
| PUT    | `/api/tenants/{id}`       | Substitui dados do tenant    |
| PATCH  | `/api/tenants/{id}`       | Atualiza dados do tenant     |

### Produtos e estoque

| Método | Endpoint                               | Descrição                                            |
| ------ | -------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/products`                        | Lista produtos do tenant                             |
| DELETE | `/api/products/{id}`                   | Exclui produto e seus dados dependentes              |
| GET    | `/api/products/benchmarks/suggestions` | Lista sugestões de produtos; aceita `nicho`          |
| GET    | `/api/products/starter-kit/status`     | Consulta status do kit inicial; aceita `nicho`       |
| POST   | `/api/products/starter-kit`            | Adiciona kit inicial; aceita `nicho` ou lista de IDs |
| GET    | `/api/replenishment`                   | Lista sugestões de reposição; aceita `apenasComprar` |

### Vendas e previsão

| Método | Endpoint                        | Descrição                                            |
| ------ | ------------------------------- | ---------------------------------------------------- |
| POST   | `/api/sales`                    | Registra venda                                       |
| POST   | `/api/sales/upload`             | Importa vendas via multipart (`file`)                |
| GET    | `/api/forecast`                 | Gera previsão; aceita `data` no formato `YYYY-MM-DD` |
| GET    | `/api/dashboard/daily-briefing` | Retorna resumo diário                                |

### Alertas e recomendações

| Método | Endpoint                            | Descrição                                         |
| ------ | ----------------------------------- | ------------------------------------------------- |
| GET    | `/api/alerts`                       | Lista alertas; aceita `status` e `apenasNaoLidos` |
| GET    | `/api/alerts/count`                 | Conta alertas ativos                              |
| PATCH  | `/api/alerts/{id}/read`             | Marca alerta como lido                            |
| PATCH  | `/api/alerts/{id}/resolve`          | Resolve alerta                                    |
| GET    | `/api/recommendations/daily`        | Lista recomendações do dia                        |
| POST   | `/api/recommendations/regenerate`   | Regenera recomendações                            |
| PATCH  | `/api/recommendations/{id}/apply`   | Aplica recomendação                               |
| PATCH  | `/api/recommendations/{id}/dismiss` | Descarta recomendação                             |

### Promoções

| Método | Endpoint                         | Descrição                                                           |
| ------ | -------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/promotions/simulation`     | Simula promoção; requer `productId` e aceita desconto ou preço-alvo |
| GET    | `/api/promotions/campaigns`      | Lista campanhas                                                     |
| POST   | `/api/promotions/campaigns`      | Cria campanha                                                       |
| PUT    | `/api/promotions/campaigns/{id}` | Atualiza campanha                                                   |
| DELETE | `/api/promotions/campaigns/{id}` | Exclui campanha                                                     |

### Equipe e turnos

| Método | Endpoint                 | Descrição                        |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/api/team/members`      | Lista membros                    |
| POST   | `/api/team/members`      | Adiciona membro                  |
| DELETE | `/api/team/members/{id}` | Exclui membro                    |
| GET    | `/api/team/shifts`       | Lista turnos; aceita `diaSemana` |
| POST   | `/api/team/shifts`       | Salva turno                      |
| DELETE | `/api/team/shifts/{id}`  | Exclui turno                     |

### Integrações externas

| Método | Endpoint                 | Descrição                                                 |
| ------ | ------------------------ | --------------------------------------------------------- |
| GET    | `/api/external/weather`  | Consulta clima; aceita `cidade` e `estado`                |
| GET    | `/api/external/holidays` | Lista feriados; aceita `cidade`, `estado` e `dias`        |
| GET    | `/api/external/status`   | Retorna status das integrações                            |
| POST   | `/api/v1/sync/weather`   | Sincroniza clima; aceita `cidade` e `estado`              |
| POST   | `/api/v1/sync/holidays`  | Sincroniza feriados; aceita `ano`, `anoInicio` e `anoFim` |

### Notificações push

| Método | Endpoint               | Descrição                   |
| ------ | ---------------------- | --------------------------- |
| GET    | `/api/push/public-key` | Retorna chave pública VAPID |
| POST   | `/api/push/subscribe`  | Registra inscrição push     |
| DELETE | `/api/push/subscribe`  | Remove inscrição push       |

Os endpoints de autenticação, tenants, integrações externas e sincronização são
públicos conforme a configuração de segurança. Os demais endpoints exigem
autenticação e, quando aplicável, usam o tenant associado ao token JWT.

### Integrantes

- Adryan Galdino Soares / 01809292
- Allyson Allan Martins Pontes / 01854829
- Emilaine Bernado Da Silva / 01763693
- Marcelo Travassos Lima De Souza / 01813851
- Murilo Henrique Marques Bento Santos / 01840008

### Funções

- Líder Técnico: Murilo
- Designer de UX/UI: Adryan
- Desenvolvedor(a) Front-End: Emilaine, Allysson e Marcelo
- Desenvolvedor Back-End: Adryan e Murilo
- Arquiteto de Dados: Adryan e Murilo
- QA: Adryan e Murilo
