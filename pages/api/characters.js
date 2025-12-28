import fs from 'fs'
import path from 'path'
import { authenticateBasic } from '../../lib/auth'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
function readUsers(){ try{ return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')||'[]') }catch(e){ return [] } }
function writeUsers(u){ fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2), 'utf8') }

export default function handler(req,res){
  const user = authenticateBasic(req)
  if(!user) return res.status(401).json({error:'Unauthorized'})

  const users = readUsers()
  // find fresh user object reference
  const u = users.find(x=>x.username === user.username)
  if(!u) return res.status(401).json({error:'Unauthorized'})

  const section = (req.query.section || 'page1')

  if(req.method === 'GET'){
    u.characters = u.characters || {}
    const list = u.characters[section] || []
    return res.status(200).json({characters: list})
  }

  if(req.method === 'POST'){
    const { name } = req.body || {}
    if(!name) return res.status(400).json({error:'Missing name'})
    u.characters = u.characters || {}
    u.characters[section] = u.characters[section] || []
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6)
    const newChar = { id, name }
    u.characters[section].push(newChar)
    try{ writeUsers(users) }catch(e){ return res.status(500).json({error:'Failed to save'}) }
    return res.status(201).json({character:newChar})
  }

  res.status(405).json({error:'Method not allowed'})
}