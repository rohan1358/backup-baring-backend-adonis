import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import makeQuery from 'App/Helpers/makeQuery'
import CheckoutDetail from 'App/Models/CheckoutDetail'
import Checkout from 'App/Models/Checkout'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SubscriptionsController {
  public async packageList({ response, auth }: HttpContextContract) {
    let axiosResponse: any = {},
      haveTrial = false

    if (auth.use('userApi').isLoggedIn) {
      if (auth.use('userApi').user?.haveTrial && !auth.use('userApi').user?.inTrial) {
        haveTrial = true
      }
    }
    try {
      axiosResponse = await axios.get(
        `${Env.get('AMEMBER_URL')}/api/products?${makeQuery({
          _key: Env.get('AMEMBER_KEY'),
          _nested: ['billing-plans', 'product-product-category'],
        }).string()}`
      )
    } catch (e) {
      return response.internalServerError()
    }

    if (axiosResponse.data.error) {
      return response.badRequest()
    }

    const products: any[] = []

    for (let product of Object.values(axiosResponse.data)) {
      const detail = product as any

      if (
        detail.nested &&
        detail.nested['product-product-category'][0]?.product_category_id === '1' &&
        !(detail.product_id === 6 && !haveTrial)
      ) {
        products.push({
          id: detail.product_id,
          title: detail.title,
          description: detail.description,
          price: Number(detail.nested['billing-plans'][0]?.first_price),
        })
      }
    }

    return products
  }

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

  private _createInvoice(userId: number, uniqueNumber: number, productId: number) {
    return new Promise((resolve) => {
      ;(async () => {
        const data = {
          _key: Env.get('AMEMBER_KEY'),
          user_id: userId,
          paysys_id: 'moota',
          currency: 'IDR',
          first_subtotal: '0.00',
          first_discount: '0.00',
          first_tax: '0.00',
          first_shipping: '0.00',
          first_total: '0.00',
          first_period: '1m',
          rebill_times: 99999, // means until cancel
          is_confirmed: 1, // Must be 1
          status: 0, // 1 - paid 0 - pending check Invoice model
          nested: {
            'invoice-items': [] as any[],
          },
        }

        const product = await this._getProduct(productId)
        if (product) {
          data.nested['invoice-items'].push({
            item_id: productId, // product_id here;
            item_type: 'product',
            item_title: product.title,
            item_description: product.description,
            qty: 1,
            first_discount: '0.00',
            first_price: (
              Number(product.nested['billing-plans'][0]?.first_price) + uniqueNumber
            ).toFixed(2),
            first_tax: '0.00',
            first_shipping: '0.00',
            first_period: product.nested['billing-plans'][0].first_period,
            second_price: uniqueNumber.toFixed(2),
            second_total: uniqueNumber.toFixed(2),
            rebill_times: product.nested['billing-plans'][0].rebill_times,
            currency: 'IDR',
            billing_plan_id: product.nested['billing-plans'][0].plan_id, // Billing plan within  product, check am_billing_plan table.
          })
          uniqueNumber = 0
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

  public async create({ auth, response, params }: HttpContextContract) {
    let axiosResponse
    try {
      axiosResponse = await axios.get(
        `${Env.get('AMEMBER_URL')}/api/products/${params.id}?${makeQuery({
          _key: Env.get('AMEMBER_KEY'),
          _nested: ['billing-plans', 'product-product-category'],
        }).string()}`
      )
    } catch (e) {
      return response.internalServerError()
    }

    if (axiosResponse.data.error) {
      return response.badRequest()
    }

    const [item] = axiosResponse.data

    const items: CheckoutDetail[] = []

    const productItem = new CheckoutDetail()
    productItem.title = item.title
    productItem.price = Number(item.nested['billing-plans'][0]?.first_price)
    productItem.qty = 1
    productItem.isSub = true

    items.push(productItem)
    const total = Number(item.nested['billing-plans'][0]?.first_price)

    let detail: any = {}

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

      const invoice = await this._createInvoice(
        auth.use('userApi').user?.amemberId!,
        uniqueNumber,
        params.id
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
}
