import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddPdfToSubjects extends BaseSchema {
  protected tableName = 'subjects'

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
