import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Cart from 'App/Models/Cart'
import Product from 'App/Models/Product'

export default class CartsController {
  public async index({ auth }: HttpContextContract) {
    const carts = await Cart.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .preload('product')

    return carts.map((cart) => {
      const serialize = cart.serialize()
      return {
        id: serialize.product?.id,
        qty: serialize.qty,
        name: serialize.product?.title,
        price: serialize.product?.price,
        image: serialize.product?.cover,
      }
    })
  }

  public async increase({ auth, request }: HttpContextContract) {
    const { qty, product_id } = await request.validate({
      schema: schema.create({
        qty: schema.number(),
        product_id: schema.number(),
      }),
    })

    const product = await Product.findByOrFail('id', product_id)
    let cart = await Cart.query()
      .where('product_id', product.id)
      .andWhere('user_id', auth.use('userApi').user?.id!)
      .first()
    if (!cart) {
      cart = new Cart()
      cart.userId = auth.use('userApi').user?.id!
      cart.productId = product.id
      cart.qty = qty || 1
    } else {
      cart.qty = cart.qty + qty
    }

    await cart.save()

    return cart.serialize()
  }

  public async decrease({ auth, request }: HttpContextContract) {
    const { qty, product_id } = await request.validate({
      schema: schema.create({
        qty: schema.number(),
        product_id: schema.number(),
      }),
    })

    console.log(auth.use('userApi').user?.id!, product_id)

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

  public async reset({ auth, request }: HttpContextContract) {
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

    if (qty <= 0) {
      await cart.delete()
    } else {
      cart.qty = qty
      await cart.save()
    }

    return cart.serialize()
  }
}
