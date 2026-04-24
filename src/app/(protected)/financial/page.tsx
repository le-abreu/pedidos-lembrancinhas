import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { DataTable } from "@/components/data-table";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { PageTabs } from "@/components/page-tabs";
import { PaginationControls } from "@/components/pagination-controls";
import { requireAnyProfile } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { parsePage, parseSearch } from "@/lib/pagination";
import { getDashboardFinancialSnapshot, getFinancialIndexData } from "@/server/services/financial-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function read(value?: string | string[]) {
  return typeof value === "string" ? value : "";
}

function formatInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

const paymentMethodLabels = {
  PIX: "Pix",
  TRANSFER: "Transferência",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
} as const;

type FinancialPlanRow = {
  order: {
    id: string;
    title: string;
    company: { tradeName: string };
    customer: { name: string };
    currentStatus: { name: string };
  };
  method: keyof typeof paymentMethodLabels;
  installmentsCount: number;
  totalAmount: { toString(): string };
  installments: Array<{
    amount: { toString(): string } | string | number;
    dueAt: Date | string;
    status: "OPEN" | "PAID";
  }>;
};

type MissingFinancialOrderRow = {
  id: string;
  title: string;
  company: { tradeName: string };
  customer: { name: string };
  currentStatus: { name: string };
  createdAt: Date | string;
};

type OverduePaymentRow = {
  number: number;
  dueAt: Date | string;
  amount: { toString(): string } | string | number;
  plan: {
    order: {
      id: string;
      title: string;
      company: { tradeName: string };
      customer: { name: string };
      currentStatus: { name: string };
    };
  };
};

