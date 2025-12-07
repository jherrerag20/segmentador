import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const RegisterSchema = z.object({
  email: z.string().email(),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  password: z.string().min(8),
  rol: z.enum(["student", "teacher"]),
  consent: z.boolean(),
  alumno: z
    .object({
      boleta: z.string().min(1),
      grupoId: z.number().int().positive(), // ID de la materia/grupo
    })
    .optional(),
  docente: z
    .object({
      opcion: z.enum(["crear", "unirme"]),
      empleadoNumero: z.string().min(1),
      grupo: z
        .object({
          nombre: z.string().min(1),                    // Nombre de la materia
          grupo: z.string().min(1),                     // Clave/grupo (7BM1, 3CM1, etc.)
          generacion: z.string().nullable().optional(), // Generación
        })
        .optional(),
      grupoId: z.number().int().positive().optional(), // ID de materia existente
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Crear/asegurar usuario
    const passHash = await bcrypt.hash(data.password, 10);
    const usuario = await prisma.usuario.upsert({
      where: { email: data.email },
      update: {
        password_hash: passHash,
        rol: data.rol,
      },
      create: {
        email: data.email,
        password_hash: passHash,
        rol: data.rol,
      },
      select: { id: true, rol: true, email: true },
    });

    // ----- FLUJO ALUMNO -----
    if (data.rol === "student") {
      if (!data.alumno) {
        return NextResponse.json(
          { error: "Faltan datos de alumno" },
          { status: 400 }
        );
      }
      const { boleta, grupoId } = data.alumno;

      // Validar que la materia (grupo) exista
      const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
      if (!grupo) {
        return NextResponse.json(
          { error: "ID de materia inválido o inexistente" },
          { status: 400 }
        );
      }

      // Upsert perfil alumno
      await prisma.perfilAlumno.upsert({
        where: { usuario_id: usuario.id },
        update: {
          boleta,
          nombre: data.nombres,
          apellido: data.apellidos,
        },
        create: {
          usuario_id: usuario.id,
          boleta,
          nombre: data.nombres,
          apellido: data.apellidos,
        },
      });

      // Inscripción (única por materia)
      await prisma.inscripcion.upsert({
        where: {
          grupo_id_alumno_id: {
            grupo_id: grupo.id,
            alumno_id: usuario.id,
          },
        },
        update: {},
        create: { grupo_id: grupo.id, alumno_id: usuario.id },
      });

      return NextResponse.json({
        ok: true,
        rol: "student",
        alumnoId: usuario.id,
        grupoId: grupo.id,
        next: "/alumno/cuestionario",
      });
    }

    // ----- FLUJO DOCENTE -----
    if (!data.docente) {
      return NextResponse.json(
        { error: "Faltan datos de docente" },
        { status: 400 }
      );
    }
    const { opcion, empleadoNumero } = data.docente;

    // Upsert perfil docente
    await prisma.perfilDocente.upsert({
      where: { usuario_id: usuario.id },
      update: {
        empleado_numero: empleadoNumero,
        nombre: data.nombres,
        apellido: data.apellidos,
      },
      create: {
        usuario_id: usuario.id,
        empleado_numero: empleadoNumero,
        nombre: data.nombres,
        apellido: data.apellidos,
      },
    });

    let grupoId: number | null = null;

    if (opcion === "crear") {
      // Validar que venga la info de la materia
      if (!data.docente.grupo) {
        return NextResponse.json(
          { error: "Faltan datos de la materia a crear" },
          { status: 400 }
        );
      }

      const { nombre, grupo, generacion } = data.docente.grupo;

      // Crear materia (Grupo) con nombre, grupo, generación
      const grp = await prisma.grupo.create({
        data: {
          nombre,                      // Nombre de la materia
          grupo,                       // Clave/grupo (7BM1, etc.)
          generacion: generacion ?? null,
        },
        select: { id: true },
      });

      // Relación docente-materia
      await prisma.grupoDocente.upsert({
        where: {
          docente_id_grupo_id: {
            docente_id: usuario.id,
            grupo_id: grp.id,
          },
        },
        update: {},
        create: { docente_id: usuario.id, grupo_id: grp.id },
      });

      grupoId = grp.id;
    } else {
      // Unirse a materia existente
      const gid = data.docente.grupoId;
      if (!gid) {
        return NextResponse.json(
          { error: "Debes indicar ID de materia para unirte" },
          { status: 400 }
        );
      }
      const grp = await prisma.grupo.findUnique({ where: { id: gid } });
      if (!grp) {
        return NextResponse.json(
          { error: "ID de materia no encontrado" },
          { status: 404 }
        );
      }

      await prisma.grupoDocente.upsert({
        where: {
          docente_id_grupo_id: {
            docente_id: usuario.id,
            grupo_id: grp.id,
          },
        },
        update: {},
        create: { docente_id: usuario.id, grupo_id: grp.id },
      });

      grupoId = grp.id;
    }

    return NextResponse.json({
      ok: true,
      rol: "teacher",
      docenteId: usuario.id,
      grupoId,
      next: "/docente",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 400 });
  }
}