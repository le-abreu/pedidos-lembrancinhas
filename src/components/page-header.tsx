type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">Gestão operacional</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

