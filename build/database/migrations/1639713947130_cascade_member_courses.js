"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CascadeMemberCourses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'member_course';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign('user_id');
            table.dropForeign('course_id');
            table.integer('user_id').unsigned().references('users.id').onDelete('cascade').alter();
            table.integer('course_id').unsigned().references('courses.id').onDelete('cascade').alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign('user_id');
            table.dropForeign('course_id');
            table.integer('user_id').unsigned().references('users.id').onDelete('set null').alter();
            table.integer('course_id').unsigned().references('courses.id').onDelete('set null').alter();
        });
    }
}
exports.default = CascadeMemberCourses;
//# sourceMappingURL=1639713947130_cascade_member_courses.js.map