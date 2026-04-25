BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Company" LIMIT 1) THEN
    RAISE EXCEPTION 'init_poc.sql espera banco vazio. Limpe a base antes de executar.';
  END IF;
END $$;

INSERT INTO "Company" ("id", "legalName", "tradeName", "cnpj", "email", "phone", "active", "createdAt", "updatedAt")
VALUES
  ('cmp_poc_memoria_viva', 'Lembrancinhas Exemplo LTDA', 'Atelie Memoria Viva', '12.345.678/0001-90', 'contato@memoriaviva.dev', '(11) 99999-0001', true, NOW(), NOW());

INSERT INTO "Customer" ("id", "companyId", "name", "document", "email", "phone", "notes", "active", "createdAt", "updatedAt")
VALUES
  ('cust_poc_marina', 'cmp_poc_memoria_viva', 'Marina Costa', '123.456.789-00', 'marina@cliente.dev', '(11) 99999-1001', 'Cliente recorrente de festas infantis.', true, NOW(), NOW()),
  ('cust_poc_horizonte', 'cmp_poc_memoria_viva', 'Empresa Horizonte', '45.678.123/0001-55', 'compras@horizonte.dev', '(11) 4002-1002', 'Atende kits corporativos e eventos internos.', true, NOW(), NOW()),
  ('cust_poc_fernanda', 'cmp_poc_memoria_viva', 'Fernanda Alves', '987.654.321-00', 'fernanda@cliente.dev', '(11) 99999-1003', 'Solicita aprovacoes rapidas por WhatsApp.', true, NOW(), NOW());

INSERT INTO "Supplier" ("id", "name", "document", "email", "phone", "type", "notes", "active", "createdAt", "updatedAt")
VALUES
  ('sup_poc_grafica', 'Grafica Impressa', '11.111.111/0001-11', 'grafica@parceiro.dev', '(11) 3333-0001', 'SUPPLIER', 'Especialista em embalagens e papelaria.', true, NOW(), NOW()),
  ('sup_poc_studio', 'Studio Acabamento Premium', '22.222.222/0001-22', 'execucao@parceiro.dev', '(11) 3333-0002', 'BOTH', 'Executa montagem final e expedicao.', true, NOW(), NOW()),
  ('sup_poc_logistica', 'Logistica Expresso Festas', '33.333.333/0001-33', 'entregas@parceiro.dev', '(11) 3333-0003', 'EXECUTOR', 'Especializada em entregas de ultima milha.', true, NOW(), NOW());

INSERT INTO "User" ("id", "companyId", "customerId", "supplierId", "avatarStoredFileId", "name", "email", "password", "active", "createdAt", "updatedAt")
VALUES
  ('usr_poc_admin', 'cmp_poc_memoria_viva', NULL, NULL, NULL, 'Administrador POC', 'admin@lembrancinha.dev', '123456', true, NOW(), NOW()),
  ('usr_poc_cliente', 'cmp_poc_memoria_viva', 'cust_poc_marina', NULL, NULL, 'Cliente Marina', 'cliente@lembrancinha.dev', '123456', true, NOW(), NOW()),
  ('usr_poc_executor', 'cmp_poc_memoria_viva', NULL, 'sup_poc_studio', NULL, 'Executor Lucas', 'executor@lembrancinha.dev', '123456', true, NOW(), NOW());

INSERT INTO "UserProfile" ("id", "userId", "profile", "createdAt")
VALUES
  ('upro_poc_admin', 'usr_poc_admin', 'ADMIN', NOW()),
  ('upro_poc_cliente', 'usr_poc_cliente', 'CLIENT', NOW()),
  ('upro_poc_executor', 'usr_poc_executor', 'EXECUTOR', NOW());

INSERT INTO "OrderStatus" ("id", "name", "description", "color", "active", "createdAt", "updatedAt")
VALUES
  ('status_poc_inicio', 'Aguardando inicio', 'Pedido recem-criado.', '#8d6e63', true, NOW(), NOW()),
  ('status_poc_producao', 'Em producao', 'Materiais e producao em andamento.', '#ef6c00', true, NOW(), NOW()),
  ('status_poc_aprovacao', 'Em aprovacao', 'Cliente precisa validar conteudo.', '#1976d2', true, NOW(), NOW()),
  ('status_poc_assinatura', 'Aguardando assinatura', 'Pedido aguardando aceite.', '#6a1b9a', true, NOW(), NOW()),
  ('status_poc_finalizado', 'Finalizado', 'Execucao concluida.', '#2e7d32', true, NOW(), NOW());

