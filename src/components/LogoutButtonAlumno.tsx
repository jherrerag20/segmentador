"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButtonAlumno() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Si el backend responde 200, ya borró la cookie
      if (res.ok) {
        router.push("/auth/login");
      } else {
        // Fallback: aunque algo falle, lo mandamos al login
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-neutral-300 text-neutral-800 font-semibold hover:bg-neutral-100 transition disabled:opacity-60"
      style={{ padding: "10px 28px" }}
    >
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}