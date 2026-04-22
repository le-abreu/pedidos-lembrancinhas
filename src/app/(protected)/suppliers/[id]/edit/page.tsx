import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateSupplier } from "@/app/actions";
import { SupplierForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getSupplierFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditSupplierPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const item = await getSupplierFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Atualize os dados do parceiro."
        action={
          <Link className="ghost-button" href="/suppliers">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Ajuste dados e tipo de atuação.">
        <SupplierForm
          action={updateSupplier}
          submitLabel="Salvar alterações"
          redirectPath={`/suppliers/${item.id}/edit`}
          item={item}
        />
      </FormCard>
    </div>
  );
}
