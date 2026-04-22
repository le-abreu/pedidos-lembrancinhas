import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleOrderTypeActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getOrderTypesList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function OrderTypesPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination } = await getOrderTypesList({ page, search, active });

  return (
    <div className="page-stack">
      <PageHeader
        title="Tipos de pedido"
        description="Pesquisa e manutenção dos tipos abstratos de pedido."
        action={
          <Link className="primary-button" href="/order-types/new">
            Novo tipo
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
          { key: "nome", header: "Tipo", render: (item) => item.name },
          { key: "descricao", header: "Descrição", render: (item) => item.description ?? "-" },
          { key: "produtos", header: "Produtos", render: (item) => item._count.products },
          {
            key: "workflow",
            header: "Workflow",
            render: (item) => item.workflow?.name ?? "Não configurado",
          },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/order-types/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleOrderTypeActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/order-types" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={
                      item.active
                        ? "Confirma a inativação deste tipo de pedido?"
                        : "Confirma a ativação deste tipo de pedido?"
                    }
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum tipo de pedido encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/order-types"
        searchParams={{ search, active: active === undefined ? undefined : String(active) }}
      />
    </div>
  );
}
