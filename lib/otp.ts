import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID as string

export async function sendOtpVerification(phone: string): Promise<void> {
  await client.verify.v2.services(VERIFY_SERVICE_SID).verifications.create({
    to: phone,
    channel: 'sms',
  })
}

export async function checkOtpVerification(phone: string, code: string): Promise<boolean> {
  const check = await client.verify.v2
    .services(VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code })
  return check.status === 'approved'
}
