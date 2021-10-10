import {
  afterDelete,
  BaseModel,
  beforeDelete,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Subject from './Subject'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import Review from './Review'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column({
    serialize: (value: string) => {
      if (!value) {
        return '/no-image.png'
      }
      return '/api/stream/course-cover/' + value
    },
  })
  public cover: string

  @column()
  public description: string

  @column()
  public price: number

  @column()
  public amemberId: number

  @manyToMany(() => User, { pivotTable: 'member_course', pivotColumns: ['mentor'] })
  public users: ManyToMany<typeof User>

  @hasMany(() => Subject)
  public subjects: HasMany<typeof Subject>

  @hasMany(() => Review)
  public reviews: HasMany<typeof Review>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeDelete()
  public static async beforeDeleteHook(course: Course) {
    const subject = await Subject.findBy('course_id', course.id)

    await subject?.delete()
  }

  @afterDelete()
  public static async afterDeleteHook(course: Course) {
    if (course.cover) {
      await s3.send(new DeleteObjectCommand({ Key: course.cover, Bucket: 'cover-online-course' }))
    }
  }
}
