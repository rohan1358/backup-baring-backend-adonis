import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import ReadLog from 'App/Models/ReadLog'
import User from 'App/Models/User'
import moment from 'moment'

export default class StatsController {
  public async userLogin({ auth }: HttpContextContract) {
    const result: object = {}
    const { rows } = await Database.rawQuery(
      'SELECT DATE(login_logs.created_at) as date,COUNT(*) as value FROM login_logs LEFT JOIN users ON users.id = login_logs.user_id WHERE users.partner_id=:id GROUP BY date ORDER BY date DESC',
      {
        id: auth.use('adminApi').user?.partnerId!,
      }
    )

    for (let i = 9; i > 0; i--) {
      result[moment().subtract(i, 'days').format('DD-MM-YYYY')] = 0
    }

    for (let row of rows) {
      result[moment(row.date).format('DD-MM-YYYY')] = parseInt(row.value)
    }

    return result
  }

  public async userReads({ auth, params, response }: HttpContextContract) {
    const user = await User.query()
      .where('id', params.id)
      .andWhere('partner_id', auth.use('adminApi').user?.partnerId!)
      .first()

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

    return {
      fullname: user.fullname,
      total: rows.length ? parseInt(rows[0].total) : 0,
      read_logs: readLogs,
    }
  }

  public async mostActiveUser({ auth }: HttpContextContract) {
    const month = moment().format('MM')
    const year = moment().format('YYYY')
    const { rows } = await Database.rawQuery(
      'SELECT users.id,users.fullname,COUNT(*) as total FROM users INNER JOIN read_logs ON read_logs.user_id=users.id WHERE users.partner_id = :id AND EXTRACT(YEAR FROM read_logs.created_at) = :year AND EXTRACT(MONTH FROM read_logs.created_at) = :month GROUP BY users.id ORDER BY total DESC',
      {
        year,
        month,
        id: auth.use('adminApi').user?.partnerId!,
      }
    )

    return rows
  }

  public async mostReadBook({ auth }: HttpContextContract) {
    const { rows } = await Database.rawQuery(
      'SELECT contents.id,contents.title,COUNT(*) as read FROM contents LEFT JOIN babs ON babs.content_id=contents.id INNER JOIN read_logs ON read_logs.bab_id=babs.id LEFT JOIN users ON users.id = read_logs.user_id WHERE users.partner_id = :id GROUP BY contents.id ORDER BY read DESC',
      {
        id: auth.use('adminApi').user?.partnerId!,
      }
    )

    return rows
  }

  public async mostReadCategory({ auth }: HttpContextContract) {
    const { rows } = await Database.rawQuery(
      'SELECT categories.id,categories.name,COUNT(*) as read FROM category_content LEFT JOIN categories ON categories.id=category_content.category_id LEFT OUTER JOIN contents ON contents.id=category_content.content_id LEFT JOIN babs ON babs.content_id=contents.id INNER JOIN read_logs ON read_logs.bab_id=babs.id LEFT JOIN users ON users.id = read_logs.user_id WHERE users.partner_id = :id GROUP BY categories.id ORDER BY read DESC',
      {
        id: auth.use('adminApi').user?.partnerId!,
      }
    )

    return rows
  }
}
