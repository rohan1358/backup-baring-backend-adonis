import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import moment from 'moment'

export default class SubscriptionCheck {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    if (auth.user instanceof User) {
      const user = auth.user
      if (
        !user.subscriptionEnd ||
        (user.subscriptionEnd && moment(user.subscriptionEnd).toDate() > new Date())
      ) {
        return response.methodNotAllowed()
      }
    }
    await next()
  }
}
