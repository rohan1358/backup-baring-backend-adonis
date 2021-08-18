import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AuthorContents extends BaseSchema {
  protected tableName = 'author_content'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('content_id').unsigned().references('contents.id').onDelete('cascade')
      table.integer('author_id').unsigned().references('authors.id').onDelete('cascade')
      table.unique(['content_id', 'author_id'])

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
