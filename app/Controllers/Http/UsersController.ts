import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import fs from 'fs'
import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios'
import makeQuery from 'App/Helpers/makeQuery'

export default class UsersController {
  private async _amemberUpdate(amemberId, payload) {
    return new Promise((resolve) => {
      axios
        .post(
          `${Env.get('AMEMBER_URL')}/api/users/${amemberId}`,
          makeQuery({
            _key: Env.get('AMEMBER_KEY'),
            ...payload,
          }).string()
        )
        .then((response) => {
          if (response.data.error) {
            console.log(response.data)
            resolve(false)
            return
          }
          resolve(true)
        })
        .catch((e) => {
          console.log(e.response?.data)
          resolve(false)
        })
    })
  }

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

  public async read({ params }: HttpContextContract) {
    const user = await User.findOrFail(params.id)
    return user.serialize()
  }

  public async editProfile({ request, auth }: HttpContextContract) {
    const { fullname, avatar } = await request.validate({
      schema: schema.create({
        fullname: schema.string(),
        avatar: schema.file.optional({
          size: '10mb',
          extnames: ['jpg', 'jpeg', 'png'],
        }),
      }),
    })

    const result = await Database.transaction(async (t) => {
      const fileName = `${cuid()}.${avatar?.extname}`
      let deleteOld: string | boolean = false
      const lastName = fullname.split(' ')
      const firstName = lastName[0]
      lastName.shift()

      const user = auth.use('userApi').user!
      user.fullname = fullname

      if (avatar) {
        if (user.avatar) {
          deleteOld = user.avatar
        }
        user.avatar = fileName
      }

      await user.useTransaction(t).save()

      if (
        !(await this._amemberUpdate(user.amemberId, {
          name_f: firstName,
          name_l: lastName.join(' '),
        }))
      ) {
        throw new Error()
      }

      if (avatar) {
        await s3.send(
          new PutObjectCommand({
            Key: fileName,
            Bucket: 'user-avatar',
            Body: fs.createReadStream(avatar.tmpPath!),
          })
        )
        if (deleteOld) {
          await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'user-avatar' }))
        }
      }

      return user
    })

    return result.serialize()
  }
}
