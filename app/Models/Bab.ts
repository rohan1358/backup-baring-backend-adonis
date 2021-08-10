import { DateTime } from 'luxon'
import { afterDelete, BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Content from './Content'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

export default class Bab extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public body: string

  @column({ serializeAs: null })
  public audio: string

  @column()
  public contentId: number

  @belongsTo(() => Content)
  public content: BelongsTo<typeof Content>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @afterDelete()
  public static async afterDeleteHook(bab: Bab) {
    const path = Application.makePath(bab.audio)

    fs.unlink(path, () => {})
  }
}
