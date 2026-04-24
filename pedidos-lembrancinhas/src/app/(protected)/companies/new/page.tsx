import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createCompany } from "@/app/actions";
import { CompanyForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewCompanyPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Nova empresa"
        description="Tela dedicada para cadastro de empresa."
        action={
          <Link className="ghost-button" href="/companies">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Preencha os dados principais da empresa.">
        <CompanyForm action={createCompany} submitLabel="Salvar empresa" redirectPath="/companies" />
      </FormCard>
    </div>
  );
}

