import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Course from 'App/Models/Course'
import Partner from 'App/Models/Partner'
import Product from 'App/Models/Product'
import User from 'App/Models/User'
import axios from 'axios'
import Checkout from 'App/Models/Checkout'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class HooksController {
  private _getInvoice(login) {
    return new Promise((resolve) => {
      axios
        .get(`${Env.get('AMEMBER_URL')}/api/check-access/by-login`, {
          params: {
            _key: Env.get('AMEMBER_KEY'),
            login,
          },
        })
        .then((response) => {
          if (response.data?.error) {
            resolve(false)
            return
          }

          resolve([response.data.subscriptions, response.data.categories])
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  public async afterPaid({ request, response }: HttpContextContract) {
    const invoice = request.input('invoice')

    if (!invoice) {
      return response.badRequest()
    }

    const { invoice_id: invoiceId } = typeof invoice === 'string' ? JSON.parse(invoice) : invoice
    const checkout = await Checkout.findByOrFail('invoice_id', invoiceId)
    const user = await checkout.related('user').query().firstOrFail()

    let force = true
    const items = await checkout.related('items').query().preload('course')
    const results = await Database.transaction(async (t) => {
      const courses: any = {}
      const [subscription, categories] = ((await this._getInvoice(user.username)) || {}) as any

      for (let item of items) {
        if (item.course && subscription[item.course.amemberId]) {
          courses[item.course.id] = {
            mentor: false,
            subscription_end: subscription[item.course.amemberId],
          }
        } else if (!item.course || item.isSub) {
          force = false
        }

        if (item.isSub && categories['1']) {
          const splitDate = categories['1'].split('-')
          user.subscriptionEnd = DateTime.fromObject({
            year: splitDate[0],
            month: splitDate[1],
            day: splitDate[2],
          })
          user.inTrial = false
          await user.save()
        }
      }

      checkout.isPaid = true
      checkout.status = force ? 3 : 1

      await user.useTransaction(t).related('courses').attach(courses)
      await checkout.useTransaction(t).save()

      return checkout.serialize()
    })

    return results
  }

  public async updateUser({ request, response }: HttpContextContract) {
    const newUser = request.input('user')
    const oldUser = request.input('oldUser')

    if (!newUser || !oldUser) {
      return response.badRequest()
    }

    const { user_id: amemberId } = oldUser
    const { login: username } = newUser

    let user: User | null = await User.findBy('amember_id', parseInt(amemberId))

    if (!user) {
      user = new User()
      user.amemberId = amemberId
    }

    let axiosResponse
    try {
      axiosResponse = await axios.get(`${Env.get('AMEMBER_URL')}/api/check-access/by-login`, {
        params: {
          _key: process.env.AMEMBER_KEY,
          login: username,
        },
      })
    } catch (e) {
      return response.internalServerError()
    }

    if (parseInt(amemberId) !== parseInt(axiosResponse.data.user_id)) return response.badRequest()

    const { name: fullname, email, groups = [], categories = {} } = axiosResponse.data

    user.username = username
    user.fullname = fullname
    user.email = email

    if (groups.length) {
      for (let group of groups) {
        if (Number(group) === 4) {
          user.isMentor = true
        } else {
          const partner = await Partner.findBy('amember_group', group)
          if (partner) {
            user.partnerId = partner.id
          }
        }
      }
    }

    if (categories['1']) {
      user.subscriptionEnd = categories['1']
    }

    await user.save()

    return user.toJSON()
  }

  public async productHook({ request, response }: HttpContextContract) {
    const amemberId = request.input('product_id', '')

    if (!amemberId) {
      return response.badRequest()
    }

    let responseAxios
    try {
      const getData = (
        await axios.get(
          `${Env.get('AMEMBER_URL')}/api/products/${amemberId}?_key=${Env.get(
            'AMEMBER_KEY'
          )}&_nested[]=billing-plans&_nested[]=product-product-category`
        )
      ).data
      if (Array.isArray(getData)) {
        responseAxios = getData[0]
      } else {
        throw new Error()
      }
    } catch (e) {
      return response.internalServerError()
    }

    const { title, description, nested } = responseAxios
    const category = nested['product-product-category'][0]?.product_category_id

    if (category === '2') {
      let course = await Course.findBy('amember_id', amemberId)
      if (!course) {
        course = new Course()
        course.amemberId = amemberId
      }

      course.title = title
      course.description = description
      course.price = parseInt(nested['billing-plans'][0]?.first_price || '0')

      await course.save()

      return course.toJSON()
    } else if (category === '3') {
      let product = await Product.findBy('amember_id', amemberId)
      if (!product) {
        product = new Product()
        product.amemberId = amemberId
      }

      product.title = title
      product.description = description
      product.price = parseInt(nested['billing-plans'][0]?.first_price || '0')

      await product.save()

      return product.toJSON()
    }
  }
}
