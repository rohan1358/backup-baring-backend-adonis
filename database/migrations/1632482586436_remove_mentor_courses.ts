import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class RemoveMentorCourses extends BaseSchema {
  protected tableName = 'courses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mentor_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('mentor_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })
  }
}
