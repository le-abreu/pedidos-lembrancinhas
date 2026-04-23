"use server";

import {
  ExpectedFileType,
  PaymentInstallmentMode,
  PaymentMethod,
  PhaseExecutionStatus,
  OrderPaymentInstallmentStatus,
  SupplierType,
  UserProfileType,
} from "@prisma/client";
import { addMonths } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOrderScope } from "@/server/services/order-service";
import {
  isUploadFile,
  uploadAndAttachFile,
  uploadStoredFile,
  uploadUserAvatar,
} from "@/server/services/file-storage-service";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: FormDataEntryValue | null) {
  const parsed = asString(value).trim();
  return parsed ? parsed : null;
}

function asBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}

function asInt(value: FormDataEntryValue | null) {
  const parsed = Number(asString(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function asDecimal(value: FormDataEntryValue | null) {
  const parsed = asOptionalString(value);
  return parsed ? parsed.replace(",", ".") : null;
}

function asRequiredInt(value: FormDataEntryValue | null, fieldLabel: string) {
  const parsed = Number(asString(value));

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} deve ser maior que zero.`);
  }

  return parsed;
}

function getRedirectPath(formData: FormData, fallback: string) {
  return asOptionalString(formData.get("redirectPath")) ?? fallback;
}

function withSuccessMessage(path: string, message: string) {
  const [pathname, hashFragment] = path.split("#");
  const [basePath, currentQuery] = pathname.split("?");
  const params = new URLSearchParams(currentQuery ?? "");
  params.set("success", message);
  const queryString = params.toString();
  return `${basePath}${queryString ? `?${queryString}` : ""}${hashFragment ? `#${hashFragment}` : ""}`;
}

function getProfileValues(formData: FormData) {
  return formData.getAll("profiles").map((value) => value.toString() as UserProfileType);
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

function isImageUpload(file: File) {
  return file.type.startsWith("image/");
}

function isDocumentUpload(file: File) {
  const allowedExtensions = new Set(["pdf", "doc", "docx", "xml"]);
  return (
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/xml" ||
    file.type === "text/xml" ||
    allowedExtensions.has(getFileExtension(file.name))
  );
}

function ensureImageUpload(file: FormDataEntryValue | null, message: string) {
  if (!isUploadFile(file) || !isImageUpload(file)) {
    throw new Error(message);
  }

  return file;
}

function ensureDocumentUpload(file: FormDataEntryValue | null, message: string) {
  if (!isUploadFile(file) || !isDocumentUpload(file)) {
    throw new Error(message);
  }

  return file;
}

function isAdminUser(user: { profiles: Array<{ profile: UserProfileType }> }) {
  return user.profiles.some((item) => item.profile === UserProfileType.ADMIN);
}

function isExecutorUser(user: { profiles: Array<{ profile: UserProfileType }> }) {
  return user.profiles.some((item) => item.profile === UserProfileType.EXECUTOR);
}

function requireAdminUser(user: { profiles: Array<{ profile: UserProfileType }> }) {
  if (!isAdminUser(user)) {
    throw new Error("Apenas administradores podem gerenciar o financeiro do pedido.");
  }
}

function canInteractWithExecution(
  user: { supplierId: string | null; profiles: Array<{ profile: UserProfileType }> },
  execution: {
    supplierId: string | null;
    phase: { requiresSupplier: boolean; responsibleSupplierId: string | null };
  },
) {
  if (isAdminUser(user)) {
    return true;
  }

  if (!isExecutorUser(user)) {
    return false;
  }

  if (execution.phase.requiresSupplier) {
    return Boolean(
      user.supplierId &&
        execution.phase.responsibleSupplierId &&
        user.supplierId === execution.phase.responsibleSupplierId,
    );
  }

  if (execution.supplierId) {
    return user.supplierId === execution.supplierId;
  }

  return true;
}

function getResponsibleSupplierData(formData: FormData) {
  const requiresSupplier = asBoolean(formData.get("requiresSupplier"));
  const responsibleSupplierId = requiresSupplier
    ? asOptionalString(formData.get("responsibleSupplierId"))
    : null;

  if (requiresSupplier && !responsibleSupplierId) {
    throw new Error("Selecione o fornecedor responsável para a fase.");
  }

  return { requiresSupplier, responsibleSupplierId };
}

function revalidateCrudPaths(basePath: string, redirectPath?: string) {
  revalidatePath(basePath);

  if (redirectPath) {
    revalidatePath(redirectPath);
  }

  revalidatePath("/");

  if (redirectPath) {
    redirect(redirectPath);
  }
}

export async function updateCurrentUserAvatar(formData: FormData) {
  const user = await requireCurrentUser();
  const file = ensureImageUpload(formData.get("avatar"), "Selecione uma imagem para a foto do usuário.");

  const storedFile = await uploadUserAvatar({
    file,
    userId: user.id,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatarStoredFileId: storedFile.id,
    },
  });

  const redirectPath = withSuccessMessage(
    getRedirectPath(formData, "/account"),
    "Foto do usuário atualizada com sucesso.",
  );

  revalidatePath("/account");
  revalidatePath("/");
  redirect(redirectPath);
}

export async function updateCurrentUserPassword(formData: FormData) {
  const user = await requireCurrentUser();
  const currentPassword = asString(formData.get("currentPassword"));
  const newPassword = asString(formData.get("newPassword"));
  const confirmPassword = asString(formData.get("confirmPassword"));

  if (currentPassword !== user.password) {
    throw new Error("A senha atual informada não confere.");
  }

  if (newPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("A confirmação da nova senha não confere.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newPassword,
    },
  });

  const redirectPath = withSuccessMessage(
    getRedirectPath(formData, "/account"),
    "Senha atualizada com sucesso.",
  );

  revalidatePath("/account");
  redirect(redirectPath);
}

async function requireAccessibleOrder(
  orderId: string,
  user?: Awaited<ReturnType<typeof requireCurrentUser>>,
) {
  const resolvedUser = user ?? (await requireCurrentUser());
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...buildOrderScope(resolvedUser),
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  return { order, user: resolvedUser };
}

export async function createCompany(formData: FormData) {
  await prisma.company.create({
    data: {
      legalName: asString(formData.get("legalName")),
      tradeName: asString(formData.get("tradeName")),
      cnpj: asString(formData.get("cnpj")),
      email: asString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/companies",
    withSuccessMessage(getRedirectPath(formData, "/companies"), "Empresa cadastrada com sucesso."),
  );
}

export async function updateCompany(formData: FormData) {
  const id = asString(formData.get("id"));

  await prisma.company.update({
    where: { id },
    data: {
      legalName: asString(formData.get("legalName")),
      tradeName: asString(formData.get("tradeName")),
      cnpj: asString(formData.get("cnpj")),
      email: asString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
    },
  });

  revalidateCrudPaths(
    "/companies",
    withSuccessMessage(
      getRedirectPath(formData, `/companies/${id}/edit`),
      "Empresa atualizada com sucesso.",
    ),
  );
}

export async function toggleCompanyActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.company.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/companies",
    withSuccessMessage(
      getRedirectPath(formData, "/companies"),
      nextValue ? "Empresa ativada com sucesso." : "Empresa inativada com sucesso.",
    ),
  );
}

export async function createCustomer(formData: FormData) {
  await prisma.customer.create({
    data: {
      companyId: asString(formData.get("companyId")),
      name: asString(formData.get("name")),
      document: asOptionalString(formData.get("document")),
      email: asOptionalString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
      notes: asOptionalString(formData.get("notes")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/customers",
    withSuccessMessage(getRedirectPath(formData, "/customers"), "Cliente cadastrado com sucesso."),
  );
}

export async function updateCustomer(formData: FormData) {
  const id = asString(formData.get("id"));

  await prisma.customer.update({
    where: { id },
    data: {
      companyId: asString(formData.get("companyId")),
      name: asString(formData.get("name")),
      document: asOptionalString(formData.get("document")),
      email: asOptionalString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
      notes: asOptionalString(formData.get("notes")),
    },
  });

  revalidateCrudPaths(
    "/customers",
    withSuccessMessage(getRedirectPath(formData, `/customers/${id}/edit`), "Cliente atualizado com sucesso."),
  );
}

export async function toggleCustomerActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.customer.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/customers",
    withSuccessMessage(
      getRedirectPath(formData, "/customers"),
      nextValue ? "Cliente ativado com sucesso." : "Cliente inativado com sucesso.",
    ),
  );
}

export async function createSupplier(formData: FormData) {
  await prisma.supplier.create({
    data: {
      name: asString(formData.get("name")),
      document: asOptionalString(formData.get("document")),
      email: asOptionalString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
      notes: asOptionalString(formData.get("notes")),
      type: asString(formData.get("type")) as SupplierType,
      active: true,
    },
  });

  revalidateCrudPaths(
    "/suppliers",
    withSuccessMessage(getRedirectPath(formData, "/suppliers"), "Fornecedor cadastrado com sucesso."),
  );
}

export async function updateSupplier(formData: FormData) {
  const id = asString(formData.get("id"));

  await prisma.supplier.update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      document: asOptionalString(formData.get("document")),
      email: asOptionalString(formData.get("email")),
      phone: asOptionalString(formData.get("phone")),
      notes: asOptionalString(formData.get("notes")),
      type: asString(formData.get("type")) as SupplierType,
    },
  });

  revalidateCrudPaths(
    "/suppliers",
    withSuccessMessage(
      getRedirectPath(formData, `/suppliers/${id}/edit`),
      "Fornecedor atualizado com sucesso.",
    ),
  );
}

export async function toggleSupplierActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.supplier.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/suppliers",
    withSuccessMessage(
      getRedirectPath(formData, "/suppliers"),
      nextValue ? "Fornecedor ativado com sucesso." : "Fornecedor inativado com sucesso.",
    ),
  );
}

export async function createUser(formData: FormData) {
  const profileValues = getProfileValues(formData);

  const user = await prisma.user.create({
    data: {
      name: asString(formData.get("name")),
      email: asString(formData.get("email")),
      password: asString(formData.get("password")),
      active: true,
      companyId: asOptionalString(formData.get("companyId")),
      customerId: asOptionalString(formData.get("customerId")),
      supplierId: asOptionalString(formData.get("supplierId")),
    },
  });

  if (profileValues.length) {
    await prisma.userProfile.createMany({
      data: profileValues.map((profile) => ({ userId: user.id, profile })),
    });
  }

  revalidateCrudPaths(
    "/users",
    withSuccessMessage(getRedirectPath(formData, "/users"), "Usuário cadastrado com sucesso."),
  );
}

export async function updateUser(formData: FormData) {
  const id = asString(formData.get("id"));
  const profileValues = getProfileValues(formData);

  await prisma.user.update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      email: asString(formData.get("email")),
      password: asString(formData.get("password")),
      companyId: asOptionalString(formData.get("companyId")),
      customerId: asOptionalString(formData.get("customerId")),
      supplierId: asOptionalString(formData.get("supplierId")),
    },
  });

  await prisma.userProfile.deleteMany({
    where: { userId: id },
  });

  if (profileValues.length) {
    await prisma.userProfile.createMany({
      data: profileValues.map((profile) => ({ userId: id, profile })),
    });
  }

  revalidateCrudPaths(
    "/users",
    withSuccessMessage(getRedirectPath(formData, `/users/${id}/edit`), "Usuário atualizado com sucesso."),
  );
}

export async function toggleUserActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.user.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/users",
    withSuccessMessage(
      getRedirectPath(formData, "/users"),
      nextValue ? "Usuário ativado com sucesso." : "Usuário inativado com sucesso.",
    ),
  );
}

export async function createStatus(formData: FormData) {
  await prisma.orderStatus.create({
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      color: asString(formData.get("color")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/statuses",
    withSuccessMessage(getRedirectPath(formData, "/statuses"), "Status cadastrado com sucesso."),
  );
}

export async function createShippingMethod(formData: FormData) {
  await (prisma as any).shippingMethod.create({
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/shipping-methods",
    withSuccessMessage(getRedirectPath(formData, "/shipping-methods"), "Tipo de frete cadastrado com sucesso."),
  );
}

export async function updateShippingMethod(formData: FormData) {
  const id = asString(formData.get("id"));

  await (prisma as any).shippingMethod.update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
    },
  });

  revalidateCrudPaths(
    "/shipping-methods",
    withSuccessMessage(
      getRedirectPath(formData, `/shipping-methods/${id}/edit`),
      "Tipo de frete atualizado com sucesso.",
    ),
  );
}

export async function toggleShippingMethodActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await (prisma as any).shippingMethod.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/shipping-methods",
    withSuccessMessage(
      getRedirectPath(formData, "/shipping-methods"),
      nextValue ? "Tipo de frete ativado com sucesso." : "Tipo de frete inativado com sucesso.",
    ),
  );
}

export async function updateStatus(formData: FormData) {
  const id = asString(formData.get("id"));

  await prisma.orderStatus.update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      color: asString(formData.get("color")),
    },
  });

  revalidateCrudPaths(
    "/statuses",
    withSuccessMessage(getRedirectPath(formData, `/statuses/${id}/edit`), "Status atualizado com sucesso."),
  );
}

export async function toggleStatusActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.orderStatus.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/statuses",
    withSuccessMessage(
      getRedirectPath(formData, "/statuses"),
      nextValue ? "Status ativado com sucesso." : "Status inativado com sucesso.",
    ),
  );
}

export async function createOrderType(formData: FormData) {
  const user = await requireCurrentUser();
  const file = formData.get("file");
  const storedFile = isUploadFile(file)
    ? await uploadStoredFile({
        file,
        objectPrefix: "order-types/catalog",
        uploadedById: user.id,
      })
    : null;

  await (prisma.orderType as any).create({
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      fileStoredFileId: storedFile?.id ?? null,
      active: true,
    },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(getRedirectPath(formData, "/order-types"), "Tipo de pedido cadastrado com sucesso."),
  );
}

export async function updateOrderType(formData: FormData) {
  const user = await requireCurrentUser();
  const id = asString(formData.get("id"));
  const file = formData.get("file");
  const storedFile = isUploadFile(file)
    ? await uploadStoredFile({
        file,
        objectPrefix: `order-types/${id}`,
        uploadedById: user.id,
      })
    : null;

  await (prisma.orderType as any).update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      ...(storedFile ? { fileStoredFileId: storedFile.id } : {}),
    },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(
      getRedirectPath(formData, `/order-types/${id}/edit`),
      "Tipo de pedido atualizado com sucesso.",
    ),
  );
}

export async function toggleOrderTypeActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.orderType.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(
      getRedirectPath(formData, "/order-types"),
      nextValue ? "Tipo de pedido ativado com sucesso." : "Tipo de pedido inativado com sucesso.",
    ),
  );
}

export async function createOrderTypeProduct(formData: FormData) {
  const user = await requireCurrentUser();
  const fileInput = formData.get("file");
  const file = isUploadFile(fileInput)
    ? ensureImageUpload(fileInput, "O arquivo do produto precisa ser uma imagem.")
    : null;
  const storedFile = isUploadFile(file)
    ? await uploadStoredFile({
        file,
        objectPrefix: `order-types/${asString(formData.get("orderTypeId"))}/products`,
        uploadedById: user.id,
      })
    : null;

  await (prisma.orderTypeProduct as any).create({
    data: {
      orderTypeId: asString(formData.get("orderTypeId")),
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      fileStoredFileId: storedFile?.id ?? null,
      defaultQuantity: asOptionalString(formData.get("defaultQuantity"))
        ? asInt(formData.get("defaultQuantity"))
        : null,
      defaultUnitPrice: asDecimal(formData.get("defaultUnitPrice")),
      defaultUnitWeight: asDecimal(formData.get("defaultUnitWeight")),
      required: asBoolean(formData.get("required")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(getRedirectPath(formData, "/order-types"), "Produto do tipo cadastrado com sucesso."),
  );
}

export async function updateOrderTypeProduct(formData: FormData) {
  const user = await requireCurrentUser();
  const id = asString(formData.get("id"));
  const orderTypeId = asString(formData.get("orderTypeId"));
  const fileInput = formData.get("file");
  const file = isUploadFile(fileInput)
    ? ensureImageUpload(fileInput, "O arquivo do produto precisa ser uma imagem.")
    : null;
  const storedFile = isUploadFile(file)
    ? await uploadStoredFile({
        file,
        objectPrefix: `order-types/${orderTypeId}/products/${id}`,
        uploadedById: user.id,
      })
    : null;

  await (prisma.orderTypeProduct as any).update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      ...(storedFile ? { fileStoredFileId: storedFile.id } : {}),
      defaultQuantity: asOptionalString(formData.get("defaultQuantity"))
        ? asInt(formData.get("defaultQuantity"))
        : null,
      defaultUnitPrice: asDecimal(formData.get("defaultUnitPrice")),
      defaultUnitWeight: asDecimal(formData.get("defaultUnitWeight")),
      required: asBoolean(formData.get("required")),
    },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(
      getRedirectPath(formData, `/order-types/${orderTypeId}/edit`),
      "Produto do tipo atualizado com sucesso.",
    ),
  );
}

export async function toggleOrderTypeProductActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.orderTypeProduct.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/order-types",
    withSuccessMessage(
      getRedirectPath(formData, "/order-types"),
      nextValue ? "Produto do tipo ativado com sucesso." : "Produto do tipo inativado com sucesso.",
    ),
  );
}

export async function createWorkflow(formData: FormData) {
  await prisma.workflow.create({
    data: {
      orderTypeId: asString(formData.get("orderTypeId")),
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      active: true,
    },
  });

  revalidateCrudPaths(
    "/workflows",
    withSuccessMessage(getRedirectPath(formData, "/workflows"), "Workflow cadastrado com sucesso."),
  );
  revalidatePath("/order-types");
}

export async function updateWorkflow(formData: FormData) {
  const id = asString(formData.get("id"));

  await prisma.workflow.update({
    where: { id },
    data: {
      orderTypeId: asString(formData.get("orderTypeId")),
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
    },
  });

  revalidateCrudPaths(
    "/workflows",
    withSuccessMessage(getRedirectPath(formData, `/workflows/${id}/edit`), "Workflow atualizado com sucesso."),
  );
}

export async function toggleWorkflowActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.workflow.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/workflows",
    withSuccessMessage(
      getRedirectPath(formData, "/workflows"),
      nextValue ? "Workflow ativado com sucesso." : "Workflow inativado com sucesso.",
    ),
  );
}

export async function createWorkflowPhase(formData: FormData) {
  const { requiresSupplier, responsibleSupplierId } = getResponsibleSupplierData(formData);

  await prisma.workflowPhase.create({
    data: {
      workflowId: asString(formData.get("workflowId")),
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      order: asInt(formData.get("order")),
      guidanceMessage: asOptionalString(formData.get("guidanceMessage")),
      allowsFileUpload: asBoolean(formData.get("allowsFileUpload")),
      expectedFileType: asBoolean(formData.get("allowsFileUpload"))
        ? (asString(formData.get("expectedFileType")) as ExpectedFileType)
        : null,
      requiresSupplier,
      responsibleSupplierId,
      changesOrderStatus: asBoolean(formData.get("changesOrderStatus")),
      targetStatusId: asBoolean(formData.get("changesOrderStatus"))
        ? asOptionalString(formData.get("targetStatusId"))
        : null,
      allowsInvoice: asBoolean(formData.get("allowsInvoice")),
      requiresComment: asBoolean(formData.get("requiresComment")),
      active: asBoolean(formData.get("active")),
    },
  });

  revalidateCrudPaths("/workflows", getRedirectPath(formData, "/workflows"));
}

export async function updateWorkflowPhase(formData: FormData) {
  const id = asString(formData.get("id"));
  const workflowId = asString(formData.get("workflowId"));
  const { requiresSupplier, responsibleSupplierId } = getResponsibleSupplierData(formData);

  await prisma.workflowPhase.update({
    where: { id },
    data: {
      name: asString(formData.get("name")),
      description: asOptionalString(formData.get("description")),
      order: asInt(formData.get("order")),
      guidanceMessage: asOptionalString(formData.get("guidanceMessage")),
      allowsFileUpload: asBoolean(formData.get("allowsFileUpload")),
      expectedFileType: asBoolean(formData.get("allowsFileUpload"))
        ? (asString(formData.get("expectedFileType")) as ExpectedFileType)
        : null,
      requiresSupplier,
      responsibleSupplierId,
      changesOrderStatus: asBoolean(formData.get("changesOrderStatus")),
      targetStatusId: asBoolean(formData.get("changesOrderStatus"))
        ? asOptionalString(formData.get("targetStatusId"))
        : null,
      allowsInvoice: asBoolean(formData.get("allowsInvoice")),
      requiresComment: asBoolean(formData.get("requiresComment")),
      active: asBoolean(formData.get("active")),
    },
  });

  revalidateCrudPaths("/workflows", getRedirectPath(formData, `/workflows/${workflowId}/edit`));
}

export async function toggleWorkflowPhaseActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.workflowPhase.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths("/workflows", getRedirectPath(formData, "/workflows"));
}

export async function createOrder(formData: FormData) {
  const user = await requireCurrentUser();
  const isClient = user.profiles.some((item) => item.profile === UserProfileType.CLIENT);
  const orderTypeId = asString(formData.get("orderTypeId"));
  const requestedQuantity = asRequiredInt(formData.get("requestedQuantity"), "Quantidade de lembrancinhas");
  const shippingMethodId = asString(formData.get("shippingMethodId"));
  const shippingPrice = asDecimal(formData.get("shippingPrice")) ?? "0";
  const deliveryAddress = asOptionalString(formData.get("deliveryAddress"));
  const workflow = await prisma.workflow.findUnique({
    where: { orderTypeId },
    include: {
      phases: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!workflow) {
    throw new Error("Tipo de pedido sem workflow configurado.");
  }

  if (!shippingMethodId) {
    throw new Error("Selecione o tipo de frete.");
  }

  if (!deliveryAddress) {
    throw new Error("Informe o endereço de entrega.");
  }

  const order = await (prisma.order as any).create({
    data: {
      companyId: isClient ? user.companyId ?? "" : asString(formData.get("companyId")),
      customerId: isClient ? user.customerId ?? "" : asString(formData.get("customerId")),
      orderTypeId,
      workflowId: workflow.id,
      currentStatusId: asString(formData.get("currentStatusId")),
      createdById: user.id,
      shippingMethodId,
      shippingPrice,
      requestedQuantity,
      deliveryAddress,
      title: asString(formData.get("title")),
      description: asOptionalString(formData.get("description")),
      requestedAt: new Date(asString(formData.get("requestedAt"))),
      expectedAt: asOptionalString(formData.get("expectedAt"))
        ? new Date(asString(formData.get("expectedAt")))
        : null,
      notes: asOptionalString(formData.get("notes")),
      active: true,
    },
  });

  const selectedProducts = formData
    .getAll("productId")
    .map((value) => value.toString())
    .filter(Boolean);

  const selectedSuppliers = formData
    .getAll("supplierId")
    .map((value) => value.toString())
    .filter(Boolean);

  if (isClient && (!user.companyId || !user.customerId)) {
    throw new Error("Usuário cliente sem empresa ou cliente vinculado.");
  }

  if (selectedProducts.length) {
    const products = (await prisma.orderTypeProduct.findMany({
      where: { id: { in: selectedProducts } },
    })) as unknown as Array<{
      id: string;
      defaultQuantity: number | null;
      defaultUnitPrice: string | null;
      defaultUnitWeight: string | null;
    }>;

    await prisma.orderItem.createMany({
      data: products.map((product) => ({
        orderId: order.id,
        productId: product.id,
        quantity: requestedQuantity * (product.defaultQuantity ?? 1),
        unitPrice: product.defaultUnitPrice,
        unitWeight: product.defaultUnitWeight,
      })),
    });
  }

  if (selectedSuppliers.length) {
    await prisma.orderSupplier.createMany({
      data: selectedSuppliers.map((supplierId) => ({
        orderId: order.id,
        supplierId,
        role: "Participante do pedido",
      })),
      skipDuplicates: true,
    });
  }

  const workflowSupplierIds = workflow.phases
    .filter((phase) => phase.requiresSupplier && phase.responsibleSupplierId)
    .map((phase) => phase.responsibleSupplierId as string);

  if (workflowSupplierIds.length) {
    await prisma.orderSupplier.createMany({
      data: [...new Set(workflowSupplierIds)].map((supplierId) => ({
        orderId: order.id,
        supplierId,
        role: "Responsável por fase do workflow",
      })),
      skipDuplicates: true,
    });
  }

  await prisma.orderPhaseExecution.createMany({
    data: workflow.phases.map((phase, index) => ({
      orderId: order.id,
      phaseId: phase.id,
      supplierId: phase.requiresSupplier ? phase.responsibleSupplierId : null,
      status: index === 0 ? PhaseExecutionStatus.IN_PROGRESS : PhaseExecutionStatus.PENDING,
      startedAt: index === 0 ? new Date() : null,
    })),
  });

  revalidateCrudPaths(
    "/orders",
    withSuccessMessage(getRedirectPath(formData, `/orders/${order.id}`), "Pedido cadastrado com sucesso."),
  );
}

export async function updateOrder(formData: FormData) {
  const id = asString(formData.get("id"));
  const requestedQuantity = asRequiredInt(formData.get("requestedQuantity"), "Quantidade de lembrancinhas");
  const shippingMethodId = asString(formData.get("shippingMethodId"));
  const shippingPrice = asDecimal(formData.get("shippingPrice")) ?? "0";
  const deliveryAddress = asOptionalString(formData.get("deliveryAddress"));
  const selectedProducts = formData
    .getAll("productId")
    .map((value) => value.toString())
    .filter(Boolean);
  const selectedSuppliers = formData
    .getAll("supplierId")
    .map((value) => value.toString())
    .filter(Boolean);

  if (!shippingMethodId) {
    throw new Error("Selecione o tipo de frete.");
  }

  if (!deliveryAddress) {
    throw new Error("Informe o endereço de entrega.");
  }

  await (prisma.order as any).update({
    where: { id },
    data: {
      companyId: asString(formData.get("companyId")),
      customerId: asString(formData.get("customerId")),
      currentStatusId: asString(formData.get("currentStatusId")),
      createdById: asString(formData.get("createdById")),
      shippingMethodId,
      shippingPrice,
      requestedQuantity,
      deliveryAddress,
      title: asString(formData.get("title")),
      description: asOptionalString(formData.get("description")),
      requestedAt: new Date(asString(formData.get("requestedAt"))),
      expectedAt: asOptionalString(formData.get("expectedAt"))
        ? new Date(asString(formData.get("expectedAt")))
        : null,
      notes: asOptionalString(formData.get("notes")),
    },
  });

  await prisma.orderItem.deleteMany({
    where: { orderId: id },
  });

  if (selectedProducts.length) {
    const products = (await prisma.orderTypeProduct.findMany({
      where: { id: { in: selectedProducts } },
    })) as unknown as Array<{
      id: string;
      defaultQuantity: number | null;
      defaultUnitPrice: string | null;
      defaultUnitWeight: string | null;
    }>;

    await prisma.orderItem.createMany({
      data: products.map((product) => ({
        orderId: id,
        productId: product.id,
        quantity: requestedQuantity * (product.defaultQuantity ?? 1),
        unitPrice: product.defaultUnitPrice,
        unitWeight: product.defaultUnitWeight,
      })),
    });
  }

  await prisma.orderSupplier.deleteMany({
    where: { orderId: id },
  });

  if (selectedSuppliers.length) {
    await prisma.orderSupplier.createMany({
      data: selectedSuppliers.map((supplierId) => ({
        orderId: id,
        supplierId,
        role: "Participante do pedido",
      })),
    });
  }

  revalidateCrudPaths(
    "/orders",
    withSuccessMessage(getRedirectPath(formData, `/orders/${id}/edit`), "Pedido atualizado com sucesso."),
  );
}

export async function toggleOrderActive(formData: FormData) {
  const id = asString(formData.get("id"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  await prisma.order.update({
    where: { id },
    data: { active: nextValue },
  });

  revalidateCrudPaths(
    "/orders",
    withSuccessMessage(
      getRedirectPath(formData, "/orders"),
      nextValue ? "Pedido ativado com sucesso." : "Pedido inativado com sucesso.",
    ),
  );
}

export async function advanceOrderPhase(formData: FormData) {
  const user = await requireCurrentUser();
  const orderId = asString(formData.get("orderId"));
  const phaseId = asString(formData.get("phaseId"));
  const executionId = asString(formData.get("executionId"));
  const supplierId = asOptionalString(formData.get("supplierId"));
  const executedByUserId = asOptionalString(formData.get("executedByUserId"));
  const comment = asOptionalString(formData.get("comment"));
  const file = formData.get("file");

  const execution = await prisma.orderPhaseExecution.findUnique({
    where: { id: executionId },
    include: {
      phase: true,
      order: {
        include: {
          workflow: {
            include: {
              phases: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!execution || execution.orderId !== orderId || execution.phaseId !== phaseId) {
    throw new Error("Execução de fase não encontrada.");
  }

  if (!canInteractWithExecution(user, execution)) {
    throw new Error("Você não tem permissão para interagir com esta fase.");
  }

  const nextSupplierId = execution.phase.requiresSupplier
    ? execution.phase.responsibleSupplierId
    : supplierId;

  await prisma.orderPhaseExecution.update({
    where: { id: executionId },
    data: {
      supplierId: nextSupplierId,
      executedByUserId: isAdminUser(user) ? executedByUserId : user.id,
      comment,
      status: PhaseExecutionStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  if (isUploadFile(file)) {
    await uploadAndAttachFile({
      file,
      entityType: "ORDER_PHASE_EXECUTION",
      entityId: executionId,
      uploadedById: user.id,
    });
  }

  if (execution.phase.changesOrderStatus && execution.phase.targetStatusId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { currentStatusId: execution.phase.targetStatusId },
    });
  }

  const nextPhase = execution.order.workflow.phases.find(
    (phase) => phase.order === execution.phase.order + 1,
  );

  if (nextPhase) {
    await prisma.orderPhaseExecution.updateMany({
      where: {
        orderId,
        phaseId: nextPhase.id,
        status: PhaseExecutionStatus.PENDING,
      },
      data: {
        status: PhaseExecutionStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=interaction`));
}

