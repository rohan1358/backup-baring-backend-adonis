"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class MakeDeleteCascades extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'comments';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign('subject_id');
            table.dropForeign('parent_id');
            table
                .integer('subject_id')
                .nullable()
                .unsigned()
                .references('subjects.id')
                .onDelete('cascade')
                .alter();
            table
                .integer('parent_id')
                .nullable()
                .unsigned()
                .references('comments.id')
                .onDelete('cascade')
                .alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign('subject_id');
            table.dropForeign('parent_id');
            table
                .integer('subject_id')
                .nullable()
                .unsigned()
                .references('subjects.id')
                .onDelete('set null')
                .alter();
            table
                .integer('parent_id')
                .nullable()
                .unsigned()
                .references('comments.id')
                .onDelete('set null')
                .alter();
        });
    }
}
exports.default = MakeDeleteCascades;
//# sourceMappingURL=1639713060126_make_delete_cascades.js.map