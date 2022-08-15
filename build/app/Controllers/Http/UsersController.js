"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const fs_1 = __importDefault(require("fs"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const axios_1 = __importDefault(require("axios"));
const makeQuery_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/makeQuery"));
class UsersController {
    async _amemberUpdate(amemberId, payload) {
        return new Promise((resolve) => {
            axios_1.default
                .put(`${Env_1.default.get('AMEMBER_URL')}/api/users/${amemberId}`, makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                ...payload,
            }).string())
                .then((response) => {
                if (response.data.error) {
                    resolve(false);
                    return;
                }
                resolve(true);
            })
                .catch((e) => {
                console.log(e.response?.data);
                resolve(false);
            });
        });
    }
    async index({ request, auth }) {
        const q = request.input('q', '');
        const mentor = request.input('mentor', '');
        let users = User_1.default.query()
            .preload('partner')
            .where((query) => {
            query.where('fullname', 'iLike', `%${q}%`).orWhere('username', 'iLike', `%${q}%`);
        })
            .limit(15);
        if (mentor && auth.use('adminApi').isLoggedIn) {
            users = users.andWhere('is_mentor', true);
        }
        const usersJson = (await users).map((user) => user.serialize());
        return usersJson;
    }
    async read({ params }) {
        const user = await User_1.default.findOrFail(params.id);
        return user.serialize();
    }
    async editProfile({ request, auth }) {
        const { fullname, avatar } = await request.validate({
            schema: Validator_1.schema.create({
                fullname: Validator_1.schema.string(),
                avatar: Validator_1.schema.file.optional({
                    size: '10mb',
                    extnames: ['jpg', 'jpeg', 'png'],
                }),
            }),
        });
        const result = await Database_1.default.transaction(async (t) => {
            const fileName = `${Helpers_1.cuid()}.${avatar?.extname}`;
            let deleteOld = false;
            const lastName = fullname.split(' ');
            const firstName = lastName[0];
            lastName.shift();
            const user = auth.use('userApi').user;
            user.fullname = fullname;
            if (avatar) {
                if (user.avatar) {
                    deleteOld = user.avatar;
                }
                user.avatar = fileName;
            }
            await user.useTransaction(t).save();
            if (!(await this._amemberUpdate(user.amemberId, {
                name_f: firstName,
                name_l: lastName.join(' '),
            }))) {
                throw new Error();
            }
            if (avatar) {
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: fileName,
                    Bucket: 'user-avatar',
                    Body: fs_1.default.createReadStream(avatar.tmpPath),
                }));
                if (deleteOld) {
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'user-avatar' }));
                }
            }
            return user;
        });
        return result.serialize();
    }
    async setFcm({ auth, request }) {
        const { token } = await request.validate({
            schema: Validator_1.schema.create({
                token: Validator_1.schema.string(),
            }),
        });
        const user = auth.use('userApi').user;
        user.fcmToken = token;
        await user.save();
        return user.serialize();
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map