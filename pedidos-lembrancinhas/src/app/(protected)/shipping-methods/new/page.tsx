import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createShippingMethod } from "@/app/actions";
import { ShippingMethodForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewShippingMethodPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo tipo de frete"
        description="Tela dedicada para cadastro de tipos de frete."
        action={
          <Link className="ghost-button" href="/shipping-methods">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Defina o nome e a descrição da modalidade de frete.">
        <ShippingMethodForm
          action={createShippingMethod}
          submitLabel="Salvar tipo de frete"
          redirectPath="/shipping-methods"
        />
      </FormCard>
    </div>
  );
}
