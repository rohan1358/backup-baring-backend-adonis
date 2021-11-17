import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Bank from 'App/Models/Bank'

const bankSchema = schema.create({
  account_name: schema.string(),
  account_number: schema.string(),
  bank_name: schema.string(),
})

export default class BanksController {
  public async create({ request }: HttpContextContract) {
    const {
      account_name: accountName,
      account_number: accountNumber,
      bank_name: bankName,
    } = await request.validate({
      schema: bankSchema,
    })

    const bank = new Bank()
    bank.accountName = accountName
    bank.accountNumber = accountNumber
    bank.bankName = bankName

    await bank.save()

    return bank.serialize()
  }

  public async edit({ request, params }: HttpContextContract) {
    const bank = await Bank.findOrFail(params.id)
    const {
      account_name: accountName,
      account_number: accountNumber,
      bank_name: bankName,
    } = await request.validate({
      schema: bankSchema,
    })

    bank.accountName = accountName
    bank.accountNumber = accountNumber
    bank.bankName = bankName

    await bank.save()

    return bank.serialize()
  }

  public async index() {
    const banks = await Bank.query()
    return banks.map((bank) => bank.serialize())
  }

  public async delete({ params }: HttpContextContract) {
    const bank = await Bank.findOrFail(params.id)
    await bank.delete()
    return bank
  }
}
