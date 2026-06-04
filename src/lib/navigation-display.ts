export type NavigationIconKey =
  | "dashboard"
  | "companies"
  | "customers"
  | "suppliers"
  | "users"
  | "statuses"
  | "shipping"
  | "order-types"
  | "workflows"
  | "orders"
  | "financial"
  | "default";

const ICON_BY_PATH = new Map<string, NavigationIconKey>([
  ["/", "dashboard"],
  ["/companies", "companies"],
  ["/customers", "customers"],
  ["/suppliers", "suppliers"],
  ["/users", "users"],
  ["/statuses", "statuses"],
  ["/shipping-methods", "shipping"],
  ["/order-types", "order-types"],
  ["/workflows", "workflows"],
  ["/orders", "orders"],
  ["/financial", "financial"],
]);

const ICON_BY_LABEL = new Map<string, NavigationIconKey>([
  ["dashboard", "dashboard"],
  ["empresas", "companies"],
  ["clientes", "customers"],
  ["fornecedores", "suppliers"],
  ["usuarios", "users"],
  ["usuários", "users"],
  ["status", "statuses"],
  ["tipos de frete", "shipping"],
  ["tipos de pedido", "order-types"],
  ["workflows", "workflows"],
  ["pedidos", "orders"],
  ["financeiro", "financial"],
]);

export function getNavigationIconKey(path: string, label: string): NavigationIconKey {
  return ICON_BY_PATH.get(path) ?? ICON_BY_LABEL.get(label.trim().toLowerCase()) ?? "default";
}
