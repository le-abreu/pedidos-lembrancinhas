# Skill: postgres-architecture-nextjs

## Objetivo

Aplicar boas práticas modernas de PostgreSQL em projetos Next.js, focando em:

- SaaS
- Sistemas web escaláveis
- Painéis administrativos
- Marketplaces
- Landing pages com CRM
- MVPs sólidos
- Sistemas empresariais modernos

Essa skill conecta:

Next.js + PostgreSQL + Prisma/Drizzle + Docker + Deploy moderno

---

# Mentalidade Principal

Para projetos Next.js, o banco precisa ser:

1. Simples para evoluir
2. Seguro para produção
3. Rápido nas consultas
4. Fácil de integrar no App Router
5. Escalável para crescimento
6. Pronto para autenticação e multi-tenant
7. Compatível com serverless

---

# Stack Recomendada

## Frontend / Backend

- Next.js latest
- App Router
- TypeScript

## Banco

- PostgreSQL

## ORM recomendado

### Preferência 1

- Prisma

### Preferência 2

- Drizzle ORM

## Hosting recomendado

- NeonDB
- Supabase
- Railway
- Render
- RDS

## Local Dev

- Docker Compose

---

# Estrutura Recomendada no Projeto

```bash
src/
  app/
  components/
  lib/
  services/
  prisma/
    schema.prisma
    migrations/
```
