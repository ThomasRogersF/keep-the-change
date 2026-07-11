# Ledgerly

A local-first personal budgeting web app. Tracks expenses, subscriptions, variable monthly income, and savings goals, with optional Supabase cloud sync across devices.

The repository is named `keep-the-change` for historical reasons; the product is **Ledgerly**.

> Status: feature-complete vs. original spec, plus magic-link auth, goals (sinking funds), and two-way Supabase cloud sync. See [`docs/audit-2026-05-18.md`](docs/audit-2026-05-18.md) for the current punch list.

---

## Features

- **Dashboard** with monthly KPIs (expenses, income, net, upcoming subscriptions), a 6-month trend chart, a category breakdown donut, and recent transactions.
- **Transactions** with search, date / category / account / amount filters, and a quick-add form that can optionally link a purchase to a savings goal.
- **Subscriptions** with weekly / monthly / yearly cadences and an "upcoming renewals" grouping.
- **Income** as a separate variable-monthly ledger (not just `type=income` transactions).
- **Goals** — sinking-fund style. Goals are virtual allocations on top of a main account; you contribute (allocations) and optionally link a real purchase against a goal (spend links). Goals do not change your bank balance.
- **Accounts** of two kinds: `main` (counts in budget KPIs) and `external` (investments / emergency funds, tracked separately).
- **Settings** — theme, currency, demo data, JSON export/import, and full cloud-sync configuration with per-table stats and a sync log viewer.
- **Cloud sync** — magic-link auth, two-way Supabase sync with per-table high-water marks, soft-delete tombstones, remote-wins conflict resolution, exponential backoff, online/offline awareness, and a 3-strategy initial-sync wizard (keep local / use cloud / merge).
- **Local-first** — IndexedDB via Dexie. The app works offline; sync is optional and additive.
- **Light / Dark / System theme**, responsive layout (sidebar on desktop, bottom nav + floating FAB on mobile).

