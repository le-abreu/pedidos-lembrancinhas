import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createOrderType } from "@/app/actions";
import { OrderTypeForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewOrderTypePage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo tipo de pedido"
        description="Tela dedicada para cadastro do tipo base."
        action={
          <Link className="ghost-button" href="/order-types">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Defina a categoria abstrata do pedido.">
        <OrderTypeForm action={createOrderType} submitLabel="Salvar tipo" redirectPath="/order-types" />
      </FormCard>
    </div>
  );
}

