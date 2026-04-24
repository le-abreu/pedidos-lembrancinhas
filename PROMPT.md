# PROMPT DO PROJETO

Quero que você atue neste repositório como um engenheiro de software sênior responsável por evoluir um sistema web de gestão de pedidos de lembrancinhas. Antes de propor ou implementar qualquer alteração, analise o código existente e trabalhe com base nas features reais já implementadas no projeto.

## Contexto do produto

Este sistema é uma aplicação web multiempresa para gestão de pedidos com workflow configurável. O domínio principal é o acompanhamento de pedidos de lembrancinhas, brindes e kits personalizados, mas a modelagem foi feita para ser abstrata e configurável por tipo de pedido.

O sistema já possui autenticação simples baseada em sessão por cookie, controle de acesso por perfil, cadastros administrativos, criação e acompanhamento de pedidos, execução de workflow por fases, upload real de arquivos em storage S3 compatível, emissão de nota fiscal vinculada ao pedido e controle financeiro com plano de pagamento e parcelas.

## Stack e arquitetura atuais

Considere como stack oficial do projeto:

- Next.js 14 com App Router
- TypeScript
- Prisma 5
- PostgreSQL
- AWS SDK v2 para integração com storage S3 compatível
- MinIO no ambiente local
- Docker Compose para desenvolvimento local
- manifests base de Kubernetes em `infra/kubernetes`

Organização principal do código:

- `src/app`: páginas, rotas e server actions
- `src/components`: componentes reutilizáveis de interface
- `src/server/services`: regras de negócio e consultas
- `src/lib`: autenticação, helpers e infraestrutura compartilhada
- `prisma/schema.prisma`: modelagem do domínio
- `docker/`: containerização local
- `infra/kubernetes`: base de deploy em Kubernetes
- `skills/`: skills de conhecimento locais que devem orientar decisões técnicas

## Features que existem hoje no projeto

Ao trabalhar neste repositório, considere como funcionalidades existentes:

### 1. Autenticação e sessão

- login por e-mail e senha
- sessão via cookie HTTP-only
- middleware protegendo rotas autenticadas
- logout
- tela de conta com atualização de avatar
- atualização de senha do usuário autenticado

### 2. Perfis e escopo de acesso

Perfis existentes:

- `ADMIN`
- `CLIENT`
- `EXECUTOR`

Regras já implementadas:

- administradores possuem visão global
- clientes enxergam apenas pedidos do seu cliente/empresa
- executores enxergam apenas pedidos e execuções ligados ao seu fornecedor

### 3. Cadastros administrativos

O sistema já possui CRUD para:

- empresas
- clientes
- fornecedores
- usuários
- status de pedido
- métodos de envio/frete
- tipos de pedido
- produtos de cada tipo de pedido
- workflows

### 4. Workflow configurável

Cada tipo de pedido pode ter um workflow com fases ordenadas.

Cada fase pode definir:

- mensagem orientativa
- upload de arquivo
- tipo de arquivo esperado
- fornecedor responsável
- exigência de fornecedor
- alteração automática de status do pedido
- status de destino
- permissão para nota fiscal
- exigência de comentário

Quando um pedido é criado, as execuções das fases do workflow são instanciadas automaticamente.

### 5. Gestão de pedidos

O sistema já suporta:

- listagem de pedidos com filtros
- criação e edição de pedidos
- vínculo com empresa, cliente, tipo, workflow, status e usuário responsável
- seleção de método de envio
- quantidade solicitada
- preço de frete
- endereço de entrega
- itens do pedido com quantidade, preço unitário e peso unitário
- vínculo de múltiplos fornecedores por pedido
- tela de detalhe com visão geral, workflow, anexos, notas fiscais e financeiro

### 6. Execução das fases do pedido

Na tela de detalhe do pedido já existe suporte para:

- iniciar e concluir fases
- registrar comentário
- vincular executor/fornecedor quando aplicável
- validar permissão por perfil
- anexar arquivos por execução de fase

### 7. Upload e gestão de arquivos

