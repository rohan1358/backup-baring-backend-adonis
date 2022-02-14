import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import s3 from 'App/Helpers/s3'
import Author from 'App/Models/Author'
import Bab from 'App/Models/Bab'
import Category from 'App/Models/Category'
import Content from 'App/Models/Content'
import Like from 'App/Models/Like'
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
          authors: schema.array.optional().members(schema.number()),
          createAuthors: schema.array.optional().members(schema.string()),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const {
      title,
      synopsis,
      categories: categoriesList,
      createCategories,
      authors: authorsList,
      createAuthors,
    } = payload

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

    if (authorsList?.length) {
      const authors = await Author.query().whereIn('id', authorsList)
      const validAuthors: number[] = []

      for (let author of authors) {
        validAuthors.push(author.id)
      }

      if (validAuthors.length) await content.related('authors').attach(validAuthors)
    }

    if (createAuthors?.length) {
      const AuthorsData: object[] = []
      for (let authorName of createAuthors) {
        AuthorsData.push({ name: authorName })
      }
      await content.related('authors').createMany(AuthorsData)
    }

    return {
      ...content.toJSON(),
      categories: await content.related('categories').query(),
      authors: await content.related('authors').query(),
    }
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
          authors: schema.array.optional().members(schema.number()),
          createAuthors: schema.array.optional().members(schema.string()),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }
    const {
      title,
      synopsis,
      categories: categoryList,
      createCategories,
      authors: authorList,
      createAuthors,
    } = payload
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
      const validCategories: number[] = []
      for (let category of categories) {
        validCategories.push(category.id)
      }
      await content.related('categories').sync(validCategories)
    }
    if (createCategories?.length) {
      const newCategoriesData: object[] = []
      for (let categoryName of createCategories) {
        newCategoriesData.push({ name: categoryName })
      }
      await content.related('categories').createMany(newCategoriesData)
    }
    if (authorList?.length) {
      const authors = await Author.query().whereIn('id', authorList)
      const validAuthors: number[] = []
      for (let author of authors) {
        validAuthors.push(author.id)
      }
      await content.related('authors').sync(validAuthors)
    }
    if (createAuthors?.length) {
      const newAuthorsData: object[] = []
      for (let authorName of createAuthors) {
        newAuthorsData.push({ name: authorName })
      }
      await content.related('authors').createMany(newAuthorsData)
    }
    return {
      ...content.toJSON(),
      categories: await content.related('categories').query(),
      authors: await content.related('authors').query(),
    }
  }

  public async index({ request, auth }: HttpContextContract) {
    const {
      page,
      category: categoryId,
      limit = 20,
    } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
        category: schema.number.optional(),
        limit: schema.number.optional(),
      }),
      data: request.all(),
    })
    const offset = (page ? page - 1 : 0) * limit
    const q = request.input('q', '')
    const liked = request.input('liked', '') ? true : false

    let category: Category | null = null
    if (categoryId) {
      category = await Category.findOrFail(categoryId)
    }

    let total = Database.query()
      .from((subquery) => {
        subquery
          .from('contents')
          .select(
            'contents.id',
            'contents.title',
            Database.from('likes')
              .select(Database.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as status`))
              .whereColumn('likes.content_id', 'contents.id')
              .andWhere('likes.user_id', auth.use('userApi').user?.id || 0)
              .limit(1)
              .as('is_liked')
          )
          .as('contents')
      })
      .count('* as total')

    let contents = Content.query()
      .select(
        'contents.id',
        'contents.title',
        'contents.cover',
        'contents.created_at',
        Database.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as is_liked`)
      )
      .withCount('babs')
      .preload('authors', (query) => {
        query.select('id', 'name')
      })
      .leftJoin('likes', (query) => {
        query
          .on('likes.content_id', '=', 'contents.id')
          .andOnVal('likes.user_id', auth.use('userApi').user?.id || 0)
      })
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit)

    if (liked) {
      total = total.where('contents.is_liked', true)
      contents = contents.whereRaw('CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END = ?', [
        'TRUE',
      ])
    } else {
      total = total.where('contents.title', 'iLike', `%${q}%`)
      contents = contents.where('contents.title', 'iLike', `%${q}%`)
    }

    if (category) {
      total = total
        .leftJoin('category_content', 'contents.id', '=', 'category_content.content_id')
        .andWhere('category_content.category_id', category.id)
      contents = contents.andWhereHas('categories', (query) => {
        query.where('categories.id', category!.id)
      })
    }

    const contentsJson = (await contents).map((content) => content.serialize())
    return {
      total: Math.ceil(Number((await total)[0].total || '0') / limit),
      data: contentsJson,
    }
  }

  public async rawContent({ params }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)
    const categories = await content.related('categories').query().select('id', 'name')
    const authors = await content.related('authors').query().select('id', 'name')

    return { ...content.toJSON(), categories, authors }
  }

  public async fullContent({ params, response, auth }: HttpContextContract) {
    let contentQuery = Content.query()
      .where('id', params.id)
      .preload('authors', (query) => {
        query.select('id', 'name')
      })
      .preload('categories', (query) => {
        query.select('id', 'name')
      })
      .preload('babs', (query) => {
        query.select('id', 'title').orderBy('created_at', 'asc')
      })

    contentQuery = contentQuery.select(
      '*',
      Database.from('likes')
        .select(Database.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as status`))
        .whereColumn('likes.content_id', 'contents.id')
        .andWhere('likes.user_id', auth.use('userApi').user?.id || 0)
        .limit(1)
        .as('is_liked')
    )

    const content = await contentQuery.first()

    if (!content) {
      return response.notFound('Content not found')
    }

    const contentJSON = content.serialize()

    return contentJSON
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

  public async like({ params, auth, response }: HttpContextContract) {
    const content = await Content.findByOrFail('id', params.id)
    const status = await content
      .related('likes')
      .query()
      .where('user_id', auth.use('userApi').user?.id!)
      .first()

    if (!status) {
      const like = new Like()
      like.userId = auth.use('userApi').user?.id!
      like.contentId = params.id
      await like.save()

      return like.toJSON()
    } else {
      return response.badRequest()
    }
  }

  public async unlike({ params, auth }: HttpContextContract) {
    const like = await Like.query()
      .where('content_id', params.id)
      .andWhere('user_id', auth.use('userApi').user?.id!)
      .firstOrFail()

    await like.delete()
    return like.toJSON()
  }
}
