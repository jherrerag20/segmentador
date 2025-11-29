// src/app/docente/grupo/[groupId]/alumnos/[alumnoId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AlumnoBarChart = dynamic(
  () => import("@/components/AlumnoBarChart"),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-neutral-500">
        Cargando gráfica…
      </p>
    ),
  }
);

const AlumnoRadarChart = dynamic(
  () => import("@/components/AlumnoRadarChart"),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-neutral-500">
        Cargando mapa del perfil…
      </p>
    ),
  }
);

type PerfilAlumnoDetalle = {
  extraversionScore: number | null;
  nivelExtraversion: string | null;
  conscientiousnessScore: number | null;
  nivelConscientiousness: string | null;
  agreeablenessScore: number | null;
  nivelAgreeableness: string | null;
  emotionalStabilityScore: number | null;
  nivelEmotionalStability: string | null;
  opennessScore: number | null;
  nivelOpenness: string | null;
  modelVersion: string | null;
  fechaEvaluacion: string | null;
  cuestionarioVersion: string | null;
};

type RecomendacionDTO = {
  id: number;
  rasgo: string;
  estrategia: string | null;
  habilidad_blanda: string | null;
  fuente: string | null;
};

type AlumnoDetalleResponse = {
  ok: boolean;
  error?: string;
  grupo?: {
    id: number;
    nombre: string;
    generacion: string | null;
  };
  alumno?: {
    id: string;
    email: string | null;
    nombreCompleto: string;
  };
  perfil?: PerfilAlumnoDetalle | null;
  recomendaciones?: RecomendacionDTO[];
};

function formatNivel(nivel: string | null | undefined): string {
  if (!nivel) return "Sin nivel";
  if (nivel === "low") return "Bajo";
  if (nivel === "medium") return "Medio";
  if (nivel === "high") return "Alto";
  return nivel;
}

function formatFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "Sin fecha";
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString();
}

