import { NextRequest, NextResponse } from "next/server";
import { clearSessionOnResponse } from "@/lib/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  return clearSessionOnResponse(res);
}