"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Subject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Subject"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const axios_1 = __importDefault(require("axios"));
if (ffmpeg_1.default) {
    ffmpeg_1.default.path;
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
}
class SubjectsController {
    _infiniteLoad(query) {
        query
            .select('id', 'title')
            .orderBy('position', 'asc')
            .preload('childs', (query) => {
            this._infiniteLoad(query);
        });
    }
    async _create({ params, request }, inParent = false) {
        const { title, body, video, pdf, audio } = await request.validate({
            schema: Validator_1.schema.create({
                title: Validator_1.schema.string(),
                body: Validator_1.schema.string.optional(),
                audio: Validator_1.schema.file.optional({
                    size: '100mb',
                    extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
                }),
                video: Validator_1.schema.file.optional({
                    size: '3000mb',
                    extnames: [
                        'mp4',
                        'mkv',
                        'webm',
                        'flv',
                        'vob',
                        'ogv',
                        'ogg',
                        'drc',
                        'gif',
                        'gifv',
                        'mng',
                        'avi',
                        'MTS',
                        'M2TS',
                        'TS',
                        'mov',
                        'qt',
                        'wmv',
                        'yuv',
                        'rm',
                        'rmvb',
                        'viv',
                        'asf',
                        'amv',
                        'm4p',
                        'm4v',
                        'mpg',
                        'mp2',
                        'mpeg',
                        'mpe',
                        'mpv',
                        'svi',
                        '3gp',
                        '3g2',
                        'mxf',
                        'roq',
                        'nsv',
                        'f4v',
                        'f4p',
                        'f4a',
                        'f4b',
                    ],
                }),
                pdf: Validator_1.schema.file.optional({
                    size: '10mb',
                    extnames: ['pdf'],
                }),
            }),
        });
        let id = Helpers_1.cuid();
        var output720 = `${__dirname}/path/to/${id}-720`;
        var output480 = `${__dirname}/path/to/${id}-480`;
        var output360 = `${__dirname}/path/to/${id}-360`;
        let q720 = `${id}-720.${video?.extname}`;
        let q480 = `${id}-480.${video?.extname}`;
        let q360 = `${id}-360.${video?.extname}`;
        let filename720 = `${output720}.${video?.extname}`;
        let filename480 = `${output480}.${video?.extname}`;
        let filename360 = `${output360}.${video?.extname}`;
        if (video) {
            await new Promise((resolve) => {
                fluent_ffmpeg_1.default(video.tmpPath)
                    .output(`${output720}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('720x?')
                    .output(`${output480}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('480x?')
                    .output(`${output360}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('360x?')
                    .on('end', function () {
                    resolve('Finished processing');
                })
                    .run();
            });
        }
        const result = await Database_1.default.transaction(async (trx) => {
            const filename = `${id}.${video?.extname}`;
            const pdfFilename = `${Helpers_1.cuid()}.${pdf?.extname}`;
            const audioFilename = `${Helpers_1.cuid()}.${audio?.extname}`;
            const subject = new Subject_1.default();
            subject.title = title;
            if (body) {
                subject.body = body;
            }
            if (video) {
                subject.video = filename;
            }
            if (audio) {
                subject.audio = audioFilename;
            }
            if (pdf) {
                subject.pdf = pdfFilename;
            }
            if (inParent) {
                const parent = await Subject_1.default.findByOrFail('id', params.id);
                subject.parentId = params.id;
                subject.courseId = parent.courseId;
            }
            else {
                subject.courseId = params.id;
            }
            await subject.useTransaction(trx).save();
            if (video) {
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: filename,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(video.tmpPath),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q720,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename720),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q480,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename480),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q360,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename360),
                }));
                fs_1.default.readdir(`${__dirname}/path/to/`, (error, filesInDirectory) => {
                    if (error)
                        throw error;
                    for (let file of filesInDirectory) {
                        fs_1.default.unlinkSync(`${__dirname}/path/to/` + file);
                    }
                });
            }
            if (audio) {
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: audioFilename,
                    Bucket: 'audio-course',
                    Body: fs_1.default.createReadStream(audio.tmpPath),
                }));
            }
            if (pdf) {
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: pdfFilename,
                    Bucket: 'pdf-course',
                    Body: fs_1.default.createReadStream(pdf.tmpPath),
                }));
            }
            return subject.toJSON();
        });
        return result;
    }
    async createInParent(ctx) {
        return await this._create(ctx, true);
    }
    async createWithoutParent(ctx) {
        return await this._create(ctx, false);
    }
    async edit({ params, request }) {
        const subject = await Subject_1.default.findByOrFail('id', params.id);
        const { title, body, video, audio, pdf } = await request.validate({
            schema: Validator_1.schema.create({
                title: Validator_1.schema.string(),
                body: Validator_1.schema.string.optional(),
                audio: Validator_1.schema.file.optional({
                    size: '100mb',
                    extnames: ['mp3', 'ogg', 'wav', 'flac', 'aac'],
                }),
                pdf: Validator_1.schema.file.optional({
                    size: '10mb',
                    extnames: ['pdf'],
                }),
                video: Validator_1.schema.file.optional({
                    size: '3000mb',
                    extnames: [
                        'mp4',
                        'mkv',
                        'webm',
                        'flv',
                        'vob',
                        'ogv',
                        'ogg',
                        'drc',
                        'gif',
                        'gifv',
                        'mng',
                        'avi',
                        'MTS',
                        'M2TS',
                        'TS',
                        'mov',
                        'qt',
                        'wmv',
                        'yuv',
                        'rm',
                        'rmvb',
                        'viv',
                        'asf',
                        'amv',
                        'm4p',
                        'm4v',
                        'mpg',
                        'mp2',
                        'mpeg',
                        'mpe',
                        'mpv',
                        'svi',
                        '3gp',
                        '3g2',
                        'mxf',
                        'roq',
                        'nsv',
                        'f4v',
                        'f4p',
                        'f4a',
                        'f4b',
                    ],
                }),
            }),
        });
        let id = Helpers_1.cuid();
        var output720 = `${__dirname}/path/to/${id}-720`;
        var output480 = `${__dirname}/path/to/${id}-480`;
        var output360 = `${__dirname}/path/to/${id}-360`;
        let q720 = `${id}-720.${video?.extname}`;
        let q480 = `${id}-480.${video?.extname}`;
        let q360 = `${id}-360.${video?.extname}`;
        let filename720 = `${output720}.${video?.extname}`;
        let filename480 = `${output480}.${video?.extname}`;
        let filename360 = `${output360}.${video?.extname}`;
        if (video) {
            await new Promise((resolve) => {
                fluent_ffmpeg_1.default(video.tmpPath)
                    .output(`${output720}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('720x?')
                    .output(`${output480}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('480x?')
                    .output(`${output360}.${video.extname}`)
                    .videoCodec('libx264')
                    .size('360x?')
                    .on('end', function () {
                    resolve('Finished processing');
                })
                    .run();
            });
        }
        const result = await Database_1.default.transaction(async (trx) => {
            let deleteOld = null;
            let deleteOldAudio = null;
            let deleteOldPdf = null;
            const filename = `${id}.${video?.extname}`;
            const audioFileName = `${Helpers_1.cuid()}.${audio?.extname}`;
            const pdfFileName = `${Helpers_1.cuid()}.${pdf?.extname}`;
            subject.title = title;
            subject.body = body || '';
            if (video) {
                if (subject.video) {
                    deleteOld = subject.video;
                }
                subject.video = filename;
            }
            if (audio) {
                if (subject.audio) {
                    deleteOldAudio = subject.audio;
                }
                subject.audio = audioFileName;
            }
            if (pdf) {
                if (subject.pdf) {
                    deleteOldPdf = subject.pdf;
                }
                subject.pdf = pdfFileName;
            }
            await subject.useTransaction(trx).save();
            if (video) {
                if (deleteOld) {
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'video-online-course' }));
                    let replace = subject.video.replace('.mp4', '');
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: `${replace}-720.mp4`, Bucket: 'video-online-course' }));
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: `${replace}-480.mp4`, Bucket: 'video-online-course' }));
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: `${replace}-360.mp4`, Bucket: 'video-online-course' }));
                }
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: filename,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(video.tmpPath),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q720,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename720),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q480,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename480),
                }));
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: q360,
                    Bucket: 'video-online-course',
                    Body: fs_1.default.createReadStream(filename360),
                }));
                fs_1.default.readdir(`${__dirname}/path/to/`, (error, filesInDirectory) => {
                    if (error)
                        throw error;
                    for (let file of filesInDirectory) {
                        fs_1.default.unlinkSync(`${__dirname}/path/to/` + file);
                    }
                });
            }
            if (audio) {
                if (deleteOldAudio) {
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOldAudio, Bucket: 'audio-course' }));
                }
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: audioFileName,
                    Bucket: 'audio-course',
                    Body: fs_1.default.createReadStream(audio.tmpPath),
                }));
            }
            if (pdf) {
                if (deleteOldPdf) {
                    await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOldPdf, Bucket: 'pdf-course' }));
                }
                await s3_1.default.send(new client_s3_1.PutObjectCommand({
                    Key: pdfFileName,
                    Bucket: 'pdf-course',
                    Body: fs_1.default.createReadStream(pdf.tmpPath),
                }));
            }
            return subject.toJSON();
        });
        return result;
    }
    async read({ params, auth }) {
        const subjectQuery = Subject_1.default.query()
            .select('subjects.*', Database_1.default.raw(`CASE WHEN boosts.id IS NULL THEN FALSE ELSE TRUE END as is_boosted`))
            .where('subjects.id', params.id)
            .preload('childs', (query) => {
            this._infiniteLoad(query);
        })
            .preload('course', (query) => {
            query.select('id', 'title', 'cover');
        })
            .leftOuterJoin('boosts', (query) => {
            query
                .on('boosts.subject_id', '=', 'subjects.id')
                .andOnVal('boosts.user_id', auth.use('userApi').user?.id);
        })
            .withCount('comments')
            .orderBy('created_at', 'asc');
        let subject = await subjectQuery.firstOrFail();
        if (auth.use('userApi').isLoggedIn) {
            subject = await subjectQuery
                .andWhereHas('course', (query) => {
                query.whereHas('users', (query) => {
                    query.where('users.id', auth.use('userApi').user?.id);
                });
            })
                .select(Database_1.default.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_member`))
                .leftOuterJoin('member_course', (query) => {
                query
                    .on('member_course.course_id', '=', 'subjects.course_id')
                    .andOnVal('member_course.user_id', auth.use('userApi').user?.id);
            })
                .firstOrFail();
        }
        let video = '';
        let video2 = '';
        let video3 = '';
        let video4 = '';
        if (subject.video) {
            let replace = subject.video.replace('.mp4', '');
            video = await s3_request_presigner_1.getSignedUrl(s3_1.default, new client_s3_1.GetObjectCommand({ Key: `${replace}.mp4`, Bucket: 'video-online-course' }), { expiresIn: 21600 });
            video2 = await s3_request_presigner_1.getSignedUrl(s3_1.default, new client_s3_1.GetObjectCommand({
                Key: `${replace}-720.mp4`,
                Bucket: 'video-online-course',
            }), { expiresIn: 21600 });
            await new Promise((resolve) => {
                axios_1.default.get(video2, { timeout: 3000 }).catch((err) => {
                    if (err.response.status === 404) {
                        video2 = '';
                        resolve({
                            message: 'file not found',
                        });
                    }
                });
                setTimeout(() => {
                    resolve({
                        message: 'file exist',
                    });
                }, 3000);
            });
            video3 = await s3_request_presigner_1.getSignedUrl(s3_1.default, new client_s3_1.GetObjectCommand({
                Key: `${replace}-480.mp4`,
                Bucket: 'video-online-course',
            }), { expiresIn: 21600 });
            await new Promise((resolve) => {
                axios_1.default.get(video3, { timeout: 3000 }).catch((err) => {
                    if (err.response.status === 404) {
                        video3 = '';
                        resolve({
                            message: 'file not found',
                        });
                    }
                });
                setTimeout(() => {
                    resolve({
                        message: 'file exist',
                    });
                }, 3000);
            });
            video4 = await s3_request_presigner_1.getSignedUrl(s3_1.default, new client_s3_1.GetObjectCommand({
                Key: `${replace}-360.mp4`,
                Bucket: 'video-online-course',
            }), { expiresIn: 21600 });
            await new Promise((resolve) => {
                axios_1.default.get(video4, { timeout: 3000 }).catch((err) => {
                    if (err.response.status === 404) {
                        video4 = '';
                        resolve({
                            message: 'file not found',
                        });
                    }
                });
                setTimeout(() => {
                    resolve({
                        message: 'file exist',
                    });
                }, 3000);
            });
        }
        return {
            ...subject.toJSON(),
            video: subject.video ? video : null,
            video720: subject.video ? video2 : null,
            video480: subject.video ? video3 : null,
            video360: subject.video ? video4 : null,
            comments_count: subject.$extras.comments_count,
            is_boosted: subject.$extras.is_boosted,
            is_member: subject.$extras.is_member,
        };
    }
    async delete({ params }) {
        const subject = await Subject_1.default.findByOrFail('id', params.id);
        await subject.delete();
        return subject.toJSON();
    }
    async arrange({ request }) {
        const { positions } = await request.validate({
            schema: Validator_1.schema.create({
                positions: Validator_1.schema.array().members(Validator_1.schema.object().members({
                    id: Validator_1.schema.number(),
                    position: Validator_1.schema.number(),
                })),
            }),
        });
        await Subject_1.default.updateOrCreateMany('id', positions);
        return positions;
    }
}
exports.default = SubjectsController;
//# sourceMappingURL=SubjectsController.js.map