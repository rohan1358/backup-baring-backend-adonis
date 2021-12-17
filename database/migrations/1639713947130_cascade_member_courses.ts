import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CascadeMemberCourses extends BaseSchema {
  protected tableName = 'member_course'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('user_id')
      table.dropForeign('course_id')
      table.integer('user_id').unsigned().references('users.id').onDelete('cascade').alter()
      table.integer('course_id').unsigned().references('courses.id').onDelete('cascade').alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('user_id')
      table.dropForeign('course_id')
      table.integer('user_id').unsigned().references('users.id').onDelete('set null').alter()
      table.integer('course_id').unsigned().references('courses.id').onDelete('set null').alter()
    })
  }
}
