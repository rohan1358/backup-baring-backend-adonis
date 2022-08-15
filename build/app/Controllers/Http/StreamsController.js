"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const Bab_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bab"));
const stream_1 = require("stream");
const sharp_1 = __importDefault(require("sharp"));
const Content_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Content"));
const Course_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Course"));
const Product_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Product"));
const Subject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Subject"));
const Partner_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Partner"));
const fs_1 = __importDefault(require("fs"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Category_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Category"));
class StreamsController {
    async streamCover({ params, response }) {
        const content = await Content_1.default.findByOrFail('cover', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'covers-01', Key: content.cover }));
        const stream = new stream_1.PassThrough();
        const transform = sharp_1.default()
            .resize(300, 300, {
            fit: 'contain',
        })
            .webp();
        file.Body.pipe(transform).pipe(stream);
        return response.stream(stream);
    }
    async streamIcon({ params, response }) {
        const category = await Category_1.default.findByOrFail('icon', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'icons-01', Key: category.icon }));
        const stream = new stream_1.PassThrough();
        const transform = sharp_1.default()
            .resize(64, 64, {
            fit: 'contain',
        })
            .webp();
        file.Body.pipe(transform).pipe(stream);
        return response.stream(stream);
    }
    async partnerLogo({ params, response }) {
        const partner = await Partner_1.default.findOrFail(params.id);
        const stream = new stream_1.PassThrough();
        if (partner.logo) {
            const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'logo-01', Key: partner.logo }));
            file.Body.pipe(stream);
        }
        else {
            const file = fs_1.default.createReadStream(Application_1.default.makePath('public', 'base-logo.png'));
            file.pipe(stream);
        }
        return response.stream(stream);
    }
    async streamCourseCover({ params, response }) {
        const course = await Course_1.default.findByOrFail('cover', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'online-course-covers', Key: course.cover }));
        const stream = new stream_1.PassThrough();
        const transform = sharp_1.default()
            .resize(300, 300, {
            fit: 'contain',
        })
            .webp();
        file.Body.pipe(transform).pipe(stream);
        return response.stream(stream);
    }
    async streamCoursePDF({ params, response }) {
        const course = await Course_1.default.findByOrFail('pdf', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'pdf-course', Key: course.pdf }));
        return response.stream(file.Body);
    }
    async streamSubjectPDF({ request, params, response }) {
        if (!request.hasValidSignature()) {
            return response.methodNotAllowed();
        }
        const subject = await Subject_1.default.findByOrFail('pdf', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'pdf-course', Key: subject.pdf }));
        return response.stream(file.Body);
    }
    async streamUserAvatar({ params, response }) {
        const user = await User_1.default.findByOrFail('avatar', params.filename);
        const stream = new stream_1.PassThrough();
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'user-avatar', Key: user.avatar }));
        const transform = sharp_1.default()
            .resize(300, 300, {
            fit: 'contain',
        })
            .webp();
        file.Body.pipe(transform).pipe(stream);
        return response.stream(stream);
    }
    async streamProductCover({ params, response }) {
        const product = await Product_1.default.findByOrFail('cover', params.filename);
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Bucket: 'product-images', Key: product.cover }));
        const stream = new stream_1.PassThrough();
        const transform = sharp_1.default()
            .resize(300, 300, {
            fit: 'contain',
        })
            .webp();
        file.Body.pipe(transform).pipe(stream);
        return response.stream(stream);
    }
    async streamSynopsis({ response, request, params }) {
        const { audio } = await Content_1.default.findByOrFail('audio', params.filename);
        const range = request.header('range');
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Key: audio, Bucket: 'plot-audio-01', Range: range }));
        response.status(206);
        response.header('Content-Range', file.ContentRange);
        response.header('Accept-Ranges', 'bytes');
        response.header('Content-Length', file.ContentLength);
        response.header('Content-Type', file.ContentType);
        response.stream(file.Body);
    }
    async streamBab({ response, request, params }) {
        if (!request.hasValidSignature()) {
            return response.methodNotAllowed();
        }
        const { audio } = await Bab_1.default.findByOrFail('audio', params.filename);
        const range = request.header('range');
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Key: audio, Bucket: 'ring-audio-01', Range: range }));
        response.status(206);
        response.header('Cache-Control', 'no-store');
        response.header('Content-Range', file.ContentRange);
        response.header('Accept-Ranges', 'bytes');
        response.header('Content-Length', file.ContentLength);
        response.header('Content-Type', file.ContentType);
        response.stream(file.Body);
    }
    async streamSubjectAudio({ response, request, params }) {
        if (!request.hasValidSignature()) {
            return response.methodNotAllowed();
        }
        const { audio } = await Subject_1.default.findByOrFail('audio', params.filename);
        const range = request.header('range');
        const file = await s3_1.default.send(new client_s3_1.GetObjectCommand({ Key: audio, Bucket: 'audio-course', Range: range }));
        response.status(206);
        response.header('Cache-Control', 'no-store');
        response.header('Content-Range', file.ContentRange);
        response.header('Accept-Ranges', 'bytes');
        response.header('Content-Length', file.ContentLength);
        response.header('Content-Type', file.ContentType);
        response.stream(file.Body);
    }
}
exports.default = StreamsController;
//# sourceMappingURL=StreamsController.js.map