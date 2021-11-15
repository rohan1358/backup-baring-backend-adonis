import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddPartnerLogos extends BaseSchema {
  protected tableName = 'partners'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('logo').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo')
    })
  }
}
