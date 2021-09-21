import { GetObjectCommand } from '@aws-sdk/client-s3'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import s3 from 'App/Helpers/s3'
import Bab from 'App/Models/Bab'
import { PassThrough } from 'stream'
import sharp from 'sharp'

import Content from 'App/Models/Content'

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
}
