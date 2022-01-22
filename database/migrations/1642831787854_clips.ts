import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Clips extends BaseSchema {
  protected tableName = 'clips'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('cascade')
      table.integer('bab_id').nullable().unsigned().references('babs.id').onDelete('set null')
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
