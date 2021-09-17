import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserProfiles extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('fullname')
      table.string('username')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fullname')
      table.dropColumn('username')
    })
  }
}
