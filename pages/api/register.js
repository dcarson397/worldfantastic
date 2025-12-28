import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '../../lib/email'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const PENDING_FILE = path.join(process.cwd(), 'data', 'pending.json')

function readUsers(){ try{ const raw = fs.readFileSync(USERS_FILE,'utf8'); return JSON.parse(raw || '[]') }catch(e){ return [] } }
function writeUsers(users){ fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8') }
function readPending(){ try{ const raw = fs.readFileSync(PENDING_FILE,'utf8'); return JSON.parse(raw || '{}') }catch(e){ return {} } }
function writePending(p){ fs.writeFileSync(PENDING_FILE, JSON.stringify(p, null, 2), 'utf8') }

function validateEmail(email){ return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) }

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const {username,password,email} = req.body || {}
  if(!username || !password || !email) return res.status(400).json({error:'Missing username, password or email'})
  if(!validateEmail(email)) return res.status(400).json({error:'Invalid email'})

  const users = readUsers()
  const pending = readPending()

  if(users.find(u=>u.username === username)) return res.status(409).json({error:'User already exists'})
  if(users.find(u=>u.email === email)) return res.status(409).json({error:'Email already in use'})
  if(Object.values(pending).find(p=>p.username === username)) return res.status(409).json({error:'Registration already pending for this username'})
  if(Object.values(pending).find(p=>p.email === email)) return res.status(409).json({error:'Registration already pending for this email'})

  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(password, salt)
  const token = crypto.randomBytes(20).toString('hex')

  // store pending registration until verification
  pending[token] = { username, email, hash, createdAt: new Date().toISOString() }
  try{ writePending(pending) }catch(e){ return res.status(500).json({error:'Failed to save pending registration'}) }

  // try to send email; if not configured and SKIP_EMAIL_VERIFICATION set, auto-activate
  const skip = (process.env.SKIP_EMAIL_VERIFICATION || '').toLowerCase() === 'true'
  let mailed = false
  try{
    await sendVerificationEmail(email, token)
    mailed = true
  }catch(err){
    // if skip flag set, activate
    if(skip){
      const newUser = { username, email, hash, verified: true, createdAt: new Date().toISOString() }
      users.push(newUser)
      delete pending[token]
      try{ writeUsers(users); writePending(pending) }catch(e){ /* ignore */ }
      return res.status(201).json({message:'Account created (email verification skipped for dev). You can login now.'})
    }
    // otherwise return error
    return res.status(500).json({error:'Failed to send verification email. Set SKIP_EMAIL_VERIFICATION=true to bypass during development.'})
  }

  if(mailed){
    return res.status(202).json({message:'Verification email sent. Please check your inbox to complete registration.'})
  }

  // fallback
  res.status(500).json({error:'Unexpected error'})
}
