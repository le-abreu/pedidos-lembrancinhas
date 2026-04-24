import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createOrder } from "@/app/actions";
import { FormCard } from "@/components/form-card";
import { OrderFormExperience } from "@/components/order-form-experience";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { hasProfile } from "@/lib/user-access";
import { getOrderFormData } from "@/server/services/order-service";

export default async function NewOrderPage() {
  const user = await requireAnyProfile([UserProfileType.ADMIN, UserProfileType.CLIENT]);
  const data = await getOrderFormData(undefined, user);
  const isAdmin = hasProfile(user, UserProfileType.ADMIN);
  const isClient = hasProfile(user, UserProfileType.CLIENT) && !hasProfile(user, UserProfileType.ADMIN);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo pedido"
        description="Tela dedicada para criação de pedido."
        action={
          <Link className="ghost-button" href="/orders">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard
        title="Jornada do pedido"
        description={
          isClient
            ? "Siga os passos do pedido. Seus clientes já aparecem conforme o vínculo da sua conta."
            : "Siga os passos da solicitação e monte o pedido com destino, itens e revisão final."
        }
      >
        <OrderFormExperience
          action={createOrder}
          submitLabel="Criar pedido"
          redirectPath="/orders"
          mode="create"
          isAdminView={isAdmin}
          isClientView={isClient}
          {...data}
        />
      </FormCard>
    </div>
  );
}