export async function updateOrderPhaseInteraction(formData: FormData) {
  const user = await requireCurrentUser();
  const orderId = asString(formData.get("orderId"));
  const executionId = asString(formData.get("executionId"));
  const file = formData.get("file");

  const execution = await prisma.orderPhaseExecution.findUnique({
    where: { id: executionId },
    include: {
      phase: true,
    },
  });

  if (!execution || execution.orderId !== orderId) {
    throw new Error("Interação não encontrada.");
  }

  if (!canInteractWithExecution(user, execution)) {
    throw new Error("Você não tem permissão para atualizar esta interação.");
  }

  await prisma.orderPhaseExecution.update({
    where: { id: executionId },
    data: {
      supplierId: execution.phase.requiresSupplier
        ? execution.phase.responsibleSupplierId
        : asOptionalString(formData.get("supplierId")),
      executedByUserId: isAdminUser(user) ? asOptionalString(formData.get("executedByUserId")) : user.id,
      comment: asOptionalString(formData.get("comment")),
    },
  });

  if (isUploadFile(file)) {
    await uploadAndAttachFile({
      file,
      entityType: "ORDER_PHASE_EXECUTION",
      entityId: executionId,
      uploadedById: user.id,
    });
  }

  revalidateCrudPaths(`/orders/${orderId}`, getRedirectPath(formData, `/orders/${orderId}?tab=interaction`));
}

