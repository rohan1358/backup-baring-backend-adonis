import { DateTime } from 'luxon'
import {
  beforeDelete,
  BaseModel,
  column,
  HasMany,
  hasMany,
  manyToMany,
  ManyToMany,
  afterDelete,
  afterCreate,
} from '@ioc:Adonis/Lucid/Orm'
import Bab from './Bab'
import Category from './Category'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import Author from './Author'
import Like from './Like'
import Firebase from 'App/Helpers/notification'

export default class Content extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column({
    serialize: (value: string) => {
      return '/api/stream/cover/' + value
    },
  })
  public cover: string

  @column()
  public synopsis: string

  @column({
    serialize: (value: string) => {
      if (value) {
        return '/api/stream/synopsis/' + value
      }

      return null
    },
  })
  public audio: string

  @hasMany(() => Bab)
  public babs: HasMany<typeof Bab>

  @manyToMany(() => Category)
  public categories: ManyToMany<typeof Category>

  @manyToMany(() => Author)
  public authors: ManyToMany<typeof Author>

  @hasMany(() => Like)
  public likes: HasMany<typeof Like>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public serializeExtras() {
    return {
      babs_count: this.$extras.babs_count,
      total: this.$extras.total,
      is_liked: this.$extras.is_liked,
    }
  }

  @beforeDelete()
  public static async beforeDeleteHook(content: Content) {
    const bab = await Bab.findBy('content_id', content.id)

    await bab?.delete()
  }

  @afterCreate()
  public static async afterCreateContent(content: Content) {
    Firebase.messaging()
      .sendToTopic('newRelease', {
        notification: {
          title: 'Rilisan Baru',
          body: content.title,
        },
      })
      .then(() => {})
  }

  @afterDelete()
  public static async afterDeleteHook(content: Content) {
    await s3.send(new DeleteObjectCommand({ Key: content.cover, Bucket: 'covers-01' }))
    if (content.audio) {
      await s3.send(new DeleteObjectCommand({ Key: content.audio, Bucket: 'plot-audio-01' }))
    }
  }
}
