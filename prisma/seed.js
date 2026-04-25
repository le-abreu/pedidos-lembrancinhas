const {
  PrismaClient,
  UserProfileType,
  SupplierType,
  ExpectedFileType,
  PhaseExecutionStatus,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: {
      legalName: "Lembrancinhas Exemplo LTDA",
      tradeName: "Atelie Memoria Viva",
      cnpj: "12.345.678/0001-90",
      email: "contato@memoriaviva.dev",
      phone: "(11) 99999-0001",
      active: true,
    },
  });

  const [customerA, customerB] = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Marina Costa",
        document: "123.456.789-00",
        email: "marina@cliente.dev",
        phone: "(11) 99999-1001",
        notes: "Cliente recorrente de festas infantis.",
        active: true,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Empresa Horizonte",
        document: "45.678.123/0001-55",
        email: "compras@horizonte.dev",
        phone: "(11) 4002-1002",
        notes: "Atende kits corporativos e eventos internos.",
        active: true,
      },
    }),
  ]);

  const [supplierA, supplierB] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Grafica Impressa",
        document: "11.111.111/0001-11",
        email: "grafica@parceiro.dev",
        phone: "(11) 3333-0001",
        type: SupplierType.SUPPLIER,
        notes: "Especialista em embalagens e papelaria.",
        active: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Studio Acabamento Premium",
        document: "22.222.222/0001-22",
        email: "execucao@parceiro.dev",
        phone: "(11) 3333-0002",
        type: SupplierType.BOTH,
        notes: "Executa montagem final e expedição.",
        active: true,
      },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Administrador",
      email: "admin@lembrancinha.dev",
      password: "123456",
      active: true,
      profiles: {
        create: [{ profile: UserProfileType.ADMIN }],
      },
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      customerId: customerA.id,
      name: "Cliente Marina",
      email: "cliente@lembrancinha.dev",
      password: "123456",
      active: true,
      profiles: {
        create: [{ profile: UserProfileType.CLIENT }],
      },
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      supplierId: supplierB.id,
      name: "Executor Lucas",
      email: "executor@lembrancinha.dev",
      password: "123456",
      active: true,
      profiles: {
        create: [{ profile: UserProfileType.EXECUTOR }],
      },
    },
  });

  const statuses = await prisma.$transaction([
    prisma.orderStatus.create({
      data: { name: "Aguardando início", description: "Pedido recém-criado.", color: "#8d6e63" },
    }),
    prisma.orderStatus.create({
      data: { name: "Em produção", description: "Materiais e produção em andamento.", color: "#ef6c00" },
    }),
    prisma.orderStatus.create({
      data: { name: "Em aprovação", description: "Cliente precisa validar conteúdo.", color: "#1976d2" },
    }),
    prisma.orderStatus.create({
      data: { name: "Aguardando assinatura", description: "Pedido aguardando aceite.", color: "#6a1b9a" },
    }),
    prisma.orderStatus.create({
      data: { name: "Finalizado", description: "Execução concluída.", color: "#2e7d32" },
    }),
  ]);

  const shippingMethods = await prisma.$transaction([
    prisma.shippingMethod.create({
      data: {
        name: "Retirada",
        description: "Cliente retira no local combinado.",
        active: true,
      },
    }),
    prisma.shippingMethod.create({
      data: {
        name: "Entrega própria",
        description: "Entrega realizada pela equipe interna.",
        active: true,
      },
    }),
    prisma.shippingMethod.create({
      data: {
        name: "Motoboy",
        description: "Entrega urbana por parceiro.",
        active: true,
      },
    }),
    prisma.shippingMethod.create({
      data: {
        name: "Correios",
        description: "Envio postal com rastreio.",
        active: true,
      },
    }),
    prisma.shippingMethod.create({
      data: {
        name: "Transportadora",
        description: "Entrega por transportadora terceirizada.",
        active: true,
      },
    }),
  ]);

  const orderType = await prisma.orderType.create({
    data: {
      name: "Lembrancinha de aniversário",
      description: "Pedido padrão com personalização, produção e entrega.",
      active: true,
    },
  });

  const [mug, box, card, chocolate, bag] = await prisma.$transaction([
    prisma.orderTypeProduct.create({
      data: {
        orderTypeId: orderType.id,
        name: "Caneca",
        description: "Caneca personalizada com arte do evento.",
        defaultQuantity: 1,
        defaultUnitPrice: 18.9,
        defaultUnitWeight: 0.35,
        required: true,
        active: true,
      },
    }),
    prisma.orderTypeProduct.create({
      data: {
        orderTypeId: orderType.id,
        name: "Caixa personalizada",
        description: "Embalagem cartonada com identidade visual.",
        defaultQuantity: 1,
        defaultUnitPrice: 4.5,
        defaultUnitWeight: 0.08,
        required: true,
        active: true,
      },
    }),
    prisma.orderTypeProduct.create({
      data: {
        orderTypeId: orderType.id,
        name: "Cartão",
        description: "Mensagem impressa para acompanhar a lembrança.",
        defaultQuantity: 1,
        defaultUnitPrice: 1.2,
        defaultUnitWeight: 0.01,
        required: false,
        active: true,
      },
    }),
    prisma.orderTypeProduct.create({
      data: {
        orderTypeId: orderType.id,
        name: "Chocolate",
        description: "Doce embalado individualmente.",
        defaultQuantity: 1,
        defaultUnitPrice: 2.8,
        defaultUnitWeight: 0.03,
        required: false,
        active: true,
      },
    }),
    prisma.orderTypeProduct.create({
      data: {
        orderTypeId: orderType.id,
        name: "Sacola",
        description: "Sacola final para entrega do kit.",
        defaultQuantity: 1,
        defaultUnitPrice: 1.9,
        defaultUnitWeight: 0.04,
        required: false,
        active: true,
      },
    }),
  ]);

  const workflow = await prisma.workflow.create({
    data: {
      orderTypeId: orderType.id,
      name: "Workflow aniversário padrão",
      description: "Fluxo base para aprovar arte, produzir, montar e entregar.",
      active: true,
    },
  });

  const [phase1, phase2, phase3, phase4, phase5] = await prisma.$transaction([
    prisma.workflowPhase.create({
      data: {
        workflowId: workflow.id,
        name: "Briefing e coleta",
        description: "Coleta de dados e arquivos do cliente.",
        order: 1,
        guidanceMessage: "Validar nome, idade, tema e referências visuais.",
        allowsFileUpload: true,
        expectedFileType: ExpectedFileType.DOCUMENT,
        changesOrderStatus: false,
        allowsInvoice: false,
        requiresComment: true,
        active: true,
      },
    }),
    prisma.workflowPhase.create({
      data: {
        workflowId: workflow.id,
        name: "Produção de arte",
        description: "Criação e envio da proposta visual.",
        order: 2,
        guidanceMessage: "Anexar prévia da arte para aprovação.",
        allowsFileUpload: true,
        expectedFileType: ExpectedFileType.PHOTO,
        changesOrderStatus: true,
        targetStatusId: statuses[2].id,
        allowsInvoice: false,
        requiresComment: true,
        active: true,
      },
    }),
    prisma.workflowPhase.create({
      data: {
        workflowId: workflow.id,
        name: "Produção física",
        description: "Impressão e preparação dos itens.",
        order: 3,
        guidanceMessage: "Associar fornecedor e registrar evolução.",
        allowsFileUpload: true,
        expectedFileType: ExpectedFileType.PHOTO,
        changesOrderStatus: true,
        targetStatusId: statuses[1].id,
        allowsInvoice: false,
        requiresComment: false,
        active: true,
      },
    }),
    prisma.workflowPhase.create({
      data: {
        workflowId: workflow.id,
        name: "Nota fiscal e expedição",
        description: "Emissão de NF e separação do envio.",
        order: 4,
        guidanceMessage: "Anexar NF e confirmar saída.",
        allowsFileUpload: true,
        expectedFileType: ExpectedFileType.DOCUMENT,
        changesOrderStatus: true,
        targetStatusId: statuses[3].id,
        allowsInvoice: true,
        requiresComment: true,
        active: true,
      },
    }),
    prisma.workflowPhase.create({
      data: {
        workflowId: workflow.id,
        name: "Entrega e encerramento",
        description: "Confirmação final do pedido entregue.",
        order: 5,
        guidanceMessage: "Registrar conclusão final.",
        allowsFileUpload: false,
        changesOrderStatus: true,
        targetStatusId: statuses[4].id,
        allowsInvoice: false,
        requiresComment: false,
        active: true,
      },
    }),
  ]);

  const order = await prisma.order.create({
    data: {
      companyId: company.id,
      customerId: customerA.id,
      orderTypeId: orderType.id,
      workflowId: workflow.id,
      currentStatusId: statuses[1].id,
      createdById: admin.id,
      requestedQuantity: 30,
      shippingMethodId: shippingMethods[4].id,
      shippingPrice: 32.5,
      deliveryAddress: "Rua das Flores, 123 - Apto 45 - Vila Mariana - Sao Paulo/SP",
      title: "Aniversário da Sofia - 30 kits",
      description: "Pedido com tema jardim encantado e entrega até o final do mês.",
      requestedAt: new Date("2026-04-05T10:00:00.000Z"),
      expectedAt: new Date("2026-04-28T18:00:00.000Z"),
      notes: "Cliente pediu tons pastel e itens já embalados.",
      active: true,
    },
  });

  await prisma.orderItem.createMany({
    data: [mug, box, card, chocolate, bag].map((product) => ({
      orderId: order.id,
      productId: product.id,
      quantity: 30 * (product.defaultQuantity || 1),
      unitPrice: product.defaultUnitPrice,
      unitWeight: product.defaultUnitWeight,
    })),
  });

  await prisma.orderSupplier.createMany({
    data: [
      { orderId: order.id, supplierId: supplierA.id, role: "Impressão e papelaria" },
      { orderId: order.id, supplierId: supplierB.id, role: "Montagem final e expedição" },
    ],
  });

  await prisma.orderPhaseExecution.createMany({
    data: [
      {
        orderId: order.id,
        phaseId: phase1.id,
        supplierId: supplierA.id,
        executedByUserId: admin.id,
        status: PhaseExecutionStatus.COMPLETED,
        comment: "Briefing aprovado com arquivos de referência.",
        startedAt: new Date("2026-04-05T11:00:00.000Z"),
        completedAt: new Date("2026-04-05T15:00:00.000Z"),
      },
      {
        orderId: order.id,
        phaseId: phase2.id,
        supplierId: supplierA.id,
        executedByUserId: admin.id,
        status: PhaseExecutionStatus.COMPLETED,
        comment: "Arte enviada e aprovada pela cliente.",
        startedAt: new Date("2026-04-06T10:00:00.000Z"),
        completedAt: new Date("2026-04-08T18:00:00.000Z"),
      },
      {
        orderId: order.id,
        phaseId: phase3.id,
        supplierId: supplierB.id,
        status: PhaseExecutionStatus.IN_PROGRESS,
        comment: "Produção física em andamento.",
        startedAt: new Date("2026-04-10T09:00:00.000Z"),
      },
      {
        orderId: order.id,
        phaseId: phase4.id,
        status: PhaseExecutionStatus.PENDING,
      },
      {
        orderId: order.id,
        phaseId: phase5.id,
        status: PhaseExecutionStatus.PENDING,
      },
    ],
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      number: "1001",
      series: "A1",
      amount: "1890.00",
      issuedAt: new Date("2026-04-12T14:00:00.000Z"),
      notes: "NF parcial para sinal do pedido.",
    },
  });

  console.log("Seed inicial concluido para banco novo.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
