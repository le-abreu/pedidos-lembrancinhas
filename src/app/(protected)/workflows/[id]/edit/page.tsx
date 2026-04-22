import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import {
  createWorkflowPhase,
  toggleWorkflowPhaseActive,
  updateWorkflow,
} from "@/app/actions";
import { updateWorkflowPhase } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { ModalForm } from "@/components/modal-form";
import { PageHeader } from "@/components/page-header";
import { WorkflowForm, WorkflowPhaseForm } from "@/components/admin-forms";
import { requireAnyProfile } from "@/lib/auth";
import { getWorkflowFormData } from "@/server/services/admin-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditWorkflowPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { item, statuses, orderTypes, suppliers } = await getWorkflowFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${item.name}`}
        description="Gerencie dados do workflow e a configuração das fases."
        action={
          <Link className="ghost-button" href="/workflows">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Workflow" description="Dados principais do workflow.">
        <WorkflowForm
          action={updateWorkflow}
          submitLabel="Salvar alterações"
          redirectPath={`/workflows/${item.id}/edit`}
          item={item}
          orderTypes={orderTypes}
        />
      </FormCard>
      <section className="page-stack">
        <section className="card page-stack">
          <div className="section-heading">
            <div>
              <h3>Fases do workflow</h3>
              <p className="muted">Cadastre novas fases no pop-up e edite as existentes na tabela.</p>
            </div>
            <div className="table-actions">
              <span className="badge">{item.phases.length} fases</span>
              <ModalForm
                title="Nova fase do workflow"
                description="Adicione uma nova fase configurável ao workflow."
                triggerLabel="Nova fase"
              >
                <WorkflowPhaseForm
                  action={createWorkflowPhase}
                  submitLabel="Adicionar fase"
                  redirectPath={`/workflows/${item.id}/edit`}
                  workflowId={item.id}
                  statuses={statuses}
                  suppliers={suppliers}
                />
              </ModalForm>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Fase</th>
                  <th>Descrição</th>
                  <th>Mensagem</th>
                  <th>Arquivo</th>
                  <th>Fornecedor</th>
                  <th>Status destino</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {item.phases.length ? (
                  item.phases.map((phase) => (
                    <tr key={phase.id}>
                      <td>{phase.order}</td>
                      <td>{phase.name}</td>
                      <td>{phase.description ?? "-"}</td>
                      <td>{phase.guidanceMessage ?? "-"}</td>
                      <td>
                        <div className="page-stack compact-stack">
                          <span>{phase.expectedFileType ?? "ANY"}</span>
                          <span className="muted">
                            {phase.allowsFileUpload ? "Permite upload" : "Sem upload"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="page-stack compact-stack">
                          <span>{phase.responsibleSupplier?.name ?? "Sem fornecedor fixo"}</span>
                          <span className="muted">
                            {phase.requiresSupplier ? "Fornecedor obrigatório" : "Sem restrição"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="page-stack compact-stack">
                          <span>{phase.targetStatus?.name ?? "Sem alteração"}</span>
                          <span className="muted">
                            {phase.changesOrderStatus ? "Altera status" : "Não altera status"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge">{phase.active ? "Ativa" : "Inativa"}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <ModalForm
                            title={`Editar fase ${phase.name}`}
                            description="Atualize os dados operacionais e regras desta fase do workflow."
                            triggerLabel="Editar"
                          >
                            <WorkflowPhaseForm
                              action={updateWorkflowPhase}
                              submitLabel="Salvar alteracoes"
                              redirectPath={`/workflows/${item.id}/edit`}
                              workflowId={item.id}
                              statuses={statuses}
                              suppliers={suppliers}
                              item={phase}
                            />
                          </ModalForm>
                          <form action={toggleWorkflowPhaseActive}>
                            <input type="hidden" name="id" value={phase.id} />
                            <input type="hidden" name="nextValue" value={String(!phase.active)} />
                            <input
                              type="hidden"
                              name="redirectPath"
                              value={`/workflows/${item.id}/edit`}
                            />
                            <ConfirmSubmitButton
                              label={phase.active ? "Inativar" : "Ativar"}
                              message={
                                phase.active
                                  ? "Confirma a inativacao desta fase do workflow?"
                                  : "Confirma a ativacao desta fase do workflow?"
                              }
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9}>Nenhuma fase configurada para este workflow.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
