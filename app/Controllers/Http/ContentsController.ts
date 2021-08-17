import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import s3 from 'App/Helpers/s3'
import Bab from 'App/Models/Bab'
import Category from 'App/Models/Category'
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
          categories: schema.array.optional().members(schema.number()),
          createCategories: schema.array.optional().members(schema.string()),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { title, synopsis, categories: categoriesList, createCategories } = payload

    const cover = request.file('cover', {
      size: '2mb',
      extnames: ['png', 'jpg', 'jpeg', 'bmp'],
    })

    const audio = request.file('audio', {
      size: '100mb',
      extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
    })

    if (!cover) {
      return response.badRequest('Cover invalid')
    }

    const fileName = `${cuid()}.${cover.extname}`

    const content = new Content()
    content.title = title
    content.synopsis = synopsis
    content.cover = `${fileName}`

    if (audio) {
      const audioFileName = `${cuid()}.${audio.extname}`
      content.audio = audioFileName

      await s3.send(
        new PutObjectCommand({
          Bucket: 'plot-audio-01',
          Key: audioFileName,
          Body: fs.createReadStream(audio.tmpPath!),
        })
      )
    }

    await content.save()

    const S3Command = new PutObjectCommand({
      Bucket: 'covers-01',
      Key: fileName,
      Body: fs.createReadStream(cover.tmpPath!),
    })
    await s3.send(S3Command)

    if (categoriesList?.length) {
      const categories = await Category.query().whereIn('id', categoriesList)
      const validCategories: number[] = []

      for (let category of categories) {
        validCategories.push(category.id)
      }

      if (validCategories.length) await content.related('categories').attach(validCategories)
    }

    if (createCategories?.length) {
      const newCategoriesData: object[] = []
      for (let categoryName of createCategories) {
        newCategoriesData.push({ name: categoryName })
      }
      await content.related('categories').createMany(newCategoriesData)
    }

    return {
      ...content.toJSON(),
      categories: await content.related('categories').query(),
    }
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
          categories: schema.array.optional().members(schema.number()),
          createCategories: schema.array.optional().members(schema.string()),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { title, synopsis, categories: categoryList, createCategories } = payload
    const cover = request.file('cover', {
      size: '2mb',
      extnames: ['png', 'jpg', 'jpeg', 'bmp'],
    })
    const audio = request.file('audio', {
      size: '100mb',
      extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
    })

    if (title) {
      content.title = title
    }
    if (synopsis) {
      content.synopsis = synopsis
    }
    if (cover) {
      const fileName = `${cuid()}.${cover.extname}`
      await s3.send(new DeleteObjectCommand({ Key: content.cover, Bucket: 'covers-01' }))
      await s3.send(
        new PutObjectCommand({
          Key: fileName,
          Bucket: 'covers-01',
          Body: fs.createReadStream(cover.tmpPath!),
        })
      )

      content.cover = fileName
    }
    if (audio) {
      const audioFileName = `${cuid()}.${audio.extname}`
      if (content.audio) {
        await s3.send(new DeleteObjectCommand({ Key: content.audio, Bucket: 'plot-audio-01' }))
      }
      await s3.send(
        new PutObjectCommand({
          Key: audioFileName,
          Bucket: 'plot-audio-01',
          Body: fs.createReadStream(audio.tmpPath!),
        })
      )

      content.cover = audioFileName
    }

    await content.save()

    if (categoryList?.length) {
      const categories = await Category.query().whereIn('id', categoryList)
      const contentCategories = await content.related('categories').query()
      const validCategories: number[] = []
      const deletedCategories: number[] = []

      for (let category of categories) {
        validCategories.push(category.id)
      }

      for (let contentCategory of contentCategories) {
        const index = validCategories.indexOf(contentCategory.id)
        if (index >= 0) {
          validCategories.splice(index, 1)
        } else {
          deletedCategories.push(contentCategory.id)
        }
      }

      if (validCategories.length) await content.related('categories').attach(validCategories)
      if (deletedCategories.length) await content.related('categories').detach(validCategories)
    }
    if (createCategories?.length) {
      const newCategoriesData: object[] = []
      for (let categoryName of createCategories) {
        newCategoriesData.push({ name: categoryName })
      }
      await content.related('categories').createMany(newCategoriesData)
    }

    return { ...content.toJSON(), categories: await content.related('categories').query() }
  }

  public async rawContent({ params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)
    const categories = await content.related('categories').query().select('id', 'name')

    return { ...content.toJSON(), categories }
  }

  public async fullContent({ params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)
    const babs = await content
      .related('babs')
      .query()
      .select('id', 'title')
      .orderBy('created_at', 'asc')
    const categories = await content.related('categories').query().select('id', 'name')

    return { ...content.toJSON(), babs, categories }
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
    bab.audio = fileName
    bab.contentId = content.id

    await bab.save()
    await s3.send(
      new PutObjectCommand({
        Key: fileName,
        Bucket: 'ring-audio-01',
        Body: fs.createReadStream(audio.tmpPath!),
      })
    )

    return {
      ...bab.toJSON(),
      content: content.toJSON(),
    }
  }

  public async delete({ params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)
    await content.delete()

    return content.toJSON()
  }

  public async categories() {
    const categories = await Category.all()

    return categories
  }

  public async streamCover({ params, response }: HttpContextContract) {
    const content = await Content.findByOrFail('cover', params.filename)

    const file = await s3.send(new GetObjectCommand({ Bucket: 'covers-01', Key: content.cover }))
    return response.stream(file.Body)
  }

  public async streamSynopsis({ response, request, params }: HttpContextContract) {
    const { audio } = await Content.findByOrFail('audio', params.filename)
    const range = request.header('range')
    const file = await s3.send(
      new GetObjectCommand({ Key: audio, Bucket: 'plot-audio-01', Range: range })
    )

    response.status(206)
    response.header('Content-Range', file.ContentRange!)
    response.header('Accept-Ranges', 'bytes')
    response.header('Content-Length', file.ContentLength!)
    response.header('Content-Type', file.ContentType!)

    response.stream(file.Body)
  }
}
