"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Admin_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Admin"));
const Partner_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Partner"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
class PartnersController {
    async index({ request }) {
        const { page } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const limit = 10;
        const offset = (page ? page - 1 : 0) * limit;
        const total = await Partner_1.default.query().count('* as total');
        const partners = await Partner_1.default.query()
            .preload('admins', (query) => {
            query.select('username');
        })
            .limit(limit)
            .offset(offset);
        const json = partners.map((partner) => partner.serialize());
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: json,
        };
    }
    async edit({ request, params, response }) {
        const partner = await Partner_1.default.query().has('admins').where('id', params.id).first();
        if (!partner)
            return response.notFound();
        const { name, amemberGroup, username, password } = await request.validate({
            schema: Validator_1.schema.create({
                name: Validator_1.schema.string(),
                amemberGroup: Validator_1.schema.number(),
                username: Validator_1.schema.string(),
                password: Validator_1.schema.string.optional(),
            }),
        });
        const result = await Database_1.default.transaction(async (trx) => {
            partner.name = name;
            partner.amemberGroup = amemberGroup;
            await partner.useTransaction(trx).save();
            const admin = (await Admin_1.default.findBy('partner_id', params.id));
            admin.fullname = name;
            admin.username = username;
            if (password) {
                admin.password = await Hash_1.default.make(password);
            }
            await admin.useTransaction(trx).save();
            return {
                ...partner.toJSON(),
                admin: admin.toJSON(),
            };
        });
        return result;
    }
    async create({ request }) {
        const { name, amemberGroup, username, password } = await request.validate({
            schema: Validator_1.schema.create({
                name: Validator_1.schema.string(),
                amemberGroup: Validator_1.schema.number(),
                username: Validator_1.schema.string(),
                password: Validator_1.schema.string(),
            }),
        });
        const result = await Database_1.default.transaction(async (trx) => {
            const partner = new Partner_1.default();
            partner.name = name;
            partner.amemberGroup = amemberGroup;
            await partner.useTransaction(trx).save();
            const json = partner.toJSON();
            const admin = new Admin_1.default();
            admin.fullname = json.name;
            admin.username = username;
            admin.password = await Hash_1.default.make(password);
            admin.partnerId = json.id;
            await admin.useTransaction(trx).save();
            return {
                ...json,
                admin: admin.toJSON(),
            };
        });
        return result;
    }
    async delete({ params }) {
        const partner = await Partner_1.default.findByOrFail('id', params.id);
        await partner.delete();
        return partner.toJSON();
    }
    async changeLogo({ request, params }) {
        const { logo } = await request.validate({
            schema: Validator_1.schema.create({
                logo: Validator_1.schema.file({
                    size: '10mb',
                    extnames: ['jpg', 'jpeg', 'png'],
                }),
            }),
        });
        const partner = await Partner_1.default.findOrFail(params.id);
        const result = await Database_1.default.transaction(async (t) => {
            let deleteOld = partner.logo || false;
            const fileName = `${Helpers_1.cuid()}.${logo.extname}`;
            partner.logo = fileName;
            await partner.useTransaction(t).save();
            if (deleteOld) {
                await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'logo-01' }));
            }
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: fileName,
                Bucket: 'logo-01',
                Body: fs_1.default.createReadStream(logo.tmpPath),
            }));
            return partner.serialize();
        });
        return result;
    }
}
exports.default = PartnersController;
//# sourceMappingURL=PartnersController.js.map