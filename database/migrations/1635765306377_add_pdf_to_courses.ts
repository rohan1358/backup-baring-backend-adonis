import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddPdfToCourses extends BaseSchema {
  protected tableName = 'courses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('pdf')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('pdf')
    })
  }
}
