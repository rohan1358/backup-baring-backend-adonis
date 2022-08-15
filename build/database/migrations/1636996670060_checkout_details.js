"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CheckoutDetails extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'checkout_details';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.string('title');
            table.integer('price');
            table.integer('qty');
            table.integer('checkout_id').unsigned().references('checkouts.id').onDelete('cascade');
            table.integer('course_id').unsigned().nullable().references('courses.id').onDelete('set null');
            table
                .integer('product_id')
                .unsigned()
                .nullable()
                .references('products.id')
                .onDelete('set null');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = CheckoutDetails;
//# sourceMappingURL=1636996670060_checkout_details.js.map