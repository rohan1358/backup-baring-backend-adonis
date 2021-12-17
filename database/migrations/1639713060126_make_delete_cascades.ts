import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class MakeDeleteCascades extends BaseSchema {
  protected tableName = 'comments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('subject_id')
      table.dropForeign('parent_id')
      table
        .integer('subject_id')
        .nullable()
        .unsigned()
        .references('subjects.id')
        .onDelete('cascade')
        .alter()
      table
        .integer('parent_id')
        .nullable()
        .unsigned()
        .references('comments.id')
        .onDelete('cascade')
        .alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('subject_id')
      table.dropForeign('parent_id')
      table
        .integer('subject_id')
        .nullable()
        .unsigned()
        .references('subjects.id')
        .onDelete('set null')
        .alter()
      table
        .integer('parent_id')
        .nullable()
        .unsigned()
        .references('comments.id')
        .onDelete('set null')
        .alter()
    })
  }
}
