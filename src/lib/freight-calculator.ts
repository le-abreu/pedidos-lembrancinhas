export type FreightCalculationType =
  | "PICKUP"
  | "FIXED"
  | "DISTANCE"
  | "REGION"
  | "WEIGHT"
  | "EXTERNAL_API";

export type FreightAddress = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference?: string | null;
};

export type FreightMethod = {
  id: string;
  name: string;
  calculationType?: FreightCalculationType | string | null;
  fixedPrice?: { toString(): string } | string | number | null;
};

export type FreightCalculationInput = {
  shippingMethod: FreightMethod | null | undefined;
  address?: FreightAddress | null;
  subtotal?: number;
  weight?: number;
};

export type FreightCalculationResult = {
  amount: number;
  requiresAddress: boolean;
  calculationType: FreightCalculationType;
};

const extensionCalculationTypes = new Set<FreightCalculationType>([
  "DISTANCE",
  "REGION",
  "WEIGHT",
  "EXTERNAL_API",
]);

export function normalizeShippingMethodName(name: string | null | undefined) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getFreightCalculationType(
  shippingMethod: FreightMethod | null | undefined,
): FreightCalculationType {
  if (!shippingMethod) {
    return "FIXED";
  }

  if (normalizeShippingMethodName(shippingMethod.name) === "retirada") {
    return "PICKUP";
  }

  const calculationType = shippingMethod.calculationType as FreightCalculationType | null | undefined;
  return calculationType ?? "FIXED";
}

export function requiresFreightAddress(shippingMethod: FreightMethod | null | undefined) {
  return getFreightCalculationType(shippingMethod) !== "PICKUP";
}

export function hasMinimumFreightAddress(address: FreightAddress | null | undefined) {
  return Boolean(
    address?.zipCode?.trim() &&
      address?.street?.trim() &&
      address?.number?.trim() &&
      address?.neighborhood?.trim() &&
      address?.city?.trim() &&
      address?.state?.trim(),
  );
}

export function formatFreightAddress(address: FreightAddress | null | undefined) {
  const firstLine = [address?.street, address?.number]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
  const secondLine = [address?.complement, address?.neighborhood]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" - ");
  const cityLine = [address?.city, address?.state]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join("/");

  return [address?.zipCode, firstLine, secondLine, cityLine, address?.reference]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join("\n");
}

export function calculateFreight(input: FreightCalculationInput): FreightCalculationResult {
  const calculationType = getFreightCalculationType(input.shippingMethod);

  if (calculationType === "PICKUP") {
    return {
      amount: 0,
      requiresAddress: false,
      calculationType,
    };
  }

  const fixedPrice = Number(input.shippingMethod?.fixedPrice?.toString() ?? 0);

  return {
    amount: Number.isFinite(fixedPrice) ? fixedPrice : 0,
    requiresAddress: true,
    calculationType: extensionCalculationTypes.has(calculationType) ? calculationType : "FIXED",
  };
}

