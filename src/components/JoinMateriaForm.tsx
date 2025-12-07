"use client";

import { useState } from "react";

export default function JoinMateriaForm({ alumnoId }: { alumnoId: string }) {
  const [materiaId, setMateriaId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!materiaId.trim() || isNaN(Number(materiaId))) {
      setErr("Ingresa un ID de materia válido.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/alumno/materias/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaId: Number(materiaId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "No se pudo unir a la materia.");
        return;
      }

      setMsg("Te has unido correctamente a la materia.");
      setMateriaId("");
    } catch {
      setErr("Error al unirte a la materia. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleJoin}
      className="max-w-sm mx-auto flex flex-col gap-3 text-left"
    >
      <label className="text-sm font-medium text-neutral-700">
        ID de la materia
      </label>
      <input
        type="text"
        value={materiaId}
        onChange={(e) => setMateriaId(e.target.value)}
        placeholder="Ej. 4"
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-[#06485A] mb-3 focus:outline-none focus:ring-2 focus:ring-[#006699]"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-[#006699] text-white px-4 py-2 text-sm font-semibold hover:bg-[#00557a] disabled:opacity-60 transition"
      >
        {loading ? "Uniendo..." : "Unirme a la materia"}
      </button>

      {err && <p className="text-red-600 text-sm">{err}</p>}
      {msg && <p className="text-emerald-700 text-sm">{msg}</p>}
    </form>
  );
}