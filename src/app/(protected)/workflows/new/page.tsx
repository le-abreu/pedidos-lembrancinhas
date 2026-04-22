import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createWorkflow } from "@/app/actions";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { WorkflowForm } from "@/components/admin-forms";
import { requireAnyProfile } from "@/lib/auth";
import { getWorkflowFormData } from "@/server/services/admin-service";

export default async function NewWorkflowPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { orderTypes } = await getWorkflowFormData();

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
      <FormCard title="Cadastro" description="Associe o workflow ao tipo de pedido correto.">
        <WorkflowForm
          action={createWorkflow}
          submitLabel="Salvar workflow"
          redirectPath="/workflows"
          orderTypes={orderTypes}
        />
      </FormCard>
    </div>
  );
}