---

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) on React 19
- TypeScript 5.9
- [TailwindCSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [lucide-react](https://lucide.dev/)
- [Dexie 4](https://dexie.org/) for IndexedDB persistence
- [Supabase JS](https://supabase.com/docs/reference/javascript) for auth + cloud sync
- [Zustand](https://github.com/pmndrs/zustand) (persisted) for client state (settings, UI, filters)
- [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) for forms and validation
- [Recharts](https://recharts.org/) for charts
- [date-fns](https://date-fns.org/) for dates
- [Sonner](https://sonner.emilkowal.ski/) for toasts

---

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project if you want cloud sync (the app works fully offline without one)

### Install & run

```bash
npm install
npm run dev
```

App boots at <http://localhost:3000>. The first route is `/login` (magic-link auth). Without Supabase env vars the login screen will error on submit; you can still use the app fully offline by short-circuiting auth (see "Local-only mode" below).

### Environment

Create `.env.local` at the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Then run the migration in `supabase/migrations/001_sync_tables.sql` against your Supabase project to create the 9 sync tables with RLS policies.

For the optional daily Supabase keep-alive (a Vercel Cron health check that keeps a Free Plan project active), also run `supabase/migrations/002_keep_alive_health_check.sql` and add a **server-only** `CRON_SECRET` to Vercel (not `.env.local` in production; only set it locally to test the endpoint). It is distinct from the two public `NEXT_PUBLIC_` keys above. See [`docs/SUPABASE_KEEP_ALIVE.md`](docs/SUPABASE_KEEP_ALIVE.md) for setup, testing, and limitations.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) at <http://localhost:3000> |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |

### Local-only mode

Cloud sync is opt-in (Settings → Cloud Sync). If you don't want to set up Supabase, the auth gate still applies — log in with any magic-link-capable email or stub out `AuthGuard` in `src/app/(app)/layout.tsx`. All CRUD works against IndexedDB regardless of sync state.

---

## Project layout

```
src/
├── app/
│   ├── (app)/              # Auth-gated app shell — dashboard, transactions, etc.
│   │   ├── layout.tsx      # AuthGuard + AutoSyncProvider + AppShell
│   │   ├── page.tsx        # Dashboard
│   │   ├── transactions/
│   │   ├── subscriptions/
│   │   ├── income/
│   │   ├── goals/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── accounts/
│   │   └── settings/
│   ├── login/              # Magic-link auth screen
│   └── layout.tsx          # Root layout (theme + auth providers)
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── layout/             # Sidebar, mobile nav, mobile add sheet, app shell, theme provider
│   ├── dashboard/          # Stat cards, charts, recent-transactions, goals widget
│   ├── transactions/       # List, form, filters
│   ├── subscriptions/      # List + form
│   ├── income/             # Table + form + month selector
│   ├── accounts/           # List + form
│   ├── goals/              # Card, form, allocation form, spend-link form, progress bar, activity list
│   ├── settings/           # Settings content
│   ├── sync/               # Sync status, initial-sync wizard, offline banner, log viewer, auto-sync provider
│   └── shared/             # Empty state, etc.
└── lib/
    ├── auth/               # Supabase AuthProvider + useAuth
    ├── db/
    │   ├── database.ts     # Dexie schema (v3) with upgrade migrations
    │   ├── repositories/   # One per entity, all extend base.repository
    │   └── seed.ts         # Demo data, clearAllData, exportAllData, importData
    ├── schemas/            # Zod schemas for each entity
    ├── hooks/              # useLiveQuery-based hooks per entity + useDashboard
    ├── services/           # Cross-entity logic (e.g. goal cascade delete)
    ├── stores/             # Zustand: settings, ui, filters
    ├── sync/               # Two-way Supabase sync engine
    │   ├── sync-engine.ts  # Push/pull engine, per-table HWMs, conflict resolution
    │   ├── table-descriptors.ts  # local↔remote field mapping per entity
    │   ├── initial-sync.ts # keep-local / use-cloud / merge strategies
    │   ├── use-sync.ts     # auto-sync hook (mount, interval, online events, backoff)
    │   └── types.ts
    ├── supabase/client.ts  # Supabase JS client
    ├── types/index.ts      # Domain types (Account, Transaction, Goal, ...)
    └── utils/              # constants, formatters
supabase/
└── migrations/
    └── 001_sync_tables.sql # 9 tables + RLS policies (mirrors Dexie schema)
```

---

## Data model

Nine entities, all carrying `createdAt`, `updatedAt`, and `deletedAt` (soft-delete) for sync:

- `Account` — `{ name, type: "main" | "external", currency }`
- `Category` — `{ name, icon, colorToken }`
- `Merchant` — `{ name }`
- `Transaction` — `{ date, amount, type: "expense" | "income", accountId, categoryId?, merchantId?, note?, tags[] }`
- `Subscription` — `{ name, amount, cadence: "weekly" | "monthly" | "yearly", nextRenewalDate, accountId, active }`
- `IncomeEntry` — `{ month: "YYYY-MM", source, amount, note? }`
- `Goal` — `{ name, targetAmount, targetDate?, accountId, archived }`
- `GoalAllocation` — `{ goalId, date, amount, note? }`
- `GoalSpendLink` — `{ goalId, transactionId, amountApplied }`

**Budget rules**

- "Main budget" KPIs include expenses on `main` accounts + income from `IncomeEntry` (not from `type=income` transactions).
- `external` accounts are tracked separately and never enter dashboard KPIs.
- A goal's "saved" amount is `sum(allocations) − sum(spend_links)`.

---

## Cloud sync, briefly

1. Local Dexie is the source of truth while offline.
2. Each entity has a `TableDescriptor` (`src/lib/sync/table-descriptors.ts`) that maps camelCase local rows to snake_case Supabase rows.
3. The sync engine (`src/lib/sync/sync-engine.ts`) runs **push then pull** per table, gated by a per-table high-water mark stored in a Dexie `syncState` row.
4. Conflict resolution is **remote wins when `remote.updated_at > local.updated_at`** (strictly greater — see audit P1#7 for the tie-break note).
5. A module-level mutex prevents concurrent syncs; manual triggers queue behind an in-flight run.
6. `use-sync.ts` adds 5-minute auto-interval, online-event triggers, and exponential backoff (10s → 5 min) with auth-vs-network error classification.
7. On first enabling sync, the user picks a strategy in the initial-sync wizard: **keep local**, **use cloud**, or **merge**.

---

## Roadmap / known gaps

See [`docs/audit-2026-05-18.md`](docs/audit-2026-05-18.md) for the prioritized punch list. Headlines:

- Categories management UI is the only outstanding spec item.
- Sync pagination needs an `ORDER BY` to be safe past ~1000 rows per table.
- Export/import filters out tombstones, which can resurrect deleted records on import.
- No cascade-delete for accounts / categories / merchants; goals do cascade.
- Loading skeletons and a handful of UX polish items remain.

---

## License

Private project, no license declared.
