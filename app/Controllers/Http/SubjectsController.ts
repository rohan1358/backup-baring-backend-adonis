import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Subject from 'App/Models/Subject'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import Ffmpeg, * as ffmpeg from 'fluent-ffmpeg'

import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import axios from 'axios'

if (ffmpegPath) {
  ffmpegPath.path

  Ffmpeg.setFfmpegPath(ffmpegPath.path)
}

export default class SubjectsController {
  private _infiniteLoad(query) {
    query
      .select('id', 'title')
      .orderBy('position', 'asc')
      .preload('childs', (query) => {
        this._infiniteLoad(query)
      })
  }

  private async _create({ params, request }: HttpContextContract, inParent: boolean = false) {
    const { title, body, video, pdf, audio } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        body: schema.string.optional(),
        audio: schema.file.optional({
          size: '100mb',
          extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
        }),
        video: schema.file.optional({
          size: '3000mb',
          extnames: [
            'mp4',
            'mkv',
            'webm',
            'flv',
            'vob',
            'ogv',
            'ogg',
            'drc',
            'gif',
            'gifv',
            'mng',
            'avi',
            'MTS',
            'M2TS',
            'TS',
            'mov',
            'qt',
            'wmv',
            'yuv',
            'rm',
            'rmvb',
            'viv',
            'asf',
            'amv',
            'm4p',
            'm4v',
            'mpg',
            'mp2',
            'mpeg',
            'mpe',
            'mpv',
            'svi',
            '3gp',
            '3g2',
            'mxf',
            'roq',
            'nsv',
            'f4v',
            'f4p',
            'f4a',
            'f4b',
          ],
        }),
        pdf: schema.file.optional({
          size: '10mb',
          extnames: ['pdf'],
        }),
      }),
    })

    let id = cuid()

    const filename = `${id}.${video?.extname}`

    var output720 = `${__dirname}/path/to/${id}-720`
    var output480 = `${__dirname}/path/to/${id}-480`
    var output360 = `${__dirname}/path/to/${id}-360`

    let q720 = `${id}-720.${video?.extname}`
    let q480 = `${id}-480.${video?.extname}`
    let q360 = `${id}-360.${video?.extname}`
    let filename720 = `${output720}.${video?.extname}`
    let filename480 = `${output480}.${video?.extname}`
    let filename360 = `${output360}.${video?.extname}`

    if (video) {
      await new Promise((resolve, reject) => {
        Ffmpeg(video.tmpPath)
          .output(`${output720}.${video.extname}`)
          .videoCodec('libx264')
          .size('720x?')
          .output(`${output480}.${video.extname}`)
          .videoCodec('libx264')
          .size('480x?')

          .output(`${output360}.${video.extname}`)
          .videoCodec('libx264')
          .size('360x?')
          .on('error', function (err) {
            // console.log('An error occurred: ' + err.message)
          })
          .on('progress', function (progress) {
            // console.log('... frames: ' + progress.frames)
          })
          .on('end', function () {
            resolve('Finished processing')
          })
          .run()
      })
    }

    const result = await Database.transaction(async (trx) => {
      const filename = `${id}.${video?.extname}`
      const pdfFilename = `${cuid()}.${pdf?.extname}`
      const audioFilename = `${cuid()}.${audio?.extname}`

      const subject = new Subject()
      subject.title = title
      if (body) {
        subject.body = body
      }
      if (video) {
        subject.video = filename
      }
      if (audio) {
        subject.audio = audioFilename
      }
      if (pdf) {
        subject.pdf = pdfFilename
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
        // console.log(video.tmpPath!)

        await s3.send(
          new PutObjectCommand({
            Key: filename,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(video.tmpPath!),
          })
        )

        await s3.send(
          new PutObjectCommand({
            Key: q720,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename720),
          })
        )

        await s3.send(
          new PutObjectCommand({
            Key: q480,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename480),
          })
        )
        await s3.send(
          new PutObjectCommand({
            Key: q360,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename360),
          })
        )

        fs.readdir(`${__dirname}/path/to/`, (error, filesInDirectory) => {
          if (error) throw error
          for (let file of filesInDirectory) {
            // console.log('File removed' + ' : ' + file)
            fs.unlinkSync(`${__dirname}/path/to/` + file)
          }
        })
      }
      if (audio) {
        await s3.send(
          new PutObjectCommand({
            Key: audioFilename,
            Bucket: 'audio-course',
            Body: fs.createReadStream(audio.tmpPath!),
          })
        )
      }
      if (pdf) {
        await s3.send(
          new PutObjectCommand({
            Key: pdfFilename,
            Bucket: 'pdf-course',
            Body: fs.createReadStream(pdf.tmpPath!),
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
    const { title, body, video, audio, pdf } = await request.validate({
      schema: schema.create({
        title: schema.string(),
        body: schema.string.optional(),
        audio: schema.file.optional({
          size: '100mb',
          extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
        }),

        pdf: schema.file.optional({
          size: '10mb',
          extnames: ['pdf'],
        }),
        video: schema.file.optional({
          size: '3000mb',
          extnames: [
            'mp4',
            'mkv',
            'webm',
            'flv',
            'vob',
            'ogv',
            'ogg',
            'drc',
            'gif',
            'gifv',
            'mng',
            'avi',
            'MTS',
            'M2TS',
            'TS',
            'mov',
            'qt',
            'wmv',
            'yuv',
            'rm',
            'rmvb',
            'viv',
            'asf',
            'amv',
            'm4p',
            'm4v',
            'mpg',
            'mp2',
            'mpeg',
            'mpe',
            'mpv',
            'svi',
            '3gp',
            '3g2',
            'mxf',
            'roq',
            'nsv',
            'f4v',
            'f4p',
            'f4a',
            'f4b',
          ],
        }),
      }),
    })

    let id = cuid()

    const filename = `${id}.${video?.extname}`

    var output720 = `${__dirname}/path/to/${id}-720`
    var output480 = `${__dirname}/path/to/${id}-480`
    var output360 = `${__dirname}/path/to/${id}-360`

    let q720 = `${id}-720.${video?.extname}`
    let q480 = `${id}-480.${video?.extname}`
    let q360 = `${id}-360.${video?.extname}`
    let filename720 = `${output720}.${video?.extname}`
    let filename480 = `${output480}.${video?.extname}`
    let filename360 = `${output360}.${video?.extname}`

    if (video) {
      await new Promise((resolve, reject) => {
        Ffmpeg(video.tmpPath)
          .output(`${output720}.${video.extname}`)
          .videoCodec('libx264')
          .size('720x?')
          .output(`${output480}.${video.extname}`)
          .videoCodec('libx264')
          .size('480x?')

          .output(`${output360}.${video.extname}`)
          .videoCodec('libx264')
          .size('360x?')
          .on('error', function (err) {
            // console.log('An error occurred: ' + err.message)
          })
          .on('progress', function (progress) {
            // console.log('... frames: ' + progress.frames)
          })
          .on('end', function () {
            resolve('Finished processing')
          })
          .run()
      })
    }

    const result = await Database.transaction(async (trx) => {
      let deleteOld: string | null = null
      let deleteOldAudio: string | null = null
      let deleteOldPdf: string | null = null
      const filename = `${id}.${video?.extname}`
      const audioFileName = `${cuid()}.${audio?.extname}`
      const pdfFileName = `${cuid()}.${pdf?.extname}`
      subject.title = title
      subject.body = body || ''

      if (video) {
        if (subject.video) {
          deleteOld = subject.video
        }
        subject.video = filename
      }
      if (audio) {
        if (subject.audio) {
          deleteOldAudio = subject.audio
        }
        subject.audio = audioFileName
      }

      if (pdf) {
        if (subject.pdf) {
          deleteOldPdf = subject.pdf
        }
        subject.pdf = pdfFileName
      }
      await subject.useTransaction(trx).save()

      if (video) {
        if (deleteOld) {
          await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'video-online-course' }))

          let replace = subject.video.replace('.mp4', '')
          await s3.send(
            new DeleteObjectCommand({ Key: `${replace}-720.mp4`, Bucket: 'video-online-course' })
          )
          await s3.send(
            new DeleteObjectCommand({ Key: `${replace}-480.mp4`, Bucket: 'video-online-course' })
          )
          await s3.send(
            new DeleteObjectCommand({ Key: `${replace}-360.mp4`, Bucket: 'video-online-course' })
          )
        }

        await s3.send(
          new PutObjectCommand({
            Key: filename,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(video.tmpPath!),
          })
        )

        await s3.send(
          new PutObjectCommand({
            Key: q720,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename720),
          })
        )

        await s3.send(
          new PutObjectCommand({
            Key: q480,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename480),
          })
        )
        await s3.send(
          new PutObjectCommand({
            Key: q360,
            Bucket: 'video-online-course',
            Body: fs.createReadStream(filename360),
          })
        )

        fs.readdir(`${__dirname}/path/to/`, (error, filesInDirectory) => {
          if (error) throw error
          for (let file of filesInDirectory) {
            fs.unlinkSync(`${__dirname}/path/to/` + file)
          }
        })
      }
      if (audio) {
        if (deleteOldAudio) {
          await s3.send(new DeleteObjectCommand({ Key: deleteOldAudio, Bucket: 'audio-course' }))
        }
        await s3.send(
          new PutObjectCommand({
            Key: audioFileName,
            Bucket: 'audio-course',
            Body: fs.createReadStream(audio.tmpPath!),
          })
        )
      }
      if (pdf) {
        if (deleteOldPdf) {
          await s3.send(new DeleteObjectCommand({ Key: deleteOldPdf, Bucket: 'pdf-course' }))
        }
        await s3.send(
          new PutObjectCommand({
            Key: pdfFileName,
            Bucket: 'pdf-course',
            Body: fs.createReadStream(pdf.tmpPath!),
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
        query.select('id', 'title', 'cover')
      })
      .leftOuterJoin('boosts', (query) => {
        query
          .on('boosts.subject_id', '=', 'subjects.id')
          .andOnVal('boosts.user_id', auth.use('userApi').user?.id!)
      })
      .withCount('comments')
      .orderBy('created_at', 'asc')

    let subject = await subjectQuery.firstOrFail()
    if (auth.use('userApi').isLoggedIn) {
      subject = await subjectQuery
        .andWhereHas('course', (query) => {
          query.whereHas('users', (query) => {
            query.where('users.id', auth.use('userApi').user?.id!)
          })
        })
        .select(
          Database.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_member`)
        )
        .leftOuterJoin('member_course', (query) => {
          query
            .on('member_course.course_id', '=', 'subjects.course_id')
            .andOnVal('member_course.user_id', auth.use('userApi').user?.id!)
        })
        .firstOrFail()
    }

    let video = ''
    let video2 = ''
    let video3 = ''
    let video4 = ''
    if (subject.video) {
      let replace = subject.video.replace('.mp4', '')

      video = await getSignedUrl(
        s3 as any,
        new GetObjectCommand({ Key: `${replace}.mp4`, Bucket: 'video-online-course' }) as any,
        { expiresIn: 21600 }
      )
      video2 = await getSignedUrl(
        s3 as any,
        new GetObjectCommand({
          Key: `${replace}-720.mp4`,
          Bucket: 'video-online-course',
        }) as any,
        { expiresIn: 21600 }
      )
      await new Promise((resolve, reject) => {
        axios.get(video2, { timeout: 3000 }).catch((err) => {
          if (err.response.status === 404) {
            video2 = ''
            resolve({
              message: 'file not found',
            })
          }
        })
        setTimeout(() => {
          resolve({
            message: 'file exist',
          })
        }, 3000)
      })
      video3 = await getSignedUrl(
        s3 as any,
        new GetObjectCommand({
          Key: `${replace}-480.mp4`,
          Bucket: 'video-online-course',
        }) as any,
        { expiresIn: 21600 }
      )
      await new Promise((resolve, reject) => {
        axios.get(video3, { timeout: 3000 }).catch((err) => {
          if (err.response.status === 404) {
            video3 = ''
            resolve({
              message: 'file not found',
            })
          }
        })
        setTimeout(() => {
          resolve({
            message: 'file exist',
          })
        }, 3000)
      })

      video4 = await getSignedUrl(
        s3 as any,
        new GetObjectCommand({
          Key: `${replace}-360.mp4`,
          Bucket: 'video-online-course',
        }) as any,
        { expiresIn: 21600 }
      )
      await new Promise((resolve, reject) => {
        axios.get(video4, { timeout: 3000 }).catch((err) => {
          if (err.response.status === 404) {
            video4 = ''
            resolve({
              message: 'file not found',
            })
          }
        })
        setTimeout(() => {
          resolve({
            message: 'file exist',
          })
        }, 3000)
      })
    }

    return {
      ...subject.toJSON(),
      video: subject.video ? video : null,
      video720: subject.video ? video2 : null,
      video480: subject.video ? video3 : null,
      video360: subject.video ? video4 : null,
      comments_count: subject.$extras.comments_count,
      is_boosted: subject.$extras.is_boosted,
      is_member: subject.$extras.is_member,
    }
  }

  public async delete({ params }: HttpContextContract) {
    const subject = await Subject.findByOrFail('id', params.id)

    await subject.delete()
    return subject.toJSON()
  }

  public async arrange({ request }: HttpContextContract) {
    const { positions } = await request.validate({
      schema: schema.create({
        positions: schema.array().members(
          schema.object().members({
            id: schema.number(),
            position: schema.number(),
          })
        ),
      }),
    })

    await Subject.updateOrCreateMany('id', positions)
    return positions
  }
}
