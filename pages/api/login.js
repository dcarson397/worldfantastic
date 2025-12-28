import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json')
function readUsers(){ try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')||'[]') }catch(e){ return [] } }

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const {username,password} = req.body || {}
  if(!username || !password) return res.status(400).json({error:'Missing username or password'})

  const users = readUsers()
  const u = users.find(x=>x.username === username)
  if(!u) return res.status(401).json({error:'Invalid credentials'})

  // legacy users without verified flag are treated as verified
  if(u.verified === false) return res.status(403).json({error:'Email not verified'})

  const ok = bcrypt.compareSync(password, u.hash)
  if(!ok) return res.status(401).json({error:'Invalid credentials'})

  res.status(200).json({message:'Login successful'})
}
