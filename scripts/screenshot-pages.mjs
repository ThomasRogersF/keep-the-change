// Design-screenshot pipeline: walks every page of the app and captures a
// mobile + desktop screenshot of each, for dropping into a Claude project
// to work on design improvements.
//
// Usage: npm run screenshots
//
// How it works:
//  1. Boots `next dev` with NEXT_PUBLIC_SCREENSHOT_MODE=1, which makes the
//     (app) route group's AuthGuard render without a real Supabase session
//     (see src/app/(app)/layout.tsx). Data still comes from the local Dexie
//     (IndexedDB) database, same as any real browser session.
//  2. Seeds local demo data via the existing Settings > "Load Demo Data"
//     button so every page has realistic content instead of empty states.
//  3. Reads a few record ids straight out of IndexedDB (goal, wealth
//     account, asset holding, emergency fund) so the dynamic detail routes
//     can be visited too.
//  4. Visits every route at a mobile and a desktop viewport and saves a
//     full-page PNG.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

const PORT = 3900;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("design-screenshots");

const VIEWPORTS = {
  mobile: { width: 390, height: 844 }, // iPhone 14-ish
  desktop: { width: 1440, height: 900 },
};

// Static routes. Dynamic ones are appended once we know real ids (see main()).
const STATIC_ROUTES = [
  { name: "dashboard", path: "/" },
  { name: "accounts", path: "/accounts" },
  { name: "transactions", path: "/transactions" },
  { name: "subscriptions", path: "/subscriptions" },
  { name: "income", path: "/income" },
  { name: "goals", path: "/goals" },
  { name: "settings", path: "/settings" },
  { name: "wealth", path: "/wealth" },
  { name: "wealth-activity", path: "/wealth/activity" },
  { name: "wealth-savings", path: "/wealth/savings" },
  { name: "wealth-investments", path: "/wealth/investments" },
  { name: "wealth-emergency", path: "/wealth/emergency" },
  { name: "login", path: "/login" },
];

function waitForPort(port, timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
    };
    tryConnect();
  });
}

function startDevServer() {
  const nextBin = path.resolve("node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], {
    env: { ...process.env, NEXT_PUBLIC_SCREENSHOT_MODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) => process.stdout.write(`[next] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));
  return child;
}

// Demo data + dynamic ids live in the app's Dexie (IndexedDB) database.
// We reach in with the raw IndexedDB API rather than importing Dexie so this
// script has zero dependency on app internals beyond the database name.
async function readSeededIds(page) {
  return page.evaluate(async () => {
    function readAll(db, storeName) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("LedgerlyDB");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const [goals, wealthAccounts, assetHoldings, emergencyFunds] = await Promise.all([
      readAll(db, "goals"),
      readAll(db, "wealthAccounts"),
      readAll(db, "assetHoldings"),
      readAll(db, "emergencyFunds"),
    ]);
    db.close();

    return {
      goalId: goals[0]?.id ?? null,
      wealthAccountId: wealthAccounts[0]?.id ?? null,
      assetHoldingId: assetHoldings[0]?.id ?? null,
      emergencyFundId: emergencyFunds[0]?.id ?? null,
    };
  });
}

async function seedDemoData(page) {
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Load Demo Data" }).click();
  await page.getByText("Demo data loaded").waitFor({ timeout: 15_000 });
  // Let the toast dismiss and live queries settle before moving on.
  await page.waitForTimeout(1000);
}

async function shootRoute(context, route, viewportName, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  try {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 30_000 });
    // Chart/animation settle time.
    await page.waitForTimeout(500);
    const file = path.join(OUT_DIR, viewportName, `${route.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  ✓ ${viewportName}/${route.name}.png`);
  } catch (err) {
    console.error(`  ✗ ${viewportName}/${route.name}: ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  await mkdir(path.join(OUT_DIR, "mobile"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "desktop"), { recursive: true });

  console.log(`Starting dev server on port ${PORT} (screenshot mode)...`);
  const server = startDevServer();
  const cleanup = () => {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"]);
    } else {
      server.kill("SIGTERM");
    }
  };

  try {
    await waitForPort(PORT);
    // Next.js is "listening" slightly before it can actually serve compiled
    // pages on first request; give it a moment.
    await new Promise((r) => setTimeout(r, 2000));

    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const seedPage = await context.newPage();

    console.log("Seeding demo data...");
    await seedDemoData(seedPage);

    console.log("Reading seeded record ids...");
    const ids = await readSeededIds(seedPage);
    console.log(" ", ids);
    await seedPage.close();

    const routes = [...STATIC_ROUTES];
    if (ids.goalId) routes.push({ name: "goal-detail", path: `/goals/${ids.goalId}` });
    if (ids.wealthAccountId)
      routes.push({ name: "wealth-savings-detail", path: `/wealth/savings/${ids.wealthAccountId}` });
    if (ids.assetHoldingId)
      routes.push({ name: "wealth-investments-detail", path: `/wealth/investments/${ids.assetHoldingId}` });
    if (ids.emergencyFundId)
      routes.push({ name: "wealth-emergency-detail", path: `/wealth/emergency/${ids.emergencyFundId}` });

    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      console.log(`\nCapturing ${viewportName} (${viewport.width}x${viewport.height})...`);
      for (const route of routes) {
        await shootRoute(context, route, viewportName, viewport);
      }
    }

    await browser.close();
    console.log(`\nDone. Screenshots saved to ${OUT_DIR}`);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
