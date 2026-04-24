import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleShippingMethodActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getShippingMethodsList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ShippingMethodsPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const { items, pagination } = await getShippingMethodsList({ page, search, active });
  type ShippingMethodRow = (typeof items)[number];

  return (
    <div className="page-stack">
      <PageHeader
        title="Tipos de frete"
        description="Pesquisa e manutenção das modalidades de frete disponíveis."
        action={
          <Link className="primary-button" href="/shipping-methods/new">
            Novo tipo de frete
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
          { key: "nome", header: "Tipo de frete", render: (item: ShippingMethodRow) => item.name },
          { key: "descricao", header: "Descrição", render: (item: ShippingMethodRow) => item.description ?? "-" },
          { key: "pedidos", header: "Pedidos", render: (item: ShippingMethodRow) => item._count.orders },
          {
            key: "acoes",
            header: "Ações",
            render: (item: ShippingMethodRow) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/shipping-methods/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleShippingMethodActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/shipping-methods" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={
                      item.active
                        ? "Confirma a inativação deste tipo de frete?"
                        : "Confirma a ativação deste tipo de frete?"
                    }
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum tipo de frete encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/shipping-methods"
        searchParams={{ search, active: active === undefined ? undefined : String(active) }}
      />
    </div>
  );
}
