import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { validator, schema, rules } from '@ioc:Adonis/Core/Validator'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'
import moment from 'moment'
import makeQuery from 'App/Helpers/makeQuery'
import Admin from 'App/Models/Admin'
import Hash from '@ioc:Adonis/Core/Hash'
import LoginLog from 'App/Models/LoginLog'
import Partner from 'App/Models/Partner'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AuthController {
  private async _userLoginLog(id: number, trx) {
    const loginLog = new LoginLog()
    loginLog.userId = id
    await loginLog.useTransaction(trx).save()
    return
  }

  public async login({ request, response, auth }: HttpContextContract) {
    const { username, password } = await validator.validate({
      schema: schema.create({
        username: schema.string(),
        password: schema.string(),
      }),
      data: request.all(),
    })

    let axiosResponse

    try {
      axiosResponse = await axios.get(`${Env.get('AMEMBER_URL')}/api/check-access/by-login-pass`, {
        params: {
          _key: process.env.AMEMBER_KEY,
          login: username,
          pass: password,
        },
      })
    } catch (e) {
      return response.internalServerError()
    }

    if (!axiosResponse.data.ok) return response.unauthorized()

    const { user_id, name, categories, groups = [] } = axiosResponse.data

    const result = await Database.transaction(async (trx) => {
      const user = await User.findBy('amember_id', user_id)

      if (!user) {
        const newUser = new User()
        newUser.amemberId = user_id
        newUser.fullname = name
        newUser.username = username

        if (groups.length) {
          const partner = await Partner.findBy('amember_group', groups[0])
          if (partner) {
            newUser.partnerId = partner.id
          }
        }

        let subscriber = false

        if (categories[1]) {
          newUser.subscriptionEnd = categories[1]
          subscriber = true
        }

        await newUser.useTransaction(trx).save()
        await this._userLoginLog(newUser.id, trx)

        return {
          user: newUser,
          subscriber,
        }
      } else {
        let subscriber = false

        if (
          categories[1] &&
          (!user.subscriptionEnd ||
            (user.subscriptionEnd &&
              moment(user.subscriptionEnd).format('YYYY-MM-DD') !==
                moment(categories[1], 'YYYY-MM-DD').format('YYYY-MM-DD')))
        ) {
          user.subscriptionEnd = categories[1]
          await user.useTransaction(trx).save()

          subscriber = true
        }

        if (user.subscriptionEnd && moment(user.subscriptionEnd).toDate() <= new Date()) {
          subscriber = true
        }

        await this._userLoginLog(user.id, trx)

        return {
          user,
          subscriber,
        }
      }
    })

    return {
      id: result.user.id,
      fullname: name,
      amember_id: result.user.amemberId,
      token: (await auth.use('userApi').generate(result.user)).token,
      subscriber: result.subscriber,
      partner: result.user.partnerId,
    }
  }
  public async register({ request, response, auth }: HttpContextContract) {
    let payload
    try {
      payload = await request.validate({
        schema: schema.create({
          username: schema.string({}, [
            rules.regex(/^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/),
          ]),
          fullname: schema.string(),
          password: schema.string(),
          email: schema.string({}, [rules.email()]),
        }),
      })
    } catch (e) {
      return response.badRequest(e.messages)
    }

    const { username, fullname, password, email } = payload
    const splitName = fullname.split(' ')
    const lastName = splitName.pop()
    const firstName = splitName.join(' ')

    let axiosResponse
    try {
      axiosResponse = await axios.post(
        `${Env.get('AMEMBER_URL')}/api/users`,
        makeQuery({
          _key: Env.get('AMEMBER_KEY'),
          login: username,
          pass: password,
          email,
          name_f: firstName,
          name_l: lastName,
        })
      )
    } catch (e) {
      return response.internalServerError()
    }

    if (axiosResponse.data.error) {
      return response.badRequest()
    }

    const [registered] = axiosResponse.data

    const user: User = await Database.transaction(async (trx) => {
      const user = new User()
      user.amemberId = registered.user_id
      user.fullname = fullname
      user.username = username

      await user.useTransaction(trx).save()
      await this._userLoginLog(user.id, trx)
      return user
    })

    return {
      id: user.id,
      fullname,
      amember_id: user.amemberId,
      token: (await auth.use('userApi').generate(user)).token,
      subscriber: false,
    }
  }
  public async adminLogin({ request, response, auth }: HttpContextContract) {
    let payload
    try {
      payload = await validator.validate({
        schema: schema.create({
          username: schema.string(),
          password: schema.string(),
        }),
        data: request.all(),
      })
    } catch (error) {
      return response.badRequest(error.messages)
    }

    const { username, password } = payload

    const admin = await Admin.findByOrFail('username', username)

    if (!(await Hash.verify(admin.password, password))) {
      return response.badRequest('Invalid credentials')
    }

    const jsonResponse = {
      ...admin.toJSON(),
      token: (await auth.use('adminApi').generate(admin)).token,
    }

    return jsonResponse
  }

  public async logout({ auth }: HttpContextContract) {
    if (auth.user instanceof Admin) {
      await auth.use('adminApi').revoke()
    } else {
      await auth.use('userApi').revoke()
    }

    return 'Token Revoked'
  }

  public async verify({ auth }: HttpContextContract) {
    const result = await Database.transaction(async (trx) => {
      const user = auth.use('userApi').user!
      await this._userLoginLog(user.id, trx)
      return user
    })

    return result
  }
}
