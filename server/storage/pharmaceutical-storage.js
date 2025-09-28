// @ts-nocheck
import { BaseStorage } from "./base";
import { batches, productFormulations, productSafety, qualityTests, regulatorySubmissions } from "@shared/schema";
export class PharmaceuticalStorage extends BaseStorage {
    // Batch Management
    async getBatches(filters) {
        let query = this.db.select().from(batches);
        const conditions = [];
        if (filters?.productId) {
            conditions.push(this.eq(batches.productId, filters.productId));
        }
        if (filters?.status) {
            conditions.push(this.eq(batches.status, filters.status));
        }
        if (filters?.supplierId) {
            conditions.push(this.eq(batches.supplierId, filters.supplierId));
        }
        if (conditions.length > 0) {
            query = query.where(this.and(...conditions));
        }
        return await query.orderBy(this.desc(batches.createdAt));
    }
    async getBatch(id) {
        return await this.findById(batches, id);
    }
    async getBatchByNumber(batchNumber) {
        const [batch] = await this.db.select()
            .from(batches)
            .where(this.eq(batches.batchNumber, batchNumber));
        return batch;
    }
    async getBatchesByProduct(productId) {
        return await this.db.select()
            .from(batches)
            .where(this.eq(batches.productId, productId))
            .orderBy(this.desc(batches.createdAt));
    }
    async getBatchesByStatus(status) {
        return await this.db.select()
            .from(batches)
            .where(this.eq(batches.status, status))
            .orderBy(this.desc(batches.createdAt));
    }
    async getExpiringBatches(days) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const expiryThreshold = futureDate.toISOString().split('T')[0];
        return await this.db.select()
            .from(batches)
            .where(this.lte(batches.expiryDate, expiryThreshold))
            .orderBy(batches.expiryDate);
    }
    async createBatch(batch) {
        return await this.create(batches, batch);
    }
    async updateBatch(id, data) {
        return await this.updateById(batches, id, data);
    }
    async deleteBatch(id) {
        return await this.deleteById(batches, id);
    }
    // Product Formulation
    async getProductFormulations(productId) {
        return await this.db.select()
            .from(productFormulations)
            .where(this.eq(productFormulations.productId, productId))
            .orderBy(productFormulations.ingredient);
    }
    async getFormulation(id) {
        return await this.findById(productFormulations, id);
    }
    async createFormulation(formulation) {
        return await this.create(productFormulations, formulation);
    }
    async updateFormulation(id, data) {
        return await this.updateById(productFormulations, id, data);
    }
    async deleteFormulation(id) {
        return await this.deleteById(productFormulations, id);
    }
    // Product Safety
    async getProductSafety(productId) {
        const [safety] = await this.db.select()
            .from(productSafety)
            .where(this.eq(productSafety.productId, productId));
        return safety;
    }
    async createProductSafety(safety) {
        return await this.create(productSafety, safety);
    }
    async updateProductSafety(productId, data) {
        const [updated] = await this.db.update(productSafety)
            .set({ ...data, updatedAt: new Date() })
            .where(this.eq(productSafety.productId, productId))
            .returning();
        return updated;
    }
    async deleteProductSafety(productId) {
        const result = await this.db.delete(productSafety)
            .where(this.eq(productSafety.productId, productId))
            .returning();
        return result.length > 0;
    }
    // Quality Control
    async getQualityTests(batchId) {
        let query = this.db.select().from(qualityTests);
        if (batchId) {
            query = query.where(this.eq(qualityTests.batchId, batchId));
        }
        return await query.orderBy(this.desc(qualityTests.testDate));
    }
    async getQualityTest(id) {
        return await this.findById(qualityTests, id);
    }
    async getQualityTestsByBatch(batchId) {
        return await this.db.select()
            .from(qualityTests)
            .where(this.eq(qualityTests.batchId, batchId))
            .orderBy(this.desc(qualityTests.testDate));
    }
    async createQualityTest(test) {
        return await this.create(qualityTests, test);
    }
    async updateQualityTest(id, data) {
        return await this.updateById(qualityTests, id, data);
    }
    async deleteQualityTest(id) {
        return await this.deleteById(qualityTests, id);
    }
    // Regulatory Submissions
    async getRegulatorySubmissions(productId, status) {
        let query = this.db.select().from(regulatorySubmissions);
        const conditions = [];
        if (productId) {
            conditions.push(this.eq(regulatorySubmissions.productId, productId));
        }
        if (status) {
            conditions.push(this.eq(regulatorySubmissions.status, status));
        }
        if (conditions.length > 0) {
            query = query.where(this.and(...conditions));
        }
        return await query.orderBy(this.desc(regulatorySubmissions.submissionDate));
    }
    async getRegulatorySubmission(id) {
        return await this.findById(regulatorySubmissions, id);
    }
    async createRegulatorySubmission(submission) {
        return await this.create(regulatorySubmissions, submission);
    }
    async updateRegulatorySubmission(id, data) {
        return await this.updateById(regulatorySubmissions, id, data);
    }
    async deleteRegulatorySubmission(id) {
        return await this.deleteById(regulatorySubmissions, id);
    }
    // Helper methods for pharmaceutical operations
    async getBatchesByManufactureDate(startDate, endDate) {
        return await this.db.select()
            .from(batches)
            .where(this.and(this.gte(batches.manufactureDate, startDate), this.lte(batches.manufactureDate, endDate)))
            .orderBy(batches.manufactureDate);
    }
    async getQualityTestsByDateRange(startDate, endDate) {
        return await this.db.select()
            .from(qualityTests)
            .where(this.and(this.gte(qualityTests.testDate, startDate), this.lte(qualityTests.testDate, endDate)))
            .orderBy(this.desc(qualityTests.testDate));
    }
    async getFormulationsByIngredient(ingredient) {
        return await this.db.select()
            .from(productFormulations)
            .where(this.eq(productFormulations.ingredient, ingredient))
            .orderBy(productFormulations.percentage);
    }
}
