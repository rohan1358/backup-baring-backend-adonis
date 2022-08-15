"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const axios_1 = __importDefault(require("axios"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const moment_1 = __importDefault(require("moment"));
const makeQuery_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/makeQuery"));
const Admin_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Admin"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const LoginLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/LoginLog"));
const Partner_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Partner"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Course_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Course"));
const luxon_1 = require("luxon");
const ResetPassword_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ResetPassword"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const Mail_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/Mail"));
const fs_1 = __importDefault(require("fs"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
class AuthController {
    async _userLoginLog(id, trx) {
        const loginLog = new LoginLog_1.default();
        loginLog.userId = id;
        await loginLog.useTransaction(trx).save();
        return;
    }
    async login({ request, response, auth }) {
        const { username, password } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                username: Validator_1.schema.string(),
                password: Validator_1.schema.string(),
            }),
            data: request.all(),
        });
        let axiosResponse;
        try {
            axiosResponse = await axios_1.default.get(`${Env_1.default.get('AMEMBER_URL')}/api/check-access/by-login-pass`, {
                params: {
                    _key: process.env.AMEMBER_KEY,
                    login: username,
                    pass: password,
                },
            });
        }
        catch (e) {
            return response.internalServerError();
        }
        if (!axiosResponse.data.ok)
            return response.unauthorized();
        const courses = {};
        const { user_id, name, email, categories, groups = [], subscriptions = {}, } = axiosResponse.data;
        const coursesList = await Course_1.default.query().whereIn('amember_id', Object.keys(subscriptions).map((el) => Number(el)));
        for (let item of coursesList) {
            courses[item.id] = {
                mentor: false,
                subscription_end: subscriptions[item.amemberId],
            };
        }
        const result = await Database_1.default.transaction(async (trx) => {
            const user = await User_1.default.findBy('amember_id', user_id);
            if (!user) {
                const newUser = new User_1.default();
                newUser.amemberId = user_id;
                newUser.fullname = name;
                newUser.username = username;
                newUser.email = email;
                if (groups.length) {
                    for (let group of groups) {
                        if (Number(group) === 4) {
                            newUser.isMentor = true;
                        }
                        else {
                            const partner = await Partner_1.default.findBy('amember_group', group);
                            if (partner) {
                                newUser.partnerId = partner.id;
                            }
                        }
                    }
                }
                let subscriber = false;
                if (categories['1']) {
                    newUser.subscriptionEnd = categories['1'];
                    subscriber = true;
                }
                await newUser.useTransaction(trx).save();
                if (Object.keys(courses).length) {
                    await newUser.useTransaction(trx).related('courses').sync(courses);
                }
                await this._userLoginLog(newUser.id, trx);
                return {
                    user: newUser,
                    subscriber,
                };
            }
            else {
                let subscriber = false;
                if (categories['1'] &&
                    (!user.subscriptionEnd ||
                        (user.subscriptionEnd &&
                            moment_1.default(user.subscriptionEnd).format('YYYY-MM-DD') !==
                                moment_1.default(categories['1'], 'YYYY-MM-DD').format('YYYY-MM-DD')))) {
                    user.subscriptionEnd = categories['1'];
                    subscriber = true;
                }
                user.email = email;
                await user.useTransaction(trx).save();
                if (Object.keys(courses).length) {
                    await user.useTransaction(trx).related('courses').sync(courses);
                }
                if (user.subscriptionEnd && moment_1.default(user.subscriptionEnd).toDate() <= new Date()) {
                    subscriber = true;
                }
                await this._userLoginLog(user.id, trx);
                return {
                    user,
                    subscriber,
                };
            }
        });
        return {
            id: result.user.id,
            fullname: name,
            amember_id: result.user.amemberId,
            token: (await auth.use('userApi').generate(result.user)).token,
            subscriber: result.subscriber,
            partner_id: result.user.partnerId,
        };
    }
    async register({ request, response, auth }) {
        let payload;
        try {
            payload = await request.validate({
                schema: Validator_1.schema.create({
                    username: Validator_1.schema.string({}, [
                        Validator_1.rules.regex(/^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/),
                    ]),
                    fullname: Validator_1.schema.string(),
                    password: Validator_1.schema.string(),
                    email: Validator_1.schema.string({}, [Validator_1.rules.email()]),
                }),
            });
        }
        catch (e) {
            return response.badRequest(e.messages);
        }
        const { username, fullname, password, email } = payload;
        const splitName = fullname.split(' ');
        const lastName = splitName.pop();
        const firstName = splitName.join(' ');
        let axiosResponse;
        try {
            axiosResponse = await axios_1.default.post(`${Env_1.default.get('AMEMBER_URL')}/api/users`, makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                login: username,
                pass: password,
                email,
                name_f: firstName,
                name_l: lastName,
            }).string());
        }
        catch (e) {
            return response.internalServerError();
        }
        if (axiosResponse.data.error) {
            return response.badRequest();
        }
        const [registered] = axiosResponse.data;
        try {
            const addAccess = await axios_1.default.post(`${Env_1.default.get('AMEMBER_URL')}/api/access`, makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                user_id: registered.user_id,
                product_id: 6,
                begin_date: luxon_1.DateTime.now().toFormat('yyyy-LL-dd'),
                expire_date: luxon_1.DateTime.now().plus({ days: 7 }).toFormat('yyyy-LL-dd'),
            }).string());
            if (addAccess.data.error) {
                throw new Error();
            }
        }
        catch (e) {
            return response.internalServerError();
        }
        const user = await Database_1.default.transaction(async (trx) => {
            const user = new User_1.default();
            user.amemberId = registered.user_id;
            user.fullname = fullname;
            user.username = username;
            user.email = email;
            user.haveTrial = false;
            user.inTrial = true;
            user.subscriptionEnd = luxon_1.DateTime.now().plus({ days: 7 });
            await user.useTransaction(trx).save();
            await this._userLoginLog(user.id, trx);
            return user;
        });
        return {
            id: user.id,
            fullname,
            amember_id: user.amemberId,
            token: (await auth.use('userApi').generate(user)).token,
            subscriber: true,
            partner_id: user.partnerId,
        };
    }
    async adminLogin({ request, response, auth }) {
        let payload;
        try {
            payload = await Validator_1.validator.validate({
                schema: Validator_1.schema.create({
                    username: Validator_1.schema.string(),
                    password: Validator_1.schema.string(),
                }),
                data: request.all(),
            });
        }
        catch (error) {
            return response.badRequest(error.messages);
        }
        const { username, password } = payload;
        const admin = await Admin_1.default.findByOrFail('username', username);
        if (!(await Hash_1.default.verify(admin.password, password))) {
            return response.badRequest('Invalid credentials');
        }
        const jsonResponse = {
            ...admin.toJSON(),
            token: (await auth.use('adminApi').generate(admin)).token,
        };
        return jsonResponse;
    }
    async logout({ auth }) {
        if (auth.user instanceof Admin_1.default) {
            await auth.use('adminApi').revoke();
        }
        else {
            await auth.use('userApi').revoke();
        }
        return 'Token Revoked';
    }
    async verify({ auth }) {
        const result = await Database_1.default.transaction(async (trx) => {
            const user = auth.use('userApi').user;
            await this._userLoginLog(user.id, trx);
            return user;
        });
        return result.serialize();
    }
    async _checkUniqueToken(token) {
        const resetToken = await ResetPassword_1.default.query()
            .where('token', token)
            .andWhere('created_at', '>=', `${luxon_1.DateTime.now().minus({ days: 2 }).toFormat('yyyy-LL-dd')} 00:00:00`)
            .first();
        if (resetToken) {
            return true;
        }
        else {
            return false;
        }
    }
    async requestResetPass({ request }) {
        const { email, url } = await request.validate({
            schema: Validator_1.schema.create({
                email: Validator_1.schema.string({}, [Validator_1.rules.email()]),
                url: Validator_1.schema.string(),
            }),
        });
        const user = await User_1.default.findByOrFail('email', email);
        let token = Helpers_1.cuid();
        while (await this._checkUniqueToken(token)) {
            token = Helpers_1.cuid();
        }
        const formattedUrl = url.replace('%token%', token);
        const result = await Database_1.default.transaction(async (t) => {
            const resetPass = new ResetPassword_1.default();
            resetPass.token = token;
            resetPass.userId = user.id;
            await resetPass.useTransaction(t).save();
            try {
                new Mail_1.default().send({
                    from: 'BaRing.Digital <ingat@baring.digital>',
                    to: [user.email],
                    subject: 'Pengaturan Ulang Password',
                    html: fs_1.default
                        .readFileSync(Application_1.default.makePath('app', 'Services', 'password.html'), 'utf8')
                        .replace('%fullname%', user.fullname)
                        .replace(/\%root_url\%/gm, formattedUrl),
                });
            }
            catch (e) {
                throw new Error(e);
            }
            return {
                success: 'Reset password request email has sent',
            };
        });
        return result;
    }
    async resetPass({ request, response }) {
        const { token, password } = await request.validate({
            schema: Validator_1.schema.create({
                token: Validator_1.schema.string(),
                password: Validator_1.schema.string(),
            }),
        });
        const resetPass = await ResetPassword_1.default.findByOrFail('token', token);
        const user = await User_1.default.findOrFail(resetPass.userId);
        if (luxon_1.DateTime.now().diff(resetPass.createdAt, 'days').days > 2)
            return response.notFound();
        const result = await Database_1.default.transaction(async (t) => {
            await resetPass.useTransaction(t).delete();
            let axiosResponse;
            try {
                axiosResponse = await axios_1.default.put(`${Env_1.default.get('AMEMBER_URL')}/api/users/${user.amemberId}?${makeQuery_1.default({
                    _key: Env_1.default.get('AMEMBER_KEY'),
                    pass: password,
                }).string()}`);
            }
            catch (e) {
                return response.internalServerError();
            }
            if (!axiosResponse)
                return response.internalServerError();
            return 'Password has changed';
        });
        return result;
    }
}
exports.default = AuthController;
//# sourceMappingURL=AuthController.js.map