// src/app/alumno/responder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PREDICTOR_URL = process.env.PREDICTOR_URL!;

const N8N_RECOMENDACIONES_URL = process.env.N8N_RECOMENDACIONES_URL;

// Deben estar en el mismo orden que el dataset (EXT1.., CSN1.., AGR1..)
const QUESTION_KEYS = [
  "Soy el alma de la fiesta",
  "No hablo mucho",
  "Me siento cómodo rodeado de muchas personas",
  "Prefiero mantenerme en segundo plano (intento no destacar)",
  "Inicio conversaciones",
  "Tengo poco que decir",
  "Le hablo a muchas personas en fiestas",
  "No me gusta llamar la atención",
  "No me molesta ser el centro de atención",
  "Soy callado cuando estoy con desconocidos",
  "Siempre estoy preparado",
  "Dejo mis pertenencias por todos lados",
  "Pongo atención a los detalles",
  "Desordeno las cosas",
  "Hago mis tareas de inmediato",
  "A menudo olvido regresar las cosas a su lugar",
  "Me gusta el orden",
  "Evito cumplir con mis deberes",
  "Sigo una agenda",
  "Soy exigente con mi trabajo",
  "Siento preocupación por los demás",
  "Me intereso por las personas",
  "Insulto a las personas",
  "Simpatizo con los sentimientos de los demás",
  "No me interesan los problemas de los demás",
  "Tengo un corazón sensible",
  "Realmente no me intereso por los demás",
  "Dedico tiempo a los demás",
  "Siento las emociones de los demás",
  "Hago que las personas se sientan cómodas",
];

// helper: convertir score numérico a enum de Prisma (por si el modelo no manda nivel)
function toLevel(score?: number | null): "low" | "medium" | "high" | null {
  if (score == null) return null;
  if (score < 20) return "low";
  if (score < 30) return "medium";
  return "high";
}

// helper: mapear 'BAJO' | 'MEDIO' | 'ALTO' (u otras variantes) → enum Prisma
function mapRawLevel(raw: any): "low" | "medium" | "high" | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();

  if (v.startsWith("baj")) return "low"; // "bajo", "BAJO"
  if (v.startsWith("med")) return "medium"; // "medio", "MEDIO"
  if (v.startsWith("alt")) return "high"; // "alto", "ALTO"

  return null;
}

