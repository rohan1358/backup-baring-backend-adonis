"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AdminApiTokens extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'admin_api_tokens';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.integer('admin_id').unsigned().references('id').inTable('admins').onDelete('CASCADE');
            table.string('name').notNullable();
            table.string('type').notNullable();
            table.string('token', 64).notNullable().unique();
            table.timestamp('expires_at', { useTz: true }).nullable();
            table.timestamp('created_at', { useTz: true }).notNullable();
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = AdminApiTokens;
//# sourceMappingURL=1628105667842_admin_api_tokens.js.map