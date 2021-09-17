import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Course from 'App/Models/Course'
import User from 'App/Models/User'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import fs from 'fs'
import s3 from 'App/Helpers/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export default class CoursesController {
  public async create({ request }: HttpContextContract) {
    const {
      title,
      description,
      cover,
      mentor: mentorId,
      price,
    } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        description: schema.string(),
        cover: schema.file({ size: '3mb', extnames: ['jpg', 'png', 'jpeg'] }),
        mentor: schema.number(),
        price: schema.number(),
      }),
    })

    const mentor = await User.findByOrFail('id', mentorId)

    const result = await Database.transaction(async (trx) => {
      const filename = `${cuid()}.${cover.extname}`
      const course = new Course()

      course.title = title
      course.description = description
      course.cover = filename
      course.price = price
      course.mentorId = mentor.id

      await course.useTransaction(trx).save()

      await s3.send(
        new PutObjectCommand({
          Key: filename,
          Bucket: 'online-course-covers',
          Body: fs.createReadStream(cover.tmpPath!),
        })
      )

      return course.toJSON()
    })

    return result
  }
}
