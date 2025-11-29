import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

const PROTECTED_PREFIXES = ["/alumno", "/docente"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const sess = getSessionFromRequest(req);
  if (!sess) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/alumno") && sess.rol !== "student") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/docente") && sess.rol !== "teacher") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/alumno/:path*", "/docente/:path*"],
};