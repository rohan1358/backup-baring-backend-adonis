import { BaseModel, beforeSave, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Partner from './Partner'

export default class Admin extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column()
  public fullname: string

  @column({ serializeAs: null })
  public password: string

  @column({
    serialize: (value) => {
      if (!value) return 'super'
      return value
    },
  })
  public role: string

  @column()
  public partnerId: number

  @belongsTo(() => Partner)
  public partner: BelongsTo<typeof Partner>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async changePartnerRole(admin: Admin) {
    admin.role = admin.partnerId ? 'partner' : admin.role
  }
}
