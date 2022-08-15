"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddPdfToCourses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'courses';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('pdf');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('pdf');
        });
    }
}
exports.default = AddPdfToCourses;
//# sourceMappingURL=1635765306377_add_pdf_to_courses.js.map