export async function createInvoice(formData: FormData) {
  const user = await requireCurrentUser();
  const orderId = asString(formData.get("orderId"));
  const fileInput = formData.get("file");
  const file = isUploadFile(fileInput)
    ? ensureDocumentUpload(fileInput, "O arquivo da nota fiscal precisa ser um documento.")
    : null;

  await requireAccessibleOrder(orderId, user);

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      number: asString(formData.get("number")),
      series: asOptionalString(formData.get("series")),
      amount: asDecimal(formData.get("amount")) ?? "0",
      issuedAt: new Date(asString(formData.get("issuedAt"))),
      notes: asOptionalString(formData.get("notes")),
    },
  });

  if (isUploadFile(file)) {
    await uploadAndAttachFile({
      file,
      entityType: "INVOICE",
      entityId: invoice.id,
      uploadedById: user.id,
    });
  }

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=invoice`));
}

export async function uploadOrderAttachment(formData: FormData) {
  const user = await requireCurrentUser();
  const orderId = asString(formData.get("orderId"));
  const file = ensureImageUpload(formData.get("file"), "O arquivo do pedido precisa ser uma imagem.");

  await requireAccessibleOrder(orderId, user);

  await uploadAndAttachFile({
    file,
    entityType: "ORDER",
    entityId: orderId,
    uploadedById: user.id,
  });

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}`));
}

