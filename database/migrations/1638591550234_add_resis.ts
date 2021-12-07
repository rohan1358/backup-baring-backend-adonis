import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddResis extends BaseSchema {
  protected tableName = 'checkouts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('resi').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('resi')
    })
  }
}
