import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createStatus } from "@/app/actions";
import { StatusForm } from "@/components/admin-forms";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewStatusPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo status"
        description="Tela dedicada para cadastro de status."
        action={
          <Link className="ghost-button" href="/statuses">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Defina nome, cor e descrição do status.">
        <StatusForm action={createStatus} submitLabel="Salvar status" redirectPath="/statuses" />
      </FormCard>
    </div>
  );
}

