import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { answered: false, error: "studentId requerido" },
        { status: 400 }
      );
    }

    // 1) Cuestionario activo
    const cuestionario = await prisma.cuestionario.findFirst({
      where: { activo: true },
    });

    if (!cuestionario) {
      return NextResponse.json({
        answered: false,
        reason: "no-active-questionnaire",
      });
    }

    // 2) ¿Ya existe una respuesta de este alumno para ese cuestionario?
    const existing = await prisma.respuesta.findUnique({
      where: {
        cuestionario_id_alumno_id: {
          cuestionario_id: cuestionario.id,
          alumno_id: studentId,
        },
      },
      select: {
        id: true,
        fecha_evaluacion: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ answered: false });
    }

    return NextResponse.json({
      answered: true,
      respuestaId: existing.id,
      fechaEvaluacion: existing.fecha_evaluacion,
    });
  } catch (err) {
    console.error("Error en /api/alumno/estado-cuestionario:", err);
    return NextResponse.json(
      { answered: false, error: "internal-error" },
      { status: 500 }
    );
  }
}