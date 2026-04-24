import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import {
  advanceOrderPhase,
  createOrderPaymentPlan,
  deleteOrderPaymentPlan,
  createInvoice,
  markOrderPaymentInstallmentPaid,
  reopenOrderPaymentInstallment,
  updateOrderPhaseInteraction,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { ModalForm } from "@/components/modal-form";
import { PageHeader } from "@/components/page-header";
import { PageTabs } from "@/components/page-tabs";
import { orderTabs } from "@/lib/constants";
import { requireAnyProfile } from "@/lib/auth";
import { formatCurrency, formatDate, formatWeight } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { canAccessSupplier } from "@/lib/user-access";
import {
  getOrderById,
  getWorkflowExecutionSummary,
} from "@/server/services/order-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAnyProfile([
    UserProfileType.ADMIN,
    UserProfileType.CLIENT,
    UserProfileType.EXECUTOR,
  ]);

  const currentTab =
    typeof searchParams?.tab === "string" ? searchParams.tab : "overview";
  const successMessage =
    typeof searchParams?.success === "string" ? searchParams.success : "";
  const [order, executionSummary, users, suppliers] = await Promise.all([
    getOrderById(params.id, user),
    getWorkflowExecutionSummary(params.id, user),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order || !executionSummary) {
    notFound();
  }

  const typedOrder = order as {
    id: string;
    title: string;
    active: boolean;
    requestedQuantity: number;
    shippingPrice: { toString(): string } | string | number | null;
    additionalChargeAmount: { toString(): string } | string | number | null;
    additionalChargeReason: string | null;
    deliveryAddress: string | null;
    description: string | null;
    notes: string | null;
    requestedAt: Date | string;
    expectedAt: Date | string | null;
    company: { tradeName: string };
    customer: { name: string };
    currentStatus: { name: string };
    shippingMethod: { name: string };
    createdBy: { name: string };
    orderType: {
      name: string;
      fileStoredFile?: {
        id: string;
        originalName: string;
        mimeType: string | null;
        byteSize: number;
      } | null;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: { toString(): string } | string | number | null;
      unitWeight: { toString(): string } | string | number | null;
      extraDescription: string | null;
      notes: string | null;
      product: {
        name: string;
        fileStoredFile?: {
          id: string;
          originalName: string;
          mimeType: string | null;
          byteSize: number;
        } | null;
      };
    }>;
    attachments: Array<{
      id: string;
      createdAt: Date | string;
      storedFile: {
        id: string;
        originalName: string;
        mimeType: string | null;
        byteSize: number;
        uploadedBy?: { name: string } | null;
      };
    }>;
    suppliers: Array<{
      id: string;
      role: string | null;
      supplier: { name: string };
      supplierId: string;
    }>;
    phaseExecutions: any[];
    invoices: any[];
    paymentPlans: Array<{
      id: string;
      method: "PIX" | "TRANSFER" | "CREDIT_CARD" | "BOLETO";
      installmentMode: "SINGLE" | "INSTALLMENT";
      installmentsCount: number;
      totalAmount: { toString(): string } | string | number;
      notes: string | null;
      createdAt: Date | string;
      createdBy: { name: string };
      installments: Array<{
        id: string;
        number: number;
        dueAt: Date | string;
        amount: { toString(): string } | string | number;
        paidAt: Date | string | null;
        notes: string | null;
        status: "OPEN" | "PAID";
      }>;
    }>;
    workflow: { name: string };
  };

  function renderAttachmentList(
    attachments: Array<{
      id: string;
      createdAt: Date | string;
      storedFile: {
        id: string;
        originalName: string;
        mimeType: string | null;
        byteSize: number;
        uploadedBy?: { name: string } | null;
      };
    }>,
    emptyMessage: string
  ) {
    if (!attachments.length) {
      return <span>{emptyMessage}</span>;
    }

    return (
      <div className="attachment-list">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            className="attachment-link"
            href={`/api/files/${attachment.storedFile.id}`}
            target="_blank"
          >
            <strong>{attachment.storedFile.originalName}</strong>
            <span className="muted">
              {attachment.storedFile.mimeType ?? "application/octet-stream"} |{" "}
              {attachment.storedFile.byteSize} bytes
            </span>
            <span className="muted">
              Enviado em {formatDate(attachment.createdAt)}
              {attachment.storedFile.uploadedBy?.name
                ? ` por ${attachment.storedFile.uploadedBy.name}`
                : ""}
            </span>
          </a>
        ))}
      </div>
    );
  }

  function renderStoredFileCard(
    file:
      | {
          id: string;
          originalName: string;
          mimeType: string | null;
          byteSize: number;
        }
      | null
      | undefined,
    emptyMessage: string
  ) {
    if (!file) {
      return <span>{emptyMessage}</span>;
    }

    return (
      <a
        className="attachment-link"
        href={`/api/files/${file.id}`}
        target="_blank"
      >
        <strong>{file.originalName}</strong>
        <span className="muted">
          {file.mimeType ?? "application/octet-stream"} | {file.byteSize} bytes
        </span>
      </a>
    );
  }

  function isImageFile(file: { mimeType: string | null }) {
    return Boolean(file.mimeType?.startsWith("image/"));
  }

  function renderImageGallery(
    images: Array<{
      id: string;
      originalName: string;
      mimeType: string | null;
    }>,
    emptyMessage: string
  ) {
    if (!images.length) {
      return <span>{emptyMessage}</span>;
    }

    return (
      <div className="image-gallery">
        {images.map((image) => (
          <a
            key={image.id}
            className="image-card"
            href={`/api/files/${image.id}`}
            target="_blank"
          >
            <img
              src={`/api/files/${image.id}`}
              alt={image.originalName}
              className="image-card-preview"
            />
            <span className="image-card-caption">{image.originalName}</span>
          </a>
        ))}
      </div>
    );
  }

  const isAdmin = user.profiles.some(
    (item: { profile: UserProfileType }) => item.profile === UserProfileType.ADMIN
  );
  const isExecutor = user.profiles.some(
    (item: { profile: UserProfileType }) => item.profile === UserProfileType.EXECUTOR
  );
  const canManage = isAdmin;
  const canViewFinancial = isAdmin;
  const canViewInvoice = isAdmin;
  const availableUsers = isAdmin
    ? users
    : users.filter((item) => item.id === user.id);
  const orderSuppliers = suppliers.filter((supplier) =>
    typedOrder.suppliers.some((item) => item.supplierId === supplier.id)
  );
  const orderItemsTotal = typedOrder.items.reduce(
    (sum: number, item) => sum + item.quantity * Number(item.unitPrice ?? 0),
    0
  );
  const shippingPrice = Number(typedOrder.shippingPrice ?? 0);
  const additionalChargeAmount = Number(typedOrder.additionalChargeAmount ?? 0);
  const orderWeightTotal = typedOrder.items.reduce(
    (sum: number, item) => sum + item.quantity * Number(item.unitWeight ?? 0),
    0
  );
  const orderFinalTotal = orderItemsTotal + shippingPrice + additionalChargeAmount;
  const orderPhotoFiles = typedOrder.attachments
    .map((attachment) => attachment.storedFile)
    .filter((file) => isImageFile(file));
  const totalPlanned = typedOrder.paymentPlans.reduce(
    (sum, plan) => sum + Number(plan.totalAmount ?? 0),
    0
  );
  const totalReceived = typedOrder.paymentPlans.reduce(
    (sum, plan) =>
      sum +
      plan.installments.reduce(
        (installmentSum, installment) =>
          installmentSum +
          (installment.status === "PAID" ? Number(installment.amount ?? 0) : 0),
        0
      ),
    0
  );
  const totalOpen = totalPlanned - totalReceived;
  const today = new Date();

  const visibleTabs = orderTabs.filter((tab) => {
    if (tab.key === "financial" || tab.key === "invoice") {
      return isAdmin;
    }

    if (tab.key === "interaction") {
      return isAdmin || isExecutor;
    }

    return true;
  });
  const safeCurrentTab = visibleTabs.some((tab) => tab.key === currentTab) ? currentTab : "overview";

  const paymentMethodLabels = {
    PIX: "Pix",
    TRANSFER: "Transferência",
    CREDIT_CARD: "Cartão de crédito",
    BOLETO: "Boleto",
  } as const;

  function canInteract(
    execution: NonNullable<typeof order>["phaseExecutions"][number]
  ) {
    if (isAdmin) {
      return true;
    }

    if (!isExecutor) {
      return false;
    }

    if (execution.phase.requiresSupplier) {
      return canAccessSupplier(user, execution.phase.responsibleSupplierId);
    }

    if (execution.supplierId) {
      return canAccessSupplier(user, execution.supplierId);
    }

    return true;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={typedOrder.title}
        description={`Pedido ${typedOrder.orderType.name} para ${typedOrder.customer.name}`}
        action={
          <div className="table-actions">
            <Link className="ghost-button" href="/orders">
              Voltar
            </Link>
            {user.profiles.some(
              (item: { profile: UserProfileType }) => item.profile === UserProfileType.ADMIN
            ) ? (
              <Link
                className="primary-button"
                href={`/orders/${typedOrder.id}/edit`}
              >
                Editar pedido
              </Link>
            ) : null}
          </div>
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <PageTabs
        pathname={`/orders/${typedOrder.id}`}
        currentTab={safeCurrentTab}
        tabs={[...visibleTabs]}
      />

      {safeCurrentTab === "overview" ? (
        <>
          <section className="details-grid">
            <div className="detail-block">
              <strong>Empresa</strong>
              <span>{typedOrder.company.tradeName}</span>
            </div>
            <div className="detail-block">
              <strong>Status atual</strong>
              <span>{typedOrder.currentStatus.name}</span>
            </div>
            <div className="detail-block">
              <strong>Solicitado em</strong>
              <span>{formatDate(typedOrder.requestedAt)}</span>
            </div>
            <div className="detail-block">
              <strong>Qtd de lembrancinhas</strong>
              <span>{typedOrder.requestedQuantity}</span>
            </div>
            <div className="detail-block">
              <strong>Previsão</strong>
              <span>{formatDate(typedOrder.expectedAt)}</span>
            </div>
            <div className="detail-block">
              <strong>Tipo de frete</strong>
              <span>{typedOrder.shippingMethod.name}</span>
            </div>
            <div className="detail-block">
              <strong>Valor do frete</strong>
              <span>{formatCurrency(shippingPrice)}</span>
            </div>
          </section>

          <div className="two-column">
            <section className="card page-stack">
              <div className="section-heading">
                <h3>Dados do pedido</h3>
                <span className="badge">
                  {typedOrder.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="detail-block">
                <strong>Descrição</strong>
                <span>{typedOrder.description ?? "Sem descrição."}</span>
              </div>
              <div className="detail-block">
                <strong>Observação</strong>
                <span>{typedOrder.notes ?? "Sem observações."}</span>
              </div>
              <div className="detail-block">
                <strong>Endereço de entrega</strong>
                <span>
                  {typedOrder.deliveryAddress ??
                    "Retirada sem endereço informado."}
                </span>
              </div>
              <div className="detail-block">
                <strong>Criado por</strong>
                <span>{typedOrder.createdBy.name}</span>
              </div>
            </section>

            <section className="card page-stack">
              <div className="section-heading">
                <h3>Itens do pedido</h3>
                <span className="badge">{typedOrder.items.length}</span>
              </div>
              <div className="detail-block">
                <strong>Totalizador dos itens</strong>
                <span>{formatCurrency(orderItemsTotal)}</span>
              </div>
              <div className="detail-block">
                <strong>Peso total do pedido</strong>
                <span>{formatWeight(orderWeightTotal)}</span>
              </div>
              <div className="detail-block">
                <strong>Frete</strong>
                <span>{formatCurrency(shippingPrice)}</span>
              </div>
              <div className="detail-block">
                <strong>Acréscimos</strong>
                <span>{formatCurrency(additionalChargeAmount)}</span>
              </div>
              <div className="detail-block">
                <strong>Total final do pedido</strong>
                <span>{formatCurrency(orderFinalTotal)}</span>
              </div>
              {typedOrder.additionalChargeReason ? (
                <div className="detail-block">
                  <strong>Motivo do acréscimo</strong>
                  <span>{typedOrder.additionalChargeReason}</span>
                </div>
              ) : null}
              {typedOrder.items.map((item) => {
                const productFile = item.product.fileStoredFile;
                const hasProductImage = productFile && isImageFile(productFile);

                return (
                  <div key={item.id} className="order-item-card">
                    {hasProductImage ? (
                      <a
                        className="order-item-image-link"
                        href={`/api/files/${productFile.id}`}
                        target="_blank"
                      >
                        <img
                          src={`/api/files/${productFile.id}`}
                          alt={item.product.name}
                          className="order-item-image"
                        />
                      </a>
                    ) : (
                      <div
                        className="order-item-image-placeholder"
                        aria-hidden="true"
                      >
                        <span className="order-item-image-placeholder-icon">
                          IMG
                        </span>
                        <strong>Imagem do produto</strong>
                        <span className="muted">Sem foto cadastrada</span>
                      </div>
                    )}

                    <div className="detail-block">
                      <strong>{item.product.name}</strong>
                      <span>
                        Quantidade: {item.quantity} | Valor unitário:{" "}
                        {formatCurrency(item.unitPrice?.toString())}
                      </span>
                      <span>
                        Peso unitário:{" "}
                        {formatWeight(item.unitWeight?.toString())}
                      </span>
                      <span>
                        {item.extraDescription ??
                          item.notes ??
                          "Sem observação."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          <section className="card page-stack">
            <div className="section-heading">
              <h3>Fornecedores vinculados</h3>
              <span className="badge">{typedOrder.suppliers.length}</span>
            </div>
            <div className="details-grid">
              {typedOrder.suppliers.map((item) => (
                <div key={item.id} className="detail-block">
                  <strong>{item.supplier.name}</strong>
                  <span>{item.role ?? "Sem papel definido"}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card page-stack">
            <div className="section-heading">
              <h3>Fotos do pedido</h3>
              <span className="badge">{orderPhotoFiles.length}</span>
            </div>
            {renderImageGallery(
              orderPhotoFiles,
              "Sem fotos vinculadas ao pedido."
            )}
          </section>
        </>
      ) : null}

      {safeCurrentTab === "financial" && canViewFinancial ? (
        <div className="page-stack">
          <section className="details-grid">
            <div className="detail-block">
              <strong>Total do pedido</strong>
              <span>{formatCurrency(orderFinalTotal)}</span>
            </div>
            <div className="detail-block">
              <strong>Total planejado</strong>
              <span>{formatCurrency(totalPlanned)}</span>
            </div>
            <div className="detail-block">
              <strong>Total recebido</strong>
              <span>{formatCurrency(totalReceived)}</span>
            </div>
            <div className="detail-block">
              <strong>Saldo em aberto</strong>
              <span>{formatCurrency(totalOpen)}</span>
            </div>
          </section>

          <section className="card page-stack">
            <div className="section-heading">
              <div>
                <h3>Controle financeiro</h3>
                <p className="muted">
                  Acompanhe os recebimentos deste pedido e faça baixas manuais.
                </p>
              </div>
              <span className="badge">
                {typedOrder.paymentPlans.length} plano(s)
              </span>
            </div>

            {isAdmin && typedOrder.paymentPlans.length === 0 ? (
              <div className="interaction-card allowed">
                <div className="interaction-header">
                  <div>
                    <strong>Pedido sem financeiro cadastrado</strong>
                    <p className="muted">
                      Crie o primeiro plano de recebimento para começar o
                      controle manual.
                    </p>
                  </div>
                  <ModalForm
                    title="Novo plano de recebimento"
                    description="Cadastre recebimento à vista ou parcelado e controle as baixas manualmente."
                    triggerLabel="Cadastrar financeiro"
                  >
                    <form action={createOrderPaymentPlan} className="form-grid">
                      <input
                        type="hidden"
                        name="orderId"
                        value={typedOrder.id}
                      />
                      <input
                        type="hidden"
                        name="redirectPath"
                        value={`/orders/${typedOrder.id}?tab=financial`}
                      />
                      <label className="field">
                        <span>Forma de pagamento</span>
                        <select name="method" defaultValue="PIX" required>
                          <option value="PIX">Pix</option>
                          <option value="TRANSFER">Transferência</option>
                          <option value="CREDIT_CARD">Cartão de crédito</option>
                          <option value="BOLETO">Boleto</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Valor total</span>
                        <input
                          name="totalAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          defaultValue={orderFinalTotal.toFixed(2)}
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Quantidade de parcelas</span>
                        <input
                          name="installmentsCount"
                          type="number"
                          min="1"
                          max="24"
                          defaultValue="1"
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Primeiro vencimento</span>
                        <input
                          type="date"
                          name="firstDueAt"
                          required
                          defaultValue={new Date().toISOString().slice(0, 10)}
                        />
                      </label>
                      <label className="field order-form-wide">
                        <span>Observações</span>
                        <textarea name="notes" rows={3} />
                      </label>
                      <button className="primary-button" type="submit">
                        Criar plano financeiro
                      </button>
                    </form>
                  </ModalForm>
                </div>
              </div>
            ) : null}

            {typedOrder.paymentPlans.length ? (
              <div className="finance-plan-list">
                {typedOrder.paymentPlans.map((plan) => {
                  const planReceived = plan.installments.reduce(
                    (sum, installment) =>
                      sum +
                      (installment.status === "PAID"
                        ? Number(installment.amount ?? 0)
                        : 0),
                    0
                  );
                  const planOpen = Number(plan.totalAmount ?? 0) - planReceived;

                  return (
                    <article key={plan.id} className="finance-plan-card">
                      <div className="interaction-header">
                        <div>
                          <strong>{paymentMethodLabels[plan.method]}</strong>
                          <p className="muted">
                            {plan.installmentMode === "INSTALLMENT"
                              ? `${plan.installmentsCount} parcelas`
                              : "Pagamento à vista"}{" "}
                            | Criado em {formatDate(plan.createdAt)} por{" "}
                            {plan.createdBy.name}
                          </p>
                        </div>
                        <div className="table-actions">
                          <span className="badge">
                            Total {formatCurrency(plan.totalAmount?.toString())}
                          </span>
                          <span className="badge">
                            Recebido {formatCurrency(planReceived)}
                          </span>
                          <span className="badge">
                            Aberto {formatCurrency(planOpen)}
                          </span>
                          {isAdmin ? (
                            <form action={deleteOrderPaymentPlan}>
                              <input type="hidden" name="orderId" value={typedOrder.id} />
                              <input type="hidden" name="planId" value={plan.id} />
                              <input
                                type="hidden"
                                name="redirectPath"
                                value={`/orders/${typedOrder.id}?tab=financial`}
                              />
                              <ConfirmSubmitButton
                                label="Remover plano"
                                className="ghost-button danger-button"
                                title="Remover plano financeiro"
                                confirmLabel="Remover"
                                message="Confirma a remoção deste plano financeiro? As parcelas vinculadas também serão excluídas."
                              />
                            </form>
                          ) : null}
                        </div>
                      </div>

                      {plan.notes ? (
                        <p className="muted">{plan.notes}</p>
                      ) : null}

                      <div className="finance-installment-list">
                        {plan.installments.map((installment) => {
                          const isOverdue =
                            installment.status === "OPEN" &&
                            new Date(installment.dueAt) < today;

                          return (
                            <div
                              key={installment.id}
                              className="finance-installment-card"
                            >
                              <div>
                                <strong>
                                  Parcela {installment.number} -{" "}
                                  {formatCurrency(
                                    installment.amount?.toString()
                                  )}
                                </strong>
                                <p className="muted">
                                  Vencimento: {formatDate(installment.dueAt)}
                                  {installment.paidAt
                                    ? ` | Pago em ${formatDate(
                                        installment.paidAt
                                      )}`
                                    : ""}
                                </p>
                                {installment.notes ? (
                                  <p className="muted">{installment.notes}</p>
                                ) : null}
                              </div>
                              <div className="table-actions">
                                <span
                                  className={`badge ${
                                    installment.status === "PAID"
                                      ? "finance-badge-paid"
                                      : isOverdue
                                      ? "finance-badge-overdue"
                                      : ""
                                  }`}
                                >
                                  {installment.status === "PAID"
                                    ? "Recebido"
                                    : isOverdue
                                    ? "Em atraso"
                                    : "Em aberto"}
                                </span>

                                {isAdmin && installment.status === "OPEN" ? (
                                  <ModalForm
                                    title={`Baixar parcela ${installment.number}`}
                                    description="Registre manualmente o recebimento desta parcela."
                                    triggerLabel="Baixar parcela"
                                  >
                                    <form
                                      action={markOrderPaymentInstallmentPaid}
                                      className="form-grid"
                                    >
                                      <input
                                        type="hidden"
                                        name="orderId"
                                        value={typedOrder.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="installmentId"
                                        value={installment.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="redirectPath"
                                        value={`/orders/${typedOrder.id}?tab=financial`}
                                      />
                                      <label className="field">
                                        <span>Data de recebimento</span>
                                        <input
                                          type="date"
                                          name="paidAt"
                                          defaultValue={new Date()
                                            .toISOString()
                                            .slice(0, 10)}
                                        />
                                      </label>
                                      <label className="field order-form-wide">
                                        <span>Observação</span>
                                        <textarea
                                          name="notes"
                                          rows={3}
                                          defaultValue={installment.notes ?? ""}
                                        />
                                      </label>
                                      <button
                                        className="primary-button"
                                        type="submit"
                                      >
                                        Confirmar recebimento
                                      </button>
                                    </form>
                                  </ModalForm>
                                ) : null}

                                {isAdmin && installment.status === "PAID" ? (
                                  <form action={reopenOrderPaymentInstallment}>
                                    <input
                                      type="hidden"
                                      name="orderId"
                                      value={typedOrder.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="installmentId"
                                      value={installment.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="redirectPath"
                                      value={`/orders/${typedOrder.id}?tab=financial`}
                                    />
                                    <button
                                      className="ghost-button"
                                      type="submit"
                                    >
                                      Reabrir parcela
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <span>
                Nenhum controle financeiro cadastrado para este pedido.
              </span>
            )}
          </section>
        </div>
      ) : null}

      {safeCurrentTab === "workflow" ? (
        <section className="card page-stack">
          <div className="section-heading">
            <h3>Workflow do pedido</h3>
            <span className="badge">{typedOrder.workflow.name}</span>
          </div>
          <div className="timeline">
            {executionSummary.executions.map(
              ({ phase, execution, isCurrent }) => (
                <div
                  key={phase.id}
                  className={`timeline-item ${
                    execution?.status === "COMPLETED"
                      ? "complete"
                      : execution?.status === "IN_PROGRESS" || isCurrent
                      ? "current"
                      : "pending"
                  }`}
                >
                  <div>
                    <strong>
                      {phase.order}. {phase.name}
                    </strong>
                    <p className="muted">
                      {phase.description ?? "Sem descrição."}
                    </p>
                    <p className="muted">
                      {phase.guidanceMessage ?? "Sem mensagem orientativa."}
                    </p>
                    <p className="muted">
                      Status da fase: {execution?.status ?? "PENDING"} | Status
                      de destino: {phase.targetStatus?.name ?? "Não altera"}
                    </p>
                    <p className="muted">
                      Regra de responsável:{" "}
                      {phase.requiresSupplier
                        ? `restrita ao fornecedor ${
                            phase.responsibleSupplier?.name ?? "não definido"
                          }`
                        : "sem fornecedor obrigatório"}
                    </p>
                  </div>
                  <div className="page-stack">
                    <span className="badge">
                      Fornecedor: {execution?.supplier?.name ?? "-"}
                    </span>
                    <span className="badge">
                      Executor: {execution?.executedByUser?.name ?? "-"}
                    </span>
                    <span className="badge">
                      {execution?.completedAt
                        ? `Concluída em ${formatDate(execution.completedAt)}`
                        : "Em aberto"}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      {safeCurrentTab === "interaction" ? (
        <section className="page-stack">
          <section className="card page-stack">
            <div className="section-heading">
              <div>
                <h3>Interações por fase</h3>
                <p className="muted">
                  Apenas o admin ou o executor vinculado ao fornecedor da fase
                  podem atuar.
                </p>
              </div>
              <span className="badge">{typedOrder.phaseExecutions.length}</span>
            </div>

            <div className="interaction-grid">
              {typedOrder.phaseExecutions.map((execution: any) => {
                const interactionAllowed = canInteract(execution);
                const canComplete =
                  interactionAllowed && execution.status !== "COMPLETED";

                return (
                  <article
                    key={execution.id}
                    className={`interaction-card ${
                      interactionAllowed ? "allowed" : "locked"
                    }`}
                  >
                    <div className="interaction-header">
                      <div>
                        <strong>
                          {execution.phase.order}. {execution.phase.name}
                        </strong>
                        <p className="muted">
                          {execution.phase.description ?? "Sem descrição."}
                        </p>
                      </div>
                      <span className="badge">{execution.status}</span>
                    </div>

                    <div className="interaction-meta">
                      <span className="badge">
                        Responsável:{" "}
                        {execution.phase.requiresSupplier
                          ? execution.phase.responsibleSupplier?.name ??
                            "Não definido"
                          : "Livre"}
                      </span>
                      <span className="badge">
                        Fornecedor da execução:{" "}
                        {execution.supplier?.name ?? "-"}
                      </span>
                      <span className="badge">
                        Executor: {execution.executedByUser?.name ?? "-"}
                      </span>
                    </div>

                    <div className="interaction-body">
                      <div className="detail-block">
                        <strong>Comentário</strong>
                        <span>{execution.comment ?? "Sem comentário."}</span>
                      </div>
                      <div className="detail-block">
                        <strong>Anexos</strong>
                        {renderAttachmentList(
                          execution.attachments ?? [],
                          "Sem arquivo vinculado."
                        )}
                      </div>
                    </div>

                    <div className="interaction-footer">
                      <span className="muted">
                        {interactionAllowed
                          ? "Interação liberada para o seu perfil."
                          : "Interação bloqueada para o seu vínculo atual."}
                      </span>
                      <div className="table-actions">
                        {interactionAllowed ? (
                          <ModalForm
                            title={`Editar interação da fase ${execution.phase.name}`}
                            description="Atualize os dados operacionais dessa fase."
                            triggerLabel="Editar interação"
                          >
                            <form
                              action={updateOrderPhaseInteraction}
                              className="form-grid"
                              encType="multipart/form-data"
                            >
                              <input
                                type="hidden"
                                name="orderId"
                                value={typedOrder.id}
                              />
                              <input
                                type="hidden"
                                name="executionId"
                                value={execution.id}
                              />
                              <input
                                type="hidden"
                                name="redirectPath"
                                value={`/orders/${typedOrder.id}?tab=interaction`}
                              />
                              {execution.phase.requiresSupplier ? (
                                <div className="detail-block">
                                  <strong>Fornecedor responsável</strong>
                                  <span>
                                    {execution.phase.responsibleSupplier
                                      ?.name ?? "Não definido"}
                                  </span>
                                </div>
                              ) : (
                                <label className="field">
                                  <span>Fornecedor</span>
                                  <select
                                    name="supplierId"
                                    defaultValue={execution.supplierId ?? ""}
                                  >
                                    <option value="">Sem fornecedor</option>
                                    {orderSuppliers.map((supplier) => (
                                      <option
                                        key={supplier.id}
                                        value={supplier.id}
                                      >
                                        {supplier.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                              {isAdmin ? (
                                <label className="field">
                                  <span>Executor</span>
                                  <select
                                    name="executedByUserId"
                                    defaultValue={
                                      execution.executedByUserId ?? ""
                                    }
                                  >
                                    <option value="">Sem usuário</option>
                                    {availableUsers.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}
                              <label className="field">
                                <span>Comentário</span>
                                <textarea
                                  name="comment"
                                  rows={4}
                                  defaultValue={execution.comment ?? ""}
                                />
                              </label>
                              <button className="primary-button" type="submit">
                                Salvar interação
                              </button>
                            </form>
                          </ModalForm>
                        ) : null}

                        {canComplete ? (
                          <ModalForm
                            title={`Concluir fase ${execution.phase.name}`}
                            description="Registre a conclusão da fase e avance o workflow."
                            triggerLabel="Concluir fase"
                          >
                            <form
                              action={advanceOrderPhase}
                              className="form-grid"
                              encType="multipart/form-data"
                            >
                              <input
                                type="hidden"
                                name="orderId"
                                value={typedOrder.id}
                              />
                              <input
                                type="hidden"
                                name="phaseId"
                                value={execution.phaseId}
                              />
                              <input
                                type="hidden"
                                name="executionId"
                                value={execution.id}
                              />
                              <input
                                type="hidden"
                                name="redirectPath"
                                value={`/orders/${typedOrder.id}?tab=interaction`}
                              />
                              {execution.phase.requiresSupplier ? (
                                <div className="detail-block">
                                  <strong>Fornecedor responsável</strong>
                                  <span>
                                    {execution.phase.responsibleSupplier
                                      ?.name ?? "Não definido"}
                                  </span>
                                </div>
                              ) : (
                                <label className="field">
                                  <span>Fornecedor</span>
                                  <select
                                    name="supplierId"
                                    defaultValue={execution.supplierId ?? ""}
                                  >
                                    <option value="">Sem fornecedor</option>
                                    {orderSuppliers.map((supplier) => (
                                      <option
                                        key={supplier.id}
                                        value={supplier.id}
                                      >
                                        {supplier.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                              {isAdmin ? (
                                <label className="field">
                                  <span>Executor</span>
                                  <select
                                    name="executedByUserId"
                                    defaultValue={
                                      execution.executedByUserId ?? ""
                                    }
                                  >
                                    <option value="">Sem usuário</option>
                                    {availableUsers.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}
                              <label className="field">
                                <span>Comentário</span>
                                <textarea
                                  name="comment"
                                  rows={4}
                                  defaultValue={execution.comment ?? ""}
                                />
                              </label>
                              <button className="primary-button" type="submit">
                                Confirmar conclusão
                              </button>
                            </form>
                          </ModalForm>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}

      {safeCurrentTab === "invoice" && canViewInvoice ? (
        <div className="page-stack">
          <section className="card page-stack">
            <div className="section-heading">
              <div>
                <h3>Notas fiscais</h3>
                <p className="muted">
                  Gerencie os documentos fiscais vinculados a este pedido.
                </p>
              </div>
              <div className="table-actions">
                <span className="badge">{typedOrder.invoices.length}</span>
                {canManage ? (
                  <ModalForm
                    title="Incluir nota fiscal"
                    description="Registre a NF em tela própria do pedido."
                    triggerLabel="Incluir nota fiscal"
                  >
                    <form
                      action={createInvoice}
                      className="form-grid"
                      encType="multipart/form-data"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={typedOrder.id}
                      />
                      <input
                        type="hidden"
                        name="redirectPath"
                        value={`/orders/${typedOrder.id}?tab=invoice`}
                      />
                      <label className="field">
                        <span>Número da nota</span>
                        <input name="number" required />
                      </label>
                      <label className="field">
                        <span>Série</span>
                        <input name="series" />
                      </label>
                      <label className="field">
                        <span>Valor</span>
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Data de emissão</span>
                        <input type="date" name="issuedAt" required />
                      </label>
                      <label className="field">
                        <span>Arquivo</span>
                        <input
                          type="file"
                          name="file"
                          accept=".pdf,.doc,.docx,.xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/xml,application/xml"
                        />
                      </label>
                      <label className="field">
                        <span>Observação</span>
                        <textarea name="notes" rows={3} />
                      </label>
                      <button className="primary-button" type="submit">
                        Registrar nota fiscal
                      </button>
                    </form>
                  </ModalForm>
                ) : null}
              </div>
            </div>
            {typedOrder.invoices.map((invoice: any) => (
              <div key={invoice.id} className="detail-block">
                <strong>
                  NF {invoice.number}{" "}
                  {invoice.series ? `- Série ${invoice.series}` : ""}
                </strong>
                <span>
                  Emissão: {formatDate(invoice.issuedAt)} | Valor:{" "}
                  {formatCurrency(invoice.amount.toString())}
                </span>
                {renderAttachmentList(
                  invoice.attachments ?? [],
                  "Sem arquivo vinculado à nota fiscal."
                )}
                <span>{invoice.notes ?? "Sem observação."}</span>
              </div>
            ))}
          </section>
        </div>
      ) : null}
    </div>
  );
}
