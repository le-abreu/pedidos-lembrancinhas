import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateShippingMethod } from "@/app/actions";
import { ShippingMethodForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getShippingMethodFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditShippingMethodPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const item = await getShippingMethodFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Atualize os dados do tipo de frete."
        action={
          <Link className="ghost-button" href="/shipping-methods">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Altere nome e descrição da modalidade de frete.">
        <ShippingMethodForm
          action={updateShippingMethod}
          submitLabel="Salvar alterações"
          redirectPath={`/shipping-methods/${item.id}/edit`}
          item={item}
        />
      </FormCard>
    </div>
  );
}
