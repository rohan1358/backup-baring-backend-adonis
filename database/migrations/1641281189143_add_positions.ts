import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddPositions extends BaseSchema {
  protected tableName = 'subjects'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('position').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('position')
    })
  }
}
