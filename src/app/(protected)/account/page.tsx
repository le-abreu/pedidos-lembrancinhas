import {
  updateCurrentUserAvatar,
  updateCurrentUserPassword,
  updateCurrentUserTheme,
} from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PageHeader } from "@/components/page-header";
import { getUserProfileTypes, requireCurrentUser } from "@/lib/auth";
import { normalizeThemePreference } from "@/lib/theme";
import { Camera, Moon, ShieldCheck, Sun } from "lucide-react";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";
  const themePreference = normalizeThemePreference(user.themePreference);
  const profileTypes = getUserProfileTypes(user);
  const profileSummary = profileTypes.length ? profileTypes.join(", ") : "Sem perfil";
  const currentThemeLabel = themePreference === "DARK" ? "Escuro" : "Claro";

  return (
    <div className="page-stack">
      <PageHeader
        title="Minha conta"
        description="Gerencie sua identidade, preferências e credenciais de acesso."
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      <div className="account-layout">
        <section className="account-profile-card">
          <div className="account-profile-main">
            <div className="account-profile-avatar">
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

            <div className="account-profile-copy">
              <p className="eyebrow">Usuário autenticado</p>
              <h3>{user.name}</h3>
              <p className="muted">{user.email}</p>
            </div>
          </div>

          <div className="account-profile-meta">
            <div className="detail-block">
              <span>Perfis</span>
              <strong>{profileSummary}</strong>
            </div>
            <div className="detail-block">
              <span>Tema atual</span>
              <strong>{currentThemeLabel}</strong>
            </div>
          </div>
        </section>

        <section className="account-settings-stack">
          <section className="card account-settings-card account-theme-card">
            <div className="account-card-heading">
              <div>
                <p className="eyebrow">Preferências</p>
                <h3>Tema do sistema</h3>
              </div>
            </div>

            <form action={updateCurrentUserTheme} className="account-theme-form">
              <input type="hidden" name="redirectPath" value="/account" />
              <div className="theme-segmented-control" role="radiogroup" aria-label="Tema do sistema">
                <label className="theme-segment">
                  <input
                    type="radio"
                    name="themePreference"
                    value="LIGHT"
                    defaultChecked={themePreference === "LIGHT"}
                  />
                  <span>
                    <Sun size={18} />
                    Claro
                  </span>
                </label>
                <label className="theme-segment">
                  <input
                    type="radio"
                    name="themePreference"
                    value="DARK"
                    defaultChecked={themePreference === "DARK"}
                  />
                  <span>
                    <Moon size={18} />
                    Escuro
                  </span>
                </label>
              </div>
              <button className="primary-button" type="submit">
                Salvar tema
              </button>
            </form>
          </section>

          <section className="card account-settings-card">
            <div className="account-card-heading">
              <div>
                <p className="eyebrow">Identidade</p>
                <h3>Foto do usuário</h3>
              </div>
              <Camera size={22} />
            </div>

            <form action={updateCurrentUserAvatar} className="account-upload-form">
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
              <label className="field">
                <span>Nova foto</span>
                <input name="avatar" type="file" accept="image/*" required />
              </label>
              <button className="primary-button" type="submit">
                Salvar foto
              </button>
            </form>
          </section>

          <section className="card account-settings-card">
            <div className="account-card-heading">
              <div>
                <p className="eyebrow">Segurança</p>
                <h3>Troca de senha</h3>
              </div>
              <ShieldCheck size={22} />
            </div>

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
          </section>
        </section>
      </div>
    </div>
  );
}
