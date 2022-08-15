"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddInvoiceIdFields extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'checkouts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('invoice_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('invoice_id');
        });
    }
}
exports.default = AddInvoiceIdFields;
//# sourceMappingURL=1637685089344_add_invoice_id_fields.js.map