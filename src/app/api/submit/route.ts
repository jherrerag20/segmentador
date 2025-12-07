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

    // 1) Buscar alumno
    const alumno = await prisma.usuario.findUnique({
      where: { email: data.alumnoEmail },
    });
    if (!alumno || alumno.rol !== "student") {
      return NextResponse.json(
        { error: "Alumno no encontrado" },
        { status: 404 }
      );
    }

    // 2) Buscar o crear cuestionario
    let cuestionario = await prisma.cuestionario.findFirst({
      where: { version: data.cuestionarioVersion },
    });
    if (!cuestionario) {
      cuestionario = await prisma.cuestionario.create({
        data: { version: data.cuestionarioVersion, activo: true },
      });
    }

    // 3) Guardar o actualizar respuestas
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

    // 4) Obtener inscripción existente del alumno
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { alumno_id: alumno.id },
    });

    if (!inscripcion) {
      return NextResponse.json(
        {
          error:
            "El alumno no está inscrito en ninguna materia. Asegúrate de que primero se registre y se inscriba en al menos una materia antes de contestar el cuestionario.",
        },
        { status: 400 }
      );
    }

    // 5) Invocar predictor
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
      emotional_stability?: number;
      openness?: number;
      model_version?: string;
    };

    // 6) Crear perfil
    const perfil = await prisma.perfil.create({
      data: {
        respuesta_id: respuesta.id,
        grupo_id: inscripcion.grupo_id,
        extraversion_score: pred.extraversion,
        agreeableness_score: pred.agreeableness,
        conscientiousness_score: pred.conscientiousness,
        emotional_stability_score: pred.emotional_stability ?? null,
        openness_score: pred.openness ?? null,
        nivel_extraversion: nivel(pred.extraversion),
        nivel_agreeableness: nivel(pred.agreeableness),
        nivel_conscientiousness: nivel(pred.conscientiousness),
        nivel_emotional_stability: nivel(pred.emotional_stability ?? null),
        nivel_openness: nivel(pred.openness ?? null),
        model_version: pred.model_version ?? "v1.0",
      },
    });

    // 7) Webhook a n8n (manteniendo 'scores' y añadiendo userId/traits/prompt)
    const webhook = process.env.N8N_WEBHOOK_URL;
    if (webhook) {
      const traits = {
        extraversion: (nivel(pred.extraversion) ?? "medium") as
          | "low"
          | "medium"
          | "high",
        agreeableness: (nivel(pred.agreeableness) ?? "medium") as
          | "low"
          | "medium"
          | "high",
        conscientiousness: (nivel(pred.conscientiousness) ?? "medium") as
          | "low"
          | "medium"
          | "high",
      };

      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // LO QUE YA TENÍAS:
            requestId: `perfil_${perfil.id}`,
            alumnoEmail: data.alumnoEmail,
            perfilId: perfil.id,
            grupoId: inscripcion.grupo_id,
            scores: pred,
            // LO QUE NECESITA EL PROMPT DE n8n:
            userId: String(alumno.id),
            traits,
            prompt: "",
          }),
        });
      } catch (err) {
        console.warn("n8n webhook failed (continuing):", err);
      }
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