# Skill: nextjs-best-practices

## Objetivo

Aplicar boas práticas modernas em projetos Next.js (App Router), garantindo performance, escalabilidade, SEO e código limpo.

---

## Stack Padrão

- Next.js latest
- TypeScript
- TailwindCSS
- ESLint
- Prettier
- Zod
- React Hook Form
- Prisma ou Drizzle
- PostgreSQL / NeonDB
- Docker

---

## Estrutura Recomendada

src/
app/
(auth)/
(dashboard)/
api/
components/
features/
services/
lib/
hooks/
types/
validators/

---

## Regras Gerais

### Sempre usar:

- TypeScript estrito
- Server Components por padrão
- Client Components apenas quando necessário
- Async/await
- Imports absolutos (@/)

### Evitar:

- useEffect desnecessário
- lógica pesada no componente
- props drilling excessivo
- componentes gigantes

---

## Data Fetching

Preferir:

- Server Actions
- Route Handlers
- fetch() no server

Evitar:

- chamadas REST desnecessárias no client

---

## Performance

Sempre aplicar:

- dynamic import quando necessário
- Image do next/image
- Font optimization
- Suspense
- loading.tsx
- error.tsx

---

## SEO

Sempre gerar:

- metadata export
- title
- description
- OpenGraph

---

## Segurança

- validar inputs com Zod
- nunca expor secrets no client
- usar env vars
- sanitizar uploads

---

## UI/UX

- responsivo mobile-first
- loading states
- empty states
- skeleton loading
- acessibilidade (aria-label)

---

## Banco de Dados

- migrations obrigatórias
- indexes
- soft delete quando necessário

---

## Docker

Sempre gerar:

- Dockerfile production
- docker-compose local
- .env.example

---

## Workflow esperado do Codex

Ao receber tarefa Next.js:

1. Ler skill
2. Analisar estrutura existente
3. Propor plano
4. Implementar seguindo padrões
5. Rodar lint
6. Rodar build
7. Explicar alterações

---

## Frase de Ativação

Quando o usuário disser:

"use nextjs-best-practices"

Aplicar automaticamente esta skill.
