import {useEffect, useState, useRef} from 'react'

const GENERAL_FIELDS = [ 'Name', 'Race', 'Alignment', 'Guiding Principle' ]
const ATTR_FIELDS = [ 'Physical Strength','Intelligence','Intuition','Willpower','Constitution','Dexterity','Attractiveness','Luck','Power' ]

export default function CharacterDetail({ character, section, onUpdate, startEditing, hideImage=false, onEditModeChange }){
  const [editMode, setEditMode] = useState(!!startEditing)
  const [general, setGeneral] = useState({})
  const [attrs, setAttrs] = useState({})
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const firstInputRef = useRef()

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
    // respect parent-driven edit state; if parent toggles startEditing, mirror it
    if(typeof startEditing !== 'undefined') setEditMode(!!startEditing)
  },[character, startEditing])

  // focus and select first input when entering edit mode
  useEffect(()=>{
    if(editMode){
      // next tick to ensure DOM updated
      setTimeout(()=>{
        try{ if(firstInputRef.current){ firstInputRef.current.focus(); firstInputRef.current.select(); } }catch(e){ }
      }, 0)
    }
    // notify parent of edit mode change
    if(typeof onEditModeChange === 'function') onEditModeChange(editMode)
  },[editMode])

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
          <div style={{display:'flex',justifyContent:'flex-start',alignItems:'center'}}>
            <h3 style={{margin:0}}>General</h3>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem',marginTop:'.75rem'}} className="detail-panel">
            {GENERAL_FIELDS.map((k, idx)=> (
              <div key={k}>
                <label>{k}</label>
                {/* Always render inputs in the same location; readOnly when not editing so layout doesn't shift */}
                <input
                  ref={idx===0? firstInputRef : undefined}
                  value={general[k] ?? ''}
                  onChange={e=>setGeneral(s=>({...s,[k]:e.target.value}))}
                  readOnly={!editMode}
                  tabIndex={editMode ? 0 : -1}
                  className={editMode ? '' : 'readonly-field'}
                  onKeyDown={e=>{
                    if(!editMode) return
                    if(e.key === 'Escape'){
                      // cancel
                      e.preventDefault();
                      setEditMode(false)
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <h4 style={{marginTop:'1rem'}}>Attributes</h4>
          <div className="attributes-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.5rem',marginTop:'.5rem'}}>
            {ATTR_FIELDS.map(k=> (
              <div key={k}>
                <label>{k}</label>
                {/* Use number inputs but allow empty string; show blank instead of 0 when empty */}
                <input
                  type="number"
                  min="0"
                  value={attrs[k] ?? ''}
                  onChange={e=>setAttrs(a=>({...a,[k]:e.target.value}))}
                  readOnly={!editMode}
                  tabIndex={editMode ? 0 : -1}
                  className={editMode ? '' : 'readonly-field'}
                  onKeyDown={e=>{ if(!editMode) return; if(e.key === 'Escape'){ e.preventDefault(); setEditMode(false) } }}
                />
              </div>
            ))}
          </div>

          {editMode && (
            <div style={{marginTop:'.75rem',display:'flex',gap:'.5rem'}}>
              <button className="primary" onClick={save} disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
              <button className="secondary" onClick={()=>{
                // revert changes to the original character values
                setEditMode(false)
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
              }}>Cancel</button>
            </div>
          )}
        </div>

      </div>

      {!hideImage && (
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
      )}
    </div>
  )
}
