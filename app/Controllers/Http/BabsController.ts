import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import s3 from 'App/Helpers/s3'
import Bab from 'App/Models/Bab'
import cuid from 'cuid'
import fs from 'fs'

export default class BabsController {
  public async get({ params }: HttpContextContract) {
    const bab = await Bab.findByOrFail('id', params.id)
    const content = await bab.related('content').query().select('id', 'title', 'cover').first()

    return {
      ...bab.toJSON(),
      content: content?.toJSON(),
    }
  }

  public async edit({ params, request, response }: HttpContextContract) {
    const bab = await Bab.findByOrFail('id', params.id)
    const content = await bab.related('content').query().select('id', 'title', 'cover').first()

    let payload
    try {
      payload = await request.validate({
        schema: schema.create({
          title: schema.string.optional(),
          body: schema.string.optional(),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { title, body } = payload

    const audio = request.file('audio', {
      size: '100mb',
      extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
    })

    if (title) {
      bab.title = title
    }
    if (body) {
      bab.body = body
    }
    if (audio) {
      const fileName = `${cuid()}.${audio.extname}`
      await s3.send(new DeleteObjectCommand({ Key: bab.audio, Bucket: 'ring-audio-01' }))
      await s3.send(
        new PutObjectCommand({
          Key: fileName,
          Bucket: 'ring-audio-01',
          Body: fs.createReadStream(audio.tmpPath!),
        })
      )
      bab.audio = `${fileName}`
    }

    await bab.save()
    return {
      ...bab.toJSON(),
      content: content?.toJSON(),
    }
  }
  public async read({ params }: HttpContextContract) {
    const bab = await Bab.findByOrFail('id', params.id)
    const content = await bab.related('content').query().select('id', 'title', 'cover').first()
    const babs =
      (await content?.related('babs').query().select('id', 'title').orderBy('created_at', 'asc')) ||
      []

    return {
      ...bab.toJSON(),
      content: {
        ...content?.toJSON(),
        babs,
      },
    }
  }
  public async delete({ params }: HttpContextContract) {
    const bab = await Bab.findByOrFail('id', params.id)
    await bab.delete()
    return bab.toJSON()
  }
}
