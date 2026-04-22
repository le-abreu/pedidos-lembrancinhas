import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const companies = await prisma.company.findMany({ orderBy: { tradeName: "asc" } });
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const body = await request.json();
  const company = await prisma.company.create({
    data: {
      legalName: body.legalName,
      tradeName: body.tradeName,
      cnpj: body.cnpj,
      email: body.email,
      phone: body.phone ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(company, { status: 201 });
}

