"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddPositions extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'subjects';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('position').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('position');
        });
    }
}
exports.default = AddPositions;
//# sourceMappingURL=1641281189143_add_positions.js.map