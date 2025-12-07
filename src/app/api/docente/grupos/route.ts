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
            grupo: true,
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
      grupo: rel.grupo.grupo,
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

// Crear nueva materia/grupo y ligarla al docente actual
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
    const nombre = (body?.nombre ?? "").trim();      // materia
    const grupo = (body?.grupo ?? "").trim();        // clave grupo
    const generacion = (body?.generacion ?? "").trim();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, error: "El nombre de la materia es obligatorio." },
        { status: 400 }
      );
    }

    if (!grupo) {
      return NextResponse.json(
        { ok: false, error: "El grupo es obligatorio (por ejemplo, 7BM1)." },
        { status: 400 }
      );
    }

    if (!generacion) {
      return NextResponse.json(
        { ok: false, error: "La generación es obligatoria (por ejemplo, 2025-2)." },
        { status: 400 }
      );
    }

    const grupoDb = await prisma.grupo.create({
      data: {
        nombre,
        grupo,
        generacion,
      },
    });

    await prisma.grupoDocente.create({
      data: {
        docente_id: sess.uid,
        grupo_id: grupoDb.id,
      },
    });

    const groupDto = {
      id: grupoDb.id,
      nombre: grupoDb.nombre,
      grupo: grupoDb.grupo,
      generacion: grupoDb.generacion,
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