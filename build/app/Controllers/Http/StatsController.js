"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Content_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Content"));
const ReadLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ReadLog"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const luxon_1 = require("luxon");
const moment_1 = __importDefault(require("moment"));
class StatsController {
    constructor() {
        this._schemaIndex = Validator_1.schema.create({
            page: Validator_1.schema.number.optional(),
            per_page: Validator_1.schema.number.optional(),
        });
    }
    async userLogin({ auth }) {
        const role = auth.use('adminApi').user?.role || null;
        const result = {};
        const { rows } = await Database_1.default.rawQuery('SELECT DATE(login_logs.created_at) as date,COUNT(*) as value FROM login_logs LEFT JOIN users ON users.id = login_logs.user_id' +
            (role === 'partner' ? ' WHERE users.partner_id=:id' : '') +
            ' GROUP BY date ORDER BY date DESC', role === 'partner'
            ? {
                id: auth.use('adminApi').user?.partnerId,
            }
            : {});
        for (let i = 9; i > 0; i--) {
            const current = moment_1.default().subtract(i, 'days').format('DD-MM-YYYY');
            const data = rows.find((el) => moment_1.default(el.date).format('DD-MM-YYYY') === current);
            result[current] = Number(data?.value || 0);
        }
        return result;
    }
    async userReads({ auth, params, response }) {
        const role = auth.use('adminApi').user?.role || 0;
        const user = role === 'partner'
            ? await User_1.default.query()
                .where('id', params.id)
                .andWhere('partner_id', auth.use('adminApi').user?.partnerId)
                .first()
            : await User_1.default.query().where('id', params.id).first();
        if (!user)
            return response.notFound();
        const readLogs = await ReadLog_1.default.query()
            .preload('bab', (query) => {
            query.select('content_id', 'title').preload('content', (query) => {
                query.select('title', 'cover');
            });
        })
            .where('user_id', user.id)
            .orderBy('created_at', 'desc')
            .limit(10)
            .offset(0);
        return readLogs.map((log) => log.serialize());
    }
    async mostActiveUser({ request, auth }) {
        const { page } = await Validator_1.validator.validate({
            schema: this._schemaIndex,
            data: request.all(),
        });
        const role = auth.use('adminApi').user?.role || 0;
        const limit = 15;
        const offset = (page ? page - 1 : 0) * limit;
        const q = request.input('q', '');
        let total = User_1.default.query().count('* as total').where('fullname', 'iLIKE', `%${q}%`);
        if (role === 'partner') {
            total = total
                .where('partner_id', auth.use('adminApi').user?.partnerId)
                .where('fullname', 'iLIKE', `%${q}%`);
        }
        let query = User_1.default.query()
            .joinRaw(`LEFT JOIN (SELECT DISTINCT ON (user_id) user_id,created_at FROM login_logs ORDER BY user_id,created_at DESC) as logs ON logs.user_id = users.id`)
            .select('users.*', 'logs.created_at as last_login')
            .orderBy('fullname', 'asc')
            .limit(limit)
            .offset(offset)
            .where('fullname', 'iLIKE', `%${q}%`);
        if (role === 'partner') {
            query = query.where('users.partner_id', auth.use('adminApi').user?.partnerId);
        }
        return {
            total: Math.ceil(Number((await total)[0].$extras.total || '0') / limit),
            data: (await query).map((user) => ({
                ...user.serialize(),
                last_login: user.$extras.last_login,
            })),
        };
    }
    async bookWasRead({ auth, params, response }) {
        const role = auth.use('adminApi').user?.role || 0;
        const user = role === 'partner'
            ? await User_1.default.query()
                .where('id', params.id)
                .andWhere('partner_id', auth.use('adminApi').user?.partnerId)
                .first()
            : await User_1.default.query().where('id', params.id).first();
        if (!user)
            return response.notFound();
        const readLogs = await ReadLog_1.default.query()
            .preload('bab', (query) => {
            query.select('content_id', 'title').preload('content', (query) => {
                query.select('title', 'cover');
            });
        })
            .leftJoin('babs', 'babs.id', '=', 'read_logs.bab_id')
            .where('user_id', user.id)
            .select('read_logs.*')
            .orderBy('babs.content_id')
            .orderBy('read_logs.created_at', 'desc')
            .distinctOn('babs.content_id');
        return readLogs.map((log) => log.serialize());
    }
    async userAccess({ params, auth, response }) {
        const role = auth.use('adminApi').user?.role || 0;
        const user = role === 'partner'
            ? await User_1.default.query()
                .where('id', params.id)
                .andWhere('partner_id', auth.use('adminApi').user?.partnerId)
                .first()
            : await User_1.default.query().where('id', params.id).first();
        if (!user)
            return response.notFound();
        const lastSevenDays = luxon_1.DateTime.now().minus({ days: 7 }).toSQL();
        let query = User_1.default.query()
            .innerJoin('login_logs', 'login_logs.user_id', '=', 'users.id')
            .select('users.id', Database_1.default.raw('COUNT (*) as access_count'))
            .where('users.id', user.id)
            .groupBy('users.id')
            .debug(true);
        const lastAccess = await User_1.default.query()
            .joinRaw(`LEFT JOIN (SELECT user_id,created_at FROM login_logs ORDER BY created_at DESC LIMIT 1) as logs ON logs.user_id = users.id`)
            .select('logs.created_at as last_login')
            .where('users.id', user.id)
            .first();
        const allTime = await query;
        const thisWeek = await query.andWhere('login_logs.created_at', '>=', lastSevenDays);
        return {
            fullname: user.fullname,
            last_access: lastAccess?.$extras.last_login,
            this_week: Number(thisWeek[0]?.$extras.access_count || '0'),
            all_time: Number(allTime[0]?.$extras.access_count || '0'),
        };
    }
    async mostReadBook({ request, auth }) {
        const { page, per_page } = await Validator_1.validator.validate({
            schema: this._schemaIndex,
            data: request.all(),
        });
        const role = auth.use('adminApi').user?.role || 0;
        const start = request.input('start')
            ? moment_1.default(request.input('start'), 'YYYY-MM-DD').format('YYYY-MM-DD')
            : moment_1.default().startOf('month').format('YYYY-MM-DD');
        const end = request.input('end')
            ? moment_1.default(request.input('end'), 'YYYY-MM-DD').format('YYYY-MM-DD')
            : moment_1.default().endOf('month').format('YYYY-MM-DD');
        const limit = per_page || 5;
        const offset = (page ? page - 1 : 0) * limit;
        let total = User_1.default.query().count('* as total');
        if (role === 'partner') {
            total = total.where('partner_id', auth.use('adminApi').user?.partnerId);
        }
        let query = User_1.default.query()
            .joinRaw('LEFT JOIN (SELECT user_id,COUNT(*) as count FROM read_logs WHERE created_at >= :start AND created_at <= :end GROUP BY user_id) as logs ON logs.user_id = users.id', {
            start,
            end,
        })
            .select('users.*', Database_1.default.raw("CASE WHEN logs.count IS NULL THEN '0' ELSE logs.count END as count"))
            .orderBy('count', 'desc')
            .limit(limit)
            .offset(offset);
        if (role === 'partner') {
            query = query.where('users.partner_id', auth.use('adminApi').user?.partnerId);
        }
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: (await query).map((item) => ({
                ...item.serialize(),
                count: Number(item.$extras?.count),
            })),
        };
    }
    async mostReadCategory({ request, auth }) {
        const { page, per_page } = await Validator_1.validator.validate({
            schema: this._schemaIndex,
            data: request.all(),
        });
        const role = auth.use('adminApi').user?.role || 0;
        const start = request.input('start')
            ? moment_1.default(request.input('start'), 'YYYY-MM-DD').format('YYYY-MM-DD')
            : moment_1.default().startOf('month').format('YYYY-MM-DD');
        const end = request.input('end')
            ? moment_1.default(request.input('end'), 'YYYY-MM-DD').format('YYYY-MM-DD')
            : moment_1.default().endOf('month').format('YYYY-MM-DD');
        const limit = per_page || 5;
        const offset = (page ? page - 1 : 0) * limit;
        let total = await Content_1.default.query().count('* as total');
        let query = Content_1.default.query()
            .preload('categories')
            .select('contents.*', Database_1.default.raw("CASE WHEN logs.count IS NULL THEN '0' ELSE logs.count END as count"))
            .orderBy('count', 'desc')
            .limit(limit)
            .offset(offset);
        if (role === 'partner') {
            query = query.joinRaw('LEFT JOIN (SELECT babs.content_id,COUNT(*) as count FROM read_logs LEFT OUTER JOIN users ON users.id=read_logs.user_id LEFT OUTER JOIN babs ON babs.id=read_logs.bab_id WHERE read_logs.created_at >= :start AND read_logs.created_at <= :end AND users.partner_id = :partner GROUP BY babs.content_id) as logs ON logs.content_id = contents.id', {
                start,
                end,
                partner: auth.use('adminApi').user?.partnerId,
            });
        }
        else {
            query = query.joinRaw('LEFT JOIN (SELECT babs.content_id,COUNT(*) as count FROM read_logs LEFT JOIN babs ON babs.id=read_logs.bab_id WHERE read_logs.created_at >= :start AND read_logs.created_at <= :end GROUP BY babs.content_id) as logs ON logs.content_id = contents.id', {
                start,
                end,
            });
        }
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: (await query).map((item) => ({
                ...item.serialize(),
                count: Number(item.$extras?.count),
            })),
        };
    }
}
exports.default = StatsController;
//# sourceMappingURL=StatsController.js.map