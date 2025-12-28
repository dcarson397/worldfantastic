#!/usr/bin/env node

const nodemailer = require('nodemailer')
const { sendVerificationEmail } = require('../lib/email')

async function main(){
  const to = process.argv[2] || 'test@example.com'
  const token = 'test-token-' + Math.random().toString(36).slice(2,10)

  if(process.env.SMTP_HOST && process.env.SMTP_PORT){
    console.log('Using configured SMTP to send verification email to', to)
    try{
      await sendVerificationEmail(to, token)
      console.log('Email sent using configured SMTP. Verify recipient inbox.')
    }catch(err){
      console.error('Failed to send via configured SMTP:', err.message)
      process.exit(1)
    }
    return
  }

  console.log('No SMTP configured; creating test account (Ethereal)')
  try{
    const testAccount = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    })

    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/verify?token=${token}`
    const info = await transporter.sendMail({
      from: 'no-reply@worldfantastic.local',
      to,
      subject: 'Test Verification Email (Ethereal)',
      text: `Verify: ${verificationUrl}`,
      html: `<p>Verification link: <a href="${verificationUrl}">${verificationUrl}</a></p>`
    })

    console.log('Message sent; preview URL:', nodemailer.getTestMessageUrl(info))
    console.log('Ethereal account:', testAccount)
  }catch(err){
    console.error('Failed to send test email:', err)
    process.exit(1)
  }
}

main()