// ---- Helper para llamar a n8n y guardar recomendaciones ----
async function generarRecomendacionesParaPerfil(params: {
  studentId: string;
  perfilId: number;
  grupoId: number;
  extraversionScore: number | null;
  extraversionLevel: "low" | "medium" | "high" | null;
  conscientiousnessScore: number | null;
  conscientiousnessLevel: "low" | "medium" | "high" | null;
  agreeablenessScore: number | null;
  agreeablenessLevel: "low" | "medium" | "high" | null;
}) {
  if (!N8N_RECOMENDACIONES_URL) {
    console.warn(
      "[recomendaciones] N8N_RECOMENDACIONES_URL no está configurado. Se omiten recomendaciones."
    );
    return;
  }

  try {
    const payload = {
      studentId: params.studentId,
      perfilId: params.perfilId,
      grupoId: params.grupoId,
      traits: {
        extraversion: {
          score: params.extraversionScore,
          level: params.extraversionLevel,
        },
        conscientiousness: {
          score: params.conscientiousnessScore,
          level: params.conscientiousnessLevel,
        },
        agreeableness: {
          score: params.agreeablenessScore,
          level: params.agreeablenessLevel,
        },
      },
    };

    const res = await fetch(N8N_RECOMENDACIONES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        "[recomendaciones] Error HTTP desde n8n:",
        res.status,
        text
      );
      return;
    }

    const raw = await res.json();

    // 1) Normalizar la respuesta de n8n
    //    - Caso actual: { output: "string-json" }
    //    - Caso futuro posible: objeto JSON directo
    let n8nPayload: any;
    if (typeof raw === "string") {
      n8nPayload = JSON.parse(raw);
    } else if (typeof raw?.output === "string") {
      n8nPayload = JSON.parse(raw.output);
    } else {
      n8nPayload = raw;
    }

    // 2) Construir las recomendaciones por rasgo
    type RasgoKey = "extraversion" | "agreeableness" | "conscientiousness";

    const recomendaciones: {
      rasgo: RasgoKey;
      estrategia?: string | null;
      habilidad_blanda?: string | null;
      fuente?: string | null;
    }[] = [];

    const rasgos: RasgoKey[] = [
      "extraversion",
      "agreeableness",
      "conscientiousness",
    ];

    for (const rasgo of rasgos) {
      const trait = n8nPayload?.[rasgo];
      const recs = trait?.recommendations;

      if (Array.isArray(recs) && recs.length > 0) {
        recomendaciones.push({
          rasgo,
          // Se juntan todas las recomendaciones de ese rasgo en un solo bloque de texto
          estrategia: recs.join("\n\n"),
          habilidad_blanda: null,
          fuente: "rag-n8n-v1",
        });
      }
    }

    if (!recomendaciones.length) {
      console.error(
        "[recomendaciones] n8n no devolvió recomendaciones utilizables:",
        n8nPayload
      );
      return;
    }

    // 3) Guardar en la BD
    await prisma.recomendacion.createMany({
      data: recomendaciones.map((r) => ({
        perfil_id: params.perfilId,
        rasgo: r.rasgo,
        estrategia: r.estrategia ?? null,
        habilidad_blanda: r.habilidad_blanda ?? null,
        fuente: r.fuente ?? null,
      })),
    });
  } catch (err) {
    console.error("[recomendaciones] Error al llamar a n8n:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, studentId } = body as {
      answers: Record<string, number>;
      studentId?: string;
    };

    // 0) Validar sesión que nos manda el frontend
    if (!studentId) {
      return NextResponse.json(
        { error: "Sesión no válida o no autorizada" },
        { status: 401 }
      );
    }

    const alumno = await prisma.usuario.findUnique({
      where: { id: studentId },
      select: { id: true, rol: true },
    });

    if (!alumno || alumno.rol !== "student") {
      return NextResponse.json(
        { error: "Sesión no válida o no autorizada" },
        { status: 401 }
      );
    }

    // 1) Validar respuestas
    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Respuestas inválidas" },
        { status: 400 }
      );
    }

    const missing = QUESTION_KEYS.filter((k) => answers[k] == null);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Faltan respuestas en el cuestionario",
          missingQuestions: missing,
        },
        { status: 400 }
      );
    }

    const orderedAnswers = QUESTION_KEYS.map((k) => answers[k]);

    // 2) Cuestionario activo
    const cuestionario = await prisma.cuestionario.findFirst({
      where: { activo: true },
    });

    if (!cuestionario) {
      return NextResponse.json(
        { error: "No hay un cuestionario activo configurado" },
        { status: 500 }
      );
    }

    // 3) Inscripción del alumno (para saber grupo)
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { alumno_id: studentId },
    });

    if (!inscripcion) {
      return NextResponse.json(
        { error: "El alumno no tiene un grupo asignado" },
        { status: 400 }
      );
    }

    // 4) Llamar al predictor (FastAPI)
    const predictorRes = await fetch(PREDICTOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respuestas: orderedAnswers, // 👈 nombre esperado por FastAPI
        studentId,
        questionnaireId: cuestionario.id,
      }),
    });

    if (!predictorRes.ok) {
      const text = await predictorRes.text();
      console.error("Error desde predictor:", predictorRes.status, text);
      return NextResponse.json(
        { error: "Error al procesar las respuestas en el modelo de IA" },
        { status: 502 }
      );
    }

    const pred = await predictorRes.json();
    console.log("Predicción IA:", pred);

    // 4.1 Obtener scores EXACTAMENTE como los da tu modelo actual
    const extraversionScore =
      typeof pred.extraversion === "number" ? pred.extraversion : null;
    const conscientiousnessScore =
      typeof pred.conscientiousness === "number"
        ? pred.conscientiousness
        : null;
    const agreeablenessScore =
      typeof pred.agreeableness === "number" ? pred.agreeableness : null;

    // Estos dos rasgos no los está calculando tu modelo, se quedan en null
    const emotionalStabilityScore = null;
    const opennessScore = null;

    // 4.2 Niveles: usar los que manda el modelo en `levels`, si existen.
    const nivelExtraversion =
      mapRawLevel(pred.levels?.extraversion) ?? toLevel(extraversionScore);

    const nivelConscientiousness =
      mapRawLevel(pred.levels?.conscientiousness) ??
      toLevel(conscientiousnessScore);

    const nivelAgreeableness =
      mapRawLevel(pred.levels?.agreeableness) ?? toLevel(agreeablenessScore);

    // Como no hay EST/OPN, los niveles también van null:
    const nivelEmotionalStability = null;
    const nivelOpenness = null;

    // 5) Guardar respuestas crudas
    const respuesta = await prisma.respuesta.create({
      data: {
        cuestionario_id: cuestionario.id,
        alumno_id: studentId,
        respuestas_raw: {
          ordered: orderedAnswers,
          byQuestion: answers,
        },
      },
    });

    // 6) Guardar perfil procesado
    const perfil = await prisma.perfil.create({
      data: {
        respuesta_id: respuesta.id,
        grupo_id: inscripcion.grupo_id,

        extraversion_score: extraversionScore,
        agreeableness_score: agreeablenessScore,
        conscientiousness_score: conscientiousnessScore,
        emotional_stability_score: emotionalStabilityScore,
        openness_score: opennessScore,

        nivel_extraversion: nivelExtraversion,
        nivel_agreeableness: nivelAgreeableness,
        nivel_conscientiousness: nivelConscientiousness,
        nivel_emotional_stability: nivelEmotionalStability,
        nivel_openness: nivelOpenness,

        model_version: pred.model_version ?? "v1.0",
      },
    });

    // 7) Llamar a n8n para generar recomendaciones (no bloquea el éxito del cuestionario)
    void generarRecomendacionesParaPerfil({
      studentId,
      perfilId: perfil.id,
      grupoId: inscripcion.grupo_id,
      extraversionScore,
      extraversionLevel: nivelExtraversion,
      conscientiousnessScore,
      conscientiousnessLevel: nivelConscientiousness,
      agreeablenessScore,
      agreeablenessLevel: nivelAgreeableness,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Cuestionario guardado correctamente. Tus resultados están procesándose.",
    });
  } catch (err: any) {
    console.error("Error en /api/alumno/responder:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}