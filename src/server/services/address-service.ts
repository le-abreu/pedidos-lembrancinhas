export type ZipCodeAddress = {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidBrazilianZipCode(value: string) {
  return normalizeZipCode(value).length === 8;
}

export async function getAddressByZipCode(zipCode: string): Promise<ZipCodeAddress | null> {
  const normalizedZipCode = normalizeZipCode(zipCode);

  if (!isValidBrazilianZipCode(normalizedZipCode)) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24 * 30,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    return null;
  }

  return {
    zipCode: data.cep ?? normalizedZipCode,
    street: data.logradouro ?? "",
    complement: data.complemento ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
