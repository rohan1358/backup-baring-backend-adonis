import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  afterDelete,
  BaseModel,
  beforeDelete,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import s3 from 'App/Helpers/s3'
import { DateTime } from 'luxon'
import Boost from './Boost'
import Comment from './Comment'
import Course from './Course'

export default class Subject extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public body: string

  @column()
  public video: string

  @column()
  public parentId: number | null

  @column()
  public courseId: number

  @belongsTo(() => Subject, { foreignKey: 'parentId' })
  public parent: BelongsTo<typeof Subject>

  @hasMany(() => Subject, { foreignKey: 'parentId' })
  public childs: HasMany<typeof Subject>

  @belongsTo(() => Course)
  public course: BelongsTo<typeof Course>

  @hasMany(() => Comment)
  public comments: HasMany<typeof Comment>

  @hasMany(() => Boost)
  public boosts: HasMany<typeof Boost>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeDelete()
  public static async beforeDeleteHook(subject: Subject) {
    const childs = await Subject.findBy('parent_id', subject.id)

    await childs?.delete()
  }

  @afterDelete()
  public static async afterDeleteHook(subject: Subject) {
    if (subject.video) {
      await s3.send(new DeleteObjectCommand({ Key: subject.video, Bucket: 'video-online-course' }))
    }
  }
}
