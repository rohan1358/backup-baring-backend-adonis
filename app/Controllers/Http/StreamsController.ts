import { GetObjectCommand } from '@aws-sdk/client-s3'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import s3 from 'App/Helpers/s3'
import Bab from 'App/Models/Bab'
import { PassThrough } from 'stream'
import sharp from 'sharp'
import Content from 'App/Models/Content'
import Course from 'App/Models/Course'
import Product from 'App/Models/Product'
import Subject from 'App/Models/Subject'
import Partner from 'App/Models/Partner'
import fs from 'fs'
import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Category from 'App/Models/Category'

export default class StreamsController {
  public async streamCover({ params, response }: HttpContextContract) {
    const content = await Content.findByOrFail('cover', params.filename)

    const file = await s3.send(new GetObjectCommand({ Bucket: 'covers-01', Key: content.cover }))

    const stream = new PassThrough()
    const transform = sharp()
      .resize(300, 300, {
        fit: 'contain',
      })
      .webp()

    file.Body.pipe(transform).pipe(stream)
    return response.stream(stream)
  }

  public async streamIcon({ params, response }: HttpContextContract) {
    const category = await Category.findByOrFail('icon', params.filename)

    const file = await s3.send(new GetObjectCommand({ Bucket: 'icons-01', Key: category.icon }))

    const stream = new PassThrough()
    const transform = sharp()
      .resize(64, 64, {
        fit: 'contain',
      })
      .webp()

    file.Body.pipe(transform).pipe(stream)
    return response.stream(stream)
  }

  public async partnerLogo({ params, response }: HttpContextContract) {
    const partner = await Partner.findOrFail(params.id)
    const stream = new PassThrough()

    if (partner.logo) {
      const file = await s3.send(new GetObjectCommand({ Bucket: 'logo-01', Key: partner.logo }))
      file.Body.pipe(stream)
    } else {
      const file = fs.createReadStream(Application.makePath('public', 'base-logo.png'))
      file.pipe(stream)
    }

    return response.stream(stream)
  }

  public async streamCourseCover({ params, response }: HttpContextContract) {
    const course = await Course.findByOrFail('cover', params.filename)

    const file = await s3.send(
      new GetObjectCommand({ Bucket: 'online-course-covers', Key: course.cover })
    )

    const stream = new PassThrough()
    const transform = sharp()
      .resize(300, 300, {
        fit: 'contain',
      })
      .webp()

    file.Body.pipe(transform).pipe(stream)
    return response.stream(stream)
  }

  public async streamCoursePDF({ params, response }: HttpContextContract) {
    const course = await Course.findByOrFail('pdf', params.filename)

    const file = await s3.send(new GetObjectCommand({ Bucket: 'pdf-course', Key: course.pdf }))

    return response.stream(file.Body)
  }

  public async streamSubjectPDF({ request, params, response }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.methodNotAllowed()
    }
    const subject = await Subject.findByOrFail('pdf', params.filename)

    const file = await s3.send(new GetObjectCommand({ Bucket: 'pdf-course', Key: subject.pdf }))

    return response.stream(file.Body)
  }

  public async streamUserAvatar({ params, response }: HttpContextContract) {
    const user = await User.findByOrFail('avatar', params.filename)
    const stream = new PassThrough()
    const file = await s3.send(new GetObjectCommand({ Bucket: 'user-avatar', Key: user.avatar }))
    const transform = sharp()
      .resize(300, 300, {
        fit: 'contain',
      })
      .webp()

    file.Body.pipe(transform).pipe(stream)

    return response.stream(stream)
  }

  public async streamProductCover({ params, response }: HttpContextContract) {
    const product = await Product.findByOrFail('cover', params.filename)

    const file = await s3.send(
      new GetObjectCommand({ Bucket: 'product-images', Key: product.cover })
    )

    const stream = new PassThrough()
    const transform = sharp()
      .resize(300, 300, {
        fit: 'contain',
      })
      .webp()

    file.Body.pipe(transform).pipe(stream)
    return response.stream(stream)
  }

  public async streamSynopsis({ response, request, params }: HttpContextContract) {
    const { audio } = await Content.findByOrFail('audio', params.filename)
    const range = request.header('range')
    const file = await s3.send(
      new GetObjectCommand({ Key: audio, Bucket: 'plot-audio-01', Range: range })
    )

    response.status(206)
    response.header('Content-Range', file.ContentRange!)
    response.header('Accept-Ranges', 'bytes')
    response.header('Content-Length', file.ContentLength!)
    response.header('Content-Type', file.ContentType!)

    response.stream(file.Body)
  }

  public async streamBab({ response, request, params }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.methodNotAllowed()
    }

    const { audio } = await Bab.findByOrFail('audio', params.filename)
    const range = request.header('range')
    const file = await s3.send(
      new GetObjectCommand({ Key: audio, Bucket: 'ring-audio-01', Range: range })
    )

    response.status(206)
    response.header('Cache-Control', 'no-store')
    response.header('Content-Range', file.ContentRange!)
    response.header('Accept-Ranges', 'bytes')
    response.header('Content-Length', file.ContentLength!)
    response.header('Content-Type', file.ContentType!)

    response.stream(file.Body)
  }

  public async streamSubjectAudio({ response, request, params }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.methodNotAllowed()
    }

    const { audio } = await Subject.findByOrFail('audio', params.filename)
    const range = request.header('range')
    const file = await s3.send(
      new GetObjectCommand({ Key: audio, Bucket: 'audio-course', Range: range })
    )

    response.status(206)
    response.header('Cache-Control', 'no-store')
    response.header('Content-Range', file.ContentRange!)
    response.header('Accept-Ranges', 'bytes')
    response.header('Content-Length', file.ContentLength!)
    response.header('Content-Type', file.ContentType!)

    response.stream(file.Body)
  }
}
