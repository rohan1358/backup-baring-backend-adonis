import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import s3 from 'App/Helpers/s3'
import Course from 'App/Models/Course'
import User from 'App/Models/User'
import axios from 'axios'
import fs from 'fs'
import Env from '@ioc:Adonis/Core/Env'
import makeQuery from 'App/Helpers/makeQuery'
import { DateTime } from 'luxon'

export default class CoursesController {
  private _infiniteLoad(query, first = false) {
    query
      .select('id', 'title', 'position')
      .orderBy('position', 'asc')
      .preload('childs', (query) => {
        this._infiniteLoad(query)
      })
    if (first) {
      query.whereDoesntHave('parent')
    }
  }
  public async index({ request }: HttpContextContract) {
    const { page } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
      data: request.all(),
    })

    const limit = 10
    const offset = (page ? page - 1 : 0) * limit

    const total = await Course.query().count('* as total')
    const courses = await Course.query()
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: courses.map((course) => course.serialize()),
    }
  }

  public async list({ request, auth }: HttpContextContract) {
    const { page } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
      data: request.all(),
    })

    const limit = 12
    const offset = (page ? page - 1 : 0) * limit

    const total = await Course.query()
      .whereHas('users', (query) => {
        query.where('users.id', auth.use('userApi').user?.id!)
      })
      .count('* as total')
    const courses = await Course.query()
      .preload('users', (query) => {
        query.wherePivot('mentor', true)
      })
      .whereHas('users', (query) => {
        query.where('users.id', auth.use('userApi').user?.id!)
      })
      .limit(limit)
      .offset(offset)

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: courses.map((course) => course.serialize()),
    }
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

  public async changePDF({ request, params }: HttpContextContract) {
    const { pdf } = await request.validate({
      schema: schema.create({
        pdf: schema.file({ size: '10mb', extnames: ['pdf'] }),
      }),
    })

    const result = Database.transaction(async (trx) => {
      let deleteOld: string | null = null
      const course = await Course.findByOrFail('id', params.id)
      if (course.pdf) {
        deleteOld = course.pdf
      }
      const filename = `${cuid()}.${pdf.extname}`
      course.pdf = filename
      await course.useTransaction(trx).save()

      await s3.send(
        new PutObjectCommand({
          Key: filename,
          Bucket: 'pdf-course',
          Body: fs.createReadStream(pdf.tmpPath!),
        })
      )
      if (deleteOld) {
        await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'pdf-course' }))
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
    const mentor = await course.related('users').pivotQuery().where('user_id', user.id).first()
    if (mentor) {
      await Database.rawQuery(
        'UPDATE member_course SET mentor=TRUE WHERE course_id=:course AND user_id=:user',
        {
          course: course.id,
          user: user.id,
        }
      )
    } else {
      await course.related('users').attach({
        [user.id]: {
          mentor: true,
        },
      })
    }

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

  public async delete({ params }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    await course.delete()
    return course.serialize()
  }

  public async join({ params, response, auth }: HttpContextContract) {
    const course = await Course.findOrFail(params.id)
    if (course.price) return response.methodNotAllowed()

    const result = await Database.transaction(async (t) => {
      const courses = {} as any
      courses[course.id] = {
        mentor: false,
        subscription_end: '2037-12-31',
      }

      await auth.use('userApi').user!.useTransaction(t).related('courses').sync(courses)

      const addAccess = await axios.post(
        `${Env.get('AMEMBER_URL')}/api/access`,
        makeQuery({
          _key: Env.get('AMEMBER_KEY'),
          user_id: auth.use('userApi').user?.id!,
          product_id: 6,
          begin_date: DateTime.now().toFormat('yyyy-LL-dd'), // Today
          expire_date: '2037-12-31', // Lifetime
        }).string()
      )
      if (addAccess.data.error) {
        throw new Error()
      }

      return course.serialize()
    })

    return result
  }
}
