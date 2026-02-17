export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<string>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class BaseRepository<T extends { id: string; deletedAt?: Date | null }> implements IRepository<T> {
  constructor(protected table: any) {}

  async getAll(): Promise<T[]> {
    const all = await this.table.toArray();
    return all.filter((r: T) => r.deletedAt === null || r.deletedAt === undefined);
  }

  async getAllIncludingDeleted(): Promise<T[]> {
    return this.table.toArray();
  }

  async getById(id: string): Promise<T | undefined> {
    const record = await this.table.get(id);
    if (record && record.deletedAt != null) return undefined;
    return record;
  }

  async getByIdIncludingDeleted(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as unknown as T;
    await this.table.add(record);
    return id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await this.table.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    const now = new Date();
    await this.table.update(id, {
      deletedAt: now,
      updatedAt: now,
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async getModifiedSince(since: Date): Promise<T[]> {
    return this.table
      .where("updatedAt")
      .above(since)
      .toArray();
  }
}
