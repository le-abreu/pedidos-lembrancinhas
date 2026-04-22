import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createSupplier } from "@/app/actions";
import { SupplierForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewSupplierPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo parceiro"
        description="Cadastro dedicado de fornecedor ou executor."
        action={
          <Link className="ghost-button" href="/suppliers">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Defina o tipo de atuação do parceiro.">
        <SupplierForm action={createSupplier} submitLabel="Salvar parceiro" redirectPath="/suppliers" />
      </FormCard>
    </div>
  );
}

