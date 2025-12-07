import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // 1) Validar sesión de alumno
    const sess = getSessionFromRequest(req);

    if (!sess || !sess.uid || sess.rol !== "student") {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Inicia sesión como alumno." },
        { status: 401 }
      );
    }

    // 2) Leer body
    const body = await req.json();
    const materiaIdRaw = body?.materiaId;

    const materiaId = Number(materiaIdRaw);
    if (!materiaId || Number.isNaN(materiaId) || materiaId <= 0) {
      return NextResponse.json(
        { ok: false, error: "ID de materia inválido." },
        { status: 400 }
      );
    }

    // 3) Verificar que la materia (grupo) exista
    const grupo = await prisma.grupo.findUnique({
      where: { id: materiaId },
      select: {
        id: true,
        nombre: true,
        grupo: true,
        generacion: true,
      },
    });

    if (!grupo) {
      return NextResponse.json(
        { ok: false, error: "La materia indicada no existe." },
        { status: 404 }
      );
    }

    // 4) Verificar que el alumno no esté ya inscrito en esa materia
    const yaInscrito = await prisma.inscripcion.findUnique({
      where: {
        grupo_id_alumno_id: {
          grupo_id: grupo.id,
          alumno_id: sess.uid,
        },
      },
    });

    if (yaInscrito) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ya estás inscrito en esta materia.",
        },
        { status: 400 }
      );
    }

    // 5) Crear la inscripción
    await prisma.inscripcion.create({
      data: {
        grupo_id: grupo.id,
        alumno_id: sess.uid,
      },
    });

    // 6) Si el alumno YA tiene un perfil en cualquier grupo,
    // clonar ese perfil y sus recomendaciones para esta nueva materia
    const perfilBase = await prisma.perfil.findFirst({
      where: {
        respuesta: {
          alumno_id: sess.uid,
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (perfilBase) {
      // 6.1 Crear nuevo perfil para este grupo
      const nuevoPerfil = await prisma.perfil.create({
        data: {
          respuesta_id: perfilBase.respuesta_id,
          grupo_id: grupo.id,
          extraversion_score: perfilBase.extraversion_score,
          agreeableness_score: perfilBase.agreeableness_score,
          conscientiousness_score: perfilBase.conscientiousness_score,
          emotional_stability_score: perfilBase.emotional_stability_score,
          openness_score: perfilBase.openness_score,
          nivel_extraversion: perfilBase.nivel_extraversion,
          nivel_agreeableness: perfilBase.nivel_agreeableness,
          nivel_conscientiousness: perfilBase.nivel_conscientiousness,
          nivel_emotional_stability: perfilBase.nivel_emotional_stability,
          nivel_openness: perfilBase.nivel_openness,
          model_version: perfilBase.model_version,
        },
      });

      // 6.2 Copiar recomendaciones del perfil base
      const recomendacionesBase = await prisma.recomendacion.findMany({
        where: { perfil_id: perfilBase.id },
      });

      if (recomendacionesBase.length > 0) {
        await prisma.recomendacion.createMany({
          data: recomendacionesBase.map((r) => ({
            perfil_id: nuevoPerfil.id,
            rasgo: r.rasgo,
            estrategia: r.estrategia,
            habilidad_blanda: r.habilidad_blanda,
            fuente: r.fuente,
            // created_at se genera con el default del modelo
          })),
        });
      }
    }

    // 7) Devolver DTO de la materia a la que se unió
    const materiaDto = {
      id: grupo.id,
      nombre: grupo.nombre,
      grupo: grupo.grupo,
      generacion: grupo.generacion,
    };

    return NextResponse.json(
      {
        ok: true,
        materia: materiaDto,
        message: perfilBase
          ? "Te has unido a la materia y se ha asociado tu perfil y recomendaciones existentes."
          : "Te has unido a la materia. Tu perfil y recomendaciones se generarán cuando contestes el cuestionario.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en /api/alumno/materias/join [POST]:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}