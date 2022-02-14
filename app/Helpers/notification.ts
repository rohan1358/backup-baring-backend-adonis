import Firebase from 'firebase-admin'
import fs from 'fs'
import Application from '@ioc:Adonis/Core/Application'

const serviceAccount = JSON.parse(
  fs.readFileSync(Application.makePath('app/Services/firebase-account.json')) as any
)

Firebase.initializeApp({
  credential: Firebase.credential.cert(serviceAccount),
})

export default Firebase
