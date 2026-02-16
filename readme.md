You are a senior product engineer + world-class UI designer. Build a premium, fully responsive budgeting web app with a UI-first approach.

APP NAME: “Ledgerly” (placeholder)
GOAL: A beautiful, modern budgeting app that tracks expenses, subscriptions, and variable monthly income, with an additional “External” area for investments + emergency savings that is tracked separately from the main budget.

TECH STACK (required):
- Next.js (App Router) + TypeScript
- TailwindCSS
- shadcn/ui components
- lucide-react icons
- Recharts for charts
- Zustand (or React Context) for state
- Local-first persistence using IndexedDB via Dexie (simple + fast). Keep a clean data access layer so we can swap to Supabase later.
- Zod for validation
- date-fns for dates

NON-NEGOTIABLE UI REQUIREMENTS:
- Extremely clean, premium UI (like Linear/Ramp/Copilot vibe)
- Fully responsive: 
  - Desktop: left sidebar navigation, content in cards
  - Mobile: bottom navigation + floating “Add” button; data entry uses bottom sheets
- Light/Dark mode with tasteful neutrals
- Beautiful empty states + skeleton loading
- Smooth micro-interactions (subtle transitions)
- Accessibility: keyboard navigation, focus states, labels

INFORMATION ARCHITECTURE / PAGES:
1) Dashboard
   - Top summary cards: This Month Spend, This Month Income, Net (Income - Spend), Subscriptions due soon
   - Charts: monthly trend line (spend vs income), category breakdown donut
   - “Recent transactions” list
2) Transactions
   - Search + filters (date range, category, account, min/max)
   - Table on desktop, cards on mobile
   - Add/Edit transaction modal/sheet
3) Subscriptions
   - Subscription cards with logo placeholder, amount, cadence, next renewal date
   - “Upcoming renewals” list + optional calendar-like grouped view
4) Income
   - Monthly income entries (variable)
   - Add income entry (month, source, amount, notes)
   - Chart: income trend
5) Accounts
   - Accounts can be type: main | external
   - Main accounts contribute to budget totals
   - External accounts: investments + emergency savings tracked separately
6) Settings
   - Categories management
   - Data export/import (JSON)
   - Currency
   - Theme toggle

DATA MODEL (implement with Zod schemas + Dexie tables):
- Account: { id, name, type: "main"|"external", currency, createdAt }
- Category: { id, name, icon, colorToken, createdAt }
- Merchant: { id, name, createdAt }
- Transaction: {
    id, date, amount, type: "expense"|"income",  // keep income here optional but we also track IncomeEntry separately
    categoryId?, merchantId?, accountId,
    note?, tags?: string[],
    createdAt, updatedAt
  }
- Subscription: {
    id, name, amount, cadence: "weekly"|"monthly"|"yearly",
    nextRenewalDate, accountId, categoryId?,
    merchantId?, active: boolean,
    createdAt, updatedAt
  }
- IncomeEntry: { id, month: "YYYY-MM", source, amount, note?, createdAt, updatedAt }

BUDGETING LOGIC RULES:
- “Main budget totals” include:
  - Transactions where type="expense" AND account.type="main"
  - Income from IncomeEntry (sum for the selected month)
- “External totals” show account balances/transactions separately and are NOT included in main budget KPIs.
- Dashboard month defaults to current month. Support changing month.

UI COMPONENTS TO BUILD (reusable):
- AppShell (sidebar + mobile bottom nav)
- PageHeader (title, subtitle, actions)
- StatCard (metric + delta)
- TransactionList (responsive)
- TransactionForm (zod validated, supports quick add)
- SubscriptionCard + SubscriptionForm
- IncomeMonthTable + IncomeForm
- FiltersBar (search + chips)
- EmptyState (nice illustration placeholder using simple shapes)
- Toast notifications

SEED DATA:
- Include a “Load demo data” toggle in Settings to populate categories, merchants, a few months of transactions, subscriptions, and income.

DELIVERABLES:
1) Create the full repo with Next.js App Router
2) Implement the full UI with responsive layouts and functioning navigation
3) Implement local persistence with Dexie and a clean repository layer
4) Implement CRUD for Transactions, Subscriptions, and IncomeEntry
5) Implement Dashboard metrics + charts using the stored data
6) Keep code clean and modular: /app pages, /components, /lib/db, /lib/services, /lib/utils, /types
7) Provide instructions to run locally

BUILD ORDER (follow strictly):
- Step A: Setup project + styling + shadcn + theme
- Step B: AppShell + navigation + empty pages with premium UI
- Step C: Dexie schema + repository layer + Zod schemas
- Step D: Transactions CRUD + polished add flow
- Step E: Income CRUD + month selector
- Step F: Subscriptions CRUD + upcoming renewals grouping
- Step G: Dashboard metrics + charts
- Step H: Settings + demo data import/export

IMPORTANT:
- Focus heavily on UI quality. Make it feel like a real product.
- Use sensible spacing, typography, and card layouts.
- Do not leave pages “unstyled”.
- If you must choose between more features and better UI, choose better UI.

Now generate the codebase.
