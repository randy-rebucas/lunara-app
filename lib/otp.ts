import twilio from 'twilio'

const ACCOUNT_SID        = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN         = process.env.TWILIO_AUTH_TOKEN
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

// In development, set TWILIO_DEV_OTP=123456 in .env.local to bypass real SMS.
const DEV_OTP = process.env.TWILIO_DEV_OTP

function isDev() {
  return process.env.NODE_ENV === 'development' && !!DEV_OTP
}

function getClient() {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SERVICE_SID) {
    throw new Error(
      'Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in .env.local.'
    )
  }
  return twilio(ACCOUNT_SID, AUTH_TOKEN)
}

export async function sendOtpVerification(phone: string): Promise<void> {
  if (isDev()) {
    console.log(`[DEV] OTP for ${phone}: ${DEV_OTP}`)
    return
  }
  try {
    const client = getClient()
    await client.verify.v2.services(VERIFY_SERVICE_SID!).verifications.create({
      to: phone,
      channel: 'sms',
    })
  } catch (err: unknown) {
    const twilioErr = err as { code?: number; status?: number; message?: string }
    if (twilioErr.code === 20003) {
      throw new Error('SMS service authentication failed. Please contact support.')
    }
    if (twilioErr.code === 21211 || twilioErr.code === 21614) {
      throw new Error('Invalid phone number format.')
    }
    if (twilioErr.code === 60200) {
      throw new Error('Invalid phone number for verification.')
    }
    throw new Error(twilioErr.message ?? 'Failed to send OTP. Please try again.')
  }
}

export async function checkOtpVerification(phone: string, code: string): Promise<boolean> {
  if (isDev()) {
    return code === DEV_OTP
  }
  try {
    const client = getClient()
    const check = await client.verify.v2
      .services(VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phone, code })
    return check.status === 'approved'
  } catch (err: unknown) {
    const twilioErr = err as { code?: number; message?: string }
    if (twilioErr.code === 20003) {
      throw new Error('SMS service authentication failed. Please contact support.')
    }
    // 20404 = verification not found (expired or already used)
    if (twilioErr.code === 20404) {
      return false
    }
    throw new Error(twilioErr.message ?? 'Failed to verify OTP. Please try again.')
  }
}
