# Ledgerly — Supabase keep-alive & health check

> A best-effort daily monitor that keeps the Supabase Free Plan project active and records whether the
> database was reachable.

Ledgerly's Supabase project runs on the **Free Plan**, which pauses projects after a stretch of low
activity. A paused project silently breaks cloud sync for everyone. This system runs a **Vercel Cron**
job once per day that calls a protected route handler, which in turn runs a **read-only** Supabase RPC.
It generates real database activity and leaves a clear success/failure trail in the Vercel logs.

**It never reads or writes budgeting data**, and it never exposes the cron secret, keys, or tokens.

---

## How it works

```
Vercel Cron (daily, 14:17 UTC)
  → GET /api/cron/supabase-keep-alive
      Authorization: Bearer <CRON_SECRET>   (injected by Vercel)
  → route verifies the Bearer secret
  → route calls supabase.rpc("ledgerly_health_check")   (anon key, read-only)
  → returns { ok, service, checkedAt, databaseResponded }
```

Pieces involved:

| Piece | Path |
| --- | --- |
| Health-check RPC (migration) | `supabase/migrations/002_keep_alive_health_check.sql` |
| Protected route handler | `src/app/api/cron/supabase-keep-alive/route.ts` |
| Cron schedule | `vercel.json` |
| In-app status card | Settings → Cloud Sync → **Database availability** |

The RPC `public.ledgerly_health_check()` returns only `{ ok, database_time, database }` — server time and
the database name. It touches **no tables**, so it cannot leak user rows, ids, emails, balances, or
transactions, and it cannot be used as a generic SQL proxy.

**Why a dedicated RPC instead of querying a table?** Every sync table is RLS-protected and user-scoped, so
an anon caller legitimately sees zero rows — an ambiguous health signal — and any table query risks
brushing personal data. The RPC returns a deterministic, data-free payload and keeps the attack surface
minimal.

---

## One-time setup

### 1. Supabase — create the health-check function

1. Open the Supabase project.
2. Go to **SQL Editor**.
3. Open `supabase/migrations/002_keep_alive_health_check.sql` from this repo and run its contents.
4. Verify the function exists (Database → Functions, or re-run the migration — it is idempotent via
   `create or replace`).
5. Test it directly from the SQL Editor:

   ```sql
   select public.ledgerly_health_check();
   ```

   Expected: a single JSON row like
   `{"ok": true, "database_time": "2026-07-11T14:17:00+00:00", "database": "postgres"}`.

### 2. Vercel — add the cron secret

1. Generate a long random secret:

   ```bash
   openssl rand -hex 32
   ```

   > Do **not** commit this value. It lives only in Vercel (and, for local testing, in your untracked
   > `.env.local`).

2. Go to the Ledgerly Vercel project → **Settings → Environment Variables**.
3. Add:

   ```text
   CRON_SECRET=<the-value-you-generated>
   ```

4. Scope it to **Production** (add it to Preview/Development too if you want to test there).
5. **Redeploy** the project so the new variable is available to the function.

**How the Bearer header gets there:** when a `CRON_SECRET` environment variable is present, Vercel Cron
automatically attaches `Authorization: Bearer $CRON_SECRET` to the scheduled request. The route validates
exactly that header, so no additional configuration is required beyond setting the variable and
redeploying. (Confirmed against the route implementation and current Vercel Cron conventions.)

The cron schedule itself is declared in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/supabase-keep-alive", "schedule": "17 14 * * *" }
  ]
}
```

That is once per day at **14:17 UTC** — a non-round minute to avoid top-of-hour contention, and within the
**Vercel Hobby** limit of one cron execution per day. Do not add more frequent schedules on Hobby.

---

## Testing the endpoint

Replace `YOUR-DOMAIN.com` with your deployment domain (or `localhost:3000` when running `npm run dev` with
`CRON_SECRET` set in `.env.local`).

### Unauthorized request → 401

```bash
curl -i https://YOUR-DOMAIN.com/api/cron/supabase-keep-alive
```

Expect: **HTTP 401**, body `{"ok":false,"service":"supabase","error":"Unauthorized"}`, no database query,
no secrets in the response.

### Authorized request → 200

```bash
curl -i \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR-DOMAIN.com/api/cron/supabase-keep-alive
```

Expect: **HTTP 200** with:

```json
{
  "ok": true,
  "service": "supabase",
  "checkedAt": "2026-07-11T12:00:00.000Z",
  "databaseResponded": true
}
```

### Failure test → 503

Temporarily point `NEXT_PUBLIC_SUPABASE_URL` at an invalid host locally (in `.env.local`) and repeat the
authorized request. Expect **HTTP 503** with a safe, summarized error and **no** secret leakage:

```json
{
  "ok": false,
  "service": "supabase",
  "checkedAt": "...",
  "databaseResponded": false,
  "error": "Database query failed"
}
```

Restore the real URL afterward.

---

## Confirming the daily cron ran

1. Open the **Vercel dashboard** and select the Ledgerly project.
2. Go to the **Cron Jobs** section (Settings → Cron Jobs) and confirm
   `/api/cron/supabase-keep-alive` is registered with the daily schedule.
3. Inspect the **latest invocation** to see when it last ran and the status code it returned.
4. Open **Function Logs** (Observability → Logs, filtered to the route).
5. Confirm a success line — `[keep-alive] Supabase reachable` — for a healthy run, or
   `[keep-alive] Supabase RPC failed: …` if the database was unreachable.

---

## Safeguards

- The RPC touches no tables, so the endpoint **cannot alter user data or enumerate users**.
- It **cannot be used as a generic Supabase proxy** — it calls one fixed, argument-free function.
- The route **authorizes before creating any Supabase client**, so unauthorized requests never reach the
  database.
- Responses set `Cache-Control: no-store` and the route uses `force-dynamic` / `revalidate = 0`, so the
  health response is **never cached**.
- **No service-role key** is introduced; only the already-public anon key is used.
- The secret, keys, tokens, authorization header, user emails, and budgeting data are **never logged or
  returned**.
- Existing authentication, PWA behavior, local Dexie data, and cloud sync are untouched.

---

## Limitation

> This external health check generates regular Supabase activity, but Supabase does not document it as a
> guaranteed way to prevent Free Plan pausing. Supabase Pro is the official option that guarantees
> projects will not be paused for inactivity.
