"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Product_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Product"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
class ProductsController {
    async index({ request }) {
        const { page, limit = 20 } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
                limit: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const offset = (page ? page - 1 : 0) * limit;
        const total = await Product_1.default.query().count('* as total');
        const products = await Product_1.default.query().orderBy('created_at', 'desc').limit(limit).offset(offset);
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: products.map((course) => course.serialize()),
        };
    }
    async delete({ params }) {
        const product = await Product_1.default.findOrFail(params.id);
        await product.delete();
        return product.serialize();
    }
    async changeCover({ request, params }) {
        const { cover } = await request.validate({
            schema: Validator_1.schema.create({
                cover: Validator_1.schema.file({ size: '10mb', extnames: ['jpg', 'png', 'jpeg'] }),
            }),
        });
        const result = Database_1.default.transaction(async (trx) => {
            let deleteOld = null;
            const product = await Product_1.default.findByOrFail('id', params.id);
            if (product.cover) {
                deleteOld = product.cover;
            }
            const filename = `${Helpers_1.cuid()}.${cover.extname}`;
            product.cover = filename;
            await product.useTransaction(trx).save();
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: filename,
                Bucket: 'product-images',
                Body: fs_1.default.createReadStream(cover.tmpPath),
            }));
            if (deleteOld) {
                await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'product-images' }));
            }
            return product.toJSON();
        });
        return result;
    }
    async changeWeight({ request, params }) {
        const { weight } = await request.validate({
            schema: Validator_1.schema.create({
                weight: Validator_1.schema.number(),
            }),
        });
        const product = await Product_1.default.findOrFail(params.id);
        product.weight = weight;
        await product.save();
        return product.serialize();
    }
    async read({ params }) {
        const product = await Product_1.default.query().where('id', params.id).firstOrFail();
        return product.serialize();
    }
}
exports.default = ProductsController;
//# sourceMappingURL=ProductsController.js.map