import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Comments extends BaseSchema {
  protected tableName = 'comments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.text('body')
      table.integer('user_id').unsigned().references('users.id').onDelete('set null')
      table
        .integer('subject_id')
        .nullable()
        .unsigned()
        .references('subjects.id')
        .onDelete('set null')
      table
        .integer('parent_id')
        .nullable()
        .unsigned()
        .references('comments.id')
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
