import Application from '@ioc:Adonis/Core/Application'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Bab from 'App/Models/Bab'
import Content from 'App/Models/Content'
import cuid from 'cuid'
import fs from 'fs'

export default class ContentsController {
  public async addContent({ request, response }: HttpContextContract) {
    let payload
    try {
      payload = await request.validate({
        schema: schema.create({
          title: schema.string(),
          synopsis: schema.string(),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { title, synopsis } = payload

    const cover = request.file('cover', {
      size: '2mb',
      extnames: ['png', 'jpg', 'jpeg', 'bmp'],
    })

    if (!cover) {
      return response.badRequest('Cover invalid')
    }

    const fileName = `${cuid()}.${cover.extname}`

    const content = new Content()
    content.title = title
    content.synopsis = synopsis
    content.cover = `/covers/${fileName}`

    await content.save()
    await cover.move(Application.publicPath('covers'), {
      name: fileName,
    })

    return content.toJSON()
  }
  public async index({ request }: HttpContextContract) {
    const total = await Content.query().count('* as total')
    const contents = await Content.query()
      .select('id', 'title', 'cover', 'created_at')
      .withCount('babs')
      .orderBy('created_at', 'desc')
      .forPage(request.input('page', 1), 20)

    return { ...total[0].toJSON(), contents }
  }
  public async editContent({ request, response, params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)

    let payload
    try {
      payload = await request.validate({
        schema: schema.create({
          title: schema.string.optional(),
          synopsis: schema.string.optional(),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { title, synopsis } = payload
    const cover = request.file('cover', {
      size: '2mb',
      extnames: ['png', 'jpg', 'jpeg', 'bmp'],
    })

    if (title) {
      content.title = title
    }
    if (synopsis) {
      content.synopsis = synopsis
    }
    if (cover) {
      const fileName = `${cuid()}.${cover.extname}`
      fs.unlink(Application.publicPath(content.cover), () => {})
      await cover.move(Application.publicPath('covers'), {
        name: fileName,
      })

      content.cover = `/covers/${fileName}`
    }

    await content.save()

    return content.toJSON()
  }

  public async rawContent({ params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)

    return content.toJSON()
  }

  public async fullContent({ params }: HttpContextContract) {
    const contents = await Content.findByOrFail('id', params.id)
    const babs = await contents
      .related('babs')
      .query()
      .select('id', 'title')
      .orderBy('created_at', 'asc')

    return { ...contents.toJSON(), babs }
  }

  public async addBab({ params, request, response }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)

    let payload
    try {
      payload = await request.validate({
        schema: schema.create({
          title: schema.string(),
          body: schema.string(),
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

    if (!audio) {
      return response.badRequest('Audio invalid')
    }

    const fileName = `${cuid()}.${audio.extname}`

    const bab = new Bab()
    bab.title = title
    bab.body = body
    bab.audio = `/audio/${fileName}`
    bab.contentId = content.id

    await bab.save()
    await audio.move(Application.makePath('audio'), {
      name: fileName,
    })

    return {
      ...bab.toJSON(),
      content: content.toJSON(),
    }
  }
}
