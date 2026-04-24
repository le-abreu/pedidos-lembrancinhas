import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleCustomerActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getCustomersList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CustomersPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const companyId = typeof searchParams?.companyId === "string" ? searchParams.companyId : "";
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination, companies } = await getCustomersList({ page, search, active, companyId });

  return (
    <div className="page-stack">
      <PageHeader
        title="Clientes"
        description="Pesquisa separada do cadastro, com paginação e filtros."
        action={
          <Link className="primary-button" href="/customers/new">
            Novo cliente
          </Link>
        }
      />

      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <FormCard title="Pesquisa" description="Filtre por empresa, situação e texto livre.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Nome, documento, e-mail..." />
            </label>
            <label className="field">
              <span>Empresa</span>
              <select name="companyId" defaultValue={companyId}>
                <option value="">Todas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.tradeName}
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
          { key: "nome", header: "Cliente", render: (item) => item.name },
          { key: "empresa", header: "Empresa", render: (item) => item.company.tradeName },
          { key: "email", header: "E-mail", render: (item) => item.email ?? "-" },
          { key: "pedidos", header: "Pedidos", render: (item) => item._count.orders },
          { key: "usuarios", header: "Usuários", render: (item) => item._count.users },
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
                <Link className="ghost-button" href={`/customers/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleCustomerActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/customers" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={item.active ? "Confirma a inativação deste cliente?" : "Confirma a ativação deste cliente?"}
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum cliente encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/customers"
        searchParams={{
          search,
          companyId: companyId || undefined,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
