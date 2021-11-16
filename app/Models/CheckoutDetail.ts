import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Checkout from './Checkout'
import Product from './Product'
import Course from './Course'

export default class CheckoutDetail extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public price: number

  @column()
  public qty: number

  @column()
  public checkoutId: number

  @column()
  public courseId: number

  @column()
  public productId: number

  @belongsTo(() => Checkout)
  public checkout: BelongsTo<typeof Checkout>

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

  @belongsTo(() => Course)
  public course: BelongsTo<typeof Course>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
