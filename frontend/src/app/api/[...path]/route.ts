import { NextRequest, NextResponse } from "next/server";

/**
 * Relais vers l'API NestJS (port 3001 par défaut).
 * Plus fiable que `rewrites` seuls (Turbopack / Windows / pare-feu).
 *
 * Défaut : `http://127.0.0.1:3001` (évite souvent l’échec `fetch failed` avec
 * `localhost` → IPv6 ::1 alors que Nest écoute en IPv4). Surcharge : BACKEND_ORIGIN.
 */
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN?.replace(/\/$/, "") || "http://127.0.0.1:3001";

/** Si la 1ʳᵉ requête échoue (localhost vs 127.0.0.1), on retente une fois. */
function alternateLoopbackOrigin(origin: string): string | null {
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString().replace(/\/$/, "");
    }
    if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      return u.toString().replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const dynamic = "force-dynamic";
/** Obligatoire pour que le relais puisse joindre localhost / le réseau local. */
export const runtime = "nodejs";

type Ctx = { params: Promise<{ path?: string[] }> };

async function proxy(req: NextRequest, context: Ctx): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const sub = Array.isArray(segments) ? segments.join("/") : "";
  const pathAndQuery = `/api/${sub}${req.nextUrl.search}`;

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

  // Multipart / binaire : laisser fetch recalculer Content-Length (évite 400 côté Nest/multer)
  if (body !== undefined && body.byteLength > 0) {
    headers.delete("content-length");
    headers.delete("transfer-encoding");
  }

  const fetchInit: RequestInit = {
    method: req.method,
    headers,
    body: body !== undefined && body.byteLength > 0 ? body : undefined,
    signal: AbortSignal.timeout(120_000),
  };

  async function forward(origin: string) {
    return fetch(`${origin}${pathAndQuery}`, fetchInit);
  }

  try {
    const res = await forward(BACKEND_ORIGIN);
    return pipeResponse(res);
  } catch (e) {
    const alt = alternateLoopbackOrigin(BACKEND_ORIGIN);
    if (alt) {
      try {
        const res = await forward(alt);
        return pipeResponse(res);
      } catch {
        /* erreur réseau sur les deux origines */
      }
    }
    const msg =
      e instanceof Error ? e.message : "Connexion refusée ou timeout";
    return NextResponse.json(
      {
        error: "backend_unreachable",
        message:
          `Impossible d'atteindre le backend (${BACKEND_ORIGIN}). ` +
          `Démarrez : cd backend && npm run start:dev. ` +
          `Sinon définissez BACKEND_ORIGIN (ex. http://127.0.0.1:3001). ` +
          `Détail : ${msg}`,
      },
      { status: 502 },
    );
  }
}

function pipeResponse(res: Response): NextResponse {
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
