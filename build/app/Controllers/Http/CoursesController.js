"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const Course_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Course"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const makeQuery_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/makeQuery"));
const luxon_1 = require("luxon");
class CoursesController {
    _infiniteLoad(query, first = false) {
        query
            .select('id', 'title', 'position')
            .orderBy('position', 'asc')
            .preload('childs', (query) => {
            this._infiniteLoad(query);
        });
        if (first) {
            query.whereDoesntHave('parent');
        }
    }
    async index({ request, auth }) {
        const { page, limit = 20 } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
                limit: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const offset = (page ? page - 1 : 0) * limit;
        const total = await Course_1.default.query().count('* as total');
        const courses = await Course_1.default.query()
            .select('courses.*', Database_1.default.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_access`))
            .preload('users', (query) => {
            query.wherePivot('mentor', true);
        })
            .leftJoin('member_course', (query) => {
            query
                .on('courses.id', '=', 'member_course.course_id')
                .andOnVal('member_course.user_id', auth.use('userApi').user?.id);
        })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: courses.map((course) => course.serialize()),
        };
    }
    async list({ request, auth }) {
        const { page } = await Validator_1.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const limit = 12;
        const offset = (page ? page - 1 : 0) * limit;
        const total = await Course_1.default.query()
            .whereHas('users', (query) => {
            query.where('users.id', auth.use('userApi').user?.id);
        })
            .count('* as total');
        const courses = await Course_1.default.query()
            .preload('users', (query) => {
            query.wherePivot('mentor', true);
        })
            .whereHas('users', (query) => {
            query.where('users.id', auth.use('userApi').user?.id);
        })
            .limit(limit)
            .offset(offset);
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: courses.map((course) => course.serialize()),
        };
    }
    async read({ params, auth }) {
        const courseQuery = Course_1.default.query()
            .where('courses.id', params.id)
            .preload('users', (query) => {
            query.wherePivot('mentor', true);
        })
            .preload('subjects', (query) => {
            this._infiniteLoad(query, true);
        });
        let course = await courseQuery.firstOrFail();
        if (auth.use('userApi').isLoggedIn) {
            course = await courseQuery
                .select('courses.*', Database_1.default.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_member`), Database_1.default.raw(`CASE WHEN member_course.mentor = TRUE THEN TRUE ELSE FALSE END as is_mentor`), Database_1.default.raw(`CASE WHEN reviews.id IS NULL THEN FALSE ELSE TRUE END as is_reviewed`))
                .leftOuterJoin('member_course', (query) => {
                query
                    .on('member_course.course_id', '=', 'courses.id')
                    .andOnVal('member_course.user_id', auth.use('userApi').user?.id);
            })
                .leftOuterJoin('reviews', (query) => {
                query
                    .on('reviews.course_id', '=', 'courses.id')
                    .andOnVal('reviews.user_id', auth.use('userApi').user?.id);
            })
                .firstOrFail();
        }
        return {
            ...course.toJSON(),
            is_member: course.$extras.is_member,
            is_mentor: course.$extras.is_mentor,
            is_reviewed: course.$extras.is_reviewed,
        };
    }
    async changeCover({ request, params }) {
        const { cover } = await request.validate({
            schema: Validator_1.schema.create({
                cover: Validator_1.schema.file({ size: '10mb', extnames: ['jpg', 'png', 'jpeg'] }),
            }),
        });
        const result = Database_1.default.transaction(async (trx) => {
            let deleteOld = null;
            const course = await Course_1.default.findByOrFail('id', params.id);
            if (course.cover) {
                deleteOld = course.cover;
            }
            const filename = `${Helpers_1.cuid()}.${cover.extname}`;
            course.cover = filename;
            await course.useTransaction(trx).save();
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: filename,
                Bucket: 'online-course-covers',
                Body: fs_1.default.createReadStream(cover.tmpPath),
            }));
            if (deleteOld) {
                await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'online-course-covers' }));
            }
            return course.toJSON();
        });
        return result;
    }
    async changePDF({ request, params }) {
        const { pdf } = await request.validate({
            schema: Validator_1.schema.create({
                pdf: Validator_1.schema.file({ size: '10mb', extnames: ['pdf'] }),
            }),
        });
        const result = Database_1.default.transaction(async (trx) => {
            let deleteOld = null;
            const course = await Course_1.default.findByOrFail('id', params.id);
            if (course.pdf) {
                deleteOld = course.pdf;
            }
            const filename = `${Helpers_1.cuid()}.${pdf.extname}`;
            course.pdf = filename;
            await course.useTransaction(trx).save();
            await s3_1.default.send(new client_s3_1.PutObjectCommand({
                Key: filename,
                Bucket: 'pdf-course',
                Body: fs_1.default.createReadStream(pdf.tmpPath),
            }));
            if (deleteOld) {
                await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: deleteOld, Bucket: 'pdf-course' }));
            }
            return course.toJSON();
        });
        return result;
    }
    async addMentor({ request, params }) {
        const course = await Course_1.default.findByOrFail('id', params.id);
        const { mentor: mentorId } = await request.validate({
            schema: Validator_1.schema.create({
                mentor: Validator_1.schema.number(),
            }),
        });
        const user = await User_1.default.findByOrFail('id', mentorId);
        const mentor = await course.related('users').pivotQuery().where('user_id', user.id).first();
        if (mentor) {
            await Database_1.default.rawQuery('UPDATE member_course SET mentor=TRUE WHERE course_id=:course AND user_id=:user', {
                course: course.id,
                user: user.id,
            });
        }
        else {
            await course.related('users').attach({
                [user.id]: {
                    mentor: true,
                },
            });
        }
        return course.toJSON();
    }
    async deleteMentor({ params }) {
        const course = await Course_1.default.findByOrFail('id', params.id);
        const user = await User_1.default.findByOrFail('id', params.userId);
        const mentor = await user
            .related('courses')
            .pivotQuery()
            .where('mentor', true)
            .andWhere('course_id', course.id)
            .firstOrFail();
        if (mentor) {
            await course.related('users').detach([user.id]);
        }
        return course.toJSON();
    }
    async delete({ params }) {
        const course = await Course_1.default.findOrFail(params.id);
        await course.delete();
        return course.serialize();
    }
    async join({ params, response, auth }) {
        const course = await Course_1.default.findOrFail(params.id);
        if (course.price)
            return response.methodNotAllowed();
        const result = await Database_1.default.transaction(async (t) => {
            await auth.use('userApi').user.useTransaction(t).related('courses').attach([course.id]);
            const addAccess = await axios_1.default.post(`${Env_1.default.get('AMEMBER_URL')}/api/access`, makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                user_id: auth.use('userApi').user?.amemberId,
                product_id: course.amemberId,
                begin_date: luxon_1.DateTime.now().toFormat('yyyy-LL-dd'),
                expire_date: '2037-12-31',
            }).string());
            if (addAccess.data.error) {
                throw new Error();
            }
            return course.serialize();
        });
        return result;
    }
}
exports.default = CoursesController;
//# sourceMappingURL=CoursesController.js.map