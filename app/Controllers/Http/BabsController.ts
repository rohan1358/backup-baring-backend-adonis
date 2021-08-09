import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Bab from 'App/Models/Bab'
import fs from 'fs'
import Application from '@ioc:Adonis/Core/Application'
import { schema } from '@ioc:Adonis/Core/Validator'
import cuid from 'cuid'

export default class BabsController {
  public async get({ params }: HttpContextContract) {
    const bab = await Bab.findByOrFail('id', params.id)
    const content = await bab.related('content').query().select('id', 'title', 'cover').first()

    return {
      ...bab.toJSON(),
      content: content?.toJSON(),
    }
  }
  public async audioStream({ response, params }: HttpContextContract) {
    const { audio } = await Bab.findByOrFail('id', params.id)
    const path = Application.makePath(audio)

    response.download(path, true)
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
      await fs.unlinkSync(Application.makePath(bab.audio))
      await audio.move(Application.makePath('audio'), {
        name: fileName,
      })
      bab.audio = `/audio/${fileName}`
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
}
