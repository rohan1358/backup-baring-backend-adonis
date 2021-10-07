import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Comment from 'App/Models/Comment'
import Subject from 'App/Models/Subject'

export default class CommentsController {
  public async index({ params, auth }: HttpContextContract) {
    const subject = await Subject.query()
      .where('subjects.id', params.id)
      .andWhereHas('course', (query) => {
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .firstOrFail()
    const comments = await Comment.query()
      .select(
        'comments.*',
        'users.fullname',
        Database.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_mentor`)
      )
      .leftOuterJoin('users', (query) => {
        query.on('users.id', '=', 'comments.user_id')
      })
      .where('subject_id', subject.id)
      .whereNull('comments.parent_id')
      .withCount('replies')
      .leftOuterJoin('subjects', (query) => {
        query.on('subjects.id', '=', 'comments.subject_id')
      })
      .leftJoin('courses', (query) => {
        query.on('courses.id', '=', 'subjects.course_id')
      })
      .leftJoin('member_course', (query) => {
        query
          .on('member_course.course_id', '=', 'courses.id')
          .andOn('member_course.user_id', 'users.id')
          .andOnVal('member_course.mentor', true)
      })
      .orderBy('created_at', 'asc')

    return comments.map((comment) => ({
      ...comment.serialize(),
      user: {
        id: comment.userId,
        fullname: comment.$extras.fullname,
      },
      replies_count: comment.$extras.replies_count,
      is_mentor: comment.$extras.is_mentor,
    }))
  }
  public async reply({ params, auth, request }: HttpContextContract) {
    const parent = await Comment.findByOrFail('id', params.id)
    const subject = await Subject.query()
      .where('subjects.id', parent.subjectId)
      .andWhereHas('course', (query) => {
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .firstOrFail()
    const { body } = await request.validate({
      schema: schema.create({
        body: schema.string(),
      }),
    })

    const comment = new Comment()
    comment.subjectId = subject.id
    comment.userId = auth.use('userApi').user?.id!
    comment.parentId = parent.id
    comment.body = body

    await comment.save()

    return {
      ...comment.toJSON(),
      user: await comment.related('user').query().select('fullname', 'id').first(),
    }
  }
  public async readReplies({ params, auth }: HttpContextContract) {
    const parent = await Comment.query()
      .where('id', params.id)
      .andWhereHas('subject', (query) => {
        query.whereHas('course', (query) => {
          query.whereHas('users', (query) => {
            query.where('users.id', auth.use('userApi').user?.id!)
          })
        })
      })
      .firstOrFail()
    const comments = await Comment.query()
      .select(
        'comments.*',
        'users.fullname',
        Database.raw(`CASE WHEN member_course.id IS NULL THEN FALSE ELSE TRUE END as is_mentor`)
      )
      .leftOuterJoin('users', (query) => {
        query.on('users.id', '=', 'comments.user_id')
      })
      .where('comments.parent_id', parent.id)

      .leftOuterJoin('subjects', (query) => {
        query.on('subjects.id', '=', 'comments.subject_id')
      })
      .leftJoin('courses', (query) => {
        query.on('courses.id', '=', 'subjects.course_id')
      })
      .leftJoin('member_course', (query) => {
        query
          .on('member_course.course_id', '=', 'courses.id')
          .andOn('member_course.user_id', 'users.id')
          .andOnVal('member_course.mentor', true)
      })
      .orderBy('created_at', 'asc')

    return comments.map((comment) => ({
      ...comment.serialize(),
      user: {
        id: comment.userId,
        fullname: comment.$extras.fullname,
      },
      is_mentor: comment.$extras.is_mentor,
    }))
  }
  public async create({ params, auth, request }: HttpContextContract) {
    const subject = await Subject.query()
      .where('subjects.id', params.id)
      .andWhereHas('course', (query) => {
        query.whereHas('users', (query) => {
          query.where('users.id', auth.use('userApi').user?.id!)
        })
      })
      .firstOrFail()
    const { body } = await request.validate({
      schema: schema.create({
        body: schema.string(),
      }),
    })

    const comment = new Comment()
    comment.subjectId = subject.id
    comment.userId = auth.use('userApi').user?.id!
    comment.body = body

    await comment.save()

    return {
      ...comment.toJSON(),
      user: await comment.related('user').query().select('fullname', 'id').first(),
    }
  }
}
