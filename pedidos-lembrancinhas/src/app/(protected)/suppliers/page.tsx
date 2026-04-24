import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleSupplierActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getSuppliersList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SuppliersPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination } = await getSuppliersList({ page, search, active });

  return (
    <div className="page-stack">
      <PageHeader
        title="Fornecedores e executores"
        description="Pesquisa paginada dos parceiros operacionais."
        action={
          <Link className="primary-button" href="/suppliers/new">
            Novo parceiro
          </Link>
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <FormCard title="Pesquisa" description="Filtre por texto e situação.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Nome, documento, e-mail..." />
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
          { key: "nome", header: "Parceiro", render: (item) => item.name },
          { key: "tipo", header: "Tipo", render: (item) => item.type },
          { key: "pedidos", header: "Pedidos", render: (item) => item._count.orderSuppliers },
          { key: "fases", header: "Fases", render: (item) => item._count.phaseExecutions },
          {
            key: "status",
            header: "Status",
            render: (item) => <span className="badge">{item.active ? "Ativo" : "Inativo"}</span>,
          },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/suppliers/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleSupplierActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/suppliers" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={
                      item.active ? "Confirma a inativação deste fornecedor?" : "Confirma a ativação deste fornecedor?"
                    }
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum parceiro encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/suppliers"
        searchParams={{
          search,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
