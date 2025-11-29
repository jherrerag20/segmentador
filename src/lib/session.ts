import { NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "psess";

export type Sess = {
  uid: string;                 // id de Usuario
  rol: "student" | "teacher";
};

// ─────────────────────────────────────────────
// helpers base64url
// ─────────────────────────────────────────────
function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function encode(sess: Sess): string {
  return toBase64Url(JSON.stringify(sess));
}

// ⬇️ exportado para usar en Server Components
export function decode(raw?: string | null): Sess | null {
  if (!raw) return null;
  try {
    return JSON.parse(fromBase64Url(raw)) as Sess;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Leer sesión desde el Request
// ─────────────────────────────────────────────
export function getSessionFromRequest(req: NextRequest): Sess | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return decode(raw);
}

// ─────────────────────────────────────────────
// Guardar sesión en cookie (login)
// ─────────────────────────────────────────────
export function setSessionOnResponse(
  res: NextResponse,
  sess: Sess
): NextResponse {
  res.cookies.set({
    name: COOKIE_NAME,
    value: encode(sess),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}

// ─────────────────────────────────────────────
// Eliminar sesión (logout)
// ─────────────────────────────────────────────
export function clearSessionOnResponse(res: NextResponse): NextResponse {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // eliminar cookie
  });
  return res;
}