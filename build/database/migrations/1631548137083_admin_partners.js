"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AdminPartners extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'admins';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .integer('partner_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('partners')
                .onDelete('CASCADE');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('partner_id');
        });
    }
}
exports.default = AdminPartners;
//# sourceMappingURL=1631548137083_admin_partners.js.map