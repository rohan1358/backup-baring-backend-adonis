import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
  public async index({ request, auth }: HttpContextContract) {
    const q = request.input('q', '')
    const mentor = request.input('mentor', '')
    let users = User.query()
      .preload('partner')
      .where((query) => {
        query.where('fullname', 'iLike', `%${q}%`).orWhere('username', 'iLike', `%${q}%`)
      })
      .limit(15)

    if (mentor && auth.use('adminApi').isLoggedIn) {
      users = users.andWhere('is_mentor', true)
    }

    const usersJson = (await users).map((user) => user.serialize())
    return usersJson
  }
}
