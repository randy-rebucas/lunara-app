import admin from 'firebase-admin'

function getApp() {
  if (admin.apps.length > 0) return admin.app()

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const app = getApp()
  await admin.messaging(app).send({
    token,
    notification: { title, body },
    data,
  })
}

export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) return
  const app = getApp()
  await admin.messaging(app).sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  })
}
