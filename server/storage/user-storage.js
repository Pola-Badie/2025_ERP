import { BaseStorage } from "./base";
import { users, userPermissions, rolePermissions, loginLogs } from "@shared/schema";
export class UserStorage extends BaseStorage {
    async getUsers() {
        return await this.findAll(users);
    }
    async getUser(id) {
        return await this.findById(users, id);
    }
    async getUserByUsername(username) {
        const [user] = await this.db.select().from(users).where(this.eq(users.username, username));
        return user;
    }
    async createUser(user) {
        return await this.create(users, user);
    }
    async updateUser(id, userData) {
        return await this.updateById(users, id, userData);
    }
    async deactivateUser(id) {
        const [updated] = await this.db.update(users)
            .set({ isActive: false })
            .where(this.eq(users.id, id))
            .returning();
        return updated !== undefined;
    }
    async getUserPermissions(userId) {
        return await this.db.select()
            .from(userPermissions)
            .where(this.eq(userPermissions.userId, userId));
    }
    async getUserPermissionsByModule(userId, moduleName) {
        const [permission] = await this.db.select()
            .from(userPermissions)
            .where(this.and(this.eq(userPermissions.userId, userId), this.eq(userPermissions.moduleName, moduleName)));
        return permission;
    }
    async createUserPermission(permission) {
        return await this.create(userPermissions, permission);
    }
    async updateUserPermission(userId, moduleName, accessGranted) {
        const [updated] = await this.db.update(userPermissions)
            .set({ accessGranted })
            .where(this.and(this.eq(userPermissions.userId, userId), this.eq(userPermissions.moduleName, moduleName)))
            .returning();
        return updated;
    }
    async deleteUserPermission(userId, moduleName) {
        const result = await this.db.delete(userPermissions)
            .where(this.and(this.eq(userPermissions.userId, userId), this.eq(userPermissions.moduleName, moduleName)))
            .returning();
        return result.length > 0;
    }
    async getRolePermissions(role) {
        return await this.db.select()
            .from(rolePermissions)
            .where(this.eq(rolePermissions.role, role));
    }
    async createRolePermission(permission) {
        return await this.create(rolePermissions, permission);
    }
    async deleteRolePermission(id) {
        return await this.deleteById(rolePermissions, id);
    }
    async getLoginLogs(limit) {
        let query = this.db.select().from(loginLogs).orderBy(this.desc(loginLogs.timestamp));
        if (limit) {
            query = query.limit(limit);
        }
        return await query;
    }
    async createLoginLog(log) {
        return await this.create(loginLogs, log);
    }
}
