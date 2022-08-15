"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const fs_1 = __importDefault(require("fs"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const cuid_1 = __importDefault(require("cuid"));
const Category_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Category"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
class CategoriesController {
    async index() {
        const categories = await Category_1.default.query().withCount('contents');
        return categories;
    }
    async addIcon({ params, request }) {
        const category = await Category_1.default.findOrFail(params.id);
        const { icon } = await request.validate({
            schema: Validator_1.schema.create({
                icon: Validator_1.schema.file({
                    size: '5mb',
                    extnames: ['jpg', 'jpeg', 'png'],
                }),
            }),
        });
        const result = await Database_1.default.transaction(async (t) => {
            const fileName = `${cuid_1.default()}.${icon.extname}`;
            category.icon = fileName;
            await category.useTransaction(t).save();
            const S3Command = new client_s3_1.PutObjectCommand({
                Bucket: 'icons-01',
                Key: fileName,
                Body: fs_1.default.createReadStream(icon.tmpPath),
            });
            await s3_1.default.send(S3Command);
            return category.serialize();
        });
        return result;
    }
    async contentGroupByCategory({ auth }) {
        const config = JSON.parse(fs_1.default.readFileSync(Application_1.default.makePath('app/Services/config.json')));
        let categories = Category_1.default.query()
            .withCount('contents')
            .has('contents')
            .orderBy('contents_count', 'desc')
            .limit(4);
        if (config.stickyCategory && config.stickyCategory.length) {
            categories = Category_1.default.query().whereIn('id', config.stickyCategory);
        }
        let response = [];
        for (let category of await categories) {
            await category.load('contents', (query) => {
                query
                    .select('contents.id', 'contents.title', 'contents.cover', 'contents.created_at', Database_1.default.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as is_liked`))
                    .withCount('babs')
                    .preload('authors', (query) => {
                    query.select('id', 'name');
                })
                    .leftJoin('likes', (query) => {
                    query
                        .on('likes.content_id', '=', 'contents.id')
                        .andOnVal('likes.user_id', auth.use('userApi').user?.id || 0);
                })
                    .orderBy('created_at', 'desc')
                    .limit(6);
            });
            response.push(category.serialize());
        }
        return response;
    }
    async read({ params }) {
        const category = await Category_1.default.findOrFail(params.id);
        return category.serialize();
    }
}
exports.default = CategoriesController;
//# sourceMappingURL=CategoriesController.js.map