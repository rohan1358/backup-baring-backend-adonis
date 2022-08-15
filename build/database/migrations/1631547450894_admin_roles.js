"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AdminRoles extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'admins';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('role');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('role');
        });
    }
}
exports.default = AdminRoles;
//# sourceMappingURL=1631547450894_admin_roles.js.map