export default function AlumnoResumenPage() {
  const router = useRouter();
  const params = useParams();

  const groupId =
    typeof params.groupId === "string" ? params.groupId : "";
  const alumnoId =
    typeof params.alumnoId === "string" ? params.alumnoId : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<AlumnoDetalleResponse | null>(null);

  useEffect(() => {
    if (!groupId || !alumnoId) return;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(
          `/api/docente/grupos/${groupId}/alumnos/${alumnoId}`
        );
        const json: AlumnoDetalleResponse = await res.json();

        if (!res.ok || !json.ok) {
          setErr(json.error || "No autorizado o error al cargar al alumno.");
          setData(null);
          return;
        }

        setData(json);
      } catch {
        setErr("Error al cargar el resumen del alumno.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [groupId, alumnoId]);

  const grupo = data?.grupo;
  const alumno = data?.alumno;
  const perfil = data?.perfil || null;
  const recomendaciones = data?.recomendaciones ?? [];

  const fechaEvaluacion = useMemo(
    () => formatFecha(perfil?.fechaEvaluacion || null),
    [perfil]
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-neutral-200 rounded-2xl px-8 py-8 shadow-sm">
        <div className="mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push(`/docente/grupo/${groupId}`)}
            className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-[#00557a] transition"
          >
            ← Volver al grupo
          </button>
        </div>

        <header className="mb-6 text-center">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />

          <h1 className="text-2xl sm:text-3xl font-bold text-[#06485A]">
            Resumen del alumno
          </h1>

          {alumno && (
            <div className="mt-3 space-y-1">
              <p className="text-sm text-neutral-800 font-semibold">
                {alumno.nombreCompleto}
              </p>
              {alumno.email && (
                <p className="text-xs text-neutral-600">{alumno.email}</p>
              )}
            </div>
          )}

          {grupo && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-700 border border-neutral-300">
                Grupo {grupo.nombre} · Generación {grupo.generacion || "N/D"}
              </span>

              {perfil && (
                <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-600">
                  <span className="inline-flex items-center rounded-full bg-[#F8FBFD] px-3 py-1 border border-neutral-200">
                    Cuestionario:{" "}
                    <span className="ml-1 font-medium">
                      {perfil.cuestionarioVersion || "N/D"}
                    </span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#F8FBFD] px-3 py-1 border border-neutral-200">
                    Modelo:{" "}
                    <span className="ml-1 font-medium">
                      {perfil.modelVersion || "N/D"}
                    </span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#F8FBFD] px-3 py-1 border border-neutral-200">
                    Fecha de evaluación:{" "}
                    <span className="ml-1 font-medium">{fechaEvaluacion}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {loading && (
          <p className="text-sm text-neutral-600 text-center mb-4">
            Cargando resumen del alumno...
          </p>
        )}

        {!loading && err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && !perfil && (
          <p className="text-sm text-neutral-600 text-center">
            Este alumno aún no tiene un perfil generado para este grupo.
          </p>
        )}

        {!loading && !err && perfil && (
          <section className="space-y-8 mt-4">
            <div>
              <h2 className="text-base font-semibold text-[#06485A] mb-3">
                Perfil de personalidad (modelo Big Five reducido)
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-4 py-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#06485A]">
                    Extraversión
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    Tendencia a buscar la interacción social y la estimulación.
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">Puntaje</p>
                      <p className="text-xl font-semibold text-neutral-900">
                        {perfil.extraversionScore?.toFixed(1) ?? "-"}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border",
                        perfil.nivelExtraversion === "high"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : perfil.nivelExtraversion === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : perfil.nivelExtraversion === "low"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200",
                      ].join(" ")}
                    >
                      Nivel: {formatNivel(perfil.nivelExtraversion)}
                    </span>
                  </div>
                </article>

                <article className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-4 py-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#06485A]">
                    Responsabilidad
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    Organización, disciplina y orientación al logro.
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">Puntaje</p>
                      <p className="text-xl font-semibold text-neutral-900">
                        {perfil.conscientiousnessScore?.toFixed(1) ?? "-"}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border",
                        perfil.nivelConscientiousness === "high"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : perfil.nivelConscientiousness === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : perfil.nivelConscientiousness === "low"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200",
                      ].join(" ")}
                    >
                      Nivel: {formatNivel(perfil.nivelConscientiousness)}
                    </span>
                  </div>
                </article>

                <article className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-4 py-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#06485A]">
                    Amabilidad
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    Empatía, cooperación y orientación hacia los demás.
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">Puntaje</p>
                      <p className="text-xl font-semibold text-neutral-900">
                        {perfil.agreeablenessScore?.toFixed(1) ?? "-"}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border",
                        perfil.nivelAgreeableness === "high"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : perfil.nivelAgreeableness === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : perfil.nivelAgreeableness === "low"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200",
                      ].join(" ")}
                    >
                      Nivel: {formatNivel(perfil.nivelAgreeableness)}
                    </span>
                  </div>
                </article>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#06485A] mb-2">
                Mapa global del perfil
              </h2>
              <p className="text-[11px] text-neutral-500 mb-3">
                Esta gráfica muestra los tres rasgos principales en un solo
                mapa, permitiendo visualizar la forma general del perfil
                de personalidad del alumno.
              </p>

              <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                <AlumnoRadarChart
                  extraversionScore={perfil.extraversionScore}
                  conscientiousnessScore={perfil.conscientiousnessScore}
                  agreeablenessScore={perfil.agreeablenessScore}
                />
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#06485A] mb-2">
                Comparación visual del puntaje y percentiles
              </h2>
              <p className="text-[11px] text-neutral-500 mb-3">
                Las líneas punteadas marcan los percentiles 30 y 70 calculados
                con los datos que se entenó el modelo. Por debajo de P30 se considera nivel
                bajo, entre P30 y P70 nivel medio, y por encima de P70 nivel
                alto.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-[#06485A] mb-2">Extroversión</p>
                  <AlumnoBarChart
                    label="Extroversión"
                    score={perfil.extraversionScore}
                    p30={25}
                    p70={34}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-[#06485A] mb-2">Responsabilidad</p>
                  <AlumnoBarChart
                    label="Responsabilidad"
                    score={perfil.conscientiousnessScore}
                    p30={29}
                    p70={35}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-[#06485A] mb-2">Amabilidad</p>
                  <AlumnoBarChart
                    label="Amabilidad"
                    score={perfil.agreeablenessScore}
                    p30={33}
                    p70={39}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#06485A] mb-3">
                Recomendaciones y literatura asociada
              </h2>

              {recomendaciones.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  Aún no se han generado recomendaciones para este alumno.
                </p>
              ) : (
                <div className="space-y-3">
                  {recomendaciones.map((rec) => (
                    <article
                      key={rec.id}
                      className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#06485A] uppercase tracking-wide">
                          {rec.rasgo}
                        </span>
                        {rec.fuente && (
                          <span className="text-[11px] text-neutral-500 italic">
                            Fuente: {rec.fuente}
                          </span>
                        )}
                      </div>

                      {rec.estrategia && (
                        <p className="mt-2 text-sm text-neutral-800">
                          {rec.estrategia}
                        </p>
                      )}

                      {rec.habilidad_blanda && (
                        <p className="mt-1 text-xs text-neutral-600">
                          Habilidad blanda asociada:{" "}
                          <span className="font-medium">
                            {rec.habilidad_blanda}
                          </span>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}