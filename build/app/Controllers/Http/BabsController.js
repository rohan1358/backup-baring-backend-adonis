"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const Bab_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bab"));
const ReadLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ReadLog"));
const cuid_1 = __importDefault(require("cuid"));
const fs_1 = __importDefault(require("fs"));
class BabsController {
    async get({ params }) {
        const bab = await Bab_1.default.findByOrFail('id', params.id);
        const content = await bab.related('content').query().select('id', 'title', 'cover').first();
        return {
            ...bab.toJSON(),
            content: content?.toJSON(),
        };
    }
    async edit({ params, request, response }) {
        const bab = await Bab_1.default.findByOrFail('id', params.id);
        const content = await bab.related('content').query().select('id', 'title', 'cover').first();
        let payload;
        try {
            payload = await request.validate({
                schema: Validator_1.schema.create({
                    title: Validator_1.schema.string.optional(),
                    body: Validator_1.schema.string.optional(),
                }),
            });
        }
        catch (e) {
            return response.badRequest(e.messages);
        }
        const { title, body } = payload;
        const audio = request.file('audio', {
            size: '100mb',
            extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
        });
        if (title) {
            bab.title = title;
        }
        if (body) {
            bab.body = body;
        }
        if (audio) {
            const fileName = `${cuid_1.default()}.${audio.extname}`;
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: bab.audio, Bucket: 'ring-audio-01' }));
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: fileName,
                Bucket: 'ring-audio-01',
                Body: fs_1.default.createReadStream(audio.tmpPath),
            }));
            bab.audio = `${fileName}`;
        }
        await bab.save();
        return {
            ...bab.toJSON(),
            content: content?.toJSON(),
        };
    }
    async read({ params, response, auth }) {
        if (auth.use('userApi').isLoggedIn) {
            const user = auth.use('userApi').user;
            if (!user.subscriptionEnd) {
                return response.methodNotAllowed();
            }
            else if (user.subscriptionEnd.toJSDate() < new Date()) {
                return response.methodNotAllowed();
            }
        }
        const bab = await Bab_1.default.query()
            .preload('content', (query) => {
            query.select('id', 'title', 'cover').preload('babs', (query) => {
                query.select('id', 'title', 'audio').orderBy('created_at', 'asc');
            });
        })
            .where('id', params.id)
            .first();
        if (!bab) {
            return response.notFound();
        }
        const readLog = new ReadLog_1.default();
        readLog.babId = bab.id;
        readLog.userId = auth.use('userApi').user?.id;
        await readLog.save();
        const babJSON = bab.serialize();
        return babJSON;
    }
    async delete({ params }) {
        const bab = await Bab_1.default.findByOrFail('id', params.id);
        await bab.delete();
        return bab.toJSON();
    }
}
exports.default = BabsController;
//# sourceMappingURL=BabsController.js.map