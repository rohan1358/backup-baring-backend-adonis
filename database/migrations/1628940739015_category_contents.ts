import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CategoryContents extends BaseSchema {
  protected tableName = 'category_content'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('content_id').unsigned().references('contents.id').onDelete('cascade')
      table.integer('category_id').unsigned().references('categories.id').onDelete('cascade')
      table.unique(['content_id', 'category_id'])

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
