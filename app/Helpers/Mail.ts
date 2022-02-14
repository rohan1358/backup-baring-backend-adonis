import Env from '@ioc:Adonis/Core/Env'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import Client from 'mailgun.js/dist/lib/client'

export default class Mail {
  private _mailInstance(): Client {
    const mg = new Mailgun(FormData).client({
      username: 'api',
      key: Env.get('MAILGUN_API_KEY'),
    })
    return mg
  }

  public send(data: any) {
    this._mailInstance().messages.create(Env.get('MAILGUN_DOMAIN'), data)
  }
}
