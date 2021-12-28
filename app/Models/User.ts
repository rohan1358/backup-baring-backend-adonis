import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Boost from './Boost'
import Checkout from './Checkout'
import Comment from './Comment'
import Course from './Course'
import Like from './Like'
import LoginLog from './LoginLog'
import Partner from './Partner'
import ReadLog from './ReadLog'
import Review from './Review'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public amemberId: number

  @column()
  public fullname: string

  @column()
  public username: string

  @column({
    serialize: (value: string) => {
      if (!value) {
        return '/no-image.png'
      }
      return '/api/stream/user-avatar/' + value
    },
  })
  public avatar: string

  @column()
  public email: string

  @column.dateTime()
  public subscriptionEnd: DateTime

  @column()
  public partnerId: number

  @column()
  public isMentor: boolean

  @column()
  public inTrial: boolean

  @column()
  public haveTrial: boolean

  @belongsTo(() => Partner)
  public partner: BelongsTo<typeof Partner>

  @hasMany(() => LoginLog)
  public loginLogs: HasMany<typeof LoginLog>

  @hasMany(() => ReadLog)
  public readLogs: HasMany<typeof ReadLog>

  @hasMany(() => Like)
  public liked: HasMany<typeof Like>

  @hasMany(() => Checkout)
  public checkouts: HasMany<typeof Checkout>

  @manyToMany(() => Course, { pivotTable: 'member_course' })
  public courses: ManyToMany<typeof Course>

  @hasMany(() => Comment)
  public comments: HasMany<typeof Comment>

  @hasMany(() => Boost)
  public boosts: HasMany<typeof Boost>

  @hasMany(() => Review)
  public reviews: HasMany<typeof Review>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
