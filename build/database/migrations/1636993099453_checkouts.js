"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Checkouts extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'checkouts';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.integer('total');
            table.integer('user_id').unsigned().references('users.id').onDelete('cascade');
            table.text('detail').nullable();
            table.boolean('is_paid');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Checkouts;
//# sourceMappingURL=1636993099453_checkouts.js.map