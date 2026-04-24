import { pageSize } from "@/lib/constants";

export function parsePage(value?: string | string[]) {
  const raw = typeof value === "string" ? Number(value) : Number(value?.[0]);

  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }

  return Math.floor(raw);
}

export function parseSearch(value?: string | string[]) {
  const raw = typeof value === "string" ? value : value?.[0];
  return raw?.trim() ?? "";
}

export function parseActiveFilter(value?: string | string[]) {
  const raw = typeof value === "string" ? value : value?.[0];

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  return undefined;
}

export function getPagination(page: number, total: number, take = pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.min(page, totalPages);

  return {
    take,
    skip: (currentPage - 1) * take,
    currentPage,
    totalPages,
    total,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}
