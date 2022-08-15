"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Subjects extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'subjects';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.string('title');
            table.text('body').nullable();
            table.string('video').nullable();
            table
                .integer('parent_id')
                .nullable()
                .unsigned()
                .references('subjects.id')
                .onDelete('set null');
            table.integer('course_id').nullable().unsigned().references('courses.id').onDelete('set null');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Subjects;
//# sourceMappingURL=1632559939274_subjects.js.map