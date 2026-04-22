Quero que você crie uma **POC completa de um sistema web em Next.js**, com persistência em **Neon DB (PostgreSQL)**, para gestão de **pedidos de lembrancinhas**.

## Objetivo da POC

O sistema deve permitir cadastrar e acompanhar pedidos de forma **abstrata e configurável**, sem ficar preso a um tipo específico de lembrancinha. A ideia é que o sistema seja flexível para evoluir depois.

## Stack desejada

* **Next.js** (preferencialmente versão atual com App Router)
* **TypeScript**
* **Neon DB (PostgreSQL)**
* ORM: pode usar **Prisma**
* API no próprio Next.js
* Interface simples, limpa e funcional
* Pode usar autenticação simples mockada ou uma estrutura inicial de login, mas já deixando preparado para perfis de usuário

## Escopo funcional

### 1. Cadastro de empresas

Preciso de cadastro de empresas, pois o sistema poderá atender mais de uma empresa.

Campos sugeridos:

* id
* razão social
* nome fantasia
* CNPJ
* e-mail
* telefone
* ativo

---

### 2. Cadastro de clientes

Uma empresa pode receber pedidos para diferentes clientes.

Campos sugeridos:

* id
* empresaId
* nome
* documento
* e-mail
* telefone
* observação
* ativo

---

### 3. Cadastro de fornecedores / executores

Na execução do pedido posso ter **mais de um fornecedor** participando em etapas diferentes.

Campos sugeridos:

* id
* nome / razão social
* documento
* e-mail
* telefone
* tipo (fornecedor, executor ou ambos)
* observação
* ativo

---

### 4. Cadastro de usuários e perfis

O usuário pode estar associado a perfis diferentes.

Perfis desejados:

* **Administrador do sistema**
* **Cliente**
* **Executor do pedido**

Regras:

* Um usuário pode ter um ou mais perfis
* Um usuário pode estar vinculado a uma empresa
* Um usuário cliente pode estar vinculado a um cliente
* Um usuário executor pode estar vinculado a um fornecedor

Campos sugeridos:

* id
* nome
* e-mail
* senha (para POC pode ser simples)
* ativo

Relacionamentos:

* user_profiles
* vínculo opcional com empresa, cliente e fornecedor

---

### 5. Cadastro de tipo de pedido

O pedido será abstrato, então preciso poder cadastrar o **tipo de pedido**.

Exemplos:

* lembrancinha de aniversário
* kit corporativo
* brinde personalizado

Campos sugeridos:

* id
* nome
* descrição
* ativo

---

### 6. Cadastro de produtos do pedido

Cada tipo de pedido pode conter produtos configuráveis.

Exemplos:

* caneca
* caixa personalizada
* cartão
* chocolate
* sacola

Campos sugeridos:

* id
* tipoPedidoId
* nome
* descrição
* quantidade padrão opcional
* obrigatório (sim/não)
* ativo

---

### 7. Cadastro do workflow do pedido

Esse é um ponto central da POC.

Preciso de uma tela para cadastrar o **workflow customizado** de cada tipo de pedido.

#### Estrutura esperada

* Um tipo de pedido pode ter um workflow
* Um workflow possui várias fases/etapas
* As fases devem possuir ordenação

Campos sugeridos para workflow:

* id
* tipoPedidoId
* nome
* descrição
* ativo

Campos sugeridos para fase:

* id
* workflowId
* nome
* descrição
* ordem
* mensagem orientativa
* permiteUploadArquivo (sim/não)
* tipoArquivoEsperado (foto, documento, assinatura, qualquer)
* alteraStatusPedido (sim/não)
* statusDestinoId (opcional)
* permiteInformarNotaFiscal (sim/não)
* exigeComentario (sim/não)
* ativo

---

### 8. Cadastro de status do pedido

Os status do pedido devem ser cadastráveis.

Exemplos:

* Aguardando início
* Em produção
* Em aprovação
* Aguardando assinatura
* Finalizado
* Entregue
* Cancelado

Campos sugeridos:

* id
* nome
* descrição
* cor
* ativo

Obs.:

* A fase do workflow pode ou não alterar o status do pedido
* Quando configurado, ao concluir a fase o pedido muda para o status definido

---

### 9. Cadastro do pedido

Tela de criação de pedido.

Campos sugeridos:

* id
* empresaId
* clienteId
* tipoPedidoId
* workflowId
* statusAtualId
* titulo
* descrição
* dataSolicitacao
* dataPrevista
* observação
* criadoPor
* ativo

