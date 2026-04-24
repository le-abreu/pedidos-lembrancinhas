import Link from "next/link";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams?: Record<string, string | undefined>;
};

function buildHref(
  pathname: string,
  searchParams: Record<string, string | undefined> | undefined,
  page: number,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set("page", String(page));

  return `${pathname}?${params.toString()}`;
}

export function PaginationControls({
  page,
  totalPages,
  pathname,
  searchParams,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <Link
        className={page <= 1 ? "ghost-button disabled-link" : "ghost-button"}
        href={buildHref(pathname, searchParams, Math.max(1, page - 1))}
      >
        Anterior
      </Link>
      <span className="badge">
        Página {page} de {totalPages}
      </span>
      <Link
        className={page >= totalPages ? "ghost-button disabled-link" : "ghost-button"}
        href={buildHref(pathname, searchParams, Math.min(totalPages, page + 1))}
      >
        Próxima
      </Link>
    </div>
  );
}

