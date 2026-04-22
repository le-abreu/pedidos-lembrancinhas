## Infraestrutura local com Docker e preparação para Kubernetes

Quero que o projeto também seja estruturado para execução local via **Docker Compose**, mas com organização pensada para futura migração para **Kubernetes**.

### Objetivo

Criar uma estrutura de containers limpa, organizada e extensível, evitando acoplamento desnecessário, para que depois seja simples transformar isso em manifests Helm, Kustomize ou YAMLs de Kubernetes.

### Requisitos gerais

- Criar **Dockerfile** para a aplicação Next.js
- Criar **docker-compose.yml** organizado
- Criar estrutura de arquivos de ambiente
- Separar claramente:

  - aplicação
  - banco de dados
  - volumes
  - variáveis de ambiente
  - scripts de inicialização

- Preparar a estrutura para futuro uso em Kubernetes
- Evitar configurações muito específicas apenas de ambiente local

### Estrutura esperada

Quero uma estrutura parecida com esta:

```text
/
├── app/
│   └── (código da aplicação)
├── docker/
│   ├── app/
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── postgres/
│   │   └── init.sql (se necessário)
│   └── compose/
│       ├── docker-compose.yml
│       ├── docker-compose.override.yml
│       └── .env.example
├── infra/
│   └── kubernetes/
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── secret.example.yaml
│       ├── deployment-app.yaml
│       ├── service-app.yaml
│       ├── ingress.yaml
│       └── README.md
└── README.md
```

### Docker Compose

Quero um `docker-compose.yml` bem estruturado, com pelo menos:

#### Serviços

1. **app**

   - aplicação Next.js
   - build por Dockerfile
   - uso de variáveis de ambiente
   - porta exposta
   - dependência do banco

2. **postgres**

   - PostgreSQL compatível com o uso local
   - volume persistente
   - variáveis de ambiente
   - healthcheck
   - porta exposta para uso local

3. Opcionalmente, se fizer sentido:

   - **pgadmin** ou ferramenta equivalente para apoiar a POC
   - mas deixar opcional

### Boas práticas esperadas no Docker Compose

- usar `healthcheck`
- usar `depends_on` com condição quando fizer sentido
- usar `volumes` nomeados
- usar `networks` próprias
- não hardcodar secrets
- usar `.env.example`
- deixar o compose claro e fácil de manter
- comentar pontos importantes quando necessário

### Dockerfile da aplicação

Quero um Dockerfile pensado de forma profissional:

- baseado em Node
- instalação de dependências
- build da aplicação
- execução adequada
- se possível, usar estratégia multi-stage
- preparado para produção e fácil adaptação para ambiente local

### Preparação para Kubernetes

Mesmo que a entrega principal seja Docker Compose, quero que a estrutura já fique pensada para Kubernetes, então:

- separar configurações de ambiente
- não acoplar secrets no compose
- deixar portas, variáveis e nomes de serviço consistentes
- criar pasta `infra/kubernetes`
- gerar exemplos iniciais de manifests:

  - Deployment da aplicação
  - Service da aplicação
  - ConfigMap
  - Secret de exemplo
  - Ingress
  - Namespace

Não precisa fazer um cluster completo, mas quero a base pronta para evolução.

### Banco de dados

Sabendo que a POC usará **Neon DB** em produção/ambiente real, quero que:

- localmente o Docker Compose possa subir um PostgreSQL local para desenvolvimento
- a aplicação seja preparada para trocar facilmente entre:

  - banco local via Docker Compose
  - Neon DB via variável de ambiente

### Variáveis de ambiente

Quero pelo menos:

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NODE_ENV`
- `PORT`

E um `.env.example` explicando o uso.

### Scripts e documentação

Quero que o projeto tenha instruções claras para:

- subir ambiente local
- derrubar ambiente
- rodar migrations
- rodar seed
- trocar de banco local para Neon DB
- explicar como essa estrutura pode evoluir para Kubernetes

### Entrega esperada

Gerar:

1. Dockerfile da aplicação
2. docker-compose.yml organizado
3. .env.example
4. scripts auxiliares se necessário
5. estrutura inicial de Kubernetes em `infra/kubernetes`
6. documentação no README explicando como subir tudo
