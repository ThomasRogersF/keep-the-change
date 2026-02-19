export interface TableSyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  error?: string;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
  tables: Record<string, TableSyncResult>;
  /** True when sync was blocked by another tab holding the cross-tab lock */
  blocked?: boolean;
}

export type RemoteRow = Record<string, unknown>;

export interface TableDescriptor<T = unknown> {
  name: string;
  localTable: string;
  remoteTable: string;
  toRemote: (row: T, userId: string) => RemoteRow;
  toLocal: (row: RemoteRow) => T;
}
