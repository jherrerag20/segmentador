import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SubmitSchema = z.object({
  alumnoEmail: z.string().email(),
  cuestionarioVersion: z.string().min(1),
  respuestas: z.any(),
  // Se mantiene 'grupo' para compatibilidad con el JSON de entrada,
  // pero ya no se usa para crear nada en BD.
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

    // 1) Buscar alumno por email
    const alumno = await prisma.usuario.findUnique({
      where: { email: data.alumnoEmail },
    });
    if (!alumno || alumno.rol !== "student") {
      return NextResponse.json(
        { error: "Alumno no encontrado" },
        { status: 404 }
      );
    }

    // 2) Cuestionario (version -> id)
    let cuestionario = await prisma.cuestionario.findFirst({
      where: { version: data.cuestionarioVersion },
    });
    if (!cuestionario) {
      cuestionario = await prisma.cuestionario.create({
        data: { version: data.cuestionarioVersion, activo: true },
      });
    }

    // 3) Guardar / actualizar respuesta cruda
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

    // 4) Obtener la inscripción del alumno
    //    Ahora asumimos que el alumno SIEMPRE se inscribe a su primera materia
    //    desde el flujo de registro / panel, así que aquí sólo tomamos la primera.
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { alumno_id: alumno.id },
    });

    // Ya no creamos grupos ni inscripciones desde este webhook.
    // Si no hay inscripción, es un error de flujo (el alumno no se registró bien).
    if (!inscripcion) {
      return NextResponse.json(
        {
          error:
            "El alumno no está inscrito en ninguna materia. Asegúrate de que se haya registrado correctamente en al menos una materia antes de contestar el cuestionario.",
        },
        { status: 400 }
      );
    }

    // 5) Llamar al predictor de personalidad
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

    // 6) Crear el perfil asociado a esta respuesta y a la materia principal
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

    // 7) Disparar webhook a n8n (mismo contrato que ya usabas)
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