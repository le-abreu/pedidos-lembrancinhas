import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createWorkflow } from "@/app/actions";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { WorkflowForm } from "@/components/admin-forms";
import { requireAnyProfile } from "@/lib/auth";

export default async function NewWorkflowPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo workflow"
        description="Tela dedicada para cadastro do workflow."
        action={
          <Link className="ghost-button" href="/workflows">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Cadastre um workflow reutilizável para os tipos de pedido.">
        <WorkflowForm
          action={createWorkflow}
          submitLabel="Salvar workflow"
          redirectPath="/workflows"
        />
      </FormCard>
    </div>
  );
}
