import { BaseStorage } from "./base";
import { like, sql, count } from "drizzle-orm";
import { products, productCategories } from "@shared/schema";
export class ProductStorage extends BaseStorage {
    async getProducts(filters) {
        let query = this.db.select().from(products);
        const conditions = [];
        if (filters?.type) {
            // Note: products table doesn't have type field, using status instead
            conditions.push(this.eq(products.status, filters.type));
        }
        if (filters?.status) {
            conditions.push(this.eq(products.status, filters.status));
        }
        if (filters?.categoryId) {
            conditions.push(this.eq(products.categoryId, filters.categoryId));
        }
        if (conditions.length > 0) {
            query = query.where(this.and(...conditions));
        }
        return await query.orderBy(this.desc(products.createdAt));
    }
    async getProductsByCategory(categoryId) {
        return await this.db.select()
            .from(products)
            .where(this.eq(products.categoryId, categoryId))
            .orderBy(products.name);
    }
    async getProductsByStatus(status) {
        return await this.db.select()
            .from(products)
            .where(this.eq(products.status, status))
            .orderBy(products.name);
    }
    async getLowStockProducts() {
        // Note: Using available quantity field instead of stockQuantity/minimumStockLevel
        return await this.db.select()
            .from(products)
            .where(this.eq(products.status, 'low_stock'))
            .orderBy(products.name);
    }
    async getProduct(id) {
        return await this.findById(products, id);
    }
    async getProductBySku(sku) {
        const [product] = await this.db.select()
            .from(products)
            .where(this.eq(products.sku, sku));
        return product;
    }
    async createProduct(product) {
        return await this.create(products, product);
    }
    async updateProduct(id, productData) {
        return await this.updateById(products, id, productData);
    }
    async deleteProduct(id) {
        return await this.deleteById(products, id);
    }
    // Product Categories
    async getProductCategories() {
        return await this.db.select()
            .from(productCategories)
            .orderBy(productCategories.name);
    }
    async getProductCategory(id) {
        return await this.findById(productCategories, id);
    }
    async createProductCategory(category) {
        return await this.create(productCategories, category);
    }
    async updateProductCategory(id, categoryData) {
        return await this.updateById(productCategories, id, categoryData);
    }
    async deleteProductCategory(id) {
        return await this.deleteById(productCategories, id);
    }
    // Helper methods for advanced product operations
    async searchProducts(searchTerm) {
        return await this.db.select()
            .from(products)
            .where(this.or(like(products.name, `%${searchTerm}%`), like(products.drugName, `%${searchTerm}%`), like(products.sku, `%${searchTerm}%`), like(products.description, `%${searchTerm}%`)))
            .orderBy(products.name);
    }
    async getProductCount() {
        const [result] = await this.db.select({ count: count() }).from(products);
        return result.count;
    }
    async getProductsByPriceRange(minPrice, maxPrice) {
        return await this.db.select()
            .from(products)
            .where(this.and(this.gte(sql `CAST(${products.sellingPrice} AS DECIMAL)`, minPrice), this.lte(sql `CAST(${products.sellingPrice} AS DECIMAL)`, maxPrice)))
            .orderBy(products.name);
    }
    or(...conditions) {
        return sql `${conditions.join(' OR ')}`;
    }
}
