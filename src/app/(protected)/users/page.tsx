import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { toggleUserActive } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { parseActiveFilter, parsePage, parseSearch } from "@/lib/pagination";
import { getUsersList } from "@/server/services/admin-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const active = parseActiveFilter(searchParams?.active);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const companyId = typeof searchParams?.companyId === "string" ? searchParams.companyId : "";
  const profile =
    typeof searchParams?.profile === "string" ? (searchParams.profile as UserProfileType) : undefined;

  const { items, pagination, companies } = await getUsersList({
    page,
    search,
    active,
    companyId,
    profile,
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Usuários"
        description="Pesquisa, paginação e manutenção dos vínculos e perfis."
        action={
          <Link className="primary-button" href="/users/new">
            Novo usuário
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Pesquisa" description="Filtre por texto, empresa, perfil e situação.">
        <form className="search-form">
          <div className="filters-grid three">
            <label className="field">
              <span>Busca</span>
              <input name="search" defaultValue={search} placeholder="Nome ou e-mail..." />
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
              <span>Perfil</span>
              <select name="profile" defaultValue={profile ?? ""}>
                <option value="">Todos</option>
                {Object.values(UserProfileType).map((item) => (
                  <option key={item} value={item}>
                    {item}
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
          { key: "nome", header: "Usuário", render: (item) => item.name },
          { key: "email", header: "E-mail", render: (item) => item.email },
          {
            key: "perfis",
            header: "Perfis",
            render: (item) => item.profiles.map((profileItem) => profileItem.profile).join(", "),
          },
          { key: "empresa", header: "Empresa", render: (item) => item.company?.tradeName ?? "-" },
          {
            key: "vinculos",
            header: "Vínculos",
            render: (item) => item.customer?.name ?? item.supplier?.name ?? "-",
          },
          {
            key: "acoes",
            header: "Ações",
            render: (item) => (
              <div className="table-actions">
                <Link className="ghost-button" href={`/users/${item.id}/edit`}>
                  Editar
                </Link>
                <form action={toggleUserActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.active)} />
                  <input type="hidden" name="redirectPath" value="/users" />
                  <ConfirmSubmitButton
                    label={item.active ? "Inativar" : "Ativar"}
                    message={item.active ? "Confirma a inativação deste usuário?" : "Confirma a ativação deste usuário?"}
                  />
                </form>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="Nenhum usuário encontrado."
      />

      <PaginationControls
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        pathname="/users"
        searchParams={{
          search,
          companyId: companyId || undefined,
          profile,
          active: active === undefined ? undefined : String(active),
        }}
      />
    </div>
  );
}
