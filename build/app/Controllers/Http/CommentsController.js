"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Comment_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Comment"));
const Subject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Subject"));
class CommentsController {
    async index({ params, auth }) {
        const subject = await Subject_1.default.query()
            .where('subjects.id', params.id)
            .andWhereHas('course', (query) => {
            query.whereHas('users', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .firstOrFail();
        const comments = await Comment_1.default.query()
            .select('comments.*', 'users.fullname', Database_1.default.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_mentor`))
            .leftOuterJoin('users', (query) => {
            query.on('users.id', '=', 'comments.user_id');
        })
            .where('subject_id', subject.id)
            .whereNull('comments.parent_id')
            .withCount('replies')
            .leftOuterJoin('subjects', (query) => {
            query.on('subjects.id', '=', 'comments.subject_id');
        })
            .leftJoin('courses', (query) => {
            query.on('courses.id', '=', 'subjects.course_id');
        })
            .leftJoin('member_course', (query) => {
            query
                .on('member_course.course_id', '=', 'courses.id')
                .andOn('member_course.user_id', 'users.id')
                .andOnVal('member_course.mentor', true);
        })
            .orderBy('created_at', 'asc');
        return comments.map((comment) => ({
            ...comment.serialize(),
            user: {
                id: comment.userId,
                fullname: comment.$extras.fullname,
            },
            replies_count: comment.$extras.replies_count,
            is_mentor: comment.$extras.is_mentor,
        }));
    }
    async reply({ params, auth, request }) {
        const parent = await Comment_1.default.findByOrFail('id', params.id);
        const subject = await Subject_1.default.query()
            .where('subjects.id', parent.subjectId)
            .andWhereHas('course', (query) => {
            query.whereHas('users', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .firstOrFail();
        const { body } = await request.validate({
            schema: Validator_1.schema.create({
                body: Validator_1.schema.string(),
            }),
        });
        const comment = new Comment_1.default();
        comment.subjectId = subject.id;
        comment.userId = auth.use('userApi').user?.id;
        comment.parentId = parent.id;
        comment.body = body;
        await comment.save();
        return {
            ...comment.toJSON(),
            user: await comment.related('user').query().select('fullname', 'id').first(),
        };
    }
    async readReplies({ params, auth }) {
        const parent = await Comment_1.default.query()
            .where('id', params.id)
            .andWhereHas('subject', (query) => {
            query.whereHas('course', (query) => {
                query.whereHas('users', (query) => {
                    query.where('users.id', auth.use('userApi').user?.id);
                });
            });
        })
            .firstOrFail();
        const comments = await Comment_1.default.query()
            .select('comments.*', 'users.fullname', Database_1.default.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_mentor`))
            .leftOuterJoin('users', (query) => {
            query.on('users.id', '=', 'comments.user_id');
        })
            .where('comments.parent_id', parent.id)
            .leftOuterJoin('subjects', (query) => {
            query.on('subjects.id', '=', 'comments.subject_id');
        })
            .leftJoin('courses', (query) => {
            query.on('courses.id', '=', 'subjects.course_id');
        })
            .leftJoin('member_course', (query) => {
            query
                .on('member_course.course_id', '=', 'courses.id')
                .andOn('member_course.user_id', 'users.id')
                .andOnVal('member_course.mentor', true);
        })
            .orderBy('created_at', 'asc');
        return comments.map((comment) => ({
            ...comment.serialize(),
            user: {
                id: comment.userId,
                fullname: comment.$extras.fullname,
            },
            is_mentor: comment.$extras.is_mentor,
        }));
    }
    async create({ params, auth, request }) {
        const subject = await Subject_1.default.query()
            .where('subjects.id', params.id)
            .andWhereHas('course', (query) => {
            query.whereHas('users', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .firstOrFail();
        const { body } = await request.validate({
            schema: Validator_1.schema.create({
                body: Validator_1.schema.string(),
            }),
        });
        const comment = new Comment_1.default();
        comment.subjectId = subject.id;
        comment.userId = auth.use('userApi').user?.id;
        comment.body = body;
        await comment.save();
        return {
            ...comment.toJSON(),
            user: await comment.related('user').query().select('fullname', 'id').first(),
        };
    }
}
exports.default = CommentsController;
//# sourceMappingURL=CommentsController.js.map