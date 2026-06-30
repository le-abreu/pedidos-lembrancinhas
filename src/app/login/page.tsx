type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === "1";

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <img className="login-logo" src="/magnum-logo.png" alt="Magnum Tires" width={220} height={44} />
        <div>
          <p className="eyebrow">Portal operacional</p>
          <h1 id="login-title">Acesso ao sistema</h1>
          <p>Entre com suas credenciais para gerenciar pedidos promocionais.</p>
        </div>

        <form action="/api/auth/login" method="post" className="form-stack">
          <label className="field">
            <span>E-mail</span>
            <input type="email" name="email" required />
          </label>

          <label className="field">
            <span>Senha</span>
            <input type="password" name="password" required />
          </label>

          {hasError ? <p className="login-error">Credenciais inválidas. Verifique e tente novamente.</p> : null}

          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
