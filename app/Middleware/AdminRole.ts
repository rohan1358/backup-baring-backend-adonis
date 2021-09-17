import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AdminRole {
  public async handle({ auth, response }: HttpContextContract, next, roles) {
    const adminRole = auth.use('adminApi').user?.role || 'super'

    if (!roles.length) {
      return next()
    } else if (roles.includes(adminRole)) {
      return next()
    } else {
      return response.methodNotAllowed()
    }
  }
}
