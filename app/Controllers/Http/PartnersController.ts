import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Admin from 'App/Models/Admin'
import Partner from 'App/Models/Partner'
import Hash from '@ioc:Adonis/Core/Hash'

export default class PartnersController {
  public async index() {
    const partners = await Partner.query().preload('admins', (query) => {
      query.select('username')
    })

    const json = partners.map((partner) => partner.serialize())

    return json
  }

  public async edit({ request, params, response }: HttpContextContract) {
    const partner = await Partner.query().has('admins').where('id', params.id).first()
    if (!partner) return response.notFound()
    const { name, amemberGroup, username, password } = await request.validate({
      schema: schema.create({
        name: schema.string(),
        amemberGroup: schema.number(),
        username: schema.string(),
        password: schema.string.optional(),
      }),
    })

    const result = await Database.transaction(async (trx) => {
      partner.name = name
      partner.amemberGroup = amemberGroup
      await partner.useTransaction(trx).save()

      const admin = (await Admin.findBy('partner_id', params.id))!
      admin.fullname = name
      admin.username = username
      if (password) {
        admin.password = await Hash.make(password)
      }

      await admin.useTransaction(trx).save()

      return {
        ...partner.toJSON(),
        admin: admin.toJSON(),
      }
    })

    return result
  }

  public async create({ request }: HttpContextContract) {
    const { name, amemberGroup, username, password } = await request.validate({
      schema: schema.create({
        name: schema.string(),
        amemberGroup: schema.number(),
        username: schema.string(),
        password: schema.string(),
      }),
    })

    const result = await Database.transaction(async (trx) => {
      const partner = new Partner()
      partner.name = name
      partner.amemberGroup = amemberGroup

      await partner.useTransaction(trx).save()

      const json = partner.toJSON()

      const admin = new Admin()
      admin.fullname = json.name
      admin.username = username
      admin.password = await Hash.make(password)
      admin.partnerId = json.id

      await admin.useTransaction(trx).save()

      return {
        ...json,
        admin: admin.toJSON(),
      }
    })

    return result
  }

  public async delete({ params }: HttpContextContract) {
    const partner = await Partner.findByOrFail('id', params.id)

    await partner.delete()
    return partner.toJSON()
  }
}
