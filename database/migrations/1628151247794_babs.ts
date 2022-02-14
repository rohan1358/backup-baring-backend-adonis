import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Babs extends BaseSchema {
  protected tableName = 'babs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('content_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('contents')
        .onDelete('set null')
      table.string('title')
      table.text('body')
      table.string('audio')

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
