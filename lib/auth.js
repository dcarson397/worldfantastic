import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
function readUsers(){ try{ return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')||'[]') }catch(e){ return [] } }

export function authenticateBasic(req){
  const auth = req.headers.authorization
  if(!auth || !auth.startsWith('Basic ')) return null
  const token = auth.slice(6)
  let decoded = ''
  try{ decoded = Buffer.from(token, 'base64').toString('utf8') }catch(e){ return null }
  const [username,password] = decoded.split(':')
  if(!username || !password) return null

  const users = readUsers()
  const u = users.find(x=>x.username === username)
  if(!u) return null
  if(u.verified === false) return null
  const ok = bcrypt.compareSync(password, u.hash)
  if(!ok) return null
  return u
}