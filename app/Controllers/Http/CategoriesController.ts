import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import fs from 'fs'
import Application from '@ioc:Adonis/Core/Application'

import Category from 'App/Models/Category'

export default class CategoriesController {
  public async index() {
    const categories = await Category.all()

    return categories
  }

  public async contentGroupByCategory({ auth }: HttpContextContract) {
    const config = JSON.parse(
      fs.readFileSync(Application.makePath('app/Services/config.json')) as any
    )

    let categories = Category.query()
      .withCount('contents')
      .has('contents')
      .orderBy('contents_count', 'desc')
      .limit(4)

    if (config.stickyCategory && config.stickyCategory.length) {
      categories = Category.query().whereIn('id', config.stickyCategory)
    }

    let response: Object[] = []

    for (let category of await categories) {
      await category.load('contents', (query) => {
        query
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
          .limit(6)
      })
      response.push(category.serialize())
    }

    return response
  }

  public async read({ params }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    return category.serialize()
  }
}
