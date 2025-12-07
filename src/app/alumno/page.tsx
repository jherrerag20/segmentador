import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, decode } from "@/lib/session";
import { LogoutButtonAlumno } from "@/components/LogoutButtonAlumno";
import JoinMateriaForm from "@/components/JoinMateriaForm";

export default async function AlumnoPage() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  const sess = decode(raw);

  if (!sess || sess.rol !== "student") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-[#06485A]">Sesión no válida</h1>
          <p className="text-sm text-neutral-600 mt-2">
            Por favor inicia sesión para continuar.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 rounded-md bg-[#006699] text-white px-4 py-2.5 font-semibold hover:bg-[#00557a] transition"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  // Usuario + alias
  const user = await prisma.usuario.findUnique({
    where: { id: sess.uid },
    select: {
      email: true,
      perfilAlumno: {
        select: {
          nombre: true,
          apellido: true,
        },
      },
    },
  });

  const aliasFromPerfil =
    user?.perfilAlumno?.nombre || user?.perfilAlumno?.apellido
      ? `${user?.perfilAlumno?.nombre ?? ""} ${
          user?.perfilAlumno?.apellido ?? ""
        }`.trim()
      : null;

  const alias = aliasFromPerfil || user?.email || "Alumno";

  // Verificamos si ya existe un perfil de personalidad asociado al alumno
  const perfilExistente = await prisma.perfil.findFirst({
    where: {
      respuesta: {
        alumno_id: sess.uid,
      },
    },
    select: { id: true },
  });

  const hasPerfil = Boolean(perfilExistente);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />
          <h1 className="text-3xl font-bold text-[#06485A]">Panel del alumno</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Bienvenido,{" "}
            <span className="font-semibold text-[#006699]">{alias}</span>
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 text-center">
          <p className="text-[#374151] text-neutral-600 text-base mb-6">
            Aquí podrás acceder a tu cuestionario, consultar tus resultados
            {hasPerfil ? " y unirte a más materias utilizando el mismo perfil." : "."}
          </p>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-6">
            <Link
              href="/alumno/cuestionario"
              className="rounded-md bg-[#006699] text-white font-semibold hover:bg-[#00557a] transition px-7 py-2.5 text-sm shadow-sm"
            >
              Ir al cuestionario
            </Link>

            <LogoutButtonAlumno />
          </div>

          <div className="mt-4 pt-6 border-t border-neutral-200">
            <h2 className="text-lg font-semibold text-[#06485A] mb-3">
              Unirse a otra materia
            </h2>

            {hasPerfil ? (
              <JoinMateriaForm alumnoId={sess.uid} />
            ) : (
              <p className="text-sm text-neutral-600 max-w-md mx-auto">
                Primero debes contestar el cuestionario en tu materia actual.
                Una vez que se genere tu perfil de personalidad, podrás unirte
                a más materias reutilizando el mismo resultado.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}