import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddResis extends BaseSchema {
  protected tableName = 'checkouts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('status')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
  }
}
