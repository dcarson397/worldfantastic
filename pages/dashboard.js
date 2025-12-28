import {useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import CharacterDetail from '../components/CharacterDetail'

const SECTIONS = [
  { id: 'page1', title: 'Page One' },
  { id: 'page2', title: 'Page Two' },
  { id: 'page3', title: 'Page Three' }
]

export default function Dashboard(){
  const [current, setCurrent] = useState(SECTIONS[0].id)
  const [chars, setChars] = useState([])
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    const token = localStorage.getItem('wf_auth')
    if(!token){ router.push('/login'); return }
    // fetch profile to get username
    fetch('/api/profile',{headers:{'Authorization': `Basic ${token}`}})
      .then(r=> r.json())
      .then(data=>{ setUsername(data.username || ''); setLoading(false) })
      .catch(()=>{ localStorage.removeItem('wf_auth'); router.push('/login') })
  },[])

  useEffect(()=>{ if(!loading) loadChars(current) }, [current, loading])

  function authHeader(){ const token = localStorage.getItem('wf_auth'); return { 'Authorization': `Basic ${token}`, 'Content-Type':'application/json' } }

  async function loadChars(section){
    const res = await fetch(`/api/characters?section=${encodeURIComponent(section)}`, { headers: authHeader() })
    if(res.ok){ const data = await res.json(); setChars(data.characters || []); setSelected(null) }
    else if(res.status === 401){ localStorage.removeItem('wf_auth'); router.push('/login') }
  }

  async function handleCreate(){
    const name = prompt('Name for new character:')
    if(!name) return
    const res = await fetch(`/api/characters?section=${encodeURIComponent(current)}`, { method:'POST', headers: authHeader(), body: JSON.stringify({ name }) })
    if(res.ok){ const data = await res.json(); setChars(prev=> [...prev, data.character]); setSelected(data.character.id); setEditingId(data.character.id) } 
    else if(res.status === 401){ localStorage.removeItem('wf_auth'); router.push('/login') }
    else{ const d = await res.json(); alert(d.error || 'Failed') }
  }

  function onLogout(){ localStorage.removeItem('wf_auth'); router.push('/login') }

  return (
    <div className="app-container">
      <Sidebar sections={SECTIONS} current={current} onSelect={setCurrent} characters={chars} onCreate={handleCreate} selectedId={selected} onSelectCharacter={setSelected} />
      <div style={{flex:1}}>
        <Topbar onLogout={onLogout} />
        <div className="content">
          <h2>{SECTIONS.find(s=>s.id===current).title}</h2>
          <p>Welcome, <strong>{username}</strong></p>

          <section style={{marginTop:'1rem'}}>
            <h3>Selected Character</h3>
            {selected ? (
              <div style={{display:'grid',gridTemplateColumns:'2fr 420px',gap:'1rem',marginTop:'.75rem'}}>
                <div style={{padding:'.75rem',border:'1px solid #e6e6e6',borderRadius:8}}>
                  {/* Left column: additional character summary or notes (kept minimal for now) */}
                  <p style={{marginTop:0}}>Overview or notes about the selected character can appear here.</p>
                  <p style={{color:'#6b7280'}}>Selected: <strong>{chars.find(c=>c.id===selected)?.name}</strong></p>
                </div>

                <div style={{padding:'.75rem',border:'1px solid #e6e6e6',borderRadius:8}}>
                  {/* Right column: fields panel with image to the right (CharacterDetail handles that) */}
                  <CharacterDetail character={chars.find(c=>c.id===selected)} section={current} onUpdate={(updated)=>{
                    setChars(prev => prev.map(x=> x.id===updated.id ? updated : x))
                    setEditingId(null)
                  }} startEditing={editingId === selected} />
                </div>
              </div>
            ) : <div style={{color:'#6b7280',marginTop:'.75rem'}}>No character selected</div> }
          </section>

        </div>
      </div>
    </div>
  )
}