import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireAnyProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getDashboardSnapshot } from "@/server/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireAnyProfile([
    UserProfileType.ADMIN,
    UserProfileType.CLIENT,
    UserProfileType.EXECUTOR,
  ]);
  const { metrics, recentOrders } = await getDashboardSnapshot(user);

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard inicial"
        description="Visão rápida da operação multiempresa, dos pedidos em andamento e do workflow."
        action={
          <Link className="primary-button" href="/orders">
            Ver pedidos
          </Link>
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

      <DataTable
        columns={[
          { key: "titulo", header: "Pedido", render: (item) => item.title },
          { key: "empresa", header: "Empresa", render: (item) => item.company.tradeName },
          { key: "cliente", header: "Cliente", render: (item) => item.customer.name },
          {
            key: "status",
            header: "Status",
            render: (item) => (
              <span className="badge" style={{ borderColor: item.currentStatus.color }}>
                {item.currentStatus.name}
              </span>
            ),
          },
          { key: "data", header: "Solicitação", render: (item) => formatDate(item.requestedAt) },
        ]}
        data={recentOrders}
        emptyMessage="Nenhum pedido encontrado."
      />
    </div>
  );
}
