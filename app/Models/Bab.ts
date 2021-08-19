import { DateTime } from 'luxon'
import { afterDelete, BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Content from './Content'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import Route from '@ioc:Adonis/Core/Route'

export default class Bab extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public body: string

  @column({
    serialize: (value: string) => {
      return Route.makeSignedUrl(
        'streamBab',
        {
          filename: value,
        },
        {
          expiresIn: '30m',
        }
      )
    },
  })
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
    await s3.send(new DeleteObjectCommand({ Key: bab.audio, Bucket: 'ring-audio-01' }))
  }
}
