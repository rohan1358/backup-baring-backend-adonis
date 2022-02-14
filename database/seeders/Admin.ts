import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Admin from 'App/Models/Admin'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AdminSeeder extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await Admin.createMany([
      {
        username: 'admin',
        fullname: 'Admin',
        password: await Hash.make('123456'),
      },
    ])
  }
}
