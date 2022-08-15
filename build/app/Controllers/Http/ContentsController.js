"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const Author_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Author"));
const Bab_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bab"));
const Category_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Category"));
const Content_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Content"));
const Like_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Like"));
const cuid_1 = __importDefault(require("cuid"));
const fs_1 = __importDefault(require("fs"));
class ContentsController {
    async addContent({ request, response }) {
        let payload;
        try {
            payload = await request.validate({
                schema: Validator_1.schema.create({
                    title: Validator_1.schema.string(),
                    synopsis: Validator_1.schema.string(),
                    categories: Validator_1.schema.array.optional().members(Validator_1.schema.number()),
                    createCategories: Validator_1.schema.array.optional().members(Validator_1.schema.string()),
                    authors: Validator_1.schema.array.optional().members(Validator_1.schema.number()),
                    createAuthors: Validator_1.schema.array.optional().members(Validator_1.schema.string()),
                }),
            });
        }
        catch (e) {
            return response.badRequest(e.messages);
        }
        const { title, synopsis, categories: categoriesList, createCategories, authors: authorsList, createAuthors, } = payload;
        const cover = request.file('cover', {
            size: '2mb',
            extnames: ['png', 'jpg', 'jpeg', 'bmp'],
        });
        const audio = request.file('audio', {
            size: '100mb',
            extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
        });
        if (!cover) {
            return response.badRequest('Cover invalid');
        }
        const fileName = `${cuid_1.default()}.${cover.extname}`;
        const content = new Content_1.default();
        content.title = title;
        content.synopsis = synopsis;
        content.cover = `${fileName}`;
        if (audio) {
            const audioFileName = `${cuid_1.default()}.${audio.extname}`;
            content.audio = audioFileName;
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Bucket: 'plot-audio-01',
                Key: audioFileName,
                Body: fs_1.default.createReadStream(audio.tmpPath),
            }));
        }
        await content.save();
        const S3Command = new client_s3_1.PutObjectCommand({
            Bucket: 'covers-01',
            Key: fileName,
            Body: fs_1.default.createReadStream(cover.tmpPath),
        });
        await s3_1.default.send(S3Command);
        if (categoriesList?.length) {
            const categories = await Category_1.default.query().whereIn('id', categoriesList);
            const validCategories = [];
            for (let category of categories) {
                validCategories.push(category.id);
            }
            if (validCategories.length)
                await content.related('categories').attach(validCategories);
        }
        if (createCategories?.length) {
            const newCategoriesData = [];
            for (let categoryName of createCategories) {
                newCategoriesData.push({ name: categoryName });
            }
            await content.related('categories').createMany(newCategoriesData);
        }
        if (authorsList?.length) {
            const authors = await Author_1.default.query().whereIn('id', authorsList);
            const validAuthors = [];
            for (let author of authors) {
                validAuthors.push(author.id);
            }
            if (validAuthors.length)
                await content.related('authors').attach(validAuthors);
        }
        if (createAuthors?.length) {
            const AuthorsData = [];
            for (let authorName of createAuthors) {
                AuthorsData.push({ name: authorName });
            }
            await content.related('authors').createMany(AuthorsData);
        }
        return {
            ...content.toJSON(),
            categories: await content.related('categories').query(),
            authors: await content.related('authors').query(),
        };
    }
    async editContent({ request, response, params }) {
        const content = await Content_1.default.findByOrFail('id', params.id);
        let payload;
        try {
            payload = await request.validate({
                schema: Validator_1.schema.create({
                    title: Validator_1.schema.string.optional(),
                    synopsis: Validator_1.schema.string.optional(),
                    categories: Validator_1.schema.array.optional().members(Validator_1.schema.number()),
                    createCategories: Validator_1.schema.array.optional().members(Validator_1.schema.string()),
                    authors: Validator_1.schema.array.optional().members(Validator_1.schema.number()),
                    createAuthors: Validator_1.schema.array.optional().members(Validator_1.schema.string()),
                }),
            });
        }
        catch (e) {
            return response.badRequest(e.messages);
        }
        const { title, synopsis, categories: categoryList, createCategories, authors: authorList, createAuthors, } = payload;
        const cover = request.file('cover', {
            size: '2mb',
            extnames: ['png', 'jpg', 'jpeg', 'bmp'],
        });
        const audio = request.file('audio', {
            size: '100mb',
            extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
        });
        if (title) {
            content.title = title;
        }
        if (synopsis) {
            content.synopsis = synopsis;
        }
        if (cover) {
            const fileName = `${cuid_1.default()}.${cover.extname}`;
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: content.cover, Bucket: 'covers-01' }));
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: fileName,
                Bucket: 'covers-01',
                Body: fs_1.default.createReadStream(cover.tmpPath),
            }));
            content.cover = fileName;
        }
        if (audio) {
            const audioFileName = `${cuid_1.default()}.${audio.extname}`;
            if (content.audio) {
                await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: content.audio, Bucket: 'plot-audio-01' }));
            }
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: audioFileName,
                Bucket: 'plot-audio-01',
                Body: fs_1.default.createReadStream(audio.tmpPath),
            }));
            content.cover = audioFileName;
        }
        await content.save();
        if (categoryList?.length) {
            const categories = await Category_1.default.query().whereIn('id', categoryList);
            const validCategories = [];
            for (let category of categories) {
                validCategories.push(category.id);
            }
            await content.related('categories').sync(validCategories);
        }
        if (createCategories?.length) {
            const newCategoriesData = [];
            for (let categoryName of createCategories) {
                newCategoriesData.push({ name: categoryName });
            }
            await content.related('categories').createMany(newCategoriesData);
        }
        if (authorList?.length) {
            const authors = await Author_1.default.query().whereIn('id', authorList);
            const validAuthors = [];
            for (let author of authors) {
                validAuthors.push(author.id);
            }
            await content.related('authors').sync(validAuthors);
        }
        if (createAuthors?.length) {
            const newAuthorsData = [];
            for (let authorName of createAuthors) {
                newAuthorsData.push({ name: authorName });
            }
            await content.related('authors').createMany(newAuthorsData);
        }
        return {
            ...content.toJSON(),
            categories: await content.related('categories').query(),
            authors: await content.related('authors').query(),
        };
    }
    async index({ request, auth }) {
        const { page, category: categoryId, limit = 20, } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
                category: Validator_1.schema.number.optional(),
                limit: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const offset = (page ? page - 1 : 0) * limit;
        const q = request.input('q', '');
        const liked = request.input('liked', '') ? true : false;
        let category = null;
        if (categoryId) {
            category = await Category_1.default.findOrFail(categoryId);
        }
        let total = Database_1.default.query()
            .from((subquery) => {
            subquery
                .from('contents')
                .select('contents.id', 'contents.title', Database_1.default.from('likes')
                .select(Database_1.default.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as status`))
                .whereColumn('likes.content_id', 'contents.id')
                .andWhere('likes.user_id', auth.use('userApi').user?.id || 0)
                .limit(1)
                .as('is_liked'), Database_1.default.raw(`STRING_AGG(authors.name,';') as authorname`))
                .leftJoin('author_content', (query) => {
                query.on('author_content.content_id', 'contents.id');
            })
                .leftJoin('authors', (query) => {
                query.on('authors.id', 'author_content.author_id');
            })
                .groupBy('contents.id')
                .as('contents');
        })
            .count('* as total');
        let contents = Content_1.default.query()
            .select('contents.id', 'contents.title', 'contents.cover', 'contents.created_at', Database_1.default.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as is_liked`), 'authorname.names')
            .withCount('babs')
            .preload('authors', (query) => {
            query.select('id', 'name');
        })
            .leftJoin('likes', (query) => {
            query
                .on('likes.content_id', '=', 'contents.id')
                .andOnVal('likes.user_id', auth.use('userApi').user?.id || 0);
        })
            .joinRaw(`LEFT JOIN (
        SELECT author_content.content_id,STRING_AGG(authors.name,';') as names FROM author_content LEFT JOIN authors ON authors.id=author_content.author_id GROUP BY author_content.content_id
      ) as authorname ON authorname.content_id=contents.id`)
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit);
        if (liked) {
            total = total.where('contents.is_liked', true);
            contents = contents.whereRaw('CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END = ?', [
                'TRUE',
            ]);
        }
        else {
            total = total
                .where('contents.title', 'iLike', `%${q}%`)
                .orWhere('contents.authorname', 'iLike', `%${q}%`);
            contents = contents
                .where('contents.title', 'iLike', `%${q}%`)
                .orWhere('authorname.names', 'iLike', `%${q}%`);
        }
        if (category) {
            total = total
                .leftJoin('category_content', 'contents.id', '=', 'category_content.content_id')
                .andWhere('category_content.category_id', category.id);
            contents = contents.andWhereHas('categories', (query) => {
                query.where('categories.id', category.id);
            });
        }
        const contentsJson = (await contents).map((content) => content.serialize());
        return {
            total: Math.ceil(Number((await total)[0].total || '0') / limit),
            data: contentsJson,
        };
    }
    async rawContent({ params }) {
        const content = await Content_1.default.findByOrFail('id', params.id);
        const categories = await content.related('categories').query().select('id', 'name');
        const authors = await content.related('authors').query().select('id', 'name');
        return { ...content.toJSON(), categories, authors };
    }
    async fullContent({ params, response, auth }) {
        let contentQuery = Content_1.default.query()
            .where('id', params.id)
            .preload('authors', (query) => {
            query.select('id', 'name');
        })
            .preload('categories', (query) => {
            query.select('id', 'name');
        })
            .preload('babs', (query) => {
            query.select('id', 'title').orderBy('created_at', 'asc');
        });
        contentQuery = contentQuery.select('*', Database_1.default.from('likes')
            .select(Database_1.default.raw(`CASE WHEN likes.id IS NULL THEN FALSE ELSE TRUE END as status`))
            .whereColumn('likes.content_id', 'contents.id')
            .andWhere('likes.user_id', auth.use('userApi').user?.id || 0)
            .limit(1)
            .as('is_liked'));
        const content = await contentQuery.first();
        if (!content) {
            return response.notFound('Content not found');
        }
        const contentJSON = content.serialize();
        return contentJSON;
    }
    async addBab({ params, request, response }) {
        const content = await Content_1.default.findByOrFail('id', params.id);
        let payload;
        try {
            payload = await request.validate({
                schema: Validator_1.schema.create({
                    title: Validator_1.schema.string(),
                    body: Validator_1.schema.string(),
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
        if (!audio) {
            return response.badRequest('Audio invalid');
        }
        const fileName = `${cuid_1.default()}.${audio.extname}`;
        const bab = new Bab_1.default();
        bab.title = title;
        bab.body = body;
        bab.audio = fileName;
        bab.contentId = content.id;
        await bab.save();
        await s3_1.default.send(new client_s3_1.PutObjectCommand({
            Key: fileName,
            Bucket: 'ring-audio-01',
            Body: fs_1.default.createReadStream(audio.tmpPath),
        }));
        return {
            ...bab.toJSON(),
            content: content.toJSON(),
        };
    }
    async delete({ params }) {
        const content = await Content_1.default.findByOrFail('id', params.id);
        await content.delete();
        return content.toJSON();
    }
    async like({ params, auth, response }) {
        const content = await Content_1.default.findByOrFail('id', params.id);
        const status = await content
            .related('likes')
            .query()
            .where('user_id', auth.use('userApi').user?.id)
            .first();
        if (!status) {
            const like = new Like_1.default();
            like.userId = auth.use('userApi').user?.id;
            like.contentId = params.id;
            await like.save();
            return like.toJSON();
        }
        else {
            return response.badRequest();
        }
    }
    async unlike({ params, auth }) {
        const like = await Like_1.default.query()
            .where('content_id', params.id)
            .andWhere('user_id', auth.use('userApi').user?.id)
            .firstOrFail();
        await like.delete();
        return like.toJSON();
    }
}
exports.default = ContentsController;
//# sourceMappingURL=ContentsController.js.map