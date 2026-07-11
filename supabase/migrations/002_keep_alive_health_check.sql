-- Keep-alive health check: read-only RPC used by the external Vercel Cron
-- monitor to exercise the database daily and confirm reachability.
-- Returns NO user data (no rows, ids, emails, balances, transactions).
-- security invoker: runs as the caller (anon); it never touches any table,
-- so RLS is not a factor and SECURITY DEFINER is unnecessary.

-- ─── Health check function ─────────────────────────────────
create or replace function public.ledgerly_health_check()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'database_time', now(),
    'database', current_database()
  );
$$;

comment on function public.ledgerly_health_check() is
  'Read-only keep-alive/health probe for the Vercel Cron monitor. Returns server time and database name only; exposes no user data. Safe to grant to anon.';

-- Grant execute only to the roles that need it; the Vercel route uses the anon key.
revoke all on function public.ledgerly_health_check() from public;
grant execute on function public.ledgerly_health_check() to anon, authenticated;
