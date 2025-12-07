"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  ok: boolean;
  sess?: { uid: string; rol: "student" | "teacher" };
  user?: {
    email?: string;
    rol?: "student" | "teacher";
    nombre?: string;
    apellido?: string;
  };
};

type GrupoDocenteDTO = {
  id: number;
  nombre: string;              // nombre de la materia
  grupo: string | null;        // clave de grupo (7BM1, 3CM1, etc.)
  generacion: string | null;
  alumnosCount: number;
  perfilesCount: number;
};

export default function DocenteDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [groups, setGroups] = useState<GrupoDocenteDTO[]>([]);

  const [err, setErr] = useState<string | null>(null);

  // UI extra: crear / unirse
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [createNombre, setCreateNombre] = useState("");      // nombre materia
  const [createGrupo, setCreateGrupo] = useState("");        // clave grupo
  const [createGeneracion, setCreateGeneracion] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinId, setJoinId] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // 1) Obtener sesión y validar que sea docente
  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setErr("No se pudo obtener tu sesión. Vuelve a iniciar sesión.");
          setLoading(false);
          return;
        }

        const data: MeResponse = await res.json();

        if (!data.ok || !data.sess || data.sess.rol !== "teacher") {
          setErr("Debes iniciar sesión como docente para acceder a este panel.");
          setLoading(false);
          return;
        }

        setMe(data);
      } catch {
        setErr("Error al obtener tu sesión. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    void loadMe();
  }, []);

  // 2) Cargar grupos del docente cuando ya tenemos sesión válida
  useEffect(() => {
    if (!me || !me.sess || me.sess.rol !== "teacher") return;

    async function loadGroups() {
      try {
        setGroupsLoading(true);
        setErr(null);

        const res = await fetch("/api/docente/grupos");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setErr(data.error || "No se pudieron cargar tus grupos.");
          return;
        }

        setGroups(data.groups || []);
      } catch {
        setErr("Error al cargar grupos. Intenta nuevamente.");
      } finally {
        setGroupsLoading(false);
      }
    }

    void loadGroups();
  }, [me]);

  const nombreUsuario =
    me?.user?.nombre || me?.user?.apellido
      ? `${me?.user?.nombre ?? ""} ${me?.user?.apellido ?? ""}`.trim()
      : me?.user?.email || "docente";

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/auth/login");
      } else {
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    }
  }

  // ---- Handlers: crear grupo/materia ----
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!createNombre.trim()) {
      setCreateError("El nombre de la materia es obligatorio.");
      return;
    }
    if (!createGrupo.trim()) {
      setCreateError("El grupo es obligatorio (por ejemplo, 7BM1).");
      return;
    }
    if (!createGeneracion.trim()) {
      setCreateError("La generación es obligatoria (por ejemplo, 2025-2).");
      return;
    }

    try {
      setCreateLoading(true);

      const res = await fetch("/api/docente/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: createNombre.trim(),
          grupo: createGrupo.trim(),
          generacion: createGeneracion.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setCreateError(data.error || "No se pudo crear la materia.");
        return;
      }

      const newGroup = data.group as GrupoDocenteDTO;
      setGroups((prev) => [...prev, newGroup]);

      setCreateNombre("");
      setCreateGrupo("");
      setCreateGeneracion("");
      setShowCreate(false);
    } catch {
      setCreateError("Error al crear la materia. Intenta de nuevo.");
    } finally {
      setCreateLoading(false);
    }
  }

  // ---- Handlers: unirse a grupo ----
  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);

    const groupIdNum = Number(joinId);
    if (!groupIdNum || Number.isNaN(groupIdNum)) {
      setJoinError("Ingresa un ID de grupo válido.");
      return;
    }

    try {
      setJoinLoading(true);

      const res = await fetch("/api/docente/grupos/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupIdNum }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setJoinError(data.error || "No se pudo unir al grupo.");
        return;
      }

      const joined = data.group as GrupoDocenteDTO;

      setGroups((prev) => {
        const exists = prev.some((g) => g.id === joined.id);
        if (exists) return prev;
        return [...prev, joined];
      });

      setJoinId("");
      setShowJoin(false);
    } catch {
      setJoinError("Error al unirse al grupo. Intenta de nuevo.");
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-2xl px-8 py-8 shadow-sm">
        {/* Barra superior: logout */}
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-[#00557a] transition"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Header centrado */}
        <header className="mb-8 text-center">
          <div className="mx-auto h-1 w-24 rounded-full bg-[#006699] mb-5" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#06485A]">
            Panel de docente
          </h1>

          <p className="text-sm text-neutral-600 mt-2">
            Bienvenido{" "}
            <span className="font-semibold text-[#06485A]">
              {nombreUsuario}
            </span>
            !
          </p>

          <p className="text-sm text-neutral-600 mt-2">
            Aquí podrás consultar tus grupos y los resultados de tus alumnos.
          </p>
        </header>

        {/* Estados globales */}
        {loading && (
          <p className="text-sm text-neutral-600 text-center mb-4">
            Cargando tu sesión...
          </p>
        )}

        {!loading && err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Si no hay sesión válida */}
        {!loading && !err && (!me || !me.sess || me.sess.rol !== "teacher") && (
          <div className="text-center mt-4">
            <p className="text-sm text-neutral-700 mb-3">
              No se encontró una sesión válida de docente.
            </p>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-[#00557a] transition"
            >
              Ir a iniciar sesión
            </button>
          </div>
        )}

        {/* Contenido principal */}
        {!loading && !err && me && me.sess?.rol === "teacher" && (
          <section className="mt-2 space-y-8">
            {/* Barra de acciones */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#06485A]">
                  Mis grupos
                </h2>
                {groupsLoading && (
                  <span className="text-xs text-neutral-500">
                    Cargando grupos...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate((v) => !v);
                    setShowJoin(false);
                  }}
                  className="rounded-md border border-[#006699] bg-white px-4 py-1.5 text-sm font-semibold text-[#006699] hover:bg-[#E6F2F7] transition"
                >
                  Crear nueva materia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoin((v) => !v);
                    setShowCreate(false);
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Unirme a materia
                </button>
              </div>
            </div>

            {/* Formulario: crear grupo/materia */}
            {showCreate && (
              <form
                onSubmit={handleCreateGroup}
                className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-5 py-4 grid gap-4 sm:grid-cols-[1.5fr_0.8fr_0.9fr_auto]"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Nombre de la materia
                  </label>
                  <input
                    type="text"
                    value={createNombre}
                    onChange={(e) => setCreateNombre(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#006699]/40"
                    placeholder="Ej. Programación Orientada a Objetos"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Grupo
                  </label>
                  <input
                    type="text"
                    value={createGrupo}
                    onChange={(e) => setCreateGrupo(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#006699]/40"
                    placeholder="Ej. 7BM1"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Generación
                  </label>
                  <input
                    type="text"
                    value={createGeneracion}
                    onChange={(e) => setCreateGeneracion(e.target.value)}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#006699]/40"
                    placeholder="Ej. 2025-2"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full rounded-md bg-[#006699] text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-[#00557a] disabled:opacity-60 transition"
                  >
                    {createLoading ? "Creando..." : "Crear materia"}
                  </button>
                </div>

                {createError && (
                  <p className="sm:col-span-4 text-xs text-red-600 mt-1">
                    {createError}
                  </p>
                )}
              </form>
            )}

            {/* Formulario: unirse a grupo */}
            {showJoin && (
              <form
                onSubmit={handleJoinGroup}
                className="rounded-xl border border-neutral-200 bg-[#F8FBFD] px-5 py-6 shadow-sm"
              >
                <div className="flex flex-col gap-1 max-w-md mx-auto">
                  <label className="text-sm font-medium text-neutral-700">
                    ID de la materia
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="Ej. 1"
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 bg-white 
                              focus:outline-none focus:ring-2 focus:ring-[#006699] focus:border-[#006699]
                              shadow-sm"
                    style={{ appearance: "none" }}
                  />

                  <span className="text-[11px] text-neutral-500 mt-1">
                    Usa el ID numérico de la materia que te compartieron.
                  </span>
                </div>

                <div className="mt-5 flex justify-center">
                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="rounded-md bg-[#006699] text-white px-6 py-2 text-sm font-semibold 
                              shadow-sm hover:bg-[#00557a] disabled:opacity-60 transition"
                  >
                    {joinLoading ? "Uniendo..." : "Unirme"}
                  </button>
                </div>

                {joinError && (
                  <p className="mt-3 text-xs text-red-600 text-center">
                    {joinError}
                  </p>
                )}
              </form>
            )}

            {/* Lista de grupos */}
            {groups.length === 0 && !groupsLoading && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-600">
                Todavía no tienes grupos asociados. Crea uno nuevo o únete a un
                grupo existente.
              </div>
            )}

            {groups.length > 0 && (
              <div className="mt-1 grid gap-5 md:grid-cols-2 place-items-center">
                {groups.map((g) => (
                  <article
                    key={g.id}
                    className="w-full max-w-md rounded-xl border border-neutral-200 bg-[#F8FBFD] px-6 py-5 flex flex-col items-center text-center shadow-[0_1px_3px_rgba(15,23,42,0.08)] hover:shadow-md hover:border-[#006699]/50 transition"
                  >
                    {/* Nombre de la materia */}
                    <h3 className="text-lg font-semibold text-[#06485A]">
                      {g.nombre}
                    </h3>

                    {/* Grupo */}
                    <span className="mt-2 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
                      Grupo {g.grupo || "no especificado"}
                    </span>

                    {/* Generación */}
                    <span className="mt-1 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
                      Gen. {g.generacion || "no especificada"}
                    </span>

                    {/* ID del grupo */}
                    <span className="mt-2 inline-flex items-center rounded-md bg-[#E6F2F7] px-3 py-1 text-xs font-medium text-[#06485A] border border-[#006699]/30">
                      ID de la materia: <b className="ml-1">{g.id}</b>
                    </span>

                    {/* Stats */}
                    <div className="mt-4 space-y-1 text-sm text-neutral-800">
                      <p>
                        Alumnos inscritos:{" "}
                        <span className="font-semibold text-neutral-900">
                          {g.alumnosCount}
                        </span>
                      </p>
                      <p>
                        Perfiles generados:{" "}
                        <span className="font-semibold text-neutral-900">
                          {g.perfilesCount}
                        </span>
                      </p>
                    </div>

                    {/* Botón */}
                    <button
                      type="button"
                      onClick={() => router.push(`/docente/grupo/${g.id}`)}
                      className="mt-6 inline-flex items-center justify-center rounded-md bg-[#006699] text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-[#00557a] transition"
                    >
                      Ver materia
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}