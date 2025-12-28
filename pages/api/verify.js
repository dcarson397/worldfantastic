import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const PENDING_FILE = path.join(process.cwd(), 'data', 'pending.json')

function readUsers(){ try{ const raw = fs.readFileSync(USERS_FILE,'utf8'); return JSON.parse(raw || '[]') }catch(e){ return [] } }
function writeUsers(users){ fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8') }
function readPending(){ try{ const raw = fs.readFileSync(PENDING_FILE,'utf8'); return JSON.parse(raw || '{}') }catch(e){ return {} } }
function writePending(p){ fs.writeFileSync(PENDING_FILE, JSON.stringify(p, null, 2), 'utf8') }

export default function handler(req,res){
  const { token } = req.query || {}
  if(!token) return res.status(400).send('Missing token')
  const pending = readPending()
  const record = pending[token]
  if(!record) return res.status(404).send('Invalid or expired token')

  const users = readUsers()
  if(users.find(u=>u.username === record.username)){
    // already exists
    delete pending[token]
    writePending(pending)
    return res.status(200).send('Account already exists. You can login.')
  }

  const newUser = { username: record.username, email: record.email, hash: record.hash, verified: true, createdAt: new Date().toISOString() }
  users.push(newUser)
  delete pending[token]
  try{ writeUsers(users); writePending(pending) }catch(e){ return res.status(500).send('Failed to create account') }

  // simple success HTML to click
  res.setHeader('Content-Type','text/html')
  res.status(200).send(`<html><body><h1>Account Verified</h1><p>Your account has been activated. <a href="/login">Login</a></p></body></html>`)
}