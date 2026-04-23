import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireAnyProfile } from "@/lib/auth";
import { getDashboardSnapshot } from "@/server/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireAnyProfile([
    UserProfileType.ADMIN,
    UserProfileType.CLIENT,
    UserProfileType.EXECUTOR,
  ]);
  const { metrics, orderStatusBreakdown } = await getDashboardSnapshot(user);

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard inicial"
        description="Visão rápida da operação multiempresa, dos pedidos em andamento e do workflow."
        action={
          <div className="table-actions">
            <Link className="ghost-button" href="/financial">
              Ver financeiro
            </Link>
            <Link className="primary-button" href="/orders">
              Ver pedidos
            </Link>
          </div>
        }
      />

      <section className="cards-grid">
        <StatCard label="Empresas" value={metrics.companies} helper="Empresas cadastradas" />
        <StatCard label="Clientes" value={metrics.customers} helper="Clientes ativos na base" />
        <StatCard
          label="Pedidos ativos"
          value={metrics.activeOrders}
          helper={`${metrics.orders} pedidos no total`}
        />
        <StatCard
          label="Fases concluídas"
          value={metrics.completedPhases}
          helper={`${metrics.pendingPhases} ainda abertas`}
        />
      </section>

      <section className="card page-stack">
        <div className="section-heading">
          <h3>Pedidos por status</h3>
          <span className="badge">{orderStatusBreakdown.length}</span>
        </div>
        <div className="status-overview-list">
          {orderStatusBreakdown.length ? (
            orderStatusBreakdown.map((item) => (
              <div key={item.id} className="status-overview-item">
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted">{item.count} pedido(s)</p>
                </div>
                <span className="badge" style={{ borderColor: item.color }}>
                  {item.count}
                </span>
              </div>
            ))
          ) : (
            <span>Sem pedidos no escopo atual.</span>
          )}
        </div>
      </section>
    </div>
  );
}
