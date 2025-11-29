// src/app/alumno/cuestionario/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const QUESTION_KEYS = [
  "Soy el alma de la fiesta", "No hablo mucho", "Me siento cómodo rodeado de muchas personas", "Prefiero mantenerme en segundo plano (intento no destacar)", "Inicio conversaciones",
  "Tengo poco que decir", "Le hablo a muchas personas en fiestas", "No me gusta llamar la atención", "No me molesta ser el centro de atención", "Soy callado cuando estoy con desconocidos",
  "Siempre estoy preparado", "Dejo mis pertenencias por todos lados", "Pongo atención a los detalles", "Desordeno las cosas", "Hago mis tareas de inmediato",
  "A menudo olvido regresar las cosas a su lugar", "Me gusta el orden", "Evito cumplir con mis deberes", "Sigo una agenda", "Soy exigente con mi trabajo",
  "Siento preocupación por los demás", "Me intereso por las personas", "Insulto a las personas", "Simpatizo con los sentimientos de los demás", "No me interesan los problemas de los demás",
  "Tengo un corazón sensible", "Realmente no me intereso por los demás", "Dedico tiempo a los demás", "Siento las emociones de los demás", "Hago que las personas se sientan cómodas",
];

export default function CuestionarioAlumno() {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [studentId, setStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);          // enviar formulario
  const [checking, setChecking] = useState(true);         // checando sesión/estado
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function setAnswer(key: string, val: number) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }

  // 1) Al montar: obtener sesión (/api/auth/me) y verificar si ya contestó
  useEffect(() => {
    async function init() {
      try {
        setChecking(true);
        setErr(null);

        // a) Obtener sesión para conocer el studentId (uid)
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          setErr("No se pudo obtener tu sesión. Vuelve a iniciar sesión.");
          setChecking(false);
          return;
        }
        const meData = await meRes.json();
        const uid = meData?.sess?.uid as string | undefined;
        if (!uid) {
          setErr("Sesión no válida. Vuelve a iniciar sesión.");
          setChecking(false);
          return;
        }
        setStudentId(uid);

        // b) Consultar si ya respondió el cuestionario activo
        const estadoRes = await fetch(
          `/api/alumno/estado-cuestionario?studentId=${encodeURIComponent(uid)}`
        );

        if (!estadoRes.ok) {
          // Si algo falla aquí, por defecto dejamos que pueda contestar
          setAlreadyAnswered(false);
          setChecking(false);
          return;
        }

        const estado = await estadoRes.json();
        if (estado.answered) {
          setAlreadyAnswered(true);
          setMsg("Ya has respondido el cuestionario activo.");
        } else {
          setAlreadyAnswered(false);
        }
      } catch (e) {
        console.error(e);
        // Ante error, permitimos contestar, pero mostramos aviso suave
        setAlreadyAnswered(false);
      } finally {
        setChecking(false);
      }
    }

    void init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!studentId) {
      setErr("Sesión no válida. Vuelve a iniciar sesión.");
      return;
    }

    if (Object.keys(answers).length !== 30) {
      setErr("Debes responder todas las preguntas antes de continuar.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/alumno/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, studentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar las respuestas");

      setMsg("¡Cuestionario enviado correctamente! Tus resultados están procesándose.");
      setAlreadyAnswered(true);

      // Pequeña pausa para que alcance a ver el mensaje y luego regresar al inicio
      setTimeout(() => {
        router.push("/alumno");
      }, 1200);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />
          <h1 className="text-3xl font-bold text-[#06485A]">
            Cuestionario de Personalidad
          </h1>
        </div>

        {/* Instrucciones */}
        <div className="mb-8 rounded-xl border border-neutral-200 bg-[#F8FBFD] px-8 py-6 text-center text-neutral-800">
          <h2 className="text-lg font-semibold text-[#06485A] mb-3">
            Instrucciones
          </h2>

          <p className="text-sm leading-6">
            Por favor, responde de manera honesta y consciente las siguientes{" "}
            <b>30 afirmaciones</b>.
            <br />
            Cada afirmación debe calificarse con un número del <b>1 al 5</b>, según
            qué tan cierta consideres que es en relación contigo.
          </p>

          <ul className="mt-3 text-sm leading-6 space-y-1">
            <li><b>1:</b> Muy en desacuerdo</li>
            <li><b>2:</b> En desacuerdo</li>
            <li><b>3:</b> Neutral</li>
            <li><b>4:</b> De acuerdo</li>
            <li><b>5:</b> Muy de acuerdo</li>
          </ul>
        </div>

        {/* Estados globales */}
        {checking && (
          <p className="text-center text-sm text-neutral-600">
            Cargando tu información...
          </p>
        )}

        {!checking && alreadyAnswered && (
          <div className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-6 py-5 text-center">
            <p className="text-sm text-neutral-800 mb-3">
              Ya has respondido el cuestionario activo.  
              Si necesitas más información, consulta a tu docente.
            </p>
            <button
              type="button"
              onClick={() => router.push("/alumno")}
              className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-5 py-2.5 font-semibold shadow-sm hover:bg-[#00557a] transition"
            >
              Volver a la página de inicio
            </button>
          </div>
        )}

        {/* Formulario solo si no está contestado y no estamos cargando */}
        {!checking && !alreadyAnswered && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {QUESTION_KEYS.map((key, idx) => (
              <div
                key={key}
                className="rounded-lg border border-neutral-200 p-4 bg-[#F8FBFD]"
              >
                <p className="font-medium text-neutral-900 mb-3 leading-relaxed">
                  {idx + 1}. {key}
                </p>

                {/* CUADROS DE RESPUESTA */}
                <div className="flex justify-center gap-4 sm:gap-5 mt-4">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = answers[key] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(key, n)}
                        style={{ width: "2.5rem", height: "2.5rem" }}
                        className={[
                          "flex items-center justify-center rounded-lg border-2 text-sm sm:text-base font-semibold transition-all select-none focus:outline-none focus:ring-2 focus:ring-[#006699]/40",
                          active
                            ? "bg-[#006699] text-neutral-50 border-[#006699] shadow-md"
                            : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100"
                        ].join(" ")}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {err && <p className="text-red-600 text-sm">{err}</p>}
            {msg && <p className="text-emerald-700 text-sm">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 rounded-md bg-[#006699] text-white py-2.5 font-semibold shadow-sm hover:bg-[#00557a] disabled:opacity-60 transition"
            >
              {loading ? "Enviando..." : "Enviar cuestionario"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}