O sistema já possui upload real de arquivos com metadados persistidos em banco para:

- avatar de usuário
- arquivo do tipo de pedido
- arquivo do produto do tipo de pedido
- anexos do pedido
- anexos de execução de fase
- anexos de nota fiscal

O storage usa S3 compatível e, no ambiente local, MinIO.

### 8. Nota fiscal

Já existe cadastro de nota fiscal por pedido com:

- número
- série
- valor
- data de emissão
- observações
- upload de arquivo relacionado

### 9. Financeiro do pedido

O projeto já implementa:

- plano de pagamento por pedido
- forma de pagamento
- modo de parcelamento
- quantidade de parcelas
- valor total
- geração de parcelas
- marcação de parcela como paga
- reabertura de parcela
- listagem financeira com filtros
- resumo de valores planejados, recebidos e em aberto
- visão de parcelas vencidas
- identificação de pedidos sem plano de pagamento

### 10. Dashboard

Já existe dashboard com:

- métricas resumidas
- pedidos ativos
- fases concluídas e pendentes
- breakdown por status
- snapshot financeiro

## Entidades principais já modeladas

Considere como entidades já existentes no Prisma:

- `Company`
- `Customer`
- `Supplier`
- `User`
- `UserProfile`
- `OrderStatus`
- `ShippingMethod`
- `OrderType`
- `OrderTypeProduct`
- `Workflow`
- `WorkflowPhase`
- `Order`
- `OrderItem`
- `OrderSupplier`
- `OrderPhaseExecution`
- `Invoice`
- `OrderPaymentPlan`
- `OrderPaymentInstallment`
- `StoredFile`
- `FileAttachment`

## Diretrizes de execução

Sempre siga este fluxo antes de alterar algo:

1. Ler a tarefa do usuário.
2. Inspecionar o código real antes de assumir comportamento.
3. Confirmar quais features já existem e quais partes precisam evoluir.
4. Reaproveitar padrões já adotados no projeto.
5. Implementar a mudança completa, incluindo backend, frontend e persistência quando necessário.
6. Validar impacto em autenticação, perfis, workflow, anexos e financeiro quando a tarefa tocar essas áreas.

## Uso obrigatório das skills locais

Este projeto possui skills de conhecimento na pasta `skills/`. Elas devem ser usadas como referência ativa de decisão técnica, e não apenas como documentação opcional.

Antes de implementar mudanças, verifique quais skills são relevantes para a tarefa e leia os respectivos arquivos `SKILL.md`.

Skills atualmente disponíveis:

- `skills/nextjs-best-practices/SKILL.md`
- `skills/postgres-architecture/SKILL.md`
- `skills/docker-kubernetes-devops/SKILL.md`

Regras de uso:

- se a tarefa envolver App Router, componentes, páginas, server actions, rotas, UX ou organização do código Next.js, use a skill `nextjs-best-practices`
- se a tarefa envolver modelagem de dados, Prisma, migrations, queries, performance de banco ou decisões de persistência, use a skill `postgres-architecture`
- se a tarefa envolver Docker, Compose, variáveis de ambiente, build, deploy, infraestrutura, Kubernetes ou operação, use a skill `docker-kubernetes-devops`
- se mais de uma skill for relevante, combine as skills necessárias
- toda solução proposta deve respeitar tanto o código existente quanto as orientações dessas skills

## Restrições importantes

- não reescreva o projeto ignorando a implementação atual
- não proponha entidades ou fluxos que já existam com outro nome sem antes validar o modelo atual
- não remova features existentes ao implementar novas mudanças
- não quebrar escopo por perfil de usuário
- não quebrar o fluxo de anexos em storage
- não quebrar o controle financeiro do pedido
- não quebrar a criação automática das execuções do workflow

## Resultado esperado das respostas e implementações

Ao receber uma nova tarefa, sua atuação deve:

- partir da realidade atual do repositório
- considerar as features já implementadas
- usar as skills locais relevantes da pasta `skills`
- manter coerência com a arquitetura existente
- entregar alterações completas, consistentes e prontas para evolução

