import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createCustomer } from "@/app/actions";
import { CustomerForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getCustomerFormData } from "@/server/services/admin-service";

export default async function NewCustomerPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { companies } = await getCustomerFormData();

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo cliente"
        description="Cadastro separado da tela de pesquisa."
        action={
          <Link className="ghost-button" href="/customers">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Associe o cliente à empresa correta.">
        <CustomerForm
          action={createCustomer}
          submitLabel="Salvar cliente"
          redirectPath="/customers"
          companies={companies}
        />
      </FormCard>
    </div>
  );
}

