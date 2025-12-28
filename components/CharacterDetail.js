import {useEffect, useState, useRef} from 'react'

const GENERAL_FIELDS = [ 'Name', 'Race', 'Alignment', 'Guiding Principle' ]
const ATTR_FIELDS = [ 'Physical Strength','Intelligence','Intuition','Willpower','Constitution','Dexterity','Attractiveness','Luck','Power' ]

export default function CharacterDetail({ character, section, onUpdate, startEditing }){
  const [editMode, setEditMode] = useState(!!startEditing)
  const [general, setGeneral] = useState({})
  const [attrs, setAttrs] = useState({})
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(()=>{
    if(!character){ setGeneral({}); setAttrs({}); setImage(null); return }
    setGeneral({
      Name: character.name || '',
      Race: character.race || '',
      Alignment: character.alignment || '',
      'Guiding Principle': character.guidingPrinciple || ''
    })
    const a = {}
    ATTR_FIELDS.forEach(k => { a[k] = (character.attributes && character.attributes[k]) ?? '' })
    setAttrs(a)
    setImage(character.image || null)
    if(startEditing) setEditMode(true)
  },[character, startEditing])

  if(!character) return <div style={{padding:'.75rem',color:'#6b7280'}}>No character selected</div>

  function onFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setImage(reader.result)
    reader.readAsDataURL(f)
  }

  async function save(){
    setSaving(true)
    const payload = {
      id: character.id,
      fields: {
        name: general.Name,
        race: general.Race,
        alignment: general.Alignment,
        guidingPrinciple: general['Guiding Principle'],
        attributes: attrs,
        image
      }
    }
    try{
      const token = localStorage.getItem('wf_auth')
      const res = await fetch(`/api/characters?section=${encodeURIComponent(section)}`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Basic ${token}` }, body: JSON.stringify(payload) })
      if(!res.ok){ const d = await res.json(); alert(d.error || 'Failed to save'); return }
      const data = await res.json()
      setEditMode(false)
      if(onUpdate) onUpdate(data.character)
    }catch(err){ alert('Failed to save: '+err.message) }
    finally{ setSaving(false) }
  }

  return (
    <div style={{display:'flex',gap:'1rem',alignItems:'flex-start'}}>
      <div style={{flex:1}}>
        {editMode && <div style={{color:'red',fontWeight:600,marginBottom:'.5rem'}}>Edit Mode</div>}

        <div style={{background:'#fff',padding:'1rem',borderRadius:8,border:'1px solid #e6e6e6'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0}}>General</h3>
            <div>
              <button className="secondary" title="Edit" onClick={()=>setEditMode(v=>!v)}>✏️</button>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem',marginTop:'.75rem'}}>
            {GENERAL_FIELDS.map(k=> (
              <div key={k}>
                <label style={{fontSize:'.8rem',color:'#6b7280'}}>{k}</label>
                {editMode ? (
                  <input value={general[k]||''} onChange={e=>setGeneral(s=>({...s,[k]:e.target.value}))} />
                ) : (
                  <div style={{padding:'.5rem .6rem'}}>{general[k] || <span style={{color:'#9aa0a6'}}>—</span>}</div>
                )}
              </div>
            ))}
          </div>

          <h4 style={{marginTop:'1rem'}}>Attributes</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.5rem',marginTop:'.5rem'}}>
            {ATTR_FIELDS.map(k=> (
              <div key={k}>
                <label style={{fontSize:'.8rem',color:'#6b7280'}}>{k}</label>
                {editMode ? (
                  <input type="number" min="0" value={attrs[k]||0} onChange={e=>setAttrs(a=>({...a,[k]:e.target.value}))} />
                ) : (
                  <div style={{padding:'.5rem .6rem'}}>{attrs[k] || <span style={{color:'#9aa0a6'}}>—</span>}</div>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <div style={{marginTop:'.75rem',display:'flex',gap:'.5rem'}}>
              <button className="primary" onClick={save} disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
              <button className="secondary" onClick={()=>{ setEditMode(false); setGeneral({Name:character.name}); setAttrs(character.attributes||{}); setImage(character.image||null) }}>Cancel</button>
            </div>
          )}
        </div>

      </div>

      <div style={{width:220}}>
        <div style={{background:'#fff',padding:'1rem',borderRadius:8,border:'1px solid #e6e6e6',textAlign:'center'}}>
          <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',borderRadius:6,background:'#fafafa'}}>
            {image ? <img src={image} style={{maxWidth:'100%',maxHeight:'100%'}} alt="character"/> : <div style={{color:'#9aa0a6'}}>No image</div>}
          </div>
          <div style={{marginTop:'.75rem'}}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile} />
            <button className="primary" onClick={()=>{ if(!editMode) return alert('Enable Edit Mode to upload'); fileRef.current.click() }}>Upload New Picture</button>
          </div>
        </div>
      </div>
    </div>
  )
}
