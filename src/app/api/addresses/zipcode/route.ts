import { NextResponse } from "next/server";

import {
  getAddressByZipCode,
  isValidBrazilianZipCode,
  normalizeZipCode,
} from "@/server/services/address-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = normalizeZipCode(searchParams.get("cep") ?? searchParams.get("zipCode") ?? "");

  if (!isValidBrazilianZipCode(zipCode)) {
    return NextResponse.json(
      { message: "CEP inválido. Informe 8 dígitos." },
      { status: 400 },
    );
  }

  const address = await getAddressByZipCode(zipCode);

  if (!address) {
    return NextResponse.json({ message: "CEP não encontrado." }, { status: 404 });
  }

  return NextResponse.json(address);
}
