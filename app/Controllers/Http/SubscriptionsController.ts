import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import makeQuery from 'App/Helpers/makeQuery'

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
          price: detail.nested['billing-plans'][0]?.first_price,
        })
      }
    }

    return products
  }
}
