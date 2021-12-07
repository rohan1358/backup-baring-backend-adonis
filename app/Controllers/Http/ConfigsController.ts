import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class ConfigsController {
  public async getRajaongkir() {
    const rajaongkirConfig = JSON.parse(
      fs.readFileSync(Application.makePath('app/Services/rajaongkir.json')) as any
    )

    return rajaongkirConfig
  }

  public async getConfig() {
    const config = JSON.parse(
      fs.readFileSync(Application.makePath('app/Services/config.json')) as any
    )

    return config
  }

  public async setRajaongkir({ request }: HttpContextContract) {
    const { subdistrict, couriers } = await request.validate({
      schema: schema.create({
        subdistrict: schema.object().members({
          subdistrict_id: schema.number(),
          province_id: schema.number(),
          province: schema.string(),
          city_id: schema.number(),
          city: schema.string(),
          type: schema.string(),
          subdistrict_name: schema.string(),
        }),
        couriers: schema.array().members(schema.string()),
      }),
    })

    const stringify = JSON.stringify({
      subdistrict,
      couriers,
    })

    fs.writeFileSync(Application.makePath('app/Services/rajaongkir.json'), stringify)

    return {
      subdistrict,
      couriers,
    }
  }

  public async setConfig({ request }: HttpContextContract) {
    const { stickyCategory, paymentText } = await request.validate({
      schema: schema.create({
        stickyCategory: schema.array().members(schema.number()),
        paymentText: schema.string(),
      }),
    })

    const stringify = JSON.stringify({
      stickyCategory,
      paymentText,
    })

    fs.writeFileSync(Application.makePath('app/Services/config.json'), stringify)

    return {
      stickyCategory,
      paymentText,
    }
  }
}
