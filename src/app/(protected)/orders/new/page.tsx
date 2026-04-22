import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createOrder } from "@/app/actions";
import { OrderForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getOrderFormData } from "@/server/services/order-service";

export default async function NewOrderPage() {
  const user = await requireAnyProfile([UserProfileType.ADMIN, UserProfileType.CLIENT]);
  const data = await getOrderFormData(undefined, user);

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
      <FormCard title="Cadastro" description="Preencha os dados principais e selecione itens e fornecedores.">
        <OrderForm action={createOrder} submitLabel="Criar pedido" redirectPath="/orders" {...data} />
      </FormCard>
    </div>
  );
}
