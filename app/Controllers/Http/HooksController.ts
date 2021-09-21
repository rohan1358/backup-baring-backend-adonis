import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Partner from 'App/Models/Partner'

export default class HooksController {
  public async updateUser({ request, response }: HttpContextContract) {
    const { user: newUser, oldUser } = await request.validate({
      schema: schema.create({
        oldUser: schema.string(),
        user: schema.string(),
      }),
    })

    const { user_id: amemberId } = JSON.parse(oldUser)
    const { login: username } = JSON.parse(newUser)

    const user = await User.findByOrFail('amember_id', parseInt(amemberId))

    let axiosResponse
    try {
      axiosResponse = await axios.get(`${Env.get('AMEMBER_URL')}/api/check-access/by-login`, {
        params: {
          _key: process.env.AMEMBER_KEY,
          login: username,
        },
      })
    } catch (e) {
      return response.internalServerError()
    }

    if (parseInt(amemberId) !== parseInt(axiosResponse.data.user_id)) return response.badRequest()

    const { name: fullname, groups = [] } = axiosResponse.data

    user.username = username
    user.fullname = fullname

    if (groups.length) {
      const partner = await Partner.findBy('amember_group', groups[0])
      if (partner) {
        user.partnerId = partner.id
      }
    }

    await user.save()

    return user.toJSON()
  }
}
