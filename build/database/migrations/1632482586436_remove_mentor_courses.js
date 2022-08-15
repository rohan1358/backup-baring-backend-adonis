"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class RemoveMentorCourses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'courses';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('mentor_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .integer('mentor_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('SET NULL');
        });
    }
}
exports.default = RemoveMentorCourses;
//# sourceMappingURL=1632482586436_remove_mentor_courses.js.map