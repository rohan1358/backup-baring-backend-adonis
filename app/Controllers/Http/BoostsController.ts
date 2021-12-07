import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Subject from 'App/Models/Subject'
import { schema } from '@ioc:Adonis/Core/Validator'
import Boost from 'App/Models/Boost'
import User from 'App/Models/User'

export default class BoostsController {
  public async create({ auth, params, request }: HttpContextContract) {
    const subject = await Subject.query()
      .where('subjects.id', params.id)
      .andWhereHas('course', (query) => {
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .andWhereDoesntHave('boosts', (query) => {
        query.whereHas('user', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .firstOrFail()

    const { body } = await request.validate({
      schema: schema.create({
        body: schema.string(),
      }),
    })

    const boost = new Boost()
    boost.userId = auth.use('userApi').user?.id!
    boost.subjectId = subject.id
    boost.body = body

    await boost.save()

    return {
      ...boost.toJSON(),
      user: await User.query()
        .select('id', 'avatar')
        .where('id', auth.use('userApi').user?.id!)
        .first(),
    }
  }
  public async index({ auth, params }: HttpContextContract) {
    const subject = await Subject.query()
      .where('subjects.id', params.id)
      .andWhereHas('course', (query) => {
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .firstOrFail()

    const ids: number[] = []
    const boosts = (await Boost.query().where('boosts.subject_id', subject.id)).map((boost) => {
      if (!ids.includes(boost.userId)) {
        ids.push(boost.userId)
      }
      return boost.serialize()
    })
    const users = await User.query().select('id', 'avatar').whereIn('id', ids)

    return boosts.map((boost) => {
      const user = users.find((el) => Number(el.id) === boost.user_id)
      return {
        ...boost,
        user: user ? user.serialize() : null,
      }
    })
  }
}
