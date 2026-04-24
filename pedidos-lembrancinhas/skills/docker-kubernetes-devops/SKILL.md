# Skill: docker-kubernetes-devops

## Objetivo

Aplicar boas práticas modernas de containerização, orquestração, CI/CD e operação de ambientes para projetos web, APIs e microsserviços.

Essa skill deve ser usada sempre que o projeto envolver:

- Docker
- Docker Compose
- Kubernetes
- Deploy
- CI/CD
- Infraestrutura moderna
- Ambientes dev / homolog / prod
- Escalabilidade
- Observabilidade

---

# Mentalidade Principal

Sempre priorizar:

1. Simplicidade primeiro
2. Produção desde o início
3. Ambiente local parecido com produção
4. Segurança por padrão
5. Automação total
6. Deploy reproduzível
7. Infra como código

---

# Stack Base Recomendada

## Containers

- Docker
- Docker Compose

## Orquestração

- Kubernetes
- K3s / Kind (local)
- EKS / GKE / AKS / DigitalOcean Kubernetes

## CI/CD

- GitHub Actions

## Proxy / Gateway

- Nginx
- Traefik
- Kong (quando necessário)

## Banco

- PostgreSQL
- MySQL
- MongoDB
- Redis

## Observabilidade

- Prometheus
- Grafana
- Loki
- OpenTelemetry

## Secrets

- Kubernetes Secrets
- External Secrets
- Vault (enterprise)

---

# Estrutura Recomendada do Projeto

infra/
docker/
k8s/
helm/
.github/workflows/
scripts/
env/

---

# Docker Best Practices

## Sempre gerar:

- Dockerfile multi-stage
- .dockerignore
- imagem leve
- usuário não-root
- healthcheck
- variáveis por ENV

## Exemplo mentalidade

builder → install deps → build app  
runner → imagem mínima

## Evitar

- rodar como root
- copiar projeto inteiro sem filtro
- imagens gigantes
- hardcode de secrets

---

# Docker Compose Best Practices

Usar para ambiente local.

## Serviços comuns:

- app
- postgres
- redis
- minio
- mailhog
- nginx

## Sempre incluir:

- volumes nomeados
- restart unless-stopped
- depends_on
- network dedicada
- healthcheck

---

# Kubernetes Best Practices

## Sempre gerar manifests separados:

k8s/base/
k8s/dev/
k8s/prod/

ou Helm chart.

## Recursos mínimos:

- Namespace
- Deployment
- Service
- Ingress
- ConfigMap
- Secret
- HPA
- PDB (produção)

## Deployments

Sempre configurar:

- readinessProbe
- livenessProbe
- resource requests
- resource limits
- rolling update

---

# Exemplo mentalidade de resources

requests:
cpu: 100m
memory: 128Mi

limits:
cpu: 500m
memory: 512Mi

---

# Escalabilidade

Quando necessário:

- Horizontal Pod Autoscaler
- múltiplas réplicas
- stateless apps
- cache Redis
- filas assíncronas

---

# Banco de Dados em Infra

Preferir:

- banco gerenciado em produção
- volume persistente apenas quando necessário
- backups automáticos

Nunca depender de banco dentro do cluster para produção crítica sem estratégia.

---

# Segurança

Sempre aplicar:

- secrets fora do código
- TLS/HTTPS
- network policies
- imagens atualizadas
- scan de vulnerabilidade
- RBAC mínimo necessário
- usuário não-root

---

# CI/CD Best Practices

Usar GitHub Actions.

Pipeline padrão:

1. install
2. lint
3. test
4. build
5. docker build
6. push registry
7. deploy staging
8. deploy prod (approval)

---

# Branch Strategy

main = produção  
develop = homologação  
feature/\* = novas features

---

# Ambientes

## Dev

- rápido
- logs verbosos
- docker compose

## Homolog

- parecido com prod
- testes integrados

## Prod

- monitorado
- escalável
- backups
- alertas

---

# Logs e Monitoramento

Sempre prever:

- logs estruturados JSON
- métricas
- traces
- dashboard Grafana
- alertas

---

# Reverse Proxy / Ingress

Preferir:

- Traefik para simplicidade
- Nginx ingress para padrão
- Kong para API Gateway robusto

---

# Storage / Arquivos

Para uploads usar:

- S3
- Cloudflare R2
- MinIO local

Nunca salvar arquivos dentro do container.

---

# Backup Strategy

Sempre prever:

- banco diário
- restore testado
- versionamento de storage crítico

---

# Quando o usuário pedir deploy

O Codex deve perguntar internamente:

1. Qual cloud?
2. Volume esperado?
3. Banco gerenciado?
4. Precisa autoscaling?
5. Precisa CDN?
6. Precisa filas?

Se não informado, assumir stack simples e profissional.

---

# Workflow esperado do Codex

Ao receber tarefa DevOps:

1. Entender stack do projeto
2. Definir ambiente local
3. Criar Dockerfile profissional
4. Criar docker-compose
5. Criar manifests k8s ou Helm
6. Criar CI/CD
7. Documentar deploy
8. Sugerir custos

---

# Frases de ativação

Quando o usuário disser:

"use docker-kubernetes-devops"

ou

"prepare deploy production ready"

Aplicar automaticamente esta skill.

---

# Para projetos do usuário

Priorizar stack:

- Next.js
- Spring Boot
- PostgreSQL
- Redis
- MinIO
- GitHub Actions
- Kubernetes
- Nginx / Kong

---

# Resultado esperado

Infra pronta para:

- subir local
- homologar rápido
- escalar produção
- reduzir riscos
- facilitar manutenção
