import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Checkouts extends BaseSchema {
  protected tableName = 'checkouts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('total')
      table.integer('user_id').unsigned().references('users.id').onDelete('cascade')
      table.text('detail').nullable()
      table.boolean('is_paid')

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
