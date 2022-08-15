"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Course_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Course"));
const Review_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Review"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class ReviewsController {
    async create({ params, auth, response, request }) {
        const course = await Course_1.default.query()
            .select('courses.*')
            .leftJoin('member_course', 'member_course.course_id', '=', 'courses.id')
            .where('courses.id', params.id)
            .where('courses.id', params.id)
            .andWhere('member_course.user_id', auth.use('userApi').user?.id)
            .andWhere('member_course.mentor', false)
            .firstOrFail();
        let review = await Review_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .andWhere('course_id', course.id)
            .first();
        if (review) {
            return response.methodNotAllowed();
        }
        const { star, body } = await request.validate({
            schema: Validator_1.schema.create({
                star: Validator_1.schema.number([Validator_1.rules.range(1, 5)]),
                body: Validator_1.schema.string(),
            }),
        });
        review = new Review_1.default();
        review.userId = Number(auth.use('userApi').user?.id);
        review.courseId = Number(course.id);
        review.star = star;
        review.body = body;
        await review.save();
        return {
            ...review.toJSON(),
            user: {
                id: review.userId,
                fullname: auth.use('userApi').user?.fullname,
            },
        };
    }
    async index({ params }) {
        const course = await Course_1.default.findByOrFail('id', params.id);
        const reviews = await course
            .related('reviews')
            .query()
            .select('reviews.*', 'users.fullname')
            .leftJoin('users', 'users.id', '=', 'reviews.user_id')
            .orderBy('reviews.created_at', 'desc');
        return reviews.map((review) => ({
            ...review.toJSON(),
            user: {
                id: review.userId,
                ...review.$extras,
            },
        }));
    }
}
exports.default = ReviewsController;
//# sourceMappingURL=ReviewsController.js.map