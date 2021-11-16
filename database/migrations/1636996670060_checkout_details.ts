import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CheckoutDetails extends BaseSchema {
  protected tableName = 'checkout_details'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title')
      table.integer('price')
      table.integer('qty')
      table.integer('checkout_id').unsigned().references('checkouts.id').onDelete('cascade')
      table.integer('course_id').unsigned().nullable().references('courses.id').onDelete('set null')
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('products.id')
        .onDelete('set null')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
