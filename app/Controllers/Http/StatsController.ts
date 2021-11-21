import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import ReadLog from 'App/Models/ReadLog'
import User from 'App/Models/User'
import moment from 'moment'
import { validator, schema } from '@ioc:Adonis/Core/Validator'
import Content from 'App/Models/Content'
import Category from 'App/Models/Category'

export default class StatsController {
  private _schemaIndex = schema.create({
    page: schema.number.optional(),
    per_page: schema.number.optional(),
  })
  public async userLogin({ auth }: HttpContextContract) {
    const role = auth.use('adminApi').user?.role! || null
    const result: object = {}
    const { rows } = await Database.rawQuery(
      'SELECT DATE(login_logs.created_at) as date,COUNT(*) as value FROM login_logs LEFT JOIN users ON users.id = login_logs.user_id' +
        (role === 'partner' ? ' WHERE users.partner_id=:id' : '') +
        ' GROUP BY date ORDER BY date DESC',
      role === 'partner'
        ? {
            id: auth.use('adminApi').user?.partnerId!,
          }
        : {}
    )

    for (let i = 9; i > 0; i--) {
      const current = moment().subtract(i, 'days').format('DD-MM-YYYY')
      const data = rows.find((el) => moment(el.date).format('DD-MM-YYYY') === current)
      result[current] = Number(data?.value || 0)
    }

    return result
  }

  public async userReads({ auth, params, response }: HttpContextContract) {
    const role = auth.use('adminApi').user?.role! || 0
    const user =
      role === 'partner'
        ? await User.query()
            .where('id', params.id)
            .andWhere('partner_id', auth.use('adminApi').user?.partnerId!)
            .first()
        : await User.query().where('id', params.id).first()

    if (!user) return response.notFound()

    const { rows } = await Database.rawQuery(
      'SELECT COUNT(*) as total FROM (SELECT contents.id FROM read_logs LEFT JOIN babs ON babs.id=read_logs.bab_id LEFT JOIN contents ON contents.id=babs.content_id WHERE read_logs.user_id = :id GROUP BY contents.id) as data',
      {
        id: user.id,
      }
    )

    const readLogs = await ReadLog.query()
      .preload('bab', (query) => {
        query.select('content_id', 'title').preload('content', (query) => {
          query.select('title', 'cover')
        })
      })
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(15)
      .offset(0)

    return {
      fullname: user.fullname,
      total: rows.length ? parseInt(rows[0].total) : 0,
      read_logs: readLogs,
    }
  }

  public async mostActiveUser({ request, auth }: HttpContextContract) {
    const { page } = await validator.validate({
      schema: this._schemaIndex,
      data: request.all(),
    })
    const role = auth.use('adminApi').user?.role! || 0
    const start = request.input('start')
      ? moment(request.input('start'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().startOf('month').format('YYYY-MM-DD hh:mm:ss')
    const end = request.input('end')
      ? moment(request.input('end'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().endOf('month').format('YYYY-MM-DD hh:mm:ss')

    const limit = 15
    const offset = (page ? page - 1 : 0) * limit

    let total = User.query().count('* as total')
    if (role === 'partner') {
      total = total.where('partner_id', auth.use('adminApi').user?.partnerId!)
    }

    const { rows } = await Database.rawQuery(
      "SELECT users.id,users.fullname,CASE WHEN logs.read_total IS NULL THEN '0' ELSE logs.read_total END as total FROM users LEFT JOIN (SELECT user_id,COUNT(*) as read_total FROM read_logs WHERE created_at >= :start AND created_at <= :end GROUP BY user_id) as logs ON logs.user_id = users.id" +
        (role === 'partner' ? ' WHERE users.partner_id=:id' : '') +
        ' ORDER BY total DESC OFFSET :offset LIMIT :limit',
      {
        start,
        end,
        id: role === 'partner' ? auth.use('adminApi').user?.partnerId! : '',
        limit,
        offset,
      }
    )

    return {
      total: Math.ceil(Number((await total)[0].$extras.total || '0') / limit),
      data: rows,
    }
  }

  public async mostReadBook({ request, auth }: HttpContextContract) {
    const { page, per_page } = await validator.validate({
      schema: this._schemaIndex,
      data: request.all(),
    })
    const role = auth.use('adminApi').user?.role! || 0
    const start = request.input('start')
      ? moment(request.input('start'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().startOf('month').format('YYYY-MM-DD hh:mm:ss')
    const end = request.input('end')
      ? moment(request.input('end'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().endOf('month').format('YYYY-MM-DD hh:mm:ss')

    const limit = per_page || 5
    const offset = (page ? page - 1 : 0) * limit

    const total = await Content.query().count('* as total')

    const { rows } = await Database.rawQuery(
      "SELECT contents.id,contents.title,CASE WHEN reads.total IS NULL THEN '0' ELSE reads.total END as read FROM contents LEFT JOIN (SELECT COUNT(*) as total,babs.content_id as content_id FROM read_logs LEFT JOIN babs ON babs.id=read_logs.bab_id LEFT OUTER JOIN users ON users.id=read_logs.user_id WHERE read_logs.created_at >= :start AND read_logs.created_at <= :end" +
        (role === 'partner' ? ' AND users.partner_id=:id' : '') +
        ' GROUP BY babs.content_id ) as reads ON reads.content_id=contents.id ORDER BY read DESC LIMIT :limit OFFSET :offset',
      role === 'partner'
        ? {
            id: auth.use('adminApi').user?.partnerId!,
            start,
            end,
            limit,
            offset,
          }
        : {
            start,
            end,
            limit,
            offset,
          }
    )

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: rows,
    }
  }

  public async mostReadCategory({ request, auth }: HttpContextContract) {
    const { page, per_page } = await validator.validate({
      schema: this._schemaIndex,
      data: request.all(),
    })
    const role = auth.use('adminApi').user?.role! || 0
    const start = request.input('start')
      ? moment(request.input('start'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().startOf('month').format('YYYY-MM-DD hh:mm:ss')
    const end = request.input('end')
      ? moment(request.input('end'), 'YYYY-MM-DD').format('YYYY-MM-DD hh:mm:ss')
      : moment().endOf('month').format('YYYY-MM-DD hh:mm:ss')

    const limit = per_page || 5
    const offset = (page ? page - 1 : 0) * limit

    const total = await Category.query().count('* as total')

    const { rows } = await Database.rawQuery(
      "SELECT categories.id,categories.name,CASE WHEN reads.total IS NULL THEN '0' ELSE reads.total END as read FROM categories LEFT JOIN (SELECT COUNT(*) as total,category_content.category_id as category_id FROM read_logs LEFT JOIN babs ON babs.id=read_logs.bab_id LEFT JOIN category_content ON category_content.content_id=babs.content_id LEFT OUTER JOIN users ON users.id=read_logs.user_id WHERE read_logs.created_at >= :start AND read_logs.created_at <= :end" +
        (role === 'partner' ? ' AND users.partner_id=:id' : '') +
        ' GROUP BY category_content.category_id ) as reads ON reads.category_id=categories.id ORDER BY read DESC LIMIT :limit OFFSET :offset',
      role === 'partner'
        ? {
            id: auth.use('adminApi').user?.partnerId!,
            start,
            end,
            limit,
            offset,
          }
        : {
            start,
            end,
            limit,
            offset,
          }
    )

    return {
      total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
      data: rows,
    }
  }
}
