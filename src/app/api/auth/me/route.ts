import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sess = getSessionFromRequest(req);

  if (!sess) {
    return NextResponse.json(
      { ok: false, reason: "no-session" },
      { status: 401 }
    );
  }

  // Buscamos al usuario con ambos perfiles (alumno y docente)
  const user = await prisma.usuario.findUnique({
    where: { id: sess.uid },
    select: {
      id: true,
      email: true,
      rol: true,

      // PERFIL ALUMNO
      perfilAlumno: {
        select: {
          nombre: true,
          apellido: true,
          boleta: true,
        },
      },

      // PERFIL DOCENTE
      perfilDocente: {
        select: {
          nombre: true,
          apellido: true,
          empleado_numero: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "user-not-found" },
      { status: 401 }
    );
  }

  // Elegimos el nombre correcto según el tipo de usuario
  let nombre = undefined;
  let apellido = undefined;

  if (user.rol === "teacher" && user.perfilDocente) {
    nombre = user.perfilDocente.nombre ?? undefined;
    apellido = user.perfilDocente.apellido ?? undefined;
  }

  if (user.rol === "student" && user.perfilAlumno) {
    nombre = user.perfilAlumno.nombre ?? undefined;
    apellido = user.perfilAlumno.apellido ?? undefined;
  }

  // Regresamos todo igual que antes, pero agregando nombre y apellido
  return NextResponse.json({
    ok: true,
    sess,
    user: {
      ...user,
      nombre,
      apellido,
    },
  });
}