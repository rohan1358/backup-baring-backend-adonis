import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Subject from './Subject'

export default class Boost extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public subjectId: number

  @column()
  public body: string

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Subject)
  public subject: BelongsTo<typeof Subject>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
