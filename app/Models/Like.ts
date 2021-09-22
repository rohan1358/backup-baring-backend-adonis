import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Content from './Content'
import User from './User'

export default class Like extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public contentId: number

  @column()
  public userId: number

  @belongsTo(() => Content)
  public content: BelongsTo<typeof Content>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
