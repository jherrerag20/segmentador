import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionOnResponse } from "@/lib/session";

const LoginSchema = z.object({
  rol: z.enum(["student", "teacher"]),
  identificador: z.string().min(1, "identificador requerido"),
  password: z.string().min(8, "contraseña mínima de 8 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rol, identificador, password } = LoginSchema.parse(body);

    if (rol === "student") {
      // 1) Buscar perfil alumno por boleta + incluir usuario
      const perfil = await prisma.perfilAlumno.findUnique({
        where: { boleta: identificador },
        include: { usuario: true },
      });

      if (!perfil || perfil.usuario.rol !== "student") {
        return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
      }

      const ok = await bcrypt.compare(password, perfil.usuario.password_hash);
      if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      // 2) Crear respuesta y setear cookie con el **id** real de Usuario
      const res = NextResponse.json({ ok: true, rol: "student", next: "/alumno" });
      return setSessionOnResponse(res, { uid: perfil.usuario.id, rol: "student" });
    }

    // ===== teacher =====
    const perfil = await prisma.perfilDocente.findUnique({
      where: { empleado_numero: identificador },
      include: { usuario: true },
    });

    if (!perfil || perfil.usuario.rol !== "teacher") {
      return NextResponse.json({ error: "Docente no encontrado" }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, perfil.usuario.password_hash);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const res = NextResponse.json({ ok: true, rol: "teacher", next: "/docente" });
    return setSessionOnResponse(res, { uid: perfil.usuario.id, rol: "teacher" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? e?.message ?? "Error" }, { status: 400 });
  }
}