export async function createOrderPaymentPlan(formData: FormData) {
  const user = await requireCurrentUser();
  requireAdminUser(user);

  const orderId = asString(formData.get("orderId"));
  await requireAccessibleOrder(orderId, user);

  const totalAmount = Number(asDecimal(formData.get("totalAmount")) ?? "0");
  const requestedInstallments = asRequiredInt(formData.get("installmentsCount"), "Quantidade de parcelas");
  const installmentsCount = Math.max(1, requestedInstallments);
  const method = asString(formData.get("method")) as PaymentMethod;
  const firstDueAtValue = asString(formData.get("firstDueAt"));

  if (!firstDueAtValue) {
    throw new Error("Informe a data do primeiro vencimento.");
  }

  if (totalAmount <= 0) {
    throw new Error("Informe um valor total maior que zero.");
  }

  const firstDueAt = new Date(firstDueAtValue);
  const installmentMode =
    installmentsCount > 1 ? PaymentInstallmentMode.INSTALLMENT : PaymentInstallmentMode.SINGLE;
  const totalCents = Math.round(totalAmount * 100);
  const baseInstallmentCents = Math.floor(totalCents / installmentsCount);
  const remainder = totalCents - baseInstallmentCents * installmentsCount;

  const plan = await prisma.orderPaymentPlan.create({
    data: {
      orderId,
      createdById: user.id,
      method,
      installmentMode,
      installmentsCount,
      totalAmount: totalAmount.toFixed(2),
      notes: asOptionalString(formData.get("notes")),
    },
  });

  await prisma.orderPaymentInstallment.createMany({
    data: Array.from({ length: installmentsCount }, (_, index) => {
      const installmentCents = baseInstallmentCents + (index < remainder ? 1 : 0);

      return {
        planId: plan.id,
        number: index + 1,
        dueAt: addMonths(firstDueAt, index),
        amount: (installmentCents / 100).toFixed(2),
        status: OrderPaymentInstallmentStatus.OPEN,
      };
    }),
  });

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=financial`));
}

export async function markOrderPaymentInstallmentPaid(formData: FormData) {
  const user = await requireCurrentUser();
  requireAdminUser(user);

  const orderId = asString(formData.get("orderId"));
  const installmentId = asString(formData.get("installmentId"));
  await requireAccessibleOrder(orderId, user);

  const installment = await prisma.orderPaymentInstallment.findUnique({
    where: { id: installmentId },
    include: {
      plan: true,
    },
  });

  if (!installment || installment.plan.orderId !== orderId) {
    throw new Error("Parcela não encontrada.");
  }

  await prisma.orderPaymentInstallment.update({
    where: { id: installmentId },
    data: {
      paidAt: asOptionalString(formData.get("paidAt")) ? new Date(asString(formData.get("paidAt"))) : new Date(),
      notes: asOptionalString(formData.get("notes")) ?? installment.notes,
      status: OrderPaymentInstallmentStatus.PAID,
    },
  });

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=financial`));
}

