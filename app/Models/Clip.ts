import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Bab from './Bab'
import User from './User'

export default class Clip extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public babId: number

  @column()
  public body: string

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Bab)
  public bab: BelongsTo<typeof Bab>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
