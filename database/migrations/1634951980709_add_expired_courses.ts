import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddExpiredCourses extends BaseSchema {
  protected tableName = 'member_course'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('subscription_end')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('subscription_end')
    })
  }
}
