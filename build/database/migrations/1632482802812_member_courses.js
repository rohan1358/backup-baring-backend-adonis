"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class MemberCourses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'member_course';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('users.id');
            table.integer('course_id').unsigned().references('courses.id');
            table.boolean('mentor');
            table.unique(['user_id', 'course_id']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = MemberCourses;
//# sourceMappingURL=1632482802812_member_courses.js.map