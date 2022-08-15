"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddExpiredCourses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'member_course';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('subscription_end');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('subscription_end');
        });
    }
}
exports.default = AddExpiredCourses;
//# sourceMappingURL=1634951980709_add_expired_courses.js.map