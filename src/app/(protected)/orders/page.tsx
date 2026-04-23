import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleOrderActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getOrderIndexData } from "@/server/services/order-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function read(value?: string | string[]) {
  return typeof value === "string" ? value : "";
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await requireAnyProfile([
    UserProfileType.ADMIN,
    UserProfileType.CLIENT,
    UserProfileType.EXECUTOR,
  ]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const filters = {
    page,
    search,
    active,
    companyId: read(searchParams?.companyId),
    customerId: read(searchParams?.customerId),
    orderTypeId: read(searchParams?.orderTypeId),
    statusId: read(searchParams?.statusId),
    supplierId: read(searchParams?.supplierId),
    responsibleUserId: read(searchParams?.responsibleUserId),
    requestedFrom: read(searchParams?.requestedFrom),
    requestedTo: read(searchParams?.requestedTo),
  };

  const { orders, pagination, filterOptions } = await getOrderIndexData(filters, user);
  const canManage = user.profiles.some((item) => item.profile === UserProfileType.ADMIN);
  const canCreate = user.profiles.some(
    (item) => item.profile === UserProfileType.ADMIN || item.profile === UserProfileType.CLIENT,
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Pedidos"
        description="Pesquisa paginada dos pedidos, com escopo por perfil."
        action={
          canCreate ? (
            <Link className="primary-button" href="/orders/new">
              Novo pedido
            </Link>
          ) : undefined
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <FormCard title="Pesquisa" description="Use filtros operacionais e de relacionamento.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Título ou descrição..." />
            </label>
            <label className="field">
              <span>Empresa</span>
              <select name="companyId" defaultValue={filters.companyId}>
                <option value="">Todas</option>
                {filterOptions.companies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.tradeName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cliente</span>
              <select name="customerId" defaultValue={filters.customerId}>
                <option value="">Todos</option>
                {filterOptions.customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tipo</span>
              <select name="orderTypeId" defaultValue={filters.orderTypeId}>
                <option value="">Todos</option>
                {filterOptions.orderTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select name="statusId" defaultValue={filters.statusId}>
                <option value="">Todos</option>
                {filterOptions.statuses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fornecedor</span>
              <select name="supplierId" defaultValue={filters.supplierId}>
                <option value="">Todos</option>
                {filterOptions.suppliers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Responsável</span>
              <select name="responsibleUserId" defaultValue={filters.responsibleUserId}>
                <option value="">Todos</option>
                {filterOptions.users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Data inicial</span>
              <input type="date" name="requestedFrom" defaultValue={filters.requestedFrom} />
            </label>
            <label className="field">
              <span>Data final</span>
              <input type="date" name="requestedTo" defaultValue={filters.requestedTo} />
            </label>
            <label className="field">
              <span>Situação</span>
              <select name="active" defaultValue={active === undefined ? "" : String(active)}>
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </label>
          </div>
          <button className="primary-button" type="submit">
            Pesquisar
          </button>
        </form>
      </FormCard>

      <DataTable
        columns={[
          {
            key: "titulo",
            header: "Pedido",
            render: (item) => (
              <Link href={`/orders/${item.id}`}>
                <div className="compact-stack">
                  <strong>{item.title}</strong>
                  {item._count.paymentPlans === 0 ? (
                    <span className="badge warning-badge">Sem financeiro</span>
                  ) : null}
                </div>
              </Link>
            ),
          },
          { key: "empresa", header: "Empresa", render: (item) => item.company.tradeName },
          { key: "cliente", header: "Cliente", render: (item) => item.customer.name },
          { key: "tipo", header: "Tipo", render: (item) => item.orderType.name },
          {
            key: "status",
            header: "Status",
            render: (item) => <span className="badge">{item.currentStatus.name}</span>,
          },
          { key: "data", header: "Solicitação", render: (item) => formatDate(item.requestedAt) },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/orders/${item.id}`}>
                  Abrir
                </Link>
                {canManage ? (
                  <>
                    <Link className="ghost-button" href={`/orders/${item.id}/edit`}>
                      Editar
                    </Link>
                    <form action={toggleOrderActive}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="nextValue" value={String(!item.active)} />
                      <input type="hidden" name="redirectPath" value="/orders" />
                      <ConfirmSubmitButton
                        label={item.active ? "Inativar" : "Ativar"}
                        message={item.active ? "Confirma a inativação deste pedido?" : "Confirma a ativação deste pedido?"}
                      />
                    </form>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        data={orders}
        emptyMessage="Nenhum pedido encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/orders"
        searchParams={{
          search,
          companyId: filters.companyId || undefined,
          customerId: filters.customerId || undefined,
          orderTypeId: filters.orderTypeId || undefined,
          statusId: filters.statusId || undefined,
          supplierId: filters.supplierId || undefined,
          responsibleUserId: filters.responsibleUserId || undefined,
          requestedFrom: filters.requestedFrom || undefined,
          requestedTo: filters.requestedTo || undefined,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
