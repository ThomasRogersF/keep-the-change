export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<string>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class BaseRepository<T extends { id: string }> implements IRepository<T> {
  constructor(protected table: any) {}

  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
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
    await this.table.delete(id);
  }
}
