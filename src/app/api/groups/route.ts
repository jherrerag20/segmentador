import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const grupos = await prisma.grupo.findMany({
    select: { id: true, nombre: true, generacion: true },
    orderBy: [{ generacion: "asc" }, { nombre: "asc" }],
  });
  return NextResponse.json({ grupos });
}