import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@worldfantastic.local'

export async function sendVerificationEmail(to, token){
  if(!SMTP_HOST || !SMTP_PORT){
    throw new Error('SMTP not configured')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT,10),
    secure: false,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })

  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/verify?token=${token}`

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Verify your World Fantastic account',
    text: `Please verify your World Fantastic account by visiting this link: ${verificationUrl}`,
    html: `<p>Please verify your World Fantastic account by clicking the link below:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
  })

  return info
}