Relacionamentos do pedido:

* itens do pedido
* fases executadas
* fornecedores vinculados
* anexos
* nota fiscal

---

### 10. Itens do pedido

O pedido deve possuir produtos/itens.

Campos sugeridos:

* id
* pedidoId
* produtoId
* descrição complementar
* quantidade
* valor unitário opcional
* observação

---

### 11. Execução do workflow do pedido

Ao criar um pedido, o sistema deve carregar o workflow relacionado ao tipo de pedido.

Preciso de uma tela de acompanhamento onde seja possível:

* visualizar as fases do workflow
* avançar fases
* registrar comentário
* anexar foto ou documento
* informar se a fase foi concluída
* alterar o status do pedido quando a fase estiver configurada para isso
* associar fornecedor responsável naquela fase

Campos sugeridos para execução da fase:

* id
* pedidoId
* faseId
* fornecedorId opcional
* statusExecucao (pendente, em andamento, concluída)
* comentario
* arquivoUrl
* dataInicio
* dataConclusao
* executadoPorUsuarioId

---

### 12. Nota fiscal

Preciso que a nota fiscal possa ser adicionada de duas formas:

1. por uma tela própria do pedido
2. por uma fase do workflow, caso a fase permita isso

Campos sugeridos:

* id
* pedidoId
* numeroNota
* serie
* valor
* dataEmissao
* arquivoUrl
* observacao

---

## Regras de negócio importantes

1. O sistema deve ser multiempresa.
2. Um cliente pertence a uma empresa.
3. Um pedido pertence a uma empresa e a um cliente.
4. Um pedido deve ter um tipo de pedido.
5. Um tipo de pedido pode ter produtos configuráveis.
6. Um tipo de pedido pode ter um workflow customizado.
7. O workflow possui fases ordenadas.
8. Cada fase pode:

   * exibir mensagem orientativa
   * permitir upload de foto ou documento
   * alterar ou não o status do pedido
   * permitir informar nota fiscal
9. Um pedido pode ter mais de um fornecedor envolvido.
10. O usuário pode ter mais de um perfil.

---

## Telas mínimas da POC

Quero pelo menos estas telas:

1. Login simples
2. Dashboard inicial
3. Cadastro de empresas
4. Cadastro de clientes
5. Cadastro de fornecedores
6. Cadastro de usuários
7. Cadastro de perfis/vínculos do usuário
8. Cadastro de status do pedido
9. Cadastro de tipo de pedido
10. Cadastro de produtos do tipo de pedido
11. Cadastro de workflow
12. Cadastro de fases do workflow
13. Criação de pedido
14. Detalhe do pedido
15. Execução/acompanhamento do workflow do pedido
16. Inclusão de nota fiscal
17. Listagem de pedidos com filtros

---

## Filtros importantes para listagem de pedidos

* empresa
* cliente
* tipo de pedido
* status
* fornecedor
* período
* usuário responsável

---

## Estrutura técnica esperada

Quero que o projeto seja entregue com:

* organização em camadas
* componentes reutilizáveis
* schema do banco
* migrations
* seed inicial com dados de exemplo
* README explicando como rodar
* variáveis de ambiente para conectar no Neon DB
* exemplo de `.env.example`

---

## Seed inicial desejado

Criar dados básicos para facilitar a validação:

* 1 empresa
* 2 clientes
* 2 fornecedores
* 3 usuários (admin, cliente, executor)
* 1 tipo de pedido
* alguns produtos vinculados ao tipo
* alguns status
* 1 workflow com 4 ou 5 fases
* 1 pedido de exemplo

---

## Experiência esperada

Não precisa focar em visual sofisticado. Quero uma interface simples, funcional e clara, priorizando:

* fluxo navegável
* boa modelagem
* clareza do código
* facilidade de evolução futura

---

## Entrega esperada

Quero que você gere:

1. a estrutura completa do projeto
2. modelagem do banco
3. páginas e componentes principais
4. APIs necessárias
5. seed inicial
6. instruções para execução local

---

## Importante

A POC deve ser pensada para futura evolução. Então modele o sistema de forma limpa, extensível e desacoplada, evitando regras engessadas para um único tipo de pedido.

Se fizer sentido, pode criar:

* enums
* tabelas de relacionamento
* componentes genéricos para CRUD
* estrutura inicial de autorização por perfil

No final, explique:

* estrutura de pastas
* entidades criadas
* fluxo principal de uso
* como rodar localmente com Neon DB

