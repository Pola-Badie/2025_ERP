import { BaseStorage } from "./base";
import { accounts, journalEntries, journalLines, customerPayments, paymentAllocations } from "@shared/schema";
export class FinancialStorage extends BaseStorage {
    // Account methods
    async getAccounts(type) {
        let query = this.db.select().from(accounts).where(this.eq(accounts.isActive, true));
        if (type) {
            query = query.where(this.and(this.eq(accounts.type, type), this.eq(accounts.isActive, true)));
        }
        return await query.orderBy(accounts.code);
    }
    async getAccount(id) {
        return await this.findById(accounts, id);
    }
    async getAccountByCode(code) {
        const [account] = await this.db.select()
            .from(accounts)
            .where(this.eq(accounts.code, code));
        return account;
    }
    async createAccount(account) {
        return await this.create(accounts, account);
    }
    async updateAccount(id, data) {
        return await this.updateById(accounts, id, data);
    }
    async deleteAccount(id) {
        return await this.softDeleteById(accounts, id);
    }
    // Journal Entry methods
    async getJournalEntries(filters) {
        let query = this.db.select().from(journalEntries);
        const conditions = [];
        if (filters?.dateFrom) {
            conditions.push(this.gte(journalEntries.date, filters.dateFrom));
        }
        if (filters?.dateTo) {
            conditions.push(this.lte(journalEntries.date, filters.dateTo));
        }
        if (filters?.status) {
            conditions.push(this.eq(journalEntries.status, filters.status));
        }
        if (conditions.length > 0) {
            query = query.where(this.and(...conditions));
        }
        return await query.orderBy(this.desc(journalEntries.date));
    }
    async getJournalEntry(id) {
        return await this.findById(journalEntries, id);
    }
    async getJournalLines(journalId) {
        return await this.db.select()
            .from(journalLines)
            .where(this.eq(journalLines.journalId, journalId))
            .orderBy(this.asc(journalLines.position));
    }
    async createJournalEntry(entry) {
        return await this.create(journalEntries, entry);
    }
    async createJournalLine(line) {
        return await this.create(journalLines, line);
    }
    async updateJournalEntry(id, data) {
        return await this.updateById(journalEntries, id, data);
    }
    async deleteJournalEntry(id) {
        return await this.deleteById(journalEntries, id);
    }
    // Customer Payment methods
    async getCustomerPayments(filters) {
        let query = this.db.select().from(customerPayments);
        const conditions = [];
        if (filters?.customerId) {
            conditions.push(this.eq(customerPayments.customerId, filters.customerId));
        }
        if (filters?.dateFrom) {
            conditions.push(this.gte(customerPayments.paymentDate, filters.dateFrom));
        }
        if (filters?.dateTo) {
            conditions.push(this.lte(customerPayments.paymentDate, filters.dateTo));
        }
        if (conditions.length > 0) {
            query = query.where(this.and(...conditions));
        }
        return await query.orderBy(this.desc(customerPayments.paymentDate));
    }
    async getCustomerPayment(id) {
        return await this.findById(customerPayments, id);
    }
    async getPaymentAllocations(paymentId) {
        return await this.db.select()
            .from(paymentAllocations)
            .where(this.eq(paymentAllocations.paymentId, paymentId));
    }
    async createCustomerPayment(payment) {
        return await this.create(customerPayments, payment);
    }
    async createPaymentAllocation(allocation) {
        return await this.create(paymentAllocations, allocation);
    }
    async updateCustomerPayment(id, data) {
        return await this.updateById(customerPayments, id, data);
    }
    async deleteCustomerPayment(id) {
        return await this.deleteById(customerPayments, id);
    }
    // Helper methods for financial operations
    async getAccountsByType(accountType) {
        return await this.db.select()
            .from(accounts)
            .where(this.and(this.eq(accounts.type, accountType), this.eq(accounts.isActive, true)))
            .orderBy(accounts.code);
    }
    async getJournalEntriesByPeriod(year, month) {
        let startDate = `${year}-01-01`;
        let endDate = `${year}-12-31`;
        if (month) {
            startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        }
        return await this.db.select()
            .from(journalEntries)
            .where(this.and(this.gte(journalEntries.date, startDate), this.lte(journalEntries.date, endDate)))
            .orderBy(this.desc(journalEntries.date));
    }
    async validateJournalEntryBalance(journalId) {
        const lines = await this.getJournalLines(journalId);
        const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
        const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
        return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding errors
    }
}
