import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Cart from 'App/Models/Cart'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Checkout from 'App/Models/Checkout'
import Database from '@ioc:Adonis/Lucid/Database'
import CheckoutDetail from 'App/Models/CheckoutDetail'
import { validator } from '@ioc:Adonis/Core/Validator'
import makeQuery from 'App/Helpers/makeQuery'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import User from 'App/Models/User'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import Route from '@ioc:Adonis/Core/Route'

export default class CheckoutsController {
  private _getProduct(id) {
    const promise: Promise<any> = new Promise((resolve) => {
      axios
        .get(`${Env.get('AMEMBER_URL')}/api/products/${id}`, {
          params: {
            _key: Env.get('AMEMBER_KEY'),
            _nested: ['billing-plans'],
          },
        })
        .then((response) => {
          if (response.data.error) {
            resolve(false)
            return
          } else if (response.data.length < 1) {
            resolve(false)
            return
          }
          resolve(response.data[0])
        })
        .catch(() => {
          resolve(false)
        })
    })
    return promise
  }

  private _randUnique() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100)
  }

  private _createInvoice(
    userId: number,
    uniqueNumber: number,
    shipping: number,
    carts: Cart[],
    paysys = 'moota'
  ) {
    return new Promise((resolve) => {
      ;(async () => {
        const data = {
          _key: Env.get('AMEMBER_KEY'),
          user_id: userId,
          paysys_id: paysys,
          currency: 'IDR',
          first_subtotal: '0.00',
          first_discount: '0.00',
          first_tax: '0.00',
          first_shipping: '0.00',
          first_total: '0.00',
          first_period: '1m',
          second_subtotal: '22.00',
          second_discount: '0.00',
          second_tax: '0.00',
          second_shipping: '0.00',
          second_total: '00.00',
          second_period: '1m',
          rebill_times: 99999, // means until cancel
          is_confirmed: 1, // Must be 1
          status: 0, // 1 - paid 0 - pending check Invoice model
          nested: {
            'invoice-items': [] as any[],
          },
        }

        for (let item of carts) {
          const product = await this._getProduct((item.product || item.course).amemberId)
          if (product) {
            for (let i = 0; i < item.qty; i++) {
              data.nested['invoice-items'].push({
                item_id: (item.product || item.course).amemberId, // product_id here;
                item_type: 'product',
                item_title: (item.product || item.course).title,
                item_description: (item.product || item.course).description,
                qty: 1,
                first_discount: '0.00',
                first_price: (
                  (item.product || item.course).price +
                  uniqueNumber +
                  shipping
                ).toFixed(2),
                first_tax: '0.00',
                first_shipping: shipping,
                first_period: product.nested['billing-plans'][0].first_period,
                second_price: (item.product || item.course).price + uniqueNumber.toFixed(2),
                second_total: (item.product || item.course).price + uniqueNumber.toFixed(2),
                rebill_times: product.nested['billing-plans'][0].rebill_times,
                currency: 'IDR',
                billing_plan_id: product.nested['billing-plans'][0].plan_id, // Billing plan within  product, check am_billing_plan table.
              })

              shipping = 0
              uniqueNumber = 0
            }
          }
        }

        const query = makeQuery(data).string()

        axios
          .post(`${Env.get('AMEMBER_URL')}/api/invoices`, query)
          .then((response) => {
            if (response.data.error) {
              resolve(false)
              return
            }
            resolve(response.data[0].invoice_id)
          })
          .catch(() => {
            resolve(false)
          })
      })()
    })
  }

  private async _checkTotalExist(total: number) {
    const payment = await Checkout.query().where('total', total).andWhere('is_paid', false).first()
    if (!payment) {
      return false
    }

    return true
  }

  private _getShippingCost(courier, service, weight, destination) {
    const rajaongkirConfig = JSON.parse(
      fs.readFileSync(Application.makePath('app/Services/rajaongkir.json')) as any
    )

    return new Promise((resolve) => {
      axios
        .post(
          'https://pro.rajaongkir.com/api/cost',
          {
            origin: rajaongkirConfig.subdistrict.subdistrict_id,
            originType: 'subdistrict',
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
      total = total + (item.product || item.course).price * item.qty
    }

    if (weight === 0 && withShipping) {
      return response.badRequest({
        error: 'Berat belum diatur',
      })
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
        return response.badRequest({
          error: 'Subdistrict tidak ditemukan',
        })
      }

      const splitShipping: string[] = shipping_service?.split('-')!
      const courier = splitShipping[0].trim()
      const service = splitShipping[1] ? splitShipping[1].trim() : false

      if (!service) {
        return response.badRequest({
          error: 'Service tidak ditemukan',
        })
      }

      const cost = await this._getShippingCost(courier, service, weight, destination_rajaongkir)

      if (!cost) {
        return response.badRequest({
          error: 'Gagal mendapatkan ongkos kirim',
        })
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

    let uniqueNumber = 0
    if (total > 0) {
      uniqueNumber = this._randUnique()
      while (Boolean(await this._checkTotalExist(total + uniqueNumber))) {
        uniqueNumber = this._randUnique()
      }
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
      checkout.status = 0
      checkout.userId = auth.use('userApi').user?.id!

      await Cart.query().useTransaction(t).whereIn('id', cartDeleted).delete()
      const invoice = await this._createInvoice(
        auth.use('userApi').user?.amemberId!,
        uniqueNumber,
        detail.shipping?.cost || 0,
        carts,
        total > 0 ? 'moota' : 'free'
      )

      if (!invoice) {
        throw new Error()
      }

      checkout.invoiceId = invoice as number
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

  public async index({ request }: HttpContextContract) {
    const { page } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
      data: request.all(),
    })

    const limit = 10
    const offset = (page ? page - 1 : 0) * limit

    const ids: number[] = []
    const total = await Checkout.query().count('* as total')
    const checkouts = (
      await Checkout.query().offset(offset).limit(limit).orderBy('created_at', 'desc')
    ).map((checkout) => {
      if (!ids.includes(checkout.userId)) {
        ids.push(checkout.userId)
      }

      return checkout.serialize()
    })
    const users = await User.query().select('id', 'fullname').whereIn('id', ids)

    return {
      total: Math.ceil(Number(total[0]?.$original.total || '0') / limit),
      data: checkouts.map((checkout) => {
        return {
          ...checkout,
          user: users.find((el) => Number(el.id) === checkout.user_id),
        }
      }),
    }
  }

  public async insertResi({ params, request, response }: HttpContextContract) {
    const checkout = await Checkout.findOrFail(params.id)
    const { resi } = await request.validate({
      schema: schema.create({
        resi: schema.string(),
      }),
    })

    const detail = checkout.detail ? JSON.parse(checkout.detail as string) : {}

    if (!detail.shipping || !checkout.isPaid) {
      return response.badRequest()
    }

    checkout.resi = resi
    if (checkout.status === 1) {
      checkout.status = 2
    }
    await checkout.save()

    return checkout.serialize()
  }

  public async changeStatus({ params, request, response }: HttpContextContract) {
    const checkout = await Checkout.findOrFail(params.id)
    const { status } = await request.validate({
      schema: schema.create({
        status: schema.number(),
      }),
    })

    if (!checkout.isPaid) {
      return response.badRequest()
    }

    checkout.status = status
    await checkout.save()

    return checkout.serialize()
  }

  public async requestPrint() {
    return {
      url: Route.makeSignedUrl('print', {
        expiresIn: '30m',
      }),
    }
  }

  public async print({ response, request }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.methodNotAllowed()
    }

    const checkouts = (
      await Checkout.query()
        .whereNot('status', 3)
        .whereNot('status', 0)
        .whereHas('items', (query) => {
          query.whereNotNull('checkout_details.product_id')
        })
    ).map((checkout) => checkout.serialize())
    const file = new PassThrough()
    const doc = new PDFDocument({ size: 'A4' })

    const width = 243.64
    const height = 140

    let counts = 0
    let x = 56
    let y = 56

    for (let item of checkouts) {
      counts = counts + 1

      doc.rect(x - 6, y - 6, width, height).stroke()

      doc.text('Nama', x, y)
      doc.moveUp()
      doc.text(':', x + 44)
      doc.moveUp()
      doc.text('', x + 54)
      doc.text(item.detail?.shipping?.recipient_name, { width: 177.64 })

      doc.text('HP', x)
      doc.moveUp()
      doc.text(':', x + 44)
      doc.moveUp()
      doc.text('', x + 54)
      doc.text(item.detail?.shipping?.recipient_phone, { width: 177.64 })

      doc.text('Alamat', x)
      doc.moveUp()
      doc.text(':', x + 44)
      doc.moveUp()
      doc.text('', x + 54)
      doc.text(item.detail?.shipping?.destination, { width: 177.64 })

      doc.text('Kurir', x)
      doc.moveUp()
      doc.text(':', x + 44)
      doc.moveUp()
      doc.text('', x + 54)
      doc.text(item.detail?.shipping?.shipping_service, { width: 177.64 })

      const yChecking = Math.floor(counts / 2)
      if (!(counts % 2 === 0)) {
        x = width + 64
      } else {
        x = 56
        y = 50 + yChecking * (height + 8) + 6
      }
      if (counts % 10 === 0) {
        doc.addPage({ size: 'A4' })
        x = 56
        y = 56
      }
    }

    doc.pipe(file)
    doc.end()

    response.stream(file)
  }
}
