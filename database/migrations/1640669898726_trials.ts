import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Trials extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('in_trial').nullable()
      table.boolean('have_trial').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('in_trial')
      table.dropColumn('have_trial')
    })
  }
}
