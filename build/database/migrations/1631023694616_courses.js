"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Courses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'courses';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.string('title');
            table.string('cover');
            table.text('description');
            table.integer('price');
            table
                .integer('mentor_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('SET NULL');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Courses;
//# sourceMappingURL=1631023694616_courses.js.map