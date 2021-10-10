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
  private _infiniteLoad(query, first = false) {
    query.select('id', 'title').preload('childs', (query) => {
      this._infiniteLoad(query)
    })
    if (first) {
      query.whereDoesntHave('parent')
    }
  }
  public async index() {
    const courses = await Course.query()
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .orderBy('created_at', 'desc')

    return courses.map((course) => course.serialize())
  }

  public async read({ params, auth }: HttpContextContract) {
    const courseQuery = Course.query()
      .where('courses.id', params.id)
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .preload('subjects', (query) => {
        this._infiniteLoad(query, true)
      })

    let course = await courseQuery.firstOrFail()

    if (auth.use('userApi').isLoggedIn) {
      course = await courseQuery
        .select(
          'courses.*',
          Database.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_member`),
          Database.raw(
            `CASE WHEN member_course.mentor = TRUE THEN TRUE ELSE FALSE END as is_mentor`
          ),
          Database.raw(`CASE WHEN reviews.id IS NULL THEN FALSE ELSE TRUE END as is_reviewed`)
        )
        .leftOuterJoin('member_course', (query) => {
          query
            .on('member_course.course_id', '=', 'courses.id')
            .andOnVal('member_course.user_id', auth.use('userApi').user?.id!)
        })
        .leftOuterJoin('reviews', (query) => {
          query
            .on('reviews.course_id', '=', 'courses.id')
            .andOnVal('reviews.user_id', auth.use('userApi').user?.id!)
        })
        .firstOrFail()
    }

    return {
      ...course.toJSON(),
      is_member: course.$extras.is_member,
      is_mentor: course.$extras.is_mentor,
      is_reviewed: course.$extras.is_reviewed,
    }
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

  public async addMentor({ request, params }: HttpContextContract) {
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

  public async deleteMentor({ params }: HttpContextContract) {
    const course = await Course.findByOrFail('id', params.id)
    const user = await User.findByOrFail('id', params.userId)
    const mentor = await user
      .related('courses')
      .pivotQuery()
      .where('mentor', true)
      .andWhere('course_id', course.id)
      .firstOrFail()

    if (mentor) {
      await course.related('users').detach([user.id])
    }

    return course.toJSON()
  }

  public async join({ params, auth, response }: HttpContextContract) {
    let course = await Course.query()
      .where('courses.id', params.id)
      .andWhereHas('users', (query) => {
        query.where('users.id', auth.use('userApi').user?.id!)
      })
      .first()

    if (course) {
      return response.badRequest()
    }

    course = await Course.findByOrFail('id', params.id)

    await course.related('users').attach({
      [auth.use('userApi').user?.id!]: {
        mentor: false,
      },
    })

    return 'Join success'
  }
}
