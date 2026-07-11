import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route is invoked by Vercel Cron once per day (see vercel.json). It runs a
// read-only Supabase RPC to keep the Free Plan project active and to record a
// reachability signal in the Vercel function logs. It must never be statically
// cached and must run per-request.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const RPC_TIMEOUT_MS = 8000;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString();

  // 1. Authorize. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
  //    CRON_SECRET env var is configured on the deployment. Reject anything else
  //    BEFORE creating a Supabase client so unauthorized requests never touch the DB.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    // Do not log the header, secret, or any request detail.
    console.warn("[keep-alive] Rejected unauthorized request");
    return jsonResponse(
      { ok: false, service: "supabase", error: "Unauthorized" },
      401
    );
  }

  // 2. Build a fresh anon-key client. The anon key is already a public frontend
  //    credential; no service-role key is used. A dedicated client (rather than the
  //    app's placeholder-fallback singleton) means a misconfigured env fails loudly.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[keep-alive] Supabase env vars missing");
    return jsonResponse(
      {
        ok: false,
        service: "supabase",
        checkedAt,
        databaseResponded: false,
        error: "Supabase is not configured",
      },
      503
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Call the read-only health-check RPC with a timeout so the request fails
  //    cleanly rather than hanging.
  try {
    const { error } = await supabase
      .rpc("ledgerly_health_check")
      .abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS));

    if (error) {
      // Only a short, summarized message is logged/returned — never keys or tokens.
      console.error(`[keep-alive] Supabase RPC failed: ${error.message}`);
      return jsonResponse(
        {
          ok: false,
          service: "supabase",
          checkedAt,
          databaseResponded: false,
          error: "Database query failed",
        },
        503
      );
    }

    console.log("[keep-alive] Supabase reachable");
    return jsonResponse(
      {
        ok: true,
        service: "supabase",
        checkedAt,
        databaseResponded: true,
      },
      200
    );
  } catch (err) {
    const summary =
      err instanceof Error && err.name === "TimeoutError"
        ? "Database request timed out"
        : "Database request failed";
    console.error(`[keep-alive] ${summary}`);
    return jsonResponse(
      {
        ok: false,
        service: "supabase",
        checkedAt,
        databaseResponded: false,
        error: summary,
      },
      503
    );
  }
}
