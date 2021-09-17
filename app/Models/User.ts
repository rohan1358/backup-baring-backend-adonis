import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Course from './Course'
import Partner from './Partner'
import LoginLog from './LoginLog'
import ReadLog from './ReadLog'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public amemberId: number

  @column()
  public fullname: string

  @column()
  public username: string

  @column()
  public subscriptionEnd: DateTime

  @column()
  public partnerId: number

  @belongsTo(() => Partner)
  public partner: BelongsTo<typeof Partner>

  @hasMany(() => LoginLog)
  public loginLogs: HasMany<typeof LoginLog>

  @hasMany(() => ReadLog)
  public readLogs: HasMany<typeof ReadLog>

  @hasMany(() => Course, {
    foreignKey: 'mentorId',
  })
  public courses: HasMany<typeof Course>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
