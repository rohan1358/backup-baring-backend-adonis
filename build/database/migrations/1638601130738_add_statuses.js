"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddResis extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'checkouts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('status');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('status');
        });
    }
}
exports.default = AddResis;
//# sourceMappingURL=1638601130738_add_statuses.js.map