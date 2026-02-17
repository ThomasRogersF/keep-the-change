export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

export type RemoteRow = Record<string, unknown>;

export interface TableDescriptor<T = unknown> {
  name: string;
  localTable: string;
  remoteTable: string;
  toRemote: (row: T, userId: string) => RemoteRow;
  toLocal: (row: RemoteRow) => T;
}
