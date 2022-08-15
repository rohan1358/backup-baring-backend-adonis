"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddCourseCarts extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'carts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('product_id').nullable().alter();
            table.integer('course_id').unsigned().nullable().references('courses.id').onDelete('cascade');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('course_id');
            table.integer('product_id').notNullable().alter();
        });
    }
}
exports.default = AddCourseCarts;
//# sourceMappingURL=1636632348244_add_course_carts.js.map