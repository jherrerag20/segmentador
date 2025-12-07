import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    // 1) Sesión de docente
    const sess = getSessionFromRequest(req);
    if (!sess || !sess.uid || sess.rol !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "No autorizado (sesión inválida)." },
        { status: 401 }
      );
    }

    // 2) Obtener y validar groupId
    const { groupId } = await context.params;
    const groupIdNum = Number(groupId);

    if (!groupIdNum || Number.isNaN(groupIdNum)) {
      return NextResponse.json(
        { ok: false, error: "ID de grupo inválido." },
        { status: 400 }
      );
    }

    // 3) Verificar que el docente esté asignado al grupo
    const vinculo = await prisma.grupoDocente.findFirst({
      where: {
        grupo_id: groupIdNum,
        docente_id: sess.uid,
      },
    });

    if (!vinculo) {
      return NextResponse.json(
        { ok: false, error: "No estás asignado a este grupo." },
        { status: 403 }
      );
    }

    // 4) Info del grupo + alumnos inscritos
    const group = await prisma.grupo.findUnique({
      where: { id: groupIdNum },
      select: {
        id: true,
        nombre: true,       // nombre de la materia
        grupo: true,        // clave del grupo (7BM1, etc.)
        generacion: true,
        alumnos: {
          include: {
            alumno: {
              select: {
                id: true,
                perfilAlumno: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Grupo no encontrado." },
        { status: 404 }
      );
    }

    // 5) Perfiles de personalidad generados para este grupo
    const perfiles = await prisma.perfil.findMany({
      where: { grupo_id: groupIdNum },
      select: {
        nivel_extraversion: true,
        nivel_conscientiousness: true,
        nivel_agreeableness: true,
        respuesta: {
          select: {
            alumno_id: true,
          },
        },
      },
    });

    // Map alumno_id -> niveles
    const nivelesPorAlumno = new Map<
      string,
      {
        extraversion?: string | null;
        conscientiousness?: string | null;
        agreeableness?: string | null;
      }
    >();

    // Resumen por rasgo / nivel
    const summary = {
      extraversion: { low: 0, medium: 0, high: 0 },
      conscientiousness: { low: 0, medium: 0, high: 0 },
      agreeableness: { low: 0, medium: 0, high: 0 },
    };

    for (const p of perfiles) {
      const alumnoId = p.respuesta?.alumno_id;
      if (!alumnoId) continue;

      const current = nivelesPorAlumno.get(alumnoId) || {};

      if (p.nivel_extraversion) {
        current.extraversion = p.nivel_extraversion;
        if (
          summary.extraversion[
            p.nivel_extraversion as "low" | "medium" | "high"
          ] !== undefined
        ) {
          summary.extraversion[
            p.nivel_extraversion as "low" | "medium" | "high"
          ]++;
        }
      }

      if (p.nivel_conscientiousness) {
        current.conscientiousness = p.nivel_conscientiousness;
        if (
          summary.conscientiousness[
            p.nivel_conscientiousness as "low" | "medium" | "high"
          ] !== undefined
        ) {
          summary.conscientiousness[
            p.nivel_conscientiousness as "low" | "medium" | "high"
          ]++;
        }
      }

      if (p.nivel_agreeableness) {
        current.agreeableness = p.nivel_agreeableness;
        if (
          summary.agreeableness[
            p.nivel_agreeableness as "low" | "medium" | "high"
          ] !== undefined
        ) {
          summary.agreeableness[
            p.nivel_agreeableness as "low" | "medium" | "high"
          ]++;
        }
      }

      nivelesPorAlumno.set(alumnoId, current);
    }

    // 6) Armar DTO de alumnos
    const alumnos = group.alumnos.map((ins) => {
      const alumnoId = ins.alumno.id;
      const pa = ins.alumno.perfilAlumno;

      const nombreCompleto = pa
        ? `${pa.nombre} ${pa.apellido}`.trim()
        : "Sin perfil de alumno";

      const niveles = nivelesPorAlumno.get(alumnoId);

      return {
        alumnoId,
        nombreCompleto,
        haContestado: Boolean(niveles),
        extraversionLevel: niveles?.extraversion ?? null,
        conscientiousnessLevel: niveles?.conscientiousness ?? null,
        agreeablenessLevel: niveles?.agreeableness ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        nombre: group.nombre,
        grupo: group.grupo,
        generacion: group.generacion,
      },
      alumnos,
      summary,
    });
  } catch (err) {
    console.error("Error en /api/docente/grupos/[groupId]/alumnos:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}