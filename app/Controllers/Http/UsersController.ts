import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
  public async index({ request }: HttpContextContract) {
    const q = request.input('q', '')
    const users = await User.query()
      .preload('partner')
      .where('fullname', 'iLike', `%${q}%`)
      .orWhere('username', 'iLike', `%${q}%`)
      .limit(15)

    const usersJson = users.map((user) => user.serialize())
    return usersJson
  }
}
