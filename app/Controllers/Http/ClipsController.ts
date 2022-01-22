import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Bab from 'App/Models/Bab'
import Clip from 'App/Models/Clip'

export default class ClipsController {
  public async create({ request, auth }: HttpContextContract) {
    const { body, bab_id: babId } = await request.validate({
      schema: schema.create({
        body: schema.string(),
        bab_id: schema.number(),
      }),
    })

    const bab = await Bab.findOrFail(babId)
    const clip = new Clip()
    clip.babId = bab.id
    clip.userId = auth.use('userApi').user?.id!
    clip.body = body
    await clip.save()

    return clip.serialize()
  }

  public async delete({ params, auth }: HttpContextContract) {
    const clip = await Clip.query()
      .where('id', params.id)
      .andWhere('user_id', auth.use('userApi').user?.id!)
      .firstOrFail()

    await clip.delete()
    return clip.serialize()
  }

  public async index({ auth }: HttpContextContract) {
    const clips = await Clip.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .preload('bab', (query) => {
        query.select('id', 'content_id', 'title').preload('content', (query) => {
          query.select('id', 'title')
        })
      })

    return clips.map((clip) => clip.serialize())
  }
}
