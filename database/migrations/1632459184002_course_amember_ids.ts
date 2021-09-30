import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CourseAmemberIds extends BaseSchema {
  protected tableName = 'courses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('amember_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('amember_id')
    })
  }
}
