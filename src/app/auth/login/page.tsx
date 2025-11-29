"use client";

import { useState } from "react";

type Rol = "student" | "teacher";

export default function LoginForm() {
  const [rol, setRol] = useState<Rol>("student");
  const [boleta, setBoleta] = useState("");
  const [empleadoNumero, setEmpleadoNumero] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Estilos reutilizados
  const label = "block text-sm font-medium text-neutral-900 mb-1";
  const input =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006699] focus:border-[#006699] transition";
  const groupBox = "rounded-xl border border-neutral-200 p-4 bg-white";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!password) {
      setErr("La contraseña es obligatoria.");
      return;
    }
    if (rol === "student" && !boleta) {
      setErr("La boleta es obligatoria.");
      return;
    }
    if (rol === "teacher" && !empleadoNumero) {
      setErr("El número de empleado es obligatorio.");
      return;
    }

    // El API espera: { rol, identificador, password }
    const payload =
      rol === "student"
        ? { rol, identificador: boleta, password }
        : { rol, identificador: empleadoNumero, password };

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow", // permite que el navegador siga el 302 del server
        body: JSON.stringify(payload),
      });

      // Si el server redirigió, navegamos a la URL final
      if (res.redirected && res.url) {
        window.location.href = res.url;
        return;
      }

      // Si no hubo redirect, intentamos leer JSON (p. ej. error o next)
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Credenciales inválidas"
        );
      }

      if (data?.next) {
        window.location.href = data.next;
        return;
      }

      // Mensaje de cortesía si no hubo redirect ni 'next'
      setMsg(
        rol === "student"
          ? "Autenticado. Redirigiendo a /alumno…"
          : "Autenticado. Redirigiendo a /docente…"
      );
    } catch (e: any) {
      setErr(e?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Reset flechas numéricas por si en un futuro cambiamos inputs */}
      <style jsx global>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />
          <h1 className="text-3xl font-bold text-[#06485A]">Iniciar sesión</h1>
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
              <div className="grid grid-cols-2 gap-3">
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

            {/* Campos por rol */}
            {rol === "student" ? (
              <div className={groupBox}>
                <p className="text-sm font-semibold text-[#06485A] mb-3">
                  Datos de alumno
                </p>
                <div>
                  <label className={label}>Boleta</label>
                  <input
                    className={input}
                    value={boleta}
                    onChange={(e) => setBoleta(e.target.value)}
                    placeholder="2025630912"
                    autoComplete="username"
                  />
                </div>
              </div>
            ) : (
              <div className={groupBox}>
                <p className="text-sm font-semibold text-[#06485A] mb-3">
                  Datos de docente
                </p>
                <div>
                  <label className={label}>Número de empleado</label>
                  <input
                    className={input}
                    value={empleadoNumero}
                    onChange={(e) => setEmpleadoNumero(e.target.value)}
                    placeholder="2020568729"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            {/* Contraseña */}
            <div className={groupBox}>
              <label className={label}>Contraseña</label>
              <div className="relative">
                <input
                  className={input + " pr-10"}
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-600 hover:bg-neutral-100"
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

            {/* Mensajes */}
            {err && <p className="text-red-600 text-sm">{err}</p>}
            {msg && <p className="text-emerald-700 text-sm">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#006699] text-white py-2.5 font-semibold shadow-sm hover:bg-[#00557a] disabled:opacity-60 transition"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <p className="text-center text-sm text-neutral-600">
              ¿No tienes cuenta?{" "}
              <a href="/auth/register" className="text-[#006699] hover:underline">
                Regístrate
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}