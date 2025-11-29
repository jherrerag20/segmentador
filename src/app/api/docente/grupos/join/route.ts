import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

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
    const groupId = Number(body?.groupId);

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json(
        { ok: false, error: "ID de grupo inválido." },
        { status: 400 }
      );
    }

    const grupo = await prisma.grupo.findUnique({
      where: { id: groupId },
      include: {
        alumnos: { select: { id: true } },
        perfiles: { select: { id: true } },
      },
    });

    if (!grupo) {
      return NextResponse.json(
        { ok: false, error: "El grupo no existe." },
        { status: 404 }
      );
    }

    // Si el docente ya está asociado, no duplicamos
    const existing = await prisma.grupoDocente.findFirst({
      where: {
        docente_id: sess.uid,
        grupo_id: grupo.id,
      },
    });

    if (!existing) {
      await prisma.grupoDocente.create({
        data: {
          docente_id: sess.uid,
          grupo_id: grupo.id,
        },
      });
    }

    const groupDto = {
      id: grupo.id,
      nombre: grupo.nombre,
      generacion: grupo.generacion,
      alumnosCount: grupo.alumnos.length,
      perfilesCount: grupo.perfiles.length,
    };

    return NextResponse.json({ ok: true, group: groupDto });
  } catch (err) {
    console.error("Error en /api/docente/grupos/join [POST]:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}