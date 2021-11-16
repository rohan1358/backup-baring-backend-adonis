import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import axios from 'axios'
import Cart from 'App/Models/Cart'

export default class RajaongkirsController {
  private service = axios.create({
    baseURL: 'https://pro.rajaongkir.com',
    headers: {
      key: Env.get('RAJAONGKIR_KEY'),
    },
  })
  public async getProvince({ response }: HttpContextContract) {
    const promise = new Promise((resolve) => {
      this.service
        .get('/api/province')
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

    const results = await promise
    if (!results) {
      return response.internalServerError()
    }
    return results
  }

  public async getCity({ response, request }: HttpContextContract) {
    const id = request.input('id', '')
    if (!id) {
      return response.badRequest()
    }

    const promise = new Promise((resolve) => {
      this.service
        .get('/api/city', {
          params: {
            province: id,
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

    const results = await promise
    if (!results) {
      return response.internalServerError()
    }
    return results
  }

  public async getSubdistrict({ response, request }: HttpContextContract) {
    const id = request.input('id', '')
    if (!id) {
      return response.badRequest()
    }

    const promise = new Promise((resolve) => {
      this.service
        .get('/api/subdistrict', {
          params: {
            city: id,
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

    const results = await promise
    if (!results) {
      return response.internalServerError()
    }
    return results
  }

  public async cost({ request, response, auth }: HttpContextContract) {
    const destination = request.input('destination', '')
    if (!destination) {
      return response.badRequest()
    }

    const carts = await Cart.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .preload('product')
    let weight: number = 0

    for (let item of carts) {
      if (item.type === 'product') {
        weight = weight + (item.product.weight || 0)
      }
    }

    if (weight === 0) {
      return response.badRequest()
    }

    const promise = new Promise((resolve) => {
      this.service
        .post('/api/cost', {
          origin: 501,
          originType: 'city',
          destination,
          destinationType: 'subdistrict',
          weight: 1000,
          courier: 'jne:tiki:pos:ninja',
        })
        .then((response) => {
          const {
            data: {
              rajaongkir: { results },
            },
          } = response

          const resultsFiltered: any[] = []

          for (let courier of results) {
            const costs = courier.costs.map((item) => {
              const cost = item.cost.map((item) =>
                item.etd
                  ? {
                      ...item,
                      etd: item.etd.replace(/[^0-9\-]+/g, ''),
                    }
                  : item
              )

              return {
                ...item,
                cost,
              }
            })

            resultsFiltered.push({
              ...courier,
              costs,
            })
          }

          resolve(resultsFiltered)
        })
        .catch(() => {
          resolve(false)
        })
    })

    const results = await promise
    if (!results) {
      return response.internalServerError()
    }
    return results
  }
}
