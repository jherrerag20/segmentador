// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";

type Rol = "student" | "teacher";

export default function RegisterForm() {
  const [rol, setRol] = useState<Rol>("student");
  const [email, setEmail] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [consent, setConsent] = useState(false);

  // Alumno
  const [boleta, setBoleta] = useState("");
  const [grupoId, setGrupoId] = useState<number | "">("");

  // Docente
  const [opcionDocente, setOpcionDocente] = useState<"crear" | "unirme">("crear");
  const [empleadoNumero, setEmpleadoNumero] = useState("");
  const [grupoNombre, setGrupoNombre] = useState("");
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
  const radioLabel = "inline-flex items-center gap-2 mr-4 text-neutral-900";
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
        setErr("Debes ingresar un Group ID válido.");
        return;
      }
      payload.alumno = {
        boleta,
        grupoId: Number(grupoId),
      };
    } else {
      if (!empleadoNumero) {
        setErr("El número de empleado es obligatorio.");
        return;
      }
      if (opcionDocente === "crear") {
        if (!grupoNombre) {
          setErr("Para crear un grupo debes indicar el nombre.");
          return;
        }
        payload.docente = {
          opcion: "crear",
          empleadoNumero,
          grupo: {
            nombre: grupoNombre,
            generacion: grupoGeneracion || null,
          },
        };
      } else {
        if (grupoIdDocenteUnir === "" || Number.isNaN(Number(grupoIdDocenteUnir))) {
          setErr("Debes ingresar un Group ID válido para unirte.");
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

      if (data.rol === "teacher" && data.grupoId) {
        setMsg(`Registro exitoso. Group ID: ${data.grupoId}. Ruta siguiente: ${data.next || "/docente"}`);
      } else if (data.rol === "student") {
        setMsg(`Registro exitoso. Ruta siguiente: ${data.next || "/alumno/cuestionario"}`);
      } else {
        setMsg("Registro exitoso.");
      }
    } catch (e: any) {
      setErr(e?.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
          <p className="text-sm text-neutral-600 mt-1">Selecciona tu rol e ingresa tus datos</p>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-3.17 4.13M1 1l22 22"/>
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
                  <label className={label}>Group ID (proporcionado por tu docente)</label>
                  <input
                    className={inputNumber}
                    type="number"
                    required
                    value={grupoId}
                    onChange={(e) => setGrupoId(e.target.value === "" ? "" : Number(e.target.value))}
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
                    {/* BOTÓN 1: Crear grupo (con texto visible) */}
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
                      Crear grupo nuevo
                    </button>

                    {/* BOTÓN 2: Unirme (con texto visible) */}
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
                      Unirme (por Group ID)
                    </button>
                  </div>
                </div>

                {opcionDocente === "crear" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Nombre de grupo</label>
                      <input
                        className={input}
                        required
                        value={grupoNombre}
                        onChange={(e) => setGrupoNombre(e.target.value)}
                        placeholder="Ej. 3CM1"
                      />
                    </div>
                    <div>
                      <label className={label}>Generación (opcional)</label>
                      <input
                        className={input}
                        value={grupoGeneracion}
                        onChange={(e) => setGrupoGeneracion(e.target.value)}
                        placeholder="Ej. 2025-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className={label}>Group ID</label>
                    <input
                      className={inputNumber}
                      type="number"
                      required
                      value={grupoIdDocenteUnir}
                      onChange={(e) =>
                        setGrupoIdDocenteUnir(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="Ej. 4"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Consentimiento (card aesthetic) */}
            <div className="rounded-xl border border-neutral-200 p-4 bg-[#F8FBFD]">
              <label className="flex items-start gap-3 text-neutral-900">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-1.5 h-4 w-4 accent-[#006699]"
                />
                <span className="text-sm leading-6">
                  Acepto el aviso de privacidad y el uso de mis datos con fines académicos.
                </span>
              </label>
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
    </main>
  );
}