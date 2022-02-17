import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddIcons extends BaseSchema {
  protected tableName = 'categories'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('icon')
    })
  }
}
