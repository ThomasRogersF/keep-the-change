/**
 * Cross-tab sync lock — prevents concurrent sync across browser tabs.
 *
 * Primary: Web Locks API (auto-release on tab close/crash).
 * Fallback: BroadcastChannel heartbeat protocol.
 * SSR / no-API: pass-through (no locking).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type LockResult<T> =
  | { status: "ok"; value: T }
  | { status: "blocked" };

// ─── Tab ID (stable per-tab, survives soft reload) ──────────────────────────

let _tabId: string | null = null;

export function getTabId(): string {
  if (_tabId) return _tabId;
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem("ledgerly-tab-id");
    if (stored) {
      _tabId = stored;
      return stored;
    }
  }
  const id = crypto.randomUUID();
  _tabId = id;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("ledgerly-tab-id", id);
  }
  return id;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCK_NAME = "ledgerly-sync-lock";
const CHANNEL_NAME = "ledgerly-sync";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max sync time

// BroadcastChannel fallback constants
const BC_CLAIM_WAIT_MS = 300;
const BC_HEARTBEAT_INTERVAL_MS = 2000;
const BC_HEARTBEAT_STALE_MS = 6000;

// ─── Feature detection ──────────────────────────────────────────────────────

function supportsWebLocks(): boolean {
  return typeof navigator !== "undefined" && "locks" in navigator;
}

function supportsBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

// ─── Timeout helper ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Sync timeout")), ms)
    ),
  ]);
}

// ─── Web Locks implementation ───────────────────────────────────────────────

async function withSyncLockWebLocks<T>(
  fn: () => Promise<T>
): Promise<LockResult<T>> {
  // navigator.locks.request with ifAvailable returns undefined when the lock
  // is held by another context. Otherwise it returns the callback's result.
  const result = await navigator.locks.request(
    LOCK_NAME,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        // Lock is held by another tab
        return { status: "blocked" as const };
      }
      const value = await withTimeout(fn(), LOCK_TIMEOUT_MS);
      return { status: "ok" as const, value };
    }
  );

  return result as LockResult<T>;
}

// ─── BroadcastChannel fallback ──────────────────────────────────────────────

type BCMessage =
  | { type: "LOCK_REQUEST"; tabId: string; ts: number }
  | { type: "LOCK_HELD"; tabId: string; ts: number }
  | { type: "HEARTBEAT"; tabId: string; ts: number }
  | { type: "LOCK_RELEASE"; tabId: string; ts: number };

async function withSyncLockBroadcastChannel<T>(
  fn: () => Promise<T>
): Promise<LockResult<T>> {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const tabId = getTabId();

  try {
    // Step 1: Check if lock is held by sending a request
    const isHeld = await new Promise<boolean>((resolve) => {
      let resolved = false;

      const onMessage = (event: MessageEvent<BCMessage>) => {
        const msg = event.data;
        if (
          (msg.type === "LOCK_HELD" || msg.type === "HEARTBEAT") &&
          msg.tabId !== tabId &&
          Date.now() - msg.ts < BC_HEARTBEAT_STALE_MS
        ) {
          resolved = true;
          resolve(true);
        }
      };

      channel.addEventListener("message", onMessage);

      // Broadcast our lock request — any holder should reply with LOCK_HELD
      channel.postMessage({
        type: "LOCK_REQUEST",
        tabId,
        ts: Date.now(),
      } satisfies BCMessage);

      // Wait for responses
      setTimeout(() => {
        channel.removeEventListener("message", onMessage);
        if (!resolved) resolve(false);
      }, BC_CLAIM_WAIT_MS);
    });

    if (isHeld) {
      return { status: "blocked" };
    }

    // Step 2: Claim the lock — start heartbeat
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const sendHeartbeat = () => {
      channel.postMessage({
        type: "HEARTBEAT",
        tabId,
        ts: Date.now(),
      } satisfies BCMessage);
    };

    // Respond to lock requests from other tabs while we hold the lock
    const onMessageWhileHolding = (event: MessageEvent<BCMessage>) => {
      const msg = event.data;
      if (msg.type === "LOCK_REQUEST" && msg.tabId !== tabId) {
        channel.postMessage({
          type: "LOCK_HELD",
          tabId,
          ts: Date.now(),
        } satisfies BCMessage);
      }
    };

    channel.addEventListener("message", onMessageWhileHolding);
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, BC_HEARTBEAT_INTERVAL_MS);

    try {
      const value = await withTimeout(fn(), LOCK_TIMEOUT_MS);
      return { status: "ok", value };
    } finally {
      // Step 3: Release the lock
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      channel.removeEventListener("message", onMessageWhileHolding);
      channel.postMessage({
        type: "LOCK_RELEASE",
        tabId,
        ts: Date.now(),
      } satisfies BCMessage);
    }
  } finally {
    channel.close();
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Acquires a cross-tab exclusive lock, executes `fn`, then releases.
 * Returns `{ status: "blocked" }` immediately if another tab holds the lock.
 * Degrades gracefully: Web Locks → BroadcastChannel → pass-through.
 */
export async function withSyncLock<T>(
  fn: () => Promise<T>
): Promise<LockResult<T>> {
  // SSR guard
  if (typeof navigator === "undefined") {
    return { status: "ok", value: await fn() };
  }

  if (supportsWebLocks()) {
    return withSyncLockWebLocks(fn);
  }

  if (supportsBroadcastChannel()) {
    return withSyncLockBroadcastChannel(fn);
  }

  // Neither available — no cross-tab coordination possible, pass-through
  return { status: "ok", value: await fn() };
}
