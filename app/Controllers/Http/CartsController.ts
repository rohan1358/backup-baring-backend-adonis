import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Cart from 'App/Models/Cart'
import Course from 'App/Models/Course'
import Product from 'App/Models/Product'

export default class CartsController {
  public async index({ auth }: HttpContextContract) {
    const carts = await Cart.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .preload('product')
      .preload('course')

    return carts.map((cart) => {
      const serialize = cart.serialize()
      let item: any

      if (serialize.type === 'product') {
        item = serialize.product
      } else if (serialize.type === 'course') {
        item = serialize.course
      }
      return {
        id: item.id,
        qty: serialize.qty,
        name: item.title,
        price: item.price,
        image: item.cover,
        type: serialize.type,
      }
    })
  }

  public async increase({ auth, request, response }: HttpContextContract) {
    const {
      qty = 1,
      product_id,
      course_id,
    } = await request.validate({
      schema: schema.create({
        qty: schema.number.optional(),
        product_id: schema.number.optional(),
        course_id: schema.number.optional(),
      }),
    })

    let item: Product | Course | null = null
    let cart: Cart | null = null

    if (product_id) {
      item = await Product.findOrFail(product_id)
      cart = await Cart.query()
        .where('user_id', auth.use('userApi').user?.id!)
        .andWhere('product_id', item.id)
        .first()

      if (!cart) {
        cart = new Cart()
        cart.userId = auth.use('userApi').user?.id!
        cart.productId = item.id
        cart.qty = qty || 1
      } else {
        cart.qty = cart.qty + qty
      }
    } else if (course_id) {
      item = await Course.findOrFail(course_id)
      if (!item.price) return response.methodNotAllowed()
      cart = await Cart.query()
        .where('user_id', auth.use('userApi').user?.id!)
        .andWhere('course_id', item.id)
        .first()

      if (!cart) {
        cart = new Cart()
        cart.userId = auth.use('userApi').user?.id!
        cart.courseId = item.id
        cart.qty = 1
      } else {
        cart.qty = cart.qty + qty
      }
    }

    if (!item) return response.badRequest()

    await cart!.save()

    return cart!.serialize()
  }

  public async decrease({ auth, request }: HttpContextContract) {
    const { qty, product_id } = await request.validate({
      schema: schema.create({
        qty: schema.number(),
        product_id: schema.number(),
      }),
    })

    const cart = await Cart.query()
      .where('product_id', product_id)
      .andWhere('user_id', auth.use('userApi').user?.id!)
      .firstOrFail()

    if (cart.qty - qty <= 0) {
      await cart.delete()
    } else {
      cart.qty = cart.qty - qty
      await cart.save()
    }

    return cart.serialize()
  }

  public async reset({ auth, request, response }: HttpContextContract) {
    const {
      qty = 0,
      product_id,
      course_id,
    } = await request.validate({
      schema: schema.create({
        qty: schema.number.optional(),
        product_id: schema.number.optional(),
        course_id: schema.number.optional(),
      }),
    })

    let cart: Cart | null = null
    let cartQuery = Cart.query().where('user_id', auth.use('userApi').user?.id!)

    if (product_id) {
      cart = await cartQuery.andWhere('product_id', product_id).firstOrFail()
    } else if (course_id) {
      cart = await cartQuery.andWhere('course_id', course_id).firstOrFail()
    }

    if (!cart) return response.badRequest()

    if (qty <= 0) {
      await cart.delete()
    } else {
      cart.qty = product_id ? qty : 1
      await cart.save()
    }

    return cart.serialize()
  }
}
