type FormCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <section className="card form-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p className="muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

