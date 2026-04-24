import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleWorkflowActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getWorkflowsList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function WorkflowsPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const orderTypeId = typeof searchParams?.orderTypeId === "string" ? searchParams.orderTypeId : "";
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination, orderTypes } = await getWorkflowsList({ page, search, active, orderTypeId });

  return (
    <div className="page-stack">
      <PageHeader
        title="Workflows"
        description="Pesquisa dos workflows e acesso à manutenção das fases."
        action={
          <Link className="primary-button" href="/workflows/new">
            Novo workflow
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Pesquisa" description="Filtre por tipo, situação e texto livre.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Nome ou descrição..." />
            </label>
            <label className="field">
              <span>Tipo de pedido</span>
              <select name="orderTypeId" defaultValue={orderTypeId}>
                <option value="">Todos</option>
                {orderTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
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
          { key: "nome", header: "Workflow", render: (item) => item.name },
          { key: "tipo", header: "Tipo", render: (item) => item.orderType.name },
          { key: "fases", header: "Fases", render: (item) => item._count.phases },
          { key: "pedidos", header: "Pedidos", render: (item) => item._count.orders },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/workflows/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleWorkflowActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/workflows" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={item.active ? "Confirma a inativação deste workflow?" : "Confirma a ativação deste workflow?"}
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum workflow encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/workflows"
        searchParams={{
          search,
          orderTypeId: orderTypeId || undefined,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
