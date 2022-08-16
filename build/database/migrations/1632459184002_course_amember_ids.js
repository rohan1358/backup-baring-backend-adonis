"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CourseAmemberIds extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'courses';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('amember_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('amember_id');
        });
    }
}
exports.default = CourseAmemberIds;
//# sourceMappingURL=1632459184002_course_amember_ids.js.map