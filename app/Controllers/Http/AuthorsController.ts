// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Author from 'App/Models/Author'

export default class AuthorsController {
  public async index() {
    const authors = await Author.all()

    return authors
  }
}
