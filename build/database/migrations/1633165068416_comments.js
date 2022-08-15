"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Comments extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'comments';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.text('body');
            table.integer('user_id').unsigned().references('users.id').onDelete('set null');
            table
                .integer('subject_id')
                .nullable()
                .unsigned()
                .references('subjects.id')
                .onDelete('set null');
            table
                .integer('parent_id')
                .nullable()
                .unsigned()
                .references('comments.id')
                .onDelete('set null');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Comments;
//# sourceMappingURL=1633165068416_comments.js.map