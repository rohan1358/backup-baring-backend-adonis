"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddIcons extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'categories';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('icon');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('icon');
        });
    }
}
exports.default = AddIcons;
//# sourceMappingURL=1645114081293_add_icons.js.map