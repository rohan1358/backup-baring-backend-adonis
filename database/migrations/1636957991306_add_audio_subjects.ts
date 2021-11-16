import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddAudioSubjects extends BaseSchema {
  protected tableName = 'subjects'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('pdf').nullable().alter()
      table.string('audio').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('audio')
      table.string('audio').notNullable().alter()
    })
  }
}
