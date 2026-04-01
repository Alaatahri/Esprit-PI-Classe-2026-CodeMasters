import { NextRequest, NextResponse } from "next/server";

/**
 * Relais vers l'API NestJS (port 3001 par défaut).
 * Plus fiable que `rewrites` seuls (Turbopack / Windows / pare-feu).
 *
 * Définir `BACKEND_ORIGIN` si le backend n'est pas sur 127.0.0.1:3001
 * (ex. `http://localhost:3001`).
 */
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN?.replace(/\/$/, "") || "http://localhost:3001";

export const dynamic = "force-dynamic";
/** Obligatoire pour que le relais puisse joindre localhost / le réseau local. */
export const runtime = "nodejs";

type Ctx = { params: Promise<{ path?: string[] }> };

async function proxy(req: NextRequest, context: Ctx): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const sub = Array.isArray(segments) ? segments.join("/") : "";
  const target = `${BACKEND_ORIGIN}/api/${sub}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "host" || k === "connection") return;
    headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body:
        body !== undefined && body.byteLength > 0 ? body : undefined,
      signal: AbortSignal.timeout(120_000),
    });

    const out = new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
    });
    res.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk === "transfer-encoding") return;
      out.headers.set(key, value);
    });
    return out;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Connexion refusée ou timeout";
    return NextResponse.json(
      {
        error: "backend_unreachable",
        message:
          `Impossible d'atteindre le backend (${BACKEND_ORIGIN}). ` +
          `Démarrez : cd backend && npm run start:dev. ` +
          `Sinon définissez BACKEND_ORIGIN (ex. http://localhost:3001). ` +
          `Détail : ${msg}`,
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
