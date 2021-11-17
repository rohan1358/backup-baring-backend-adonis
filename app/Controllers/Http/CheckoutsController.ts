import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Cart from 'App/Models/Cart'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Checkout from 'App/Models/Checkout'
import Database from '@ioc:Adonis/Lucid/Database'
import CheckoutDetail from 'App/Models/CheckoutDetail'
import { validator } from '@ioc:Adonis/Core/Validator'

export default class CheckoutsController {
  private _randUnique() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100)
  }

  private async _checkTotalExist(total: number) {
    const payment = await Checkout.query().where('total', total).andWhere('is_paid', false).first()
    if (!payment) {
      return false
    }

    return true
  }

  private _getShippingCost(courier, service, weight, destination) {
    return new Promise((resolve) => {
      axios
        .post(
          'https://pro.rajaongkir.com/api/cost',
          {
            origin: 501,
            originType: 'city',
            destination,
            destinationType: 'subdistrict',
            weight,
            courier,
          },
          {
            headers: {
              key: Env.get('RAJAONGKIR_KEY'),
            },
          }
        )
        .then((response) => {
          const {
            data: {
              rajaongkir: { results },
            },
          } = response

          const shipping = results[0]?.costs?.find((el) => el.service === service)
          if (!service) {
            resolve(false)
            return
          }
          const cost = shipping.cost[0].value

          resolve(cost)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }
  private _getSubdistricts(id) {
    return new Promise((resolve) => {
      axios
        .get('https://pro.rajaongkir.com/api/subdistrict', {
          params: {
            id,
          },
          headers: {
            key: Env.get('RAJAONGKIR_KEY'),
          },
        })
        .then((response) => {
          const {
            data: {
              rajaongkir: { results },
            },
          } = response

          resolve(results)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  public async create({ request, auth, response }: HttpContextContract) {
    const carts = await Cart.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .preload('product')
      .preload('course')
    let weight: number = 0
    let total: number = 0
    let withShipping: boolean = false
    const items: CheckoutDetail[] = []
    const cartDeleted: number[] = []

    for (let item of carts) {
      cartDeleted.push(item.id)
      if (item.type === 'product') {
        withShipping = true
        weight = weight + (item.product.weight || 0)

        const productItem = new CheckoutDetail()
        productItem.title = item.product.title
        productItem.price = item.product.price
        productItem.qty = item.qty
        productItem.productId = item.product.id

        items.push(productItem)
      } else if (item.type === 'course') {
        const courseItem = new CheckoutDetail()
        courseItem.title = item.course.title
        courseItem.price = item.course.price
        courseItem.qty = item.qty
        courseItem.courseId = item.course.id

        items.push(courseItem)
      }
      total = total + (item.product || item.course).price
    }

    if (weight === 0 && withShipping) {
      return response.badRequest()
    }

    const {
      destination_rajaongkir,
      destination_first,
      recipient_name,
      recipient_phone,
      shipping_service,
    } = await request.validate({
      schema: schema.create({
        destination_rajaongkir: withShipping ? schema.number() : schema.number.optional(),
        destination_first: withShipping ? schema.string() : schema.string.optional(),
        recipient_name: withShipping ? schema.string() : schema.string.optional(),
        recipient_phone: withShipping ? schema.string() : schema.string.optional(),
        shipping_service: withShipping ? schema.string() : schema.string.optional(),
      }),
    })

    let detail: any = {}
    if (withShipping) {
      const subdistrict: any = await this._getSubdistricts(destination_rajaongkir)
      if (!subdistrict) {
        return response.badRequest()
      }

      const splitShipping: string[] = shipping_service?.split('-')!
      const courier = splitShipping[0].trim()
      const service = splitShipping[1] ? splitShipping[1].trim() : false

      if (!service) {
        return response.badRequest()
      }

      const cost = await this._getShippingCost(courier, service, weight, destination_rajaongkir)

      if (!cost) {
        return response.badRequest()
      }

      total = total + Number(cost)

      detail.shipping = {
        recipient_name,
        recipient_phone,
        destination: `${destination_first}, Kec. ${subdistrict.subdistrict_name}, ${subdistrict.type} ${subdistrict.city}, ${subdistrict.province}`,
        destination_rajaongkir,
        shipping_service: `${courier} - ${service}`.toUpperCase(),
        cost,
        weight,
      }
    }

    let uniqueNumber = this._randUnique()
    while (Boolean(await this._checkTotalExist(total + uniqueNumber))) {
      uniqueNumber = this._randUnique()
    }
    detail.payment = {
      total,
      unique_number: uniqueNumber,
    }

    const result = await Database.transaction(async (t) => {
      const checkout = new Checkout()
      checkout.total = total + uniqueNumber
      checkout.detail = detail
      checkout.isPaid = false
      checkout.userId = auth.use('userApi').user?.id!

      await Cart.query().useTransaction(t).whereIn('id', cartDeleted).delete()
      await checkout.useTransaction(t).save()
      await checkout.useTransaction(t).related('items').saveMany(items)

      return checkout
    })

    return result.serialize()
  }

  public async list({ request, auth }: HttpContextContract) {
    const { page } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
      data: request.all(),
    })

    const limit = 12
    const offset = (page ? page - 1 : 0) * limit

    const total = await Checkout.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .count('* as total')
    const checkouts = await Checkout.query()
      .preload('items', (query) => {
        query.preload('product')
        query.preload('course')
      })
      .where('user_id', auth.use('userApi').user?.id!)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: checkouts.map((course) => course.serialize()),
    }
  }

  public async read({ params, auth, response }: HttpContextContract) {
    const checkout = await Checkout.findOrFail(params.id)

    if (
      auth.use('userApi').isLoggedIn &&
      checkout.userId !== Number(auth.use('userApi').user?.id)
    ) {
      return response.unauthorized()
    }

    return {
      ...checkout.serialize(),
      items: (await checkout.related('items').query()).map((item) => item.serialize()),
    }
  }
}
