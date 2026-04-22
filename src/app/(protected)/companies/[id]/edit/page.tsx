import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateCompany } from "@/app/actions";
import { CompanyForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getCompanyFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditCompanyPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const item = await getCompanyFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.tradeName}`}
        description="Atualize os dados cadastrais da empresa."
        action={
          <Link className="ghost-button" href="/companies">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Altere os dados cadastrais.">
        <CompanyForm
          action={updateCompany}
          submitLabel="Salvar alterações"
          redirectPath={`/companies/${item.id}/edit`}
          item={item}
        />
      </FormCard>
    </div>
  );
}
