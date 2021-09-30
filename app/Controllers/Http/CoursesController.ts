import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Course from 'App/Models/Course'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import User from 'App/Models/User'

export default class CoursesController {
  private _infiniteLoad(query) {
    query.select('id', 'title').preload('childs', (query) => {
      this._infiniteLoad(query)
    })
  }
  public async index() {
    const courses = await Course.query()
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .orderBy('created_at', 'desc')

    return courses.map((course) => course.serialize())
  }

  public async read({ params }: HttpContextContract) {
    const course = await Course.query()
      .where('id', params.id)
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .preload('subjects', (query) => {
        this._infiniteLoad(query)
      })
      .firstOrFail()

    return course.toJSON()
  }

  public async changeCover({ request, params }: HttpContextContract) {
    const { cover } = await request.validate({
      schema: schema.create({
        cover: schema.file({ size: '10mb', extnames: ['jpg', 'png', 'jpeg'] }),
      }),
    })

    const result = Database.transaction(async (trx) => {
      let deleteOld: string | null = null
      const course = await Course.findByOrFail('id', params.id)
      if (course.cover) {
        deleteOld = course.cover
      }
      const filename = `${cuid()}.${cover.extname}`
      course.cover = filename
      await course.useTransaction(trx).save()

      await s3.send(
        new PutObjectCommand({
          Key: filename,
          Bucket: 'online-course-covers',
          Body: fs.createReadStream(cover.tmpPath!),
        })
      )
      if (deleteOld) {
        await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'online-course-covers' }))
      }

      return course.toJSON()
    })
    return result
  }

  public async changeMentor({ request, params }: HttpContextContract) {
    const course = await Course.findByOrFail('id', params.id)

    const { mentor: mentorId } = await request.validate({
      schema: schema.create({
        mentor: schema.number(),
      }),
    })

    const user = await User.findByOrFail('id', mentorId)
    const mentor = await course.related('users').pivotQuery().where('mentor', true).first()

    if (mentor && user.id !== mentor.id) {
      await course.related('users').detach([mentor.id])
    }

    await course.related('users').attach({
      [user.id]: {
        mentor: true,
      },
    })

    return course.toJSON()
  }
}
