export { SyncEngine, runSync, isSyncInFlight, isSyncQueued } from "./sync-engine";
export {
  initialSyncKeepLocal,
  initialSyncUseCloud,
  initialSyncMerge,
  getLocalDataCounts,
  getRemoteDataCounts,
} from "./initial-sync";
export { useSyncState, useSync } from "./use-sync";
export { useSyncCountdown } from "./use-sync-countdown";
export { withSyncLock, getTabId } from "./cross-tab-lock";
export type { LockResult } from "./cross-tab-lock";
export { runSyncDiagnostics, exportDiagnosticsJson } from "./sync-diagnostics";
export type { SyncDiagnostics } from "./sync-diagnostics";
export { ALL_DESCRIPTORS } from "./table-descriptors";
export type { SyncResult, TableSyncResult, TableDescriptor, RemoteRow } from "./types";
