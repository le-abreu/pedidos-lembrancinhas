import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateStatus } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { StatusForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getStatusFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditStatusPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const item = await getStatusFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Atualize os dados do status."
        action={
          <Link className="ghost-button" href="/statuses">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Altere descrição e cor.">
        <StatusForm
          action={updateStatus}
          submitLabel="Salvar alterações"
          redirectPath={`/statuses/${item.id}/edit`}
          item={item}
        />
      </FormCard>
    </div>
  );
}
