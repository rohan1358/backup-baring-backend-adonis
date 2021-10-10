import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Course from 'App/Models/Course'
import Review from 'App/Models/Review'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class ReviewsController {
  public async create({ params, auth, response, request }: HttpContextContract) {
    const course = await Course.query()
      .leftJoin('member_course', 'member_course.course_id', '=', 'courses.id')
      .where('courses.id', params.id)
      .where('courses.id', params.id)
      .andWhere('member_course.user_id', auth.use('userApi').user?.id!)
      .andWhere('member_course.mentor', false)
      .firstOrFail()

    let review = await Review.query()
      .where('user_id', auth.use('userApi').user?.id!)
      .andWhere('course_id', course.id)
      .first()

    if (review) {
      return response.methodNotAllowed()
    }

    const { star, body } = await request.validate({
      schema: schema.create({
        star: schema.number([rules.range(1, 5)]),
        body: schema.string(),
      }),
    })

    review = new Review()
    review.userId = auth.use('userApi').user?.id!
    review.courseId = course.id
    review.star = star
    review.body = body

    await review.save()

    return {
      ...review.toJSON(),
      user: {
        id: review.userId,
        fullname: auth.use('userApi').user?.fullname,
      },
    }
  }
  public async index({ params }: HttpContextContract) {
    const course = await Course.findByOrFail('id', params.id)
    const reviews = await course
      .related('reviews')
      .query()
      .select('reviews.*', 'users.fullname')
      .leftJoin('users', 'users.id', '=', 'reviews.user_id')
      .orderBy('reviews.created_at', 'desc')

    return reviews.map((review) => ({
      ...review.toJSON(),
      user: {
        id: review.userId,
        ...review.$extras,
      },
    }))
  }
}
