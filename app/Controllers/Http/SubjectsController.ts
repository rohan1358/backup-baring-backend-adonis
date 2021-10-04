import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Subject from 'App/Models/Subject'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'

export default class SubjectsController {
  private _infiniteLoad(query) {
    query.select('id', 'title').preload('childs', (query) => {
      this._infiniteLoad(query)
    })
  }

  private async _create({ params, request }: HttpContextContract, inParent: boolean = false) {
    const { title, body, video } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        body: schema.string.optional(),
        video: schema.file.optional({
          size: '1024mb',
          extnames: ['mp4', 'mkv'],
        }),
      }),
    })

    const result = await Database.transaction(async (trx) => {
      const filename = `${cuid()}.${video?.extname}`

      const subject = new Subject()
      subject.title = title
      if (body) {
        subject.body = body
      }
      if (video) {
        subject.video = filename
      }
      if (inParent) {
        const parent = await Subject.findByOrFail('id', params.id)
        subject.parentId = params.id
        subject.courseId = parent.courseId
      } else {
        subject.courseId = params.id
      }

      await subject.useTransaction(trx).save()

      if (video) {
        await s3.send(
          new PutObjectCommand({
            Key: filename,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(video.tmpPath!),
          })
        )
      }

      return subject.toJSON()
    })

    return result
  }

  public async createInParent(ctx: HttpContextContract) {
    return await this._create(ctx, true)
  }

  public async createWithoutParent(ctx: HttpContextContract) {
    return await this._create(ctx, false)
  }

  public async edit({ params, request }: HttpContextContract) {
    const subject = await Subject.findByOrFail('id', params.id)
    const { title, body, video } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        body: schema.string.optional(),
        video: schema.file.optional({
          size: '1024mb',
          extnames: ['mp4', 'mkv'],
        }),
      }),
    })

    const result = await Database.transaction(async (trx) => {
      let deleteOld: string | null = null
      const filename = `${cuid()}.${video?.extname}`
      subject.title = title
      subject.body = body || ''
      if (video) {
        if (subject.video) {
          deleteOld = subject.video
        }
        subject.video = filename
      }
      await subject.useTransaction(trx).save()

      if (video) {
        if (deleteOld) {
          await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'video-online-course' }))
        }
        await s3.send(
          new PutObjectCommand({
            Key: filename,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(video.tmpPath!),
          })
        )
      }

      return subject.toJSON()
    })

    return result
  }

  public async read({ params, auth }: HttpContextContract) {
    const subjectQuery = Subject.query()
      .select(
        'subjects.*',
        Database.raw(`CASE WHEN boosts.id IS NULL THEN FALSE ELSE TRUE END as is_boosted`)
      )
      .where('subjects.id', params.id)
      .preload('childs', (query) => {
        this._infiniteLoad(query)
      })
      .preload('course', (query) => {
        query.select('id', 'title')
      })
      .leftOuterJoin('boosts', (query) => {
        query
          .on('boosts.subject_id', '=', 'subjects.id')
          .andOnVal('boosts.user_id', auth.use('userApi').user?.id!)
      })
      .withCount('comments')

    let subject = await subjectQuery.firstOrFail()
    if (auth.use('userApi').isLoggedIn) {
      subject = await subjectQuery
        .andWhereHas('course', (query) => {
          query.whereHas('users', (query) => {
            query.where('users.id', auth.use('userApi').user?.id!)
          })
        })
        .firstOrFail()
    }

    return {
      ...subject.toJSON(),
      comments_count: subject.$extras.comments_count,
      is_boosted: subject.$extras.is_boosted,
    }
  }

  public async delete({ params }: HttpContextContract) {
    const subject = await Subject.findByOrFail('id', params.id)

    await subject.delete()
    return subject.toJSON()
  }
}
