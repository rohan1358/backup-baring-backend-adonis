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
import Course from 'App/Models/Course'
import { DateTime } from 'luxon'
import ResetPassword from 'App/Models/ResetPassword'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Mail from 'App/Helpers/Mail'
import fs from 'fs'
import Application from '@ioc:Adonis/Core/Application'

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

    const courses: any = {}

    const {
      user_id,
      name,
      email,
      categories,
      groups = [],
      subscriptions = {} as any,
    } = axiosResponse.data

    const coursesList = await Course.query().whereIn(
      'amember_id',
      Object.keys(subscriptions).map((el) => Number(el))
    )

    for (let item of coursesList) {
      courses[item.id] = {
        mentor: false,
        subscription_end: subscriptions[item.amemberId],
      }
    }

    const result = await Database.transaction(async (trx) => {
      const user = await User.findBy('amember_id', user_id)

      if (!user) {
        const newUser = new User()
        newUser.amemberId = user_id
        newUser.fullname = name
        newUser.username = username
        newUser.email = email

        if (groups.length) {
          for (let group of groups) {
            if (Number(group) === 4) {
              newUser.isMentor = true
            } else {
              const partner = await Partner.findBy('amember_group', group)
              if (partner) {
                newUser.partnerId = partner.id
              }
            }
          }
        }

        let subscriber = false

        if (categories['1']) {
          newUser.subscriptionEnd = categories['1']
          subscriber = true
        }

        await newUser.useTransaction(trx).save()
        if (Object.keys(courses).length) {
          await newUser.useTransaction(trx).related('courses').sync(courses)
        }
        await this._userLoginLog(newUser.id, trx)

        return {
          user: newUser,
          subscriber,
        }
      } else {
        let subscriber = false

        if (
          categories['1'] &&
          (!user.subscriptionEnd ||
            (user.subscriptionEnd &&
              moment(user.subscriptionEnd).format('YYYY-MM-DD') !==
                moment(categories['1'], 'YYYY-MM-DD').format('YYYY-MM-DD')))
        ) {
          user.subscriptionEnd = categories['1']

          subscriber = true
        }
        user.email = email
        await user.useTransaction(trx).save()
        if (Object.keys(courses).length) {
          await user.useTransaction(trx).related('courses').sync(courses)
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
      partner_id: result.user.partnerId,
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
        }).string()
      )
    } catch (e) {
      console.log(e)
      return response.internalServerError()
    }

    if (axiosResponse.data.error) {
      return response.badRequest()
    }
    const [registered] = axiosResponse.data

    try {
      const addAccess = await axios.post(
        `${Env.get('AMEMBER_URL')}/api/access`,
        makeQuery({
          _key: Env.get('AMEMBER_KEY'),
          user_id: registered.user_id,
          product_id: 6,
          begin_date: DateTime.now().toFormat('yyyy-LL-dd'), // Today
          expire_date: DateTime.now().plus({ days: 7 }).toFormat('yyyy-LL-dd'), // Lifetime
        }).string()
      )
      if (addAccess.data.error) {
        throw new Error()
      }
    } catch (e) {
      console.log(e)
      return response.internalServerError()
    }

    const user: User = await Database.transaction(async (trx) => {
      const user = new User()
      user.amemberId = registered.user_id
      user.fullname = fullname
      user.username = username
      user.email = email
      user.haveTrial = false
      user.inTrial = true
      user.subscriptionEnd = DateTime.now().plus({ days: 7 })

      await user.useTransaction(trx).save()
      await this._userLoginLog(user.id, trx)
      return user
    })

    return {
      id: user.id,
      fullname,
      amember_id: user.amemberId,
      token: (await auth.use('userApi').generate(user)).token,
      subscriber: true,
      partner_id: user.partnerId,
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

    return result.serialize()
  }

  private async _checkUniqueToken(token: string) {
    const resetToken = await ResetPassword.query()
      .where('token', token)
      .andWhere(
        'created_at',
        '>=',
        `${DateTime.now().minus({ days: 2 }).toFormat('yyyy-LL-dd')} 00:00:00`
      )
      .first()

    if (resetToken) {
      return true
    } else {
      return false
    }
  }

  public async requestResetPass({ request }: HttpContextContract) {
    const { email, url } = await request.validate({
      schema: schema.create({
        email: schema.string({}, [rules.email()]),
        url: schema.string(),
      }),
    })

    const user = await User.findByOrFail('email', email)
    let token = cuid()
    while (await this._checkUniqueToken(token)) {
      token = cuid()
    }

    const formattedUrl = url.replace('%token%', token)

    const result = await Database.transaction(async (t) => {
      const resetPass = new ResetPassword()
      resetPass.token = token
      resetPass.userId = user.id

      await resetPass.useTransaction(t).save()

      try {
        new Mail().send({
          from: 'BaRing.Digital <ingat@baring.digital>',
          to: [user.email],
          subject: 'Pengaturan Ulang Password',
          html: fs
            .readFileSync(Application.makePath('app', 'Services', 'password.html'), 'utf8')
            .replace('%fullname%', user.fullname)
            .replace(/\%root_url\%/gm, formattedUrl),
        })
      } catch (e) {
        throw new Error(e)
      }

      return {
        success: 'Reset password request email has sent',
      }
    })

    return result
  }

  public async resetPass({ request, response }: HttpContextContract) {
    const { token, password } = await request.validate({
      schema: schema.create({
        token: schema.string(),
        password: schema.string(),
      }),
    })

    const resetPass = await ResetPassword.findByOrFail('token', token)
    const user = await User.findOrFail(resetPass.userId)
    if (DateTime.now().diff(resetPass.createdAt, 'days').days > 2) return response.notFound()

    const result = await Database.transaction(async (t) => {
      await resetPass.useTransaction(t).delete()

      let axiosResponse

      try {
        axiosResponse = await axios.put(
          `${Env.get('AMEMBER_URL')}/api/users/${user.amemberId}?${makeQuery({
            _key: Env.get('AMEMBER_KEY'),
            pass: password,
          }).string()}`
        )
      } catch (e) {
        return response.internalServerError()
      }

      if (!axiosResponse) return response.internalServerError()

      return 'Password has changed'
    })

    return result
  }
}
