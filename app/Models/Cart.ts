import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, computed } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Product from './Product'
import Course from './Course'

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public productId: number

  @column()
  public courseId: number

  @column()
  public qty: number

  @computed()
  public get type() {
    if (this.productId) {
      return 'product'
    } else if (this.courseId) {
      return 'course'
    }

    return null
  }

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>

  @belongsTo(() => Course)
  public course: BelongsTo<typeof Course>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
