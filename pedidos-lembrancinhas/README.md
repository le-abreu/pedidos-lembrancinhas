# Pedidos de lembrancinhas

Aplicação de gestão multiempresa de pedidos com workflow configurável, preparada para rodar localmente com `Docker Compose` e evoluir depois para `Kubernetes`.

## Stack adotada

- `App Router`
- `TypeScript`
- `Prisma` com PostgreSQL
- `MinIO` como bucket S3 compatível em desenvolvimento local
- API integrada na aplicação
- `Docker Compose` para desenvolvimento local
- base inicial de manifests em `infra/kubernetes`

`Prisma 5` foi mantido para compatibilidade com o ambiente local atual (`Node 18.17.1`). O container da aplicação usa `Node 20 LTS`, que é a base recomendada para execução empacotada e futura evolução em cluster.

## Estrutura de pastas

```text
docker/
  app/
    Dockerfile
    entrypoint.sh
  compose/
    .env.example
    docker-compose.yml
    docker-compose.override.yml
  postgres/
    init.sql
infra/
  kubernetes/
    namespace.yaml
    configmap.yaml
    secret.example.yaml
    deployment-app.yaml
    service-app.yaml
    ingress.yaml
    README.md
prisma/
  migrations/
  schema.prisma
  seed.js
src/
  app/
  components/
  lib/
  server/
```

## Entidades principais

- `Company`: empresa atendida pela plataforma
- `Customer`: cliente vinculado a uma empresa
- `Supplier`: fornecedor, executor ou ambos
- `User` + `UserProfile`: usuários com múltiplos perfis
- `OrderStatus`: status configuráveis do pedido
- `OrderType`: tipo abstrato do pedido
- `OrderTypeProduct`: produtos configuráveis por tipo
- `Workflow` + `WorkflowPhase`: fluxo configurável e suas fases ordenadas
- `Order`: pedido principal
- `OrderItem`: itens do pedido
- `OrderSupplier`: fornecedores envolvidos no pedido
- `OrderPhaseExecution`: execução do workflow por pedido
- `Invoice`: nota fiscal do pedido
- `StoredFile`: metadados do arquivo enviado ao bucket
- `FileAttachment`: vínculo entre arquivo e entidade de negócio

## Fluxo principal

1. Cadastre empresa, clientes, fornecedores, usuários, status e tipos de pedido.
2. Configure um workflow para o tipo de pedido e adicione as fases.
3. Crie um pedido escolhendo empresa, cliente, tipo, status inicial, itens e fornecedores.
4. O sistema instancia automaticamente as execuções das fases do workflow.
5. Na tela de detalhe do pedido, avance fases, associe fornecedor/executor, envie anexos reais e registre nota fiscal com upload.

## Variáveis de ambiente

As variáveis principais são:

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NODE_ENV`
- `PORT`
- `RUN_MIGRATIONS`
- `RUN_SEED`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`

### Banco local via Compose

O arquivo [docker/compose/.env.example](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/docker/compose/.env.example) já aponta a aplicação para o serviço `postgres` do Compose.
Para upload local, o mesmo arquivo também já aponta o storage para o `minio` do Compose.

O app não depende de PostgreSQL local em nível de código; ele depende apenas de `DATABASE_URL`.

## Execução local sem Docker

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL` para o PostgreSQL desejado.
3. Instale dependências:

```bash
yarn
```

4. Gere o client do Prisma:

```bash
yarn db:generate
```

5. Aplique migrations:

```bash
yarn db:migrate
```

6. Rode o seed:

```bash
yarn db:seed
```

7. Suba a aplicação:

```bash
yarn dev
```

## Execução local com Docker Compose

1. Copie o arquivo de ambiente do Compose:

```bash
cp docker/compose/.env.example docker/compose/.env
```

2. Suba o ambiente:

```bash
yarn docker:up
```

3. Acesse:

- aplicação: `http://localhost:3000`
- PostgreSQL local: `localhost:5432`
- MinIO API S3: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- pgAdmin opcional:

```bash
docker compose --env-file docker/compose/.env -f docker/compose/docker-compose.yml --profile tools up -d pgadmin
```

4. Acompanhe logs:

```bash
yarn docker:logs
```

5. Derrube o ambiente:

```bash
yarn docker:down
```

## Migrations e seed no ambiente Docker

O container da aplicação usa [docker/app/entrypoint.sh](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/docker/app/entrypoint.sh).

- `RUN_MIGRATIONS=true`: executa `prisma migrate deploy` ao subir
- `RUN_SEED=true`: executa `prisma db seed` ao subir

Para um primeiro bootstrap local, você pode temporariamente definir em `docker/compose/.env`:

```env
RUN_SEED=true
```

Depois disso, volte para `false` para evitar reexecuções desnecessárias.

## Docker e infraestrutura

### Dockerfile

O [docker/app/Dockerfile](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/docker/app/Dockerfile) usa:

- multi-stage build
- dependências separadas da etapa de build
- build standalone da aplicação
- imagem final menor
- usuário não-root
- entrypoint preparado para migration e seed

### Docker Compose

O [docker/compose/docker-compose.yml](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/docker/compose/docker-compose.yml) está organizado com:

