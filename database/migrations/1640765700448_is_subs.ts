import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class IsSubs extends BaseSchema {
  protected tableName = 'checkout_details'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_sub').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_sub')
    })
  }
}
