import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserPartners extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('partner_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('partners')
        .onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('partner_id')
    })
  }
}
