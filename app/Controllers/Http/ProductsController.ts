import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { validator, schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Product from 'App/Models/Product'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import s3 from 'App/Helpers/s3'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'

export default class ProductsController {
  public async index({ request }: HttpContextContract) {
    const { page, limit = 20 } = await validator.validate({
      schema: schema.create({
        page: schema.number.optional(),
        limit: schema.number.optional(),
      }),
      data: request.all(),
    })

    const offset = (page ? page - 1 : 0) * limit

    const total = await Product.query().count('* as total')
    const products = await Product.query().orderBy('created_at', 'desc').limit(limit).offset(offset)

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: products.map((course) => course.serialize()),
    }
  }

  public async delete({ params }: HttpContextContract) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return product.serialize()
  }

  public async changeCover({ request, params }: HttpContextContract) {
    const { cover } = await request.validate({
      schema: schema.create({
        cover: schema.file({ size: '10mb', extnames: ['jpg', 'png', 'jpeg'] }),
      }),
    })

    const result = Database.transaction(async (trx) => {
      let deleteOld: string | null = null
      const product = await Product.findByOrFail('id', params.id)
      if (product.cover) {
        deleteOld = product.cover
      }
      const filename = `${cuid()}.${cover.extname}`
      product.cover = filename
      await product.useTransaction(trx).save()

      await s3.send(
        new PutObjectCommand({
          Key: filename,
          Bucket: 'product-images',
          Body: fs.createReadStream(cover.tmpPath!),
        })
      )
      if (deleteOld) {
        await s3.send(new DeleteObjectCommand({ Key: deleteOld, Bucket: 'product-images' }))
      }

      return product.toJSON()
    })
    return result
  }

  public async changeWeight({ request, params }: HttpContextContract) {
    const { weight } = await request.validate({
      schema: schema.create({
        weight: schema.number(),
      }),
    })

    const product = await Product.findOrFail(params.id)
    product.weight = weight
    await product.save()

    return product.serialize()
  }

  public async read({ params }: HttpContextContract) {
    const product = await Product.query().where('id', params.id).firstOrFail()

    return product.serialize()
  }
}