export async function deleteOrderPaymentPlan(formData: FormData) {
  const user = await requireCurrentUser();
  requireAdminUser(user);

  const orderId = asString(formData.get("orderId"));
  const planId = asString(formData.get("planId"));
  await requireAccessibleOrder(orderId, user);

  const plan = await prisma.orderPaymentPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || plan.orderId !== orderId) {
    throw new Error("Plano financeiro não encontrado.");
  }

  await prisma.orderPaymentPlan.delete({
    where: { id: planId },
  });

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=financial`));
}

export async function reopenOrderPaymentInstallment(formData: FormData) {
  const user = await requireCurrentUser();
  requireAdminUser(user);

  const orderId = asString(formData.get("orderId"));
  const installmentId = asString(formData.get("installmentId"));
  await requireAccessibleOrder(orderId, user);

  const installment = await prisma.orderPaymentInstallment.findUnique({
    where: { id: installmentId },
    include: {
      plan: true,
    },
  });

  if (!installment || installment.plan.orderId !== orderId) {
    throw new Error("Parcela não encontrada.");
  }

  await prisma.orderPaymentInstallment.update({
    where: { id: installmentId },
    data: {
      paidAt: null,
      status: OrderPaymentInstallmentStatus.OPEN,
    },
  });

  revalidateCrudPaths("/orders", getRedirectPath(formData, `/orders/${orderId}?tab=financial`));
}
