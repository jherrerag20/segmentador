import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const sess = getSessionFromRequest(req);

    if (!sess || !sess.uid || sess.rol !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const relaciones = await prisma.grupoDocente.findMany({
      where: { docente_id: sess.uid },
      include: {
        grupo: {
          select: {
            id: true,
            nombre: true,
            generacion: true,
            alumnos: { select: { id: true } },
            perfiles: { select: { id: true } },
          },
        },
      },
    });

    const groups = relaciones.map((rel) => ({
      id: rel.grupo.id,
      nombre: rel.grupo.nombre,
      generacion: rel.grupo.generacion,
      alumnosCount: rel.grupo.alumnos.length,
      perfilesCount: rel.grupo.perfiles.length,
    }));

    return NextResponse.json({ ok: true, groups });
  } catch (err) {
    console.error("Error en /api/docente/grupos [GET]:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Crear nuevo grupo y ligarlo al docente actual
export async function POST(req: NextRequest) {
  try {
    const sess = getSessionFromRequest(req);

    if (!sess || !sess.uid || sess.rol !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const nombre = (body?.nombre || "").trim();
    const generacion = (body?.generacion || null) as string | null;

    if (!nombre) {
      return NextResponse.json(
        { ok: false, error: "El nombre del grupo es obligatorio." },
        { status: 400 }
      );
    }

    const grupo = await prisma.grupo.create({
      data: {
        nombre,
        generacion,
      },
    });

    await prisma.grupoDocente.create({
      data: {
        docente_id: sess.uid,
        grupo_id: grupo.id,
      },
    });

    const groupDto = {
      id: grupo.id,
      nombre: grupo.nombre,
      generacion: grupo.generacion,
      alumnosCount: 0,
      perfilesCount: 0,
    };

    return NextResponse.json({ ok: true, group: groupDto }, { status: 201 });
  } catch (err) {
    console.error("Error en /api/docente/grupos [POST]:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}