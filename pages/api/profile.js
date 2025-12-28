import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const DATA_FILE = path.join(process.cwd(),'data','users.json')
function readUsers(){ try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')||'[]') }catch(e){ return [] } }

export default function handler(req,res){
  const auth = req.headers.authorization
  if(!auth || !auth.startsWith('Basic ')) return res.status(401).json({error:'Missing Authorization'})
  const token = auth.slice(6)
  let decoded = ''
  try{ decoded = Buffer.from(token, 'base64').toString('utf8') }catch(e){ return res.status(401).json({error:'Invalid token'}) }
  const [username,password] = decoded.split(':')
  if(!username || !password) return res.status(401).json({error:'Invalid token'})

  const users = readUsers()
  const u = users.find(x=>x.username === username)
  if(!u) return res.status(401).json({error:'Invalid credentials'})

  // ensure email verified
  if(u.verified === false) return res.status(403).json({error:'Email not verified'})

  const ok = bcrypt.compareSync(password, u.hash)
  if(!ok) return res.status(401).json({error:'Invalid credentials'})

  return res.status(200).json({username: u.username})
}
