import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddWeightProducts extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('weight').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('weight')
    })
  }
}
