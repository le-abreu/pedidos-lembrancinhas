type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === "1";

  return (
    <main className="login-page">
      <section className="login-layout">
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-brand-panel">
            <img className="login-logo" src="/magnum-logo.png" alt="Magnum Tires" />
            <div>
              <p className="eyebrow">Portal operacional</p>
              <h1 id="login-title">Acesso ao sistema</h1>
              <p className="muted">Entre com suas credenciais corporativas para continuar.</p>
            </div>
          </div>

          <form action="/api/auth/login" method="post" className="login-form">
            <label className="field">
              <span>E-mail</span>
              <input type="email" name="email" placeholder="seuemail@empresa.com" required />
            </label>

            <label className="field">
              <span>Senha</span>
              <input type="password" name="password" placeholder="Digite sua senha" required />
            </label>

            {hasError ? <p className="login-error">Credenciais inválidas. Verifique e tente novamente.</p> : null}

            <button className="primary-button" type="submit">
              Entrar
            </button>
          </form>

          <div className="login-support-line">
            <span>Acesso restrito</span>
            <span>Ambiente monitorado</span>
          </div>
        </section>
      </section>
    </main>
  );
}
