import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Subject from 'App/Models/Subject'
import { schema } from '@ioc:Adonis/Core/Validator'
import Boost from 'App/Models/Boost'

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

    return boost.toJSON()
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
    const boosts = await Boost.query().where('boosts.subject_id', subject.id)

    return boosts.map((boost) => boost.toJSON())
  }
}
