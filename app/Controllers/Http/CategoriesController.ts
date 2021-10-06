import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

import Category from 'App/Models/Category'

export default class CategoriesController {
  public async index() {
    const categories = await Category.all()

    return categories
  }

  public async contentGroupByCategory({ auth }: HttpContextContract) {
    const categories = await Category.query()
      .preload('contents', (query) => {
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
          .offset(0)
      })
      .has('contents')

    return categories.map((categories) => categories.serialize())
  }
}
