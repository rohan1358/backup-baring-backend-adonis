"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CategoryContents extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'category_content';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.integer('content_id').unsigned().references('contents.id').onDelete('cascade');
            table.integer('category_id').unsigned().references('categories.id').onDelete('cascade');
            table.unique(['content_id', 'category_id']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = CategoryContents;
//# sourceMappingURL=1628940739015_category_contents.js.map