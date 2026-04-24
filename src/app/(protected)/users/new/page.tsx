import Link from "next/link";
import { UserProfileType } from "@prisma/client";

import { createUser } from "@/app/actions";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/components/user-form";
import { requireAnyProfile } from "@/lib/auth";
import { getUserFormData } from "@/server/services/admin-service";

export default async function NewUserPage() {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const { companies, customers, suppliers } = await getUserFormData();

  return (
    <div className="page-stack">
      <PageHeader
        title="Novo usuário"
        description="Cadastro dedicado com perfis e vínculos."
        action={
          <Link className="ghost-button" href="/users">
            Voltar para pesquisa
          </Link>
        }
      />
      <FormCard title="Cadastro" description="Defina credenciais, perfis e vínculos.">
        <UserForm
          action={createUser}
          submitLabel="Salvar usuário"
          redirectPath="/users"
          companies={companies}
          customers={customers}
          suppliers={suppliers}
        />
      </FormCard>
    </div>
  );
}
