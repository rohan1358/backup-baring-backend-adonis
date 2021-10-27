import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Course from 'App/Models/Course'
import Product from 'App/Models/Product'
import Partner from 'App/Models/Partner'
import User from 'App/Models/User'
import axios from 'axios'

export default class HooksController {
  public async updateUser({ request, response }: HttpContextContract) {
    const { user: newUser, oldUser } = await request.validate({
      schema: schema.create({
        oldUser: schema.string(),
        user: schema.string(),
      }),
    })

    const { user_id: amemberId } = JSON.parse(oldUser)
    const { login: username } = JSON.parse(newUser)

    const user = await User.findByOrFail('amember_id', parseInt(amemberId))

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

    const { name: fullname, groups = [] } = axiosResponse.data

    user.username = username
    user.fullname = fullname

    if (groups.length) {
      for (let group of groups) {
        if (Number(group) === 4) {
          user.isMentor = true
        } else {
          const partner = await Partner.findBy('amember_group', groups[0])
          if (partner) {
            user.partnerId = partner.id
          }
        }
      }
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
