import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ groupId: string; alumnoId: string }> }
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

    // 2) Params
    const { groupId, alumnoId } = await context.params;
    const groupIdNum = Number(groupId);

    if (!groupIdNum || Number.isNaN(groupIdNum) || !alumnoId) {
      return NextResponse.json(
        { ok: false, error: "Parámetros inválidos." },
        { status: 400 }
      );
    }

    // 3) Verificar que este docente esté asignado al grupo
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

    // 4) Datos del grupo
    const group = await prisma.grupo.findUnique({
      where: { id: groupIdNum },
      select: {
        id: true,
        nombre: true,
        generacion: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Grupo no encontrado." },
        { status: 404 }
      );
    }

    // 5) Datos del alumno
    const alumno = await prisma.usuario.findUnique({
      where: { id: alumnoId },
      select: {
        id: true,
        email: true,
        perfilAlumno: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!alumno) {
      return NextResponse.json(
        { ok: false, error: "Alumno no encontrado." },
        { status: 404 }
      );
    }

    // 6) Perfil más reciente del alumno en este grupo
    const perfil = await prisma.perfil.findFirst({
      where: {
        grupo_id: groupIdNum,
        respuesta: {
          alumno_id: alumnoId,
        },
      },
      orderBy: { created_at: "desc" },
      select: {
        extraversion_score: true,
        nivel_extraversion: true,
        conscientiousness_score: true,
        nivel_conscientiousness: true,
        agreeableness_score: true,
        nivel_agreeableness: true,
        emotional_stability_score: true,
        nivel_emotional_stability: true,
        openness_score: true,
        nivel_openness: true,
        model_version: true,
        created_at: true,
        respuesta: {
          select: {
            fecha_evaluacion: true,
            cuestionario: {
              select: {
                version: true,
              },
            },
          },
        },
        recomendaciones: {
          select: {
            id: true,
            rasgo: true,
            estrategia: true,
            habilidad_blanda: true,
            fuente: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    const nombreCompleto = alumno.perfilAlumno
      ? `${alumno.perfilAlumno.nombre} ${alumno.perfilAlumno.apellido}`.trim()
      : "Sin nombre registrado";

    return NextResponse.json({
      ok: true,
      grupo: {
        id: group.id,
        nombre: group.nombre,
        generacion: group.generacion,
      },
      alumno: {
        id: alumno.id,
        email: alumno.email,
        nombreCompleto,
      },
      perfil: perfil
        ? {
            extraversionScore: perfil.extraversion_score,
            nivelExtraversion: perfil.nivel_extraversion,
            conscientiousnessScore: perfil.conscientiousness_score,
            nivelConscientiousness: perfil.nivel_conscientiousness,
            agreeablenessScore: perfil.agreeableness_score,
            nivelAgreeableness: perfil.nivel_agreeableness,
            emotionalStabilityScore: perfil.emotional_stability_score,
            nivelEmotionalStability: perfil.nivel_emotional_stability,
            opennessScore: perfil.openness_score,
            nivelOpenness: perfil.nivel_openness,
            modelVersion: perfil.model_version,
            fechaEvaluacion:
              perfil.respuesta?.fecha_evaluacion?.toISOString() ?? null,
            cuestionarioVersion: perfil.respuesta?.cuestionario?.version ?? null,
          }
        : null,
      recomendaciones: perfil?.recomendaciones ?? [],
    });
  } catch (err) {
    console.error(
      "Error en /api/docente/grupos/[groupId]/alumnos/[alumnoId]:",
      err
    );
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}