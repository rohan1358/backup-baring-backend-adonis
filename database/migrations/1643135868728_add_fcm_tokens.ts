import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddFcmTokens extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('fcm_token').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fcm_token')
    })
  }
}
