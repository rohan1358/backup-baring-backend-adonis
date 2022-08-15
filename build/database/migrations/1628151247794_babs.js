"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Babs extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'babs';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('content_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('contents')
                .onDelete('set null');
            table.string('title');
            table.text('body');
            table.string('audio');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Babs;
//# sourceMappingURL=1628151247794_babs.js.map