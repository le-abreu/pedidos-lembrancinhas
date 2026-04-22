import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateUser } from "@/app/actions";
import { UserForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getUserFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditUserPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { item, companies, customers, suppliers } = await getUserFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Atualize perfis, vínculos e dados básicos."
        action={
          <Link className="ghost-button" href="/users">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Ajuste a estrutura de acesso do usuário.">
        <UserForm
          action={updateUser}
          submitLabel="Salvar alterações"
          redirectPath={`/users/${item.id}/edit`}
          item={item}
          companies={companies}
          customers={customers}
          suppliers={suppliers}
        />
      </FormCard>
    </div>
  );
}
