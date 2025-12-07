"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rol = "student" | "teacher";

export default function RegisterForm() {
  const router = useRouter();

  const [rol, setRol] = useState<Rol>("student");
  const [email, setEmail] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Alumno
  const [boleta, setBoleta] = useState("");
  const [grupoId, setGrupoId] = useState<number | "">("");

  // Docente
  const [opcionDocente, setOpcionDocente] = useState<"crear" | "unirme">("crear");
  const [empleadoNumero, setEmpleadoNumero] = useState("");
  const [grupoNombre, setGrupoNombre] = useState(""); // Nombre de la materia
  const [materiaGrupo, setMateriaGrupo] = useState(""); // Clave/grupo (7BM1, 3CM1, etc.)
  const [grupoGeneracion, setGrupoGeneracion] = useState("");
  const [grupoIdDocenteUnir, setGrupoIdDocenteUnir] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // estilos
  const label = "block text-sm font-medium text-neutral-900 mb-1";
  const input =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006699] focus:border-[#006699] transition";
  const inputNumber =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006699] focus:border-[#006699] transition appearance-none";
  const groupBox = "rounded-xl border border-neutral-200 p-4 bg-white";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!email || !nombres || !apellidos || !password) {
      setErr("Todos los campos generales son obligatorios.");
      return;
    }
    if (!consent) {
      setErr("Debes aceptar el aviso de privacidad.");
      return;
    }

    const payload: any = {
      email,
      nombres,
      apellidos,
      rol,
      password,
      consent: true,
    };

    if (rol === "student") {
      if (!boleta) {
        setErr("La boleta es obligatoria.");
        return;
      }
      if (grupoId === "" || Number.isNaN(Number(grupoId))) {
        setErr("Debes ingresar un ID de la materia válido.");
        return;
      }
      payload.alumno = {
        boleta,
        grupoId: Number(grupoId), // sigue siendo grupoId a nivel backend/BD
      };
    } else {
      if (!empleadoNumero) {
        setErr("El número de empleado es obligatorio.");
        return;
      }
      if (opcionDocente === "crear") {
        if (!grupoNombre) {
          setErr("Para crear una materia debes indicar el nombre de la materia.");
          return;
        }
        if (!materiaGrupo) {
          setErr("Para crear una materia debes indicar también el grupo (por ejemplo, 7BM1).");
          return;
        }
        payload.docente = {
          opcion: "crear",
          empleadoNumero,
          grupo: {
            nombre: grupoNombre,           // nombre de la materia
            grupo: materiaGrupo,           // clave/grupo (7BM1, 3CM1, etc.)
            generacion: grupoGeneracion || null,
          },
        };
      } else {
        if (grupoIdDocenteUnir === "" || Number.isNaN(Number(grupoIdDocenteUnir))) {
          setErr("Debes ingresar un ID de la materia válido para unirte.");
          return;
        }
        payload.docente = {
          opcion: "unirme",
          empleadoNumero,
          grupoId: Number(grupoIdDocenteUnir),
        };
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error en el registro");

      setMsg("Registro exitoso. Ahora puedes iniciar sesión.");
      router.push("/auth/login");
    } catch (e: any) {
      setErr(e?.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 md:py-20">
      {/* Oculta flechas de inputs numéricos (WebKit + Firefox) */}
      <style jsx global>{`
        /* WebKit */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />
          <h1 className="text-3xl font-bold text-[#06485A]">Registro</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Selecciona tu rol e ingresa tus datos
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rol como tarjetas */}
            <div className={groupBox}>
              <p className="text-sm font-semibold text-[#06485A] mb-3 text-center">
                Selecciona tu rol
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRol("student")}
                  className={[
                    "w-full rounded-xl border p-3 text-center transition font-medium text-sm",
                    "hover:shadow-sm",
                    rol === "student"
                      ? "border-[#006699] ring-2 ring-[#006699] bg-[#F0F8FB] text-[#006699]"
                      : "border-neutral-300 bg-white text-neutral-800",
                  ].join(" ")}
                >
                  Alumno
                </button>

                <button
                  type="button"
                  onClick={() => setRol("teacher")}
                  className={[
                    "w-full rounded-xl border p-3 text-center transition font-medium text-sm",
                    "hover:shadow-sm",
                    rol === "teacher"
                      ? "border-[#006699] ring-2 ring-[#006699] bg-[#F0F8FB] text-[#006699]"
                      : "border-neutral-300 bg-white text-neutral-800",
                  ].join(" ")}
                >
                  Docente
                </button>
              </div>
            </div>

            {/* Datos generales */}
            <div className={groupBox}>
              <p className="text-sm font-semibold text-[#06485A] mb-3">Datos generales</p>
              <div className="mb-3">
                <label className={label}>Correo institucional</label>
                <input
                  className={input}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@institucion.mx"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Nombre(s)</label>
                  <input
                    className={input}
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ana"
                  />
                </div>
                <div>
                  <label className={label}>Apellidos</label>
                  <input
                    className={input}
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="López"
                  />
                </div>
              </div>
              <div className="mt-3 relative">
                <label className={label}>Contraseña</label>
                <input
                  className={input + " pr-10"}
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                {/* Botón ojo */}
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-[34px] p-1 rounded-md text-neutral-600 hover:bg-neutral-100"
                >
                  {showPass ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-3.17 4.13M1 1l22 22" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Alumno */}
            {rol === "student" && (
              <div className={groupBox}>
                <p className="text-sm font-semibold text-[#06485A] mb-3">Datos de alumno</p>
                <div className="mb-3">
                  <label className={label}>Boleta</label>
                  <input
                    className={input}
                    required
                    value={boleta}
                    onChange={(e) => setBoleta(e.target.value)}
                    placeholder="2025B200111"
                  />
                </div>
                <div className="mb-3">
                  <label className={label}>
                    ID de la materia (proporcionado por tu docente)
                  </label>
                  <input
                    className={inputNumber}
                    type="number"
                    required
                    value={grupoId}
                    onChange={(e) =>
                      setGrupoId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Ej. 4"
                  />
                </div>
              </div>
            )}

            {/* Docente */}
            {rol === "teacher" && (
              <div className={groupBox}>
                <p className="text-sm font-semibold text-[#06485A] mb-3">Datos de docente</p>
                <div className="mb-3">
                  <label className={label}>Número de empleado</label>
                  <input
                    className={input}
                    required
                    value={empleadoNumero}
                    onChange={(e) => setEmpleadoNumero(e.target.value)}
                    placeholder="EMP-12345"
                  />
                </div>

                <div className="mb-3">
                  <label className={label}>Acción</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setOpcionDocente("crear")}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm transition font-medium",
                        opcionDocente === "crear"
                          ? "border-[#006699] ring-2 ring-[#006699] bg-[#F0F8FB] text-[#006699]"
                          : "border-neutral-300 bg-white text-neutral-800 hover:border-[#006699]",
                      ].join(" ")}
                    >
                      Crear materia nueva
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpcionDocente("unirme")}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm transition font-medium",
                        opcionDocente === "unirme"
                          ? "border-[#006699] ring-2 ring-[#006699] bg-[#F0F8FB] text-[#006699]"
                          : "border-neutral-300 bg-white text-neutral-800 hover:border-[#006699]",
                      ].join(" ")}
                    >
                      Unirme a materia existente
                    </button>
                  </div>
                </div>

                {opcionDocente === "crear" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className={label}>Nombre de la materia</label>
                      <input
                        className={input}
                        required
                        value={grupoNombre}
                        onChange={(e) => setGrupoNombre(e.target.value)}
                        placeholder="Ej. Programación Orientada a Objetos"
                      />
                    </div>
                    <div>
                      <label className={label}>Grupo</label>
                      <input
                        className={input}
                        required
                        value={materiaGrupo}
                        onChange={(e) => setMateriaGrupo(e.target.value)}
                        placeholder="Ej. 7BM1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={label}>Generación</label>
                      <input
                        className={input}
                        value={grupoGeneracion}
                        onChange={(e) => setGrupoGeneracion(e.target.value)}
                        placeholder="Ej. 2025-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className={label}>ID de la materia</label>
                    <input
                      className={inputNumber}
                      type="number"
                      required
                      value={grupoIdDocenteUnir}
                      onChange={(e) =>
                        setGrupoIdDocenteUnir(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Ej. 4"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Consentimiento */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-[#F5FAFF] px-5 py-4 shadow-sm">
                <label className="flex items-start gap-3 text-neutral-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 accent-[#006699]"
                  />

                  <p className="text-sm leading-6 text-neutral-800">
                    Acepto el{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="underline text-[#006699] hover:text-[#00557a] font-medium"
                    >
                      aviso de privacidad
                    </button>{" "}
                    y el uso de mis datos con fines académicos.
                  </p>
                </label>
              </div>
            </div>

            {/* Mensajes */}
            {err && <p className="text-red-600 text-sm">{err}</p>}
            {msg && <p className="text-emerald-700 text-sm">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#006699] text-white py-2.5 font-semibold shadow-sm hover:bg-[#00557a] disabled:opacity-60 transition"
            >
              {loading ? "Registrando..." : "Registrarme"}
            </button>
          </form>
        </div>
      </div>

      {/* Popup Aviso de Privacidad */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-xl p-6 relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-[#06485A]">
                Aviso de Privacidad
              </h2>
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="text-neutral-500 hover:text-neutral-800 rounded-md p-1"
                aria-label="Cerrar aviso de privacidad"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-800">
              <p>
                Con fundamento en los artículos 15 y 16 de la Ley Federal de
                Protección de Datos Personales en Posesión de los Particulares,
                se informa que este proyecto de titulación es responsable del
                tratamiento, uso y protección de los datos personales que sean
                recabados durante el desarrollo de la investigación y la
                prestación de los servicios académicos derivados del mismo.
              </p>

              <p>
                La información personal que se recabe será utilizada
                exclusivamente para fines relacionados con el proyecto, tales
                como:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Registrar y gestionar la participación de los usuarios o
                  voluntarios.
                </li>
                <li>
                  Dar seguimiento a consultas, comentarios o solicitudes
                  vinculadas con el estudio.
                </li>
                <li>
                  Generar análisis, estadísticas y evaluaciones que permitan
                  mejorar la calidad y precisión del proyecto.
                </li>
                <li>
                  Elaborar reportes académicos, conclusiones y documentación
                  requerida por la institución educativa.
                </li>
                <li>
                  Cumplir con obligaciones legales, normativas y académicas
                  aplicables al proceso de titulación.
                </li>
              </ul>

              <p>Podrán recabarse, entre otros, los siguientes datos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Nombre completo.</li>
                <li>Edad.</li>
                <li>Correo electrónico.</li>
                <li>
                  Información generada durante la interacción con la plataforma
                  o los cuestionarios aplicados.
                </li>
              </ul>
              <p>No se solicitarán datos personales sensibles.</p>

              <p>
                Los datos serán tratados bajo estrictas medidas de seguridad
                técnicas, administrativas y físicas para protegerlos contra
                daño, pérdida, alteración, destrucción o uso no autorizado. En
                ningún caso los datos recabados serán compartidos, vendidos o
                transferidos a terceros, salvo cuando exista una obligación
                legal que así lo exija.
              </p>

              <p>
                Los titulares de los datos personales podrán ejercer en todo
                momento sus derechos de Acceso, Rectificación, Cancelación y
                Oposición (ARCO), así como solicitar la limitación del uso o
                divulgación de sus datos, mediante solicitud dirigida al
                responsable del proyecto a través de los medios de contacto que
                se hayan proporcionado.
              </p>

              <p>
                El presente Aviso de Privacidad puede ser modificado para
                cumplir con disposiciones legales o académicas. Cualquier cambio
                será comunicado oportunamente a los participantes mediante los
                medios autorizados.
              </p>

              <p>
                Al proporcionar sus datos personales y participar en las
                actividades relacionadas con este proyecto de titulación, usted
                reconoce haber leído este Aviso de Privacidad y otorga su
                consentimiento para el tratamiento de su información conforme a
                lo aquí establecido.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="rounded-md bg-[#006699] text-white px-4 py-2 text-sm font-medium hover:bg-[#00557a] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}