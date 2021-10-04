import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Boosts extends BaseSchema {
  protected tableName = 'boosts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('users.id').onDelete('cascade')
      table.integer('subject_id').unsigned().references('subjects.id').onDelete('cascade')
      table.string('body')

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
