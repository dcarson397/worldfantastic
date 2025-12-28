import {useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import CharacterDetail from '../components/CharacterDetail'
import PicturePanel from '../components/PicturePanel'

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
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <h3 style={{margin:0}}>Selected Character</h3>
              <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                {selected && (
                  <button className="secondary" title="Edit" onClick={()=>{
                    // toggle edit mode for the selected character
                    if(editingId === selected) setEditingId(null)
                    else setEditingId(selected)
                  }}>✏️</button>
                )}
              </div>
            </div>

            {selected ? (
              <div style={{display:'grid',gridTemplateRows:'90px auto',gap:'.75rem',marginTop:'.75rem',width:'100%'}}>
                <div style={{padding:'.5rem',border:'1px solid #e6e6e6',borderRadius:8,overflow:'hidden',height:90}}>
                  {/* Shrunk Overview area */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:'100%'}}>
                    <div>
                      <div style={{fontWeight:700}}>{chars.find(c=>c.id===selected)?.name}</div>
                      <div style={{color:'#6b7280',fontSize:'.9rem'}}>{chars.find(c=>c.id===selected)?.race || ''}</div>
                    </div>
                    <div style={{color:'#9aa0a6'}}>Overview</div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'2fr 220px',gap:'1rem'}}>
                  <div style={{padding:'.75rem',border:'1px solid #e6e6e6',borderRadius:8}}>
                    {/* Fields panel (left below overview) */}
                    <CharacterDetail character={chars.find(c=>c.id===selected)} section={current} onUpdate={(updated)=>{
                      setChars(prev => prev.map(x=> x.id===updated.id ? updated : x))
                      setEditingId(null)
                    }} startEditing={editingId === selected} hideImage={true} onEditModeChange={(v)=>{/* no-op parent listener here if needed */}} />
                  </div>

                  <div style={{padding:'.75rem',border:'1px solid #e6e6e6',borderRadius:8,textAlign:'center'}}>
                    {/* Picture panel (right below overview) */}
                    <PicturePanel character={chars.find(c=>c.id===selected)} section={current} onSaved={(updated)=> setChars(prev=> prev.map(x=> x.id===updated.id ? updated : x))} editEnabled={editingId === selected} />
                  </div>
                </div>
              </div>
            ) : <div style={{color:'#6b7280',marginTop:'.75rem'}}>No character selected</div> }
          </section>

        </div>
      </div>
    </div>
  )
}