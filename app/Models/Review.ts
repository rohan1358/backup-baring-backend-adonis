import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Course from './Course'

export default class Review extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public courseId: number

  @column()
  public star: number

  @column()
  public body: string

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Course)
  public course: BelongsTo<typeof Course>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
