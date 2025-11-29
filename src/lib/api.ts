export async function postJson<T = any>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || "Error en la solicitud";
    const error = new Error(message) as Error & { status?: number; body?: any };
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data as T;
}