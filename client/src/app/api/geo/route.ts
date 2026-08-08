import { NextResponse } from "next/server";
import { headers } from "next/headers";

/** Vercel resolves the visitor's country at the edge and exposes it on every
 *  request. Reading the header is the whole implementation: no IP is read,
 *  nothing is logged, nothing is stored, and no third-party service is called.
 *  The response carries a two-letter country code and nothing else. */
const VERCEL_COUNTRY_HEADER = "x-vercel-ip-country";

/** Header-dependent by definition, so it can never be prerendered or shared:
 *  a cached answer would hand one visitor's country to everybody else. */
export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const raw = requestHeaders.get(VERCEL_COUNTRY_HEADER)?.trim().toUpperCase();

  // Absent off Vercel (local dev, self-hosted preview) and for requests the
  // edge could not place. `null` is a valid answer meaning "unknown" — the
  // caller falls back to its own default rather than guessing.
  const country = raw && /^[A-Z]{2}$/.test(raw) ? raw : null;

  return NextResponse.json(
    { country },
    { headers: { "Cache-Control": "no-store" } }
  );
}
