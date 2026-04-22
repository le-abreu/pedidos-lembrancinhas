type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === "1";

  return (
    <main className="login-page">
      <section className="card login-card">
        <p className="eyebrow">Acesso à plataforma</p>
        <h1>Entrar no sistema</h1>
        <p className="muted">
          Login simples com base nos usuários do seed. Use `admin@lembrancinha.dev` com senha
          `123456`.
        </p>

        <form action="/api/auth/login" method="post" className="page-stack">
          <label className="field">
            <span>E-mail</span>
            <input type="email" name="email" placeholder="admin@lembrancinha.dev" required />
          </label>

          <label className="field">
            <span>Senha</span>
            <input type="password" name="password" placeholder="123456" required />
          </label>

          {hasError ? <p className="muted">Credenciais inválidas.</p> : null}

          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
