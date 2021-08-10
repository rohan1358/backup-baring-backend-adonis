import { DateTime } from 'luxon'
import { beforeDelete, BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Bab from './Bab'

export default class Content extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public cover: string

  @column()
  public synopsis: string

  @hasMany(() => Bab)
  public babs: HasMany<typeof Bab>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public serializeExtras() {
    return {
      babs_count: this.$extras.babs_count,
      total: this.$extras.total,
    }
  }

  @beforeDelete()
  public static async beforeDeleteHook(content: Content) {
    const bab = await Bab.findBy('content_id', content.id)

    await bab?.delete()
  }
}
