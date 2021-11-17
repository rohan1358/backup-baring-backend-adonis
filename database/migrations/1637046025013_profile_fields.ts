import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ProfileFields extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('avatar').nullable()
      table.string('email')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar')
      table.dropColumn('email')
    })
  }
}
