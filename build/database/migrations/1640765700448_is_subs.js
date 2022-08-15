"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class IsSubs extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'checkout_details';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('is_sub').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('is_sub');
        });
    }
}
exports.default = IsSubs;
//# sourceMappingURL=1640765700448_is_subs.js.map