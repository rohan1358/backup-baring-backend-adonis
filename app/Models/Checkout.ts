import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeSave,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import CheckoutDetail from './CheckoutDetail'
import User from './User'

export default class Checkout extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public total: number

  @column()
  public userId: number

  @column({
    serialize: (value: string) => {
      return JSON.parse(value)
    },
  })
  public detail: string | object

  @column()
  public isPaid: boolean

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => CheckoutDetail)
  public items: HasMany<typeof CheckoutDetail>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static stringifyDetailInfo(checkout: Checkout) {
    if (checkout.$dirty.detail && checkout.$dirty.detail instanceof Object) {
      checkout.detail = JSON.stringify(checkout.$dirty.detail)
    }
  }
}
