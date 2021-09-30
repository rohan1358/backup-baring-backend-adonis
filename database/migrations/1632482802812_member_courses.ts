import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class MemberCourses extends BaseSchema {
  protected tableName = 'member_course'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('users.id')
      table.integer('course_id').unsigned().references('courses.id')
      table.boolean('mentor')
      table.unique(['user_id', 'course_id'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
