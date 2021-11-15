import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddCourseCarts extends BaseSchema {
  protected tableName = 'carts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('product_id').nullable().alter()
      table.integer('course_id').unsigned().nullable().references('courses.id').onDelete('cascade')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('course_id')
      table.integer('product_id').notNullable().alter()
    })
  }
}
