import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleStatusActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getStatusesList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StatusesPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination } = await getStatusesList({ page, search, active });

  return (
    <div className="page-stack">
      <PageHeader
        title="Status"
        description="Pesquisa e manutenção dos status de pedido."
        action={
          <Link className="primary-button" href="/statuses/new">
            Novo status
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Pesquisa" description="Filtre por nome, descrição e situação.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Nome ou descrição..." />
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
          { key: "nome", header: "Status", render: (item) => item.name },
          { key: "descricao", header: "Descrição", render: (item) => item.description ?? "-" },
          {
            key: "cor",
            header: "Cor",
            render: (item) => (
              <span className="badge">
                <span className="color-dot" style={{ background: item.color }} />
                {item.color}
              </span>
            ),
          },
          { key: "pedidos", header: "Pedidos", render: (item) => item._count.orders },
          { key: "fases", header: "Fases", render: (item) => item._count.workflows },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/statuses/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleStatusActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/statuses" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={item.active ? "Confirma a inativação deste status?" : "Confirma a ativação deste status?"}
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum status encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/statuses"
        searchParams={{ search, active: active === undefined ? undefined : String(active) }}
      />
    </div>
  );
}