- `app`
- `postgres`
- `minio`
- `minio-init` para criar o bucket local automaticamente
- `pgadmin` opcional por `profile`
- `healthcheck`
- `depends_on` com condição de saúde
- `volumes` nomeados
- `network` dedicada
- secrets fora do YAML, via `.env`

## Upload de arquivos

Pedido, execução de fase e nota fiscal não recebem mais URL manual.

O fluxo atual é:

1. o frontend envia o arquivo real em `multipart/form-data`
2. a aplicação faz upload para bucket compatível com S3
3. a tabela `StoredFile` registra bucket, chave, nome original, mime type, tamanho e checksum
4. a tabela `FileAttachment` vincula o arquivo à entidade de negócio (`ORDER`, `ORDER_PHASE_EXECUTION` ou `INVOICE`)
5. o download é servido por `GET /api/files/:id`, respeitando autenticação e escopo do pedido

## Kubernetes

A base inicial está em [infra/kubernetes](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/infra/kubernetes/README.md) com:

- `Namespace`
- `ConfigMap`
- `Secret` de exemplo
- `Deployment`
- `Service`
- `Ingress`

### Como evoluir para Kubernetes depois

1. Publicar a imagem do `docker/app/Dockerfile` em um registry.
2. Trocar `secret.example.yaml` por um secret real ou integração com secret manager.
3. Extrair migrations para um `Job` dedicado em vez de depender do startup do app.
4. Evoluir os YAMLs para `Helm` ou `Kustomize`.
5. Adicionar HPA, NetworkPolicy, PDB e observabilidade.

O desenho atual já ajuda nessa migração porque:

- a aplicação depende só de `DATABASE_URL`
- configuração sensível está separada
- portas e nomes são consistentes entre Compose e Kubernetes
- a imagem da app é independente do banco local

## Deploy barato para validação

Para validar com o menor custo e menor atrito, a combinação mais simples para este projeto hoje é:

- app: `Render` Web Service com `Docker`
- banco: `Neon` PostgreSQL free
- arquivos: `Cloudflare R2` free tier

Motivos:

- o projeto já tem `Dockerfile` pronto
- o startup já executa `prisma migrate deploy`
- o app exige PostgreSQL e storage compatível com S3
- essa combinação evita manter VM, Kubernetes ou banco pago logo no primeiro teste

### Arquivos preparados

- [`render.yaml`](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/render.yaml): blueprint inicial para subir a aplicação no Render
- [`next.config.mjs`](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/next.config.mjs): aceita domínio de produção via `APP_URL` e `SERVER_ACTIONS_ALLOWED_ORIGINS`
- [`.env.example`](/home/leandroabreuferreira/Develop/CODEX/workspace_pedido_lembrancinha/.env.example): agora inclui variáveis de URL pública e S3

### Variáveis mínimas em produção

- `APP_URL=https://seu-app.onrender.com`
- `DATABASE_URL=postgresql://...`
- `RUN_MIGRATIONS=true`
- `RUN_SEED=false`
- `S3_REGION=auto` ou região do seu provider
- `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com` ou endpoint do provider
- `S3_BUCKET=pedido-anexos`
- `S3_ACCESS_KEY_ID=...`
- `S3_SECRET_ACCESS_KEY=...`
- `S3_FORCE_PATH_STYLE=false`

Se você usar domínio próprio ou proxy reverso, defina também:

- `SERVER_ACTIONS_ALLOWED_ORIGINS=dominio.com,www.dominio.com`

### Passo a passo sugerido

1. Suba o código para um repositório Git.
2. Crie um banco no Neon e copie a `DATABASE_URL` com SSL.
3. Crie um bucket no Cloudflare R2 e gere as chaves S3.
4. No Render, crie um `Blueprint` a partir do repositório ou um `Web Service` usando o `docker/app/Dockerfile`.
5. Configure as variáveis de ambiente listadas acima.
6. Faça o primeiro deploy e valide o login, cadastro e upload de anexos.

### Alternativas

- `Vercel + Neon + R2`: pode sair `US$ 0`, mas você precisará tratar migrations fora do startup do servidor.
- `Railway`: mais simples para app + banco, porém a validação deixa de ser free com mais facilidade.
- `Render + Neon + R2`: melhor equilíbrio para este repositório no estado atual.

## Seed inicial

O seed cria:

- 1 empresa
- 2 clientes
- 2 fornecedores
- 3 usuários (`admin`, `cliente`, `executor`)
- 1 tipo de pedido
- 5 produtos configuráveis
- 5 status
- 1 workflow com 5 fases
- 1 pedido de exemplo com itens, fornecedores, execuções e nota fiscal

## Credenciais de acesso

- Login: `admin@lembrancinha.dev`
- Senha: `123456`

## Endpoints principais

- `GET/POST /api/companies`
- `GET/POST /api/customers`
- `GET/POST /api/suppliers`
- `GET/POST /api/users`
- `GET/POST /api/statuses`
- `GET/POST /api/order-types`
- `GET/POST /api/workflows`
- `GET/POST /api/orders`
- `GET /api/orders/:id/phases`
- `GET/POST /api/orders/:id/invoice`

## Verificação executada

- `yarn db:generate`
- `npx tsc --noEmit`
- `yarn build`

Não validei a subida real de containers porque isso depende de Docker disponível no host. A estrutura e a aplicação foram deixadas prontas para esse fluxo.
