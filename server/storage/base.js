import { db } from "../db";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
export class BaseStorage {
    constructor() {
        this.db = db;
        this.eq = eq;
        this.and = and;
        this.desc = desc;
        this.asc = asc;
        this.gte = gte;
        this.lte = lte;
    }
    async findById(table, id) {
        const [record] = await this.db.select().from(table).where(eq(table.id, id));
        return record;
    }
    async findAll(table, conditions) {
        let query = this.db.select().from(table);
        if (conditions) {
            query = query.where(conditions);
        }
        return await query;
    }
    async create(table, data) {
        const [record] = await this.db.insert(table).values(data).returning();
        return record;
    }
    async updateById(table, id, data) {
        const [record] = await this.db.update(table)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(table.id, id))
            .returning();
        return record;
    }
    async deleteById(table, id) {
        const result = await this.db.delete(table).where(eq(table.id, id)).returning();
        return result.length > 0;
    }
    async softDeleteById(table, id) {
        const [updated] = await this.db.update(table)
            .set({ isActive: false })
            .where(eq(table.id, id))
            .returning();
        return updated !== undefined;
    }
}
