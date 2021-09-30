import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Subjects extends BaseSchema {
  protected tableName = 'subjects'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title')
      table.string('body').nullable()
      table.string('video').nullable()
      table
        .integer('parent_id')
        .nullable()
        .unsigned()
        .references('subjects.id')
        .onDelete('set null')
      table.integer('course_id').nullable().unsigned().references('courses.id').onDelete('set null')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
