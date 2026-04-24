type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

const highlights = [
  "Painel centralizado para pedidos, status e acompanhamento de produção.",
  "Estrutura multiempresa para operar clientes, fornecedores e times no mesmo ambiente.",
  "Fluxos configuráveis para reduzir retrabalho e dar previsibilidade à operação.",
];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === "1";

  return (
    <main className="login-page">
      <section className="login-layout">
        <div className="login-showcase">
          <div className="login-showcase-copy">
            <p className="eyebrow">Gestão operacional</p>
            <h1>Controle pedidos, produção e entregas em uma interface mais clara.</h1>
            <p className="muted">
              Uma operação de lembrancinhas exige visão rápida do que entrou, do que está em andamento e do que
              precisa destravar.
            </p>
          </div>

          <div className="login-highlights">
            {highlights.map((highlight) => (
              <article key={highlight} className="login-highlight-card">
                <span className="login-highlight-marker" />
                <p>{highlight}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="card login-card">
          <div className="page-stack compact-stack">
            <p className="eyebrow">Acesso seguro</p>
            <h2>Entrar no sistema</h2>
            <p className="muted">Use suas credenciais para acessar os módulos liberados para o seu perfil.</p>
          </div>

          <form action="/api/auth/login" method="post" className="page-stack">
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
        </section>
      </section>
    </main>
  );
}
