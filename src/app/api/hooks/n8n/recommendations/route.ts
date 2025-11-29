import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SubmitSchema = z.object({
  alumnoEmail: z.string().email(),
  cuestionarioVersion: z.string().min(1),
  respuestas: z.any(),
  grupo: z
    .object({
      nombre: z.string(),
      generacion: z.string().optional().nullable(),
    })
    .optional(),
});

function nivel(score?: number | null) {
  if (score == null) return null;
  if (score < 0.33) return "low";
  if (score < 0.66) return "medium";
  return "high";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SubmitSchema.parse(body);

    const alumno = await prisma.usuario.findUnique({
      where: { email: data.alumnoEmail },
    });
    if (!alumno || alumno.rol !== "student") {
      return NextResponse.json(
        { error: "Alumno no encontrado" },
        { status: 404 }
      );
    }

    let cuestionario = await prisma.cuestionario.findFirst({
      where: { version: data.cuestionarioVersion },
    });
    if (!cuestionario) {
      cuestionario = await prisma.cuestionario.create({
        data: { version: data.cuestionarioVersion, activo: true },
      });
    }

    const respuesta = await prisma.respuesta.upsert({
      where: {
        cuestionario_id_alumno_id: {
          cuestionario_id: cuestionario.id,
          alumno_id: alumno.id,
        },
      },
      update: { respuestas_raw: data.respuestas },
      create: {
        cuestionario_id: cuestionario.id,
        alumno_id: alumno.id,
        respuestas_raw: data.respuestas,
      },
    });

    let inscripcion = await prisma.inscripcion.findFirst({
      where: { alumno_id: alumno.id },
    });

    if (!inscripcion && data.grupo?.nombre) {
      // Siempre usar un string para 'generacion' para que coincida con el tipo del índice único
      const generacion = data.grupo.generacion ?? "";

      const grupo = await prisma.grupo.upsert({
        where: {
          nombre_generacion: {
            nombre: data.grupo.nombre,
            generacion,
          },
        },
        update: {},
        create: {
          nombre: data.grupo.nombre,
          generacion,
        },
      });

      inscripcion = await prisma.inscripcion.create({
        data: { grupo_id: grupo.id, alumno_id: alumno.id },
      });
    }

    if (!inscripcion) {
      return NextResponse.json(
        { error: "El alumno no está inscrito en ningún grupo" },
        { status: 400 }
      );
    }

    // predictor
    const resp = await fetch(process.env.PREDICT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestas: data.respuestas }),
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Error al invocar predictor" },
        { status: 502 }
      );
    }

    const pred = (await resp.json()) as {
      extraversion: number;
      agreeableness: number;
      conscientiousness: number;
      emotional_stability: number;
      openness: number;
      model_version?: string;
    };

    const perfil = await prisma.perfil.create({
      data: {
        respuesta_id: respuesta.id,
        grupo_id: inscripcion.grupo_id,
        extraversion_score: pred.extraversion,
        agreeableness_score: pred.agreeableness,
        conscientiousness_score: pred.conscientiousness,
        emotional_stability_score: pred.emotional_stability,
        openness_score: pred.openness,
        nivel_extraversion: nivel(pred.extraversion),
        nivel_agreeableness: nivel(pred.agreeableness),
        nivel_conscientiousness: nivel(pred.conscientiousness),
        nivel_emotional_stability: nivel(pred.emotional_stability),
        nivel_openness: nivel(pred.openness),
        model_version: pred.model_version ?? "v1.0",
      },
    });

    const webhook = process.env.N8N_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: `perfil_${perfil.id}`,
          alumnoEmail: data.alumnoEmail,
          perfilId: perfil.id,
          grupoId: inscripcion.grupo_id,
          scores: pred,
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      respuestaId: respuesta.id,
      perfilId: perfil.id,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Error" },
      { status: 400 }
    );
  }
}