export default async function FinancialPage({ searchParams }: PageProps) {
  const user = await requireAnyProfile([UserProfileType.ADMIN]);

  const page = parsePage(searchParams?.page);
  const search = parseSearch(searchParams?.search);
  const currentTab = typeof searchParams?.tab === "string" ? searchParams.tab : "dashboard";
  const today = new Date();
  const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dashboardStartDate = read(searchParams?.startDate) || formatInputDate(defaultStartDate);
  const dashboardEndDate = read(searchParams?.endDate) || formatInputDate(defaultEndDate);
  const plansStartDate = read(searchParams?.plansStartDate) || formatInputDate(defaultStartDate);
  const plansEndDate = read(searchParams?.plansEndDate) || formatInputDate(defaultEndDate);
  const filters = {
    page,
    search,
    companyId: read(searchParams?.companyId),
    customerId: read(searchParams?.customerId),
    statusId: read(searchParams?.statusId),
    method: read(searchParams?.method),
    startDate: plansStartDate,
    endDate: plansEndDate,
  };

  const [
    { items, pagination, filters: filterOptions, summary, ordersWithoutPaymentCount, ordersWithoutPayment },
    financialDashboard,
  ] = await Promise.all([
    getFinancialIndexData(filters, user as any),
    getDashboardFinancialSnapshot(user as any, {
      startDate: dashboardStartDate,
      endDate: dashboardEndDate,
    }),
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Financeiro"
        description="Controle consolidado dos recebimentos planejados e realizados dos pedidos."
        action={
          <Link className="ghost-button" href="/orders">
            Ver pedidos
          </Link>
        }
      />

      <PageTabs
        pathname="/financial"
        currentTab={currentTab}
        tabs={[
          { key: "dashboard", label: "Dashboard" },
          { key: "plans", label: "Recebimentos" },
          { key: "missing", label: "Sem financeiro" },
        ]}
        searchParams={{
          search: search || undefined,
          companyId: filters.companyId || undefined,
          customerId: filters.customerId || undefined,
          statusId: filters.statusId || undefined,
          method: filters.method || undefined,
          startDate: dashboardStartDate || undefined,
          endDate: dashboardEndDate || undefined,
          plansStartDate: plansStartDate || undefined,
          plansEndDate: plansEndDate || undefined,
        }}
      />

      {currentTab === "dashboard" ? (
        <>
          <FormCard
            title="Período do dashboard"
            description="Os indicadores financeiros consideram o intervalo informado abaixo."
          >
            <form className="filters-grid">
              <input type="hidden" name="tab" value="dashboard" />
              <label className="field">
                <span>Data inicial</span>
                <input type="date" name="startDate" defaultValue={dashboardStartDate} />
              </label>
              <label className="field">
                <span>Data final</span>
                <input type="date" name="endDate" defaultValue={dashboardEndDate} />
              </label>
              <button className="primary-button" type="submit">
                Aplicar período
              </button>
            </form>
          </FormCard>

          <section className="financial-dashboard-stack">
            <div className="financial-dashboard-primary">
              <article className="card stat-card">
                <p className="eyebrow">Planejado</p>
                <strong>{formatCurrency(financialDashboard.financialSummary.planned)}</strong>
                <span className="muted">Recebimento planejado total</span>
              </article>
              <article className="card stat-card">
                <p className="eyebrow">Recebido</p>
                <strong>{formatCurrency(financialDashboard.financialSummary.received)}</strong>
                <span className="muted">Valores baixados manualmente</span>
              </article>
              <article className="card stat-card">
                <p className="eyebrow">Em aberto</p>
                <strong>{formatCurrency(financialDashboard.financialSummary.open)}</strong>
                <span className="muted">{financialDashboard.financialSummary.openInstallments} parcelas abertas</span>
              </article>
            </div>

            <div className="financial-dashboard-secondary">
              <article className="card stat-card">
                <p className="eyebrow">Atrasados</p>
                <strong>{financialDashboard.financialSummary.overdueInstallments}</strong>
                <span className="muted">Parcelas vencidas sem recebimento</span>
              </article>
              <article className="card stat-card">
                <p className="eyebrow">Sem financeiro</p>
                <strong>{financialDashboard.financialSummary.ordersWithoutPayment}</strong>
                <span className="muted">Pedidos sem plano de pagamento</span>
              </article>
            </div>
          </section>

          <div className="two-column">
            <section className="card page-stack">
              <div className="section-heading">
                <div>
                  <h3>Pagamentos atrasados</h3>
                  <p className="muted">Itens vencidos com maior urgência de cobrança.</p>
                </div>
                <span className="badge warning-badge">{financialDashboard.financialSummary.overdueInstallments}</span>
              </div>
              <DataTable<OverduePaymentRow>
                columns={[
                  {
                    key: "pedido",
                    header: "Pedido",
                    render: (item) => (
                      <Link href={`/orders/${item.plan.order.id}?tab=financial`}>
                        <strong>{item.plan.order.title}</strong>
                      </Link>
                    ),
                  },
                  { key: "cliente", header: "Cliente", render: (item) => item.plan.order.customer.name },
                  { key: "parcela", header: "Parcela", render: (item) => `Parcela ${item.number}` },
                  { key: "vencimento", header: "Vencimento", render: (item) => formatDate(item.dueAt) },
                  {
                    key: "valor",
                    header: "Valor",
                    render: (item) => formatCurrency(item.amount?.toString?.() ?? item.amount),
                  },
                ]}
                data={financialDashboard.financialSummary.overdueItems as OverduePaymentRow[]}
                emptyMessage="Nenhum pagamento atrasado no escopo atual."
              />
            </section>

            <section className="card page-stack">
              <div className="section-heading">
                <h3>Saúde financeira</h3>
                <span className="badge">Resumo</span>
              </div>
              <div className="details-grid">
                <div className="detail-block">
                  <strong>Total planejado</strong>
                  <span>{formatCurrency(financialDashboard.financialSummary.planned)}</span>
                </div>
                <div className="detail-block">
                  <strong>Total recebido</strong>
                  <span>{formatCurrency(financialDashboard.financialSummary.received)}</span>
                </div>
                <div className="detail-block">
                  <strong>Total em aberto</strong>
                  <span>{formatCurrency(financialDashboard.financialSummary.open)}</span>
                </div>
                <div className="detail-block">
                  <strong>Pedidos sem financeiro</strong>
                  <span>{financialDashboard.financialSummary.ordersWithoutPayment}</span>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <FormCard
          title={currentTab === "plans" ? "Pesquisa de recebimentos" : "Pesquisa de pedidos sem financeiro"}
          description="Filtre os registros por pedido, vínculo e forma."
        >
          <form className="search-form">
            <input type="hidden" name="tab" value={currentTab} />
            <div className="filters-grid three">
              <label className="field">
                <span>Busca</span>
                <input name="search" defaultValue={search} placeholder="Pedido, descrição..." />
              </label>
              <label className="field">
                <span>Empresa</span>
                <select name="companyId" defaultValue={filters.companyId}>
                  <option value="">Todas</option>
                  {filterOptions.companies.map((item: { id: string; tradeName: string }) => (
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
                  {filterOptions.customers.map((item: { id: string; name: string }) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status do pedido</span>
                <select name="statusId" defaultValue={filters.statusId}>
                  <option value="">Todos</option>
                  {filterOptions.statuses.map((item: { id: string; name: string }) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Forma de pagamento</span>
                <select name="method" defaultValue={filters.method}>
                  <option value="">Todas</option>
                  <option value="PIX">Pix</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="CREDIT_CARD">Cartão de crédito</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </label>
              {currentTab === "plans" ? (
                <>
                  <label className="field">
                    <span>Data inicial</span>
                    <input type="date" name="plansStartDate" defaultValue={plansStartDate} />
                  </label>
                  <label className="field">
                    <span>Data final</span>
                    <input type="date" name="plansEndDate" defaultValue={plansEndDate} />
                  </label>
                </>
              ) : null}
            </div>
            <button className="primary-button" type="submit">
              Pesquisar
            </button>
          </form>
        </FormCard>
      )}

      {currentTab === "plans" ? (
        <>
          <section className="card page-stack">
            <div className="section-heading">
              <div>
                <h3>Recebimentos pesquisados</h3>
                <p className="muted">Relação dos planos financeiros encontrados com o filtro atual.</p>
              </div>
              <span className="badge">{pagination.total}</span>
            </div>
            <DataTable<FinancialPlanRow>
              columns={[
                {
                  key: "pedido",
                  header: "Pedido",
                  render: (item) => (
                    <Link href={`/orders/${item.order.id}?tab=financial`}>
                      <strong>{item.order.title}</strong>
                    </Link>
                  ),
                },
                { key: "empresa", header: "Empresa", render: (item) => item.order.company.tradeName },
                { key: "cliente", header: "Cliente", render: (item) => item.order.customer.name },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => <span className="badge">{item.order.currentStatus.name}</span>,
                },
                { key: "forma", header: "Pagamento", render: (item) => paymentMethodLabels[item.method] },
                {
                  key: "parcelas",
                  header: "Parcelas",
                  render: (item) => `${item.installments.length}/${item.installmentsCount}`,
                },
                { key: "total", header: "Total", render: (item) => formatCurrency(item.totalAmount.toString()) },
                {
                  key: "recebido",
                  header: "Recebido",
                  render: (item) =>
                    formatCurrency(
                      item.installments
                        .reduce(
                          (sum: number, installment: any) =>
                            sum + (installment.status === "PAID" ? Number(installment.amount) : 0),
                          0,
                        )
                        .toFixed(2),
                    ),
                },
                {
                  key: "proximo",
                  header: "Próximo vencimento",
                  render: (item) => {
                    const nextInstallment = item.installments.find((installment: any) => installment.status === "OPEN");
                    return nextInstallment ? formatDate(nextInstallment.dueAt) : "Liquidado";
                  },
                },
              ]}
              data={items as FinancialPlanRow[]}
              emptyMessage="Nenhum registro financeiro encontrado."
            />
          </section>

          <PaginationControls
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            pathname="/financial"
            searchParams={{
              search: search || undefined,
              companyId: filters.companyId || undefined,
              customerId: filters.customerId || undefined,
              statusId: filters.statusId || undefined,
              method: filters.method || undefined,
              startDate: dashboardStartDate || undefined,
              endDate: dashboardEndDate || undefined,
              plansStartDate: plansStartDate || undefined,
              plansEndDate: plansEndDate || undefined,
              tab: currentTab,
            }}
          />
        </>
      ) : null}

      {currentTab === "missing" ? (
        <>
          <section className="card page-stack">
            <div className="section-heading">
              <div>
                <h3>Pedidos sem financeiro</h3>
                <p className="muted">Pedidos que ainda não possuem plano de pagamento cadastrado.</p>
              </div>
              <span className="badge warning-badge">{ordersWithoutPaymentCount}</span>
            </div>
            <DataTable<MissingFinancialOrderRow>
              columns={[
                {
                  key: "pedido",
                  header: "Pedido",
                  render: (item) => (
                    <Link href={`/orders/${item.id}?tab=financial`}>
                      <strong>{item.title}</strong>
                    </Link>
                  ),
                },
                { key: "empresa", header: "Empresa", render: (item) => item.company.tradeName },
                { key: "cliente", header: "Cliente", render: (item) => item.customer.name },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => <span className="badge">{item.currentStatus.name}</span>,
                },
                { key: "data", header: "Criado em", render: (item) => formatDate(item.createdAt) },
              ]}
              data={ordersWithoutPayment as MissingFinancialOrderRow[]}
              emptyMessage="Nenhum pedido sem financeiro no escopo atual."
            />
          </section>

          <PaginationControls
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            pathname="/financial"
            searchParams={{
              search: search || undefined,
              companyId: filters.companyId || undefined,
              customerId: filters.customerId || undefined,
              statusId: filters.statusId || undefined,
              method: filters.method || undefined,
              startDate: dashboardStartDate || undefined,
              endDate: dashboardEndDate || undefined,
              plansStartDate: plansStartDate || undefined,
              plansEndDate: plansEndDate || undefined,
              tab: currentTab,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
