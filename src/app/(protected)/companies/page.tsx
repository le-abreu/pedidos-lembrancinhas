import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleCompanyActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getCompaniesList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination } = await getCompaniesList({ page, search, active });

  return (
    <div className="page-stack">
      <PageHeader
        title="Empresas"
        description="Listagem paginada com filtros e operações administrativas."
        action={
          <Link className="primary-button" href="/companies/new">
            Nova empresa
          </Link>
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <FormCard title="Pesquisa" description="Filtre por texto e situação.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Razão social, fantasia, CNPJ..." />
            </label>
            <label className="field">
              <span>Situação</span>
              <select name="active" defaultValue={active === undefined ? "" : String(active)}>
                <option value="">Todas</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
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
          { key: "empresa", header: "Empresa", render: (item) => item.tradeName },
          { key: "razao", header: "Razão social", render: (item) => item.legalName },
          { key: "cnpj", header: "CNPJ", render: (item) => item.cnpj },
          { key: "clientes", header: "Clientes", render: (item) => item._count.customers },
          { key: "pedidos", header: "Pedidos", render: (item) => item._count.orders },
          {
            key: "ativo",
            header: "Status",
            render: (item) => <span className="badge">{item.active ? "Ativa" : "Inativa"}</span>,
          },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/companies/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleCompanyActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/companies" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={
                      item.active
                        ? "Confirma a inativação desta empresa?"
                        : "Confirma a ativação desta empresa?"
                    }
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhuma empresa encontrada."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/companies"
        searchParams={{
          search,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
