import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateCustomer } from "@/app/actions";
import { CustomerForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getCustomerFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditCustomerPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { item, companies } = await getCustomerFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Atualize os dados cadastrais do cliente."
        action={
          <Link className="ghost-button" href="/customers">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Ajuste vínculo e contato.">
        <CustomerForm
          action={updateCustomer}
          submitLabel="Salvar alterações"
          redirectPath={`/customers/${item.id}/edit`}
          companies={companies}
          item={item}
        />
      </FormCard>
    </div>
  );
}
