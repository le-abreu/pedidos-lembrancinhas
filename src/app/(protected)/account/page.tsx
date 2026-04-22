import { updateCurrentUserAvatar, updateCurrentUserPassword } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireCurrentUser } from "@/lib/auth";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  return (
    <div className="page-stack">
      <PageHeader
        title="Minha conta"
        description="Atualize a foto exibida no sistema e troque a sua senha."
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <div className="two-column">
        <FormCard title="Foto do usuário" description="A imagem será exibida na sessão do sistema.">
          <form action={updateCurrentUserAvatar} className="form-grid">
            <input type="hidden" name="redirectPath" value="/account" />
            <div className="account-avatar-preview">
              {user.avatarStoredFile?.id ? (
                <img
                  className="account-avatar-image"
                  src={`/api/files/${user.avatarStoredFile.id}`}
                  alt={user.name}
                />
              ) : (
                <div className="account-avatar-placeholder">{user.name.slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <label className="field order-form-wide">
              <span>Nova foto</span>
              <input name="avatar" type="file" accept="image/*" required />
            </label>
            <button className="primary-button" type="submit">
              Salvar foto
            </button>
          </form>
        </FormCard>

        <FormCard title="Troca de senha" description="Informe a senha atual e defina uma nova senha.">
          <form action={updateCurrentUserPassword} className="form-grid">
            <input type="hidden" name="redirectPath" value="/account" />
            <label className="field">
              <span>Senha atual</span>
              <input name="currentPassword" type="password" required />
            </label>
            <label className="field">
              <span>Nova senha</span>
              <input name="newPassword" type="password" minLength={6} required />
            </label>
            <label className="field order-form-wide">
              <span>Confirmar nova senha</span>
              <input name="confirmPassword" type="password" minLength={6} required />
            </label>
            <button className="primary-button" type="submit">
              Atualizar senha
            </button>
          </form>
        </FormCard>
      </div>
    </div>
  );
}
