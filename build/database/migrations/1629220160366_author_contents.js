"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AuthorContents extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'author_content';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('content_id').unsigned().references('contents.id').onDelete('cascade');
            table.integer('author_id').unsigned().references('authors.id').onDelete('cascade');
            table.unique(['content_id', 'author_id']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = AuthorContents;
//# sourceMappingURL=1629220160366_author_contents.js.map