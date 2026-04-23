import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import {
  createOrderTypeProduct,
  toggleOrderTypeProductActive,
  updateOrderType,
  updateOrderTypeProduct,
} from "@/app/actions";
import { OrderTypeForm, OrderTypeProductForm } from "@/components/admin-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { ModalForm } from "@/components/modal-form";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { formatCurrency, formatWeight } from "@/lib/format";
import { getOrderTypeFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditOrderTypePage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { item } = await getOrderTypeFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  const products = item.products as unknown as Array<{
    id: string;
    name: string;
    description: string | null;
    defaultQuantity: number | null;
    defaultUnitPrice: { toString(): string } | null;
    defaultUnitWeight: { toString(): string } | null;
    required: boolean;
    active: boolean;
    fileStoredFile?: {
      id: string;
      originalName: string;
    } | null;
  }>;
  const unitTemplateTotal = products.reduce(
    (sum, product) => sum + (product.defaultQuantity ?? 0) * Number(product.defaultUnitPrice?.toString() ?? 0),
    0,
  );
  const unitTemplateWeight = products.reduce(
    (sum, product) => sum + (product.defaultQuantity ?? 0) * Number(product.defaultUnitWeight?.toString() ?? 0),
    0,
  );

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Gerencie dados do tipo e os produtos configuráveis."
        action={
          <Link className="ghost-button" href="/order-types">
            Voltar para pesquisa
          </Link>
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Tipo de pedido" description="Dados principais do tipo.">
        <OrderTypeForm
          action={updateOrderType}
          submitLabel="Salvar alterações"
          redirectPath={`/order-types/${item.id}/edit`}
          item={item}
        />
      </FormCard>

      <section className="page-stack">
        <section className="card page-stack">
          <div className="section-heading">
            <div>
              <h3>Produtos do tipo de pedido</h3>
              <p className="muted">Cadastre novos produtos no pop-up e edite os existentes na tabela.</p>
            </div>
            <div className="table-actions">
              <span className="badge">{products.length} produtos</span>
              <ModalForm
                title="Novo produto do tipo"
                description="Adicione um novo produto configurável para este tipo de pedido."
                triggerLabel="Novo produto"
              >
                <OrderTypeProductForm
                  action={createOrderTypeProduct}
                  submitLabel="Adicionar produto"
                  redirectPath={`/order-types/${item.id}/edit`}
                  orderTypeId={item.id}
                />
              </ModalForm>
            </div>
          </div>

          <section className="details-grid">
            <div className="detail-block">
              <strong>Total do template</strong>
              <span>{formatCurrency(unitTemplateTotal)}</span>
            </div>
            <div className="detail-block">
              <strong>Peso do template</strong>
              <span>{formatWeight(unitTemplateWeight)}</span>
            </div>
          </section>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Descrição</th>
                  <th>Qtd por lembrancinha</th>
                  <th>Custo padrão</th>
                  <th>Total por produto</th>
                  <th>Peso padrão</th>
                  <th>Arquivo</th>
                  <th>Obrigatório</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.length ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.description ?? "-"}</td>
                      <td>{product.defaultQuantity ?? "-"}</td>
                      <td>{formatCurrency(product.defaultUnitPrice?.toString())}</td>
                      <td>
                        {formatCurrency(
                          (product.defaultQuantity ?? 0) * Number(product.defaultUnitPrice?.toString() ?? 0),
                        )}
                      </td>
                      <td>{product.defaultUnitWeight?.toString() ?? "-"} kg</td>
                      <td>
                        {product.fileStoredFile ? (
                          <a href={`/api/files/${product.fileStoredFile.id}`} target="_blank">
                            {product.fileStoredFile.originalName}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{product.required ? "Sim" : "Nao"}</td>
                      <td>
                        <span className="badge">{product.active ? "Ativo" : "Inativo"}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <ModalForm
                            title={`Editar produto ${product.name}`}
                            description="Atualize os dados do produto configuravel deste tipo de pedido."
                            triggerLabel="Editar"
                          >
                            <OrderTypeProductForm
                              action={updateOrderTypeProduct}
                              submitLabel="Salvar alteracoes"
                              redirectPath={`/order-types/${item.id}/edit`}
                              orderTypeId={item.id}
                              item={product}
                            />
                          </ModalForm>
                          <form action={toggleOrderTypeProductActive}>
                            <input type="hidden" name="id" value={product.id} />
                            <input type="hidden" name="nextValue" value={String(!product.active)} />
                            <input
                              type="hidden"
                              name="redirectPath"
                              value={`/order-types/${item.id}/edit`}
                            />
                            <ConfirmSubmitButton
                              label={product.active ? "Inativar" : "Ativar"}
                              message={
                                product.active
                                  ? "Confirma a inativacao deste produto do tipo?"
                                  : "Confirma a ativacao deste produto do tipo?"
                              }
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10}>Nenhum produto configurado para este tipo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