INSERT INTO "ShippingMethod" ("id", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  ('ship_poc_retirada', 'Retirada', 'Cliente retira no local combinado.', true, NOW(), NOW()),
  ('ship_poc_propria', 'Entrega propria', 'Entrega realizada pela equipe interna.', true, NOW(), NOW()),
  ('ship_poc_motoboy', 'Motoboy', 'Entrega urbana por parceiro.', true, NOW(), NOW()),
  ('ship_poc_correios', 'Correios', 'Envio postal com rastreio.', true, NOW(), NOW()),
  ('ship_poc_transportadora', 'Transportadora', 'Entrega por transportadora terceirizada.', true, NOW(), NOW());

INSERT INTO "OrderType" ("id", "fileStoredFileId", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  ('otype_poc_aniversario', NULL, 'Lembrancinha de aniversario', 'Pedido padrao com personalizacao, producao e entrega.', true, NOW(), NOW());

INSERT INTO "OrderTypeProduct" ("id", "orderTypeId", "fileStoredFileId", "name", "description", "defaultQuantity", "defaultUnitPrice", "defaultUnitWeight", "required", "active", "createdAt", "updatedAt")
VALUES
  ('prod_poc_caneca', 'otype_poc_aniversario', NULL, 'Caneca', 'Caneca personalizada com arte do evento.', 1, 18.90, 0.350, true, true, NOW(), NOW()),
  ('prod_poc_caixa', 'otype_poc_aniversario', NULL, 'Caixa personalizada', 'Embalagem cartonada com identidade visual.', 1, 4.50, 0.080, true, true, NOW(), NOW()),
  ('prod_poc_cartao', 'otype_poc_aniversario', NULL, 'Cartao', 'Mensagem impressa para acompanhar a lembranca.', 1, 1.20, 0.010, false, true, NOW(), NOW()),
  ('prod_poc_chocolate', 'otype_poc_aniversario', NULL, 'Chocolate', 'Doce embalado individualmente.', 1, 2.80, 0.030, false, true, NOW(), NOW()),
  ('prod_poc_sacola', 'otype_poc_aniversario', NULL, 'Sacola', 'Sacola final para entrega do kit.', 1, 1.90, 0.040, false, true, NOW(), NOW());

INSERT INTO "Workflow" ("id", "orderTypeId", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  ('workflow_poc_aniversario', 'otype_poc_aniversario', 'Workflow aniversario padrao', 'Fluxo base para aprovar arte, produzir, montar e entregar.', true, NOW(), NOW());

INSERT INTO "WorkflowPhase" ("id", "workflowId", "responsibleSupplierId", "name", "description", "order", "guidanceMessage", "allowsFileUpload", "expectedFileType", "requiresSupplier", "changesOrderStatus", "targetStatusId", "allowsInvoice", "requiresComment", "active", "createdAt", "updatedAt")
SELECT * FROM (
  VALUES
    ('phase_poc_briefing', 'workflow_poc_aniversario', NULL, 'Briefing e coleta', 'Coleta de dados e arquivos do cliente.', 1, 'Validar nome, idade, tema e referencias visuais.', true, 'DOCUMENT'::"ExpectedFileType", false, false, NULL::text, false, true, true, NOW(), NOW()),
    ('phase_poc_arte', 'workflow_poc_aniversario', NULL, 'Producao de arte', 'Criacao e envio da proposta visual.', 2, 'Anexar previa da arte para aprovacao.', true, 'PHOTO'::"ExpectedFileType", false, true, (SELECT id FROM "OrderStatus" WHERE name = 'Em aprovacao'), false, true, true, NOW(), NOW()),
    ('phase_poc_fisica', 'workflow_poc_aniversario', NULL, 'Producao fisica', 'Impressao e preparacao dos itens.', 3, 'Associar fornecedor e registrar evolucao.', true, 'PHOTO'::"ExpectedFileType", false, true, (SELECT id FROM "OrderStatus" WHERE name = 'Em producao'), false, false, true, NOW(), NOW()),
    ('phase_poc_nota', 'workflow_poc_aniversario', NULL, 'Nota fiscal e expedicao', 'Emissao de NF e separacao do envio.', 4, 'Anexar NF e confirmar saida.', true, 'DOCUMENT'::"ExpectedFileType", false, true, (SELECT id FROM "OrderStatus" WHERE name = 'Aguardando assinatura'), true, true, true, NOW(), NOW()),
    ('phase_poc_entrega', 'workflow_poc_aniversario', NULL, 'Entrega e encerramento', 'Confirmacao final do pedido entregue.', 5, 'Registrar conclusao final.', false, NULL::"ExpectedFileType", false, true, (SELECT id FROM "OrderStatus" WHERE name = 'Finalizado'), false, false, true, NOW(), NOW())
) AS workflow_phase_rows("id", "workflowId", "responsibleSupplierId", "name", "description", "order", "guidanceMessage", "allowsFileUpload", "expectedFileType", "requiresSupplier", "changesOrderStatus", "targetStatusId", "allowsInvoice", "requiresComment", "active", "createdAt", "updatedAt");

COMMIT;
