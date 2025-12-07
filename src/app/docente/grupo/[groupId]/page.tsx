"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TraitKey = "extraversion" | "conscientiousness" | "agreeableness";
type LevelKey = "low" | "medium" | "high";

type AlumnoRow = {
  alumnoId: string;
  nombreCompleto: string;
  haContestado: boolean;
  extraversionLevel: string | null;
  conscientiousnessLevel: string | null;
  agreeablenessLevel: string | null;
};

type Summary = {
  extraversion: Record<LevelKey, number>;
  conscientiousness: Record<LevelKey, number>;
  agreeableness: Record<LevelKey, number>;
};

type GroupDetailResponse = {
  ok: boolean;
  error?: string;
  group?: {
    id: number;
    nombre: string;           // nombre de la materia
    grupo: string | null;     // clave 7BM1, etc.
    generacion: string | null;
  };
  alumnos?: AlumnoRow[];
  summary?: Summary;
};

const TRAIT_LABELS: Record<TraitKey, string> = {
  extraversion: "Extroversión",
  conscientiousness: "Responsabilidad",
  agreeableness: "Amabilidad",
};

const LEVEL_LABELS: Record<LevelKey, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export default function GrupoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = typeof params.groupId === "string" ? params.groupId : "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GroupDetailResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Filtros
  const [selectedTrait, setSelectedTrait] = useState<TraitKey | "">("");
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | "">("");

  useEffect(() => {
    if (!groupId) return;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/docente/grupos/${groupId}/alumnos`);
        const json: GroupDetailResponse = await res.json();

        if (!res.ok || !json.ok) {
          setErr(json.error || "No autorizado o error al cargar el grupo.");
          setData(null);
          return;
        }

        setData(json);
      } catch {
        setErr("Error al cargar los datos del grupo.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [groupId]);

  const group = data?.group;
  const alumnos = data?.alumnos ?? [];
  const summary = data?.summary;

  // Alumnos filtrados según rasgo / nivel
  const alumnosFiltrados = useMemo(() => {
    if (!selectedTrait || !selectedLevel) return alumnos;

    const fieldMap: Record<TraitKey, keyof AlumnoRow> = {
      extraversion: "extraversionLevel",
      conscientiousness: "conscientiousnessLevel",
      agreeableness: "agreeablenessLevel",
    };

    const field = fieldMap[selectedTrait];

    return alumnos.filter((a) => {
      const level = a[field];
      return level === selectedLevel;
    });
  }, [alumnos, selectedTrait, selectedLevel]);

  const filtroActivo = selectedTrait && selectedLevel;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-neutral-200 rounded-2xl px-8 py-8 shadow-sm">
        {/* FILA SUPERIOR: Botón volver */}
        <div className="mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push("/docente")}
            className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-[#00557a] transition"
          >
            Volver al panel
          </button>
        </div>

        {/* HEADER CENTRADO */}
        <header className="mb-6 text-center">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-4" />

          <h1 className="text-2xl sm:text-3xl font-bold text-[#06485A]">
            Resultados de la materia
          </h1>

          {group && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-neutral-700">
                Materia{" "}
                <span className="font-semibold text-neutral-900">
                  {group.nombre}
                </span>
              </p>

              <div className="flex flex-wrap gap-2 justify-center mt-1">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-700 border border-neutral-300">
                  Grupo {group.grupo || "no especificado"}
                </span>

                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-700 border border-neutral-300">
                  Generación {group.generacion || "no especificada"}
                </span>

                <span className="inline-flex items-center rounded-full bg-[#E6F2F7] px-3 py-1 text-[11px] font-medium text-[#06485A] border border-[#006699]/40">
                  ID del grupo: {group.id}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* ESTADOS */}
        {loading && (
          <p className="text-sm text-neutral-600 text-center mb-4">
            Cargando información del grupo...
          </p>
        )}

        {!loading && err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && !group && (
          <p className="text-sm text-neutral-600 text-center">
            No se encontró la información del grupo.
          </p>
        )}

        {/* CONTENIDO PRINCIPAL */}
        {!loading && !err && group && (
          <section className="mt-2 space-y-8">
            {/* PANEL DE RESUMEN */}
            {summary && (
              <div>
                <h2 className="text-base font-semibold text-[#06485A] mb-3">
                  Resumen de perfiles del grupo
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {(
                    ["extraversion", "conscientiousness", "agreeableness"] as TraitKey[]
                  ).map((trait) => (
                    <article
                      key={trait}
                      className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-4 py-4 text-sm shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                    >
                      <h3 className="text-sm font-semibold text-[#06485A] mb-2">
                        {TRAIT_LABELS[trait]}
                      </h3>
                      <dl className="space-y-1 text-xs text-neutral-700">
                        {(Object.keys(summary[trait]) as LevelKey[]).map((lvl) => (
                          <div key={lvl} className="flex justify-between">
                            <dt className="font-medium">
                              {LEVEL_LABELS[lvl]}:
                            </dt>
                            <dd className="text-neutral-900 font-semibold">
                              {summary[trait][lvl]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* FILTROS */}
            <div className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-4 py-4">
              <h3 className="text-sm font-semibold text-[#06485A] mb-3">
                Filtrar alumnos por rasgo y nivel
              </h3>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Rasgo
                  </label>
                  <select
                    value={selectedTrait}
                    onChange={(e) =>
                      setSelectedTrait(e.target.value as TraitKey | "")
                    }
                    className="
                      appearance-none
                      rounded-lg
                      border border-neutral-300
                      bg-white
                      px-4 py-2.5
                      text-sm
                      text-neutral-800
                      shadow-sm
                      transition
                      focus:border-[#006699]
                      focus:ring-2
                      focus:ring-[#006699]/30
                      hover:border-neutral-400
                      relative
                      cursor-pointer
                    "
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666666'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "14px",
                    }}
                  >
                    <option value="">Todos los rasgos</option>
                    <option value="extraversion">Extroversión</option>
                    <option value="conscientiousness">Responsabilidad</option>
                    <option value="agreeableness">Amabilidad</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Nivel
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) =>
                      setSelectedLevel(e.target.value as LevelKey | "")
                    }
                    className="
                      appearance-none
                      rounded-lg
                      border border-neutral-300
                      bg-white
                      px-4 py-2.5
                      text-sm
                      text-neutral-800
                      shadow-sm
                      transition
                      focus:border-[#006699]
                      focus:ring-2
                      focus:ring-[#006699]/30
                      hover:border-neutral-400
                      relative
                      cursor-pointer
                    "
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666666'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "14px",
                    }}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="low">Bajo</option>
                    <option value="medium">Medio</option>
                    <option value="high">Alto</option>
                  </select>
                </div>

                <div className="flex flex-row gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrait("");
                      setSelectedLevel("");
                    }}
                    className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {filtroActivo && (
                <p className="mt-3 text-[11px] text-neutral-500">
                  Mostrando alumnos con{" "}
                  <b>{TRAIT_LABELS[selectedTrait as TraitKey]}</b> en nivel{" "}
                  <b>{LEVEL_LABELS[selectedLevel as LevelKey]}</b>.
                </p>
              )}
            </div>

            {/* TABLA DE ALUMNOS */}
            <div>
              <h2 className="text-base font-semibold text-[#06485A] mb-3">
                Alumnos inscritos
              </h2>

              {alumnosFiltrados.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  {filtroActivo
                    ? "No hay alumnos que coincidan con el rasgo y nivel seleccionados."
                    : "Aún no hay alumnos inscritos en este grupo."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F8FBFD] text-neutral-600">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">
                          Alumno
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Estado del cuestionario
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map((a) => (
                        <tr
                          key={a.alumnoId}
                          className="border-t border-neutral-100 hover:bg-neutral-50"
                        >
                          <td className="px-6 py-4 align-middle">
                            <span className="font-medium text-neutral-900">
                              {a.nombreCompleto}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            {a.haContestado ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                                Contestó
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 align-middle">
                            {a.haContestado ? (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/docente/grupo/${groupId}/alumno/${a.alumnoId}`
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-[#00557a] transition"
                              >
                                Ver resumen
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-600">
                                Sin resultados aún
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}