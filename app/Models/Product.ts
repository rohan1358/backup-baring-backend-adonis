import { DateTime } from 'luxon'
import { afterCreate, afterDelete, BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import Firebase from 'App/Helpers/notification'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column({
    serialize: (value: string) => {
      if (!value) {
        return '/no-image.png'
      }
      return '/api/stream/product-cover/' + value
    },
  })
  public cover: string

  @column()
  public description: string

  @column()
  public price: number

  @column()
  public amemberId: number

  @column()
  public weight: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @afterDelete()
  public static async afterDeleteHook(product: Product) {
    if (product.cover) {
      await s3.send(new DeleteObjectCommand({ Key: product.cover, Bucket: 'product-images' }))
    }
  }

  @afterCreate()
  public static async afterCreateProduct(product: Product) {
    Firebase.messaging()
      .sendToTopic('newProduct', {
        notification: {
          title: 'Produk Baru',
          body: product.title,
        },
      })
      .then(() => {})
  }
}
