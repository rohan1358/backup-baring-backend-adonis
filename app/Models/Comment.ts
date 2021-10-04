import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Subject from './Subject'
import User from './User'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public body: string

  @column()
  public userId: number

  @column()
  public subjectId: number

  @column()
  public parentId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Subject)
  public subject: BelongsTo<typeof Subject>

  @belongsTo(() => Comment, { foreignKey: 'parentId' })
  public repliedTo: BelongsTo<typeof Comment>

  @hasMany(() => Comment, {
    foreignKey: 'parentId',
  })
  public replies: HasMany<typeof Comment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
