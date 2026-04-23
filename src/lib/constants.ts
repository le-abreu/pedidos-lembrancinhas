import { UserProfileType } from "@prisma/client";

export const pageSize = 10;

export const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    allowedProfiles: [UserProfileType.ADMIN, UserProfileType.CLIENT, UserProfileType.EXECUTOR],
  },
  {
    href: "/companies",
    label: "Empresas",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/customers",
    label: "Clientes",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/suppliers",
    label: "Fornecedores",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/users",
    label: "Usuários",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/statuses",
    label: "Status",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/shipping-methods",
    label: "Tipos de frete",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/order-types",
    label: "Tipos de pedido",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/workflows",
    label: "Workflows",
    allowedProfiles: [UserProfileType.ADMIN],
  },
  {
    href: "/orders",
    label: "Pedidos",
    allowedProfiles: [UserProfileType.ADMIN, UserProfileType.CLIENT, UserProfileType.EXECUTOR],
  },
  {
    href: "/financial",
    label: "Financeiro",
    allowedProfiles: [UserProfileType.ADMIN, UserProfileType.CLIENT, UserProfileType.EXECUTOR],
  },
];

export const orderTabs = [
  { key: "overview", label: "Dados do pedido" },
  { key: "financial", label: "Financeiro" },
  { key: "workflow", label: "Workflow" },
  { key: "interaction", label: "Interações" },
  { key: "invoice", label: "Notas fiscais" },
] as const;
