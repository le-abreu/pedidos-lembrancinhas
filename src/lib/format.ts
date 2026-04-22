import { format } from "date-fns";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  return format(new Date(value), "dd/MM/yyyy");
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatWeight(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${Number(value).toFixed(3)} kg`;
}
