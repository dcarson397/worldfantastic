import {useEffect, useState, useRef} from 'react'

const GENERAL_FIELDS = [ 'Name', 'Race', 'Alignment', 'Guiding Principle' ]
const ATTR_FIELDS = [ 'Physical Strength','Intelligence','Intuition','Willpower','Constitution','Dexterity','Attractiveness','Luck','Power' ]
const PERSONAL_FIELDS = [ 'Sex','Age','Handedness','Height','Weight','Hair Color','Eye Color','Skin Color' ]

export default function CharacterDetail({ character, section, onUpdate, startEditing, hideImage=false, onEditModeChange }){
  const [editMode, setEditMode] = useState(!!startEditing)
  const [general, setGeneral] = useState({})
  const [attrs, setAttrs] = useState({})
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)

  // personal and skill lists
  const [personal, setPersonal] = useState({})
  const [specials, setSpecials] = useState([])
  const [melee, setMelee] = useState([])
  const [missile, setMissile] = useState([])

  const fileRef = useRef()
  const firstInputRef = useRef()

  function camelize(s){
    return s.split(' ').map((w,i)=> i? w[0].toUpperCase()+w.slice(1) : w[0].toLowerCase()+w.slice(1)).join('')
  }

  useEffect(()=>{
    if(!character){ setGeneral({}); setAttrs({}); setImage(null); setPersonal({}); setSpecials([]); setMelee([]); setMissile([]); return }
    setGeneral({
      Name: character.name || '',
      Race: character.race || '',
      Alignment: character.alignment || '',
      'Guiding Principle': character.guidingPrinciple || ''
    })
    const a = {}
    ATTR_FIELDS.forEach(k => { a[k] = (character.attributes && character.attributes[k]) ?? '' })
    setAttrs(a)

    // personal characteristics
    const p = {}
    PERSONAL_FIELDS.forEach(k => { p[k] = (character.personalCharacteristics && (character.personalCharacteristics[k] || character.personalCharacteristics[camelize(k)])) ?? '' })
    setPersonal(p)

    // specials & skills
    setSpecials(character.specials ? [...character.specials] : [])
    setMelee(character.meleeSkills ? [...character.meleeSkills] : [])
    setMissile(character.missileSkills ? [...character.missileSkills] : [])

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

  // helpers to manage rows
  function addSpecial(){ setSpecials(s=>[...s,{ id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), name:'', power:'' }]) }
  function removeSpecial(id){ setSpecials(s=>s.filter(x=>x.id!==id)) }

  function addMelee(){ setMelee(m=>[...m,{ id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), skill:'', skills:'', base:'0' }]) }
  function removeMelee(id){ setMelee(m=>m.filter(x=>x.id!==id)) }

  function addMissile(){ setMissile(m=>[...m,{ id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), skill:'', skills:'', base:'0' }]) }
  function removeMissile(id){ setMissile(m=>m.filter(x=>x.id!==id)) }

  function onFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setImage(reader.result)
    reader.readAsDataURL(f)
  }

  async function save(){
    setSaving(true)

    // map personal to camel-case keys
    const personalData = {
      sex: personal['Sex'],
      age: personal['Age'],
      handedness: personal['Handedness'],
      height: personal['Height'],
      weight: personal['Weight'],
      hairColor: personal['Hair Color'],
      eyeColor: personal['Eye Color'],
      skinColor: personal['Skin Color']
    }

    const payload = {
      id: character.id,
      fields: {
        name: general.Name,
        race: general.Race,
        alignment: general.Alignment,
        guidingPrinciple: general['Guiding Principle'],
        attributes: attrs,
        image,
        personalCharacteristics: personalData,
        specials,
        meleeSkills: melee,
        missileSkills: missile
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

{/* Personal Characteristics / Specials and Melee / Missile as explicit 2x2 grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'auto auto',gap:'.75rem',marginTop:'.75rem'}}>

            {/* Top-left: Personal Characteristics */}
            <div style={{padding:'.75rem',border:'1px solid #eef2f6',borderRadius:6, minHeight:160}}>
              <h4 style={{marginTop:0}}>Personal Characteristics</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem'}}>
                {PERSONAL_FIELDS.map((k,idx)=> (
                  <div key={k}>
                    <label style={{display:'block',marginBottom:'.25rem'}}>{k}</label>
                    <input value={personal[k] ?? ''} onChange={e=>setPersonal(p=>({...p,[k]:e.target.value}))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Top-right: Character Specials */}
            <div style={{padding:'.75rem',border:'1px solid #eef2f6',borderRadius:6, minHeight:160}}>
              <h4 style={{marginTop:0}}>Character Specials</h4>
              <div style={{marginTop:'.5rem'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left'}}><th>Special Name/Description</th><th>Power</th><th></th></tr>
                  </thead>
                  <tbody>
                    {specials.map(s=> (
                      <tr key={s.id}>
                        <td><input value={s.name} onChange={e=>setSpecials(ss=>ss.map(x=> x.id===s.id ? {...x,name:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td><input value={s.power} onChange={e=>setSpecials(ss=>ss.map(x=> x.id===s.id ? {...x,power:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td>{editMode && <button className="secondary" onClick={()=>removeSpecial(s.id)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && <div style={{marginTop:'.5rem'}}><button className="secondary" onClick={addSpecial}>Add Special</button></div>}
              </div>
            </div>

            {/* Bottom-left: Melee Skills */}
            <div style={{padding:'.75rem',border:'1px solid #eef2f6',borderRadius:6}}>
              <h4 style={{marginTop:0}}>Melee Skills</h4>
              <div style={{marginTop:'.5rem'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left'}}><th>Melee Skill</th><th>Skills</th><th>Base %</th><th></th></tr>
                  </thead>
                  <tbody>
                    {melee.map(row=> (
                      <tr key={row.id}>
                        <td><input value={row.skill} onChange={e=>setMelee(m=>m.map(x=> x.id===row.id? {...x,skill:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td><input value={row.skills} onChange={e=>setMelee(m=>m.map(x=> x.id===row.id? {...x,skills:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td><input value={row.base} onChange={e=>setMelee(m=>m.map(x=> x.id===row.id? {...x,base:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td>{editMode && <button className="secondary" onClick={()=>removeMelee(row.id)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && <div style={{marginTop:'.5rem'}}><button className="secondary" onClick={addMelee}>Add Melee Skill</button></div>}
              </div>
            </div>

            {/* Bottom-right: Missile Skills */}
            <div style={{padding:'.75rem',border:'1px solid #eef2f6',borderRadius:6}}>
              <h4 style={{marginTop:0}}>Missile Skills</h4>
              <div style={{marginTop:'.5rem'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left'}}><th>Missile Skill</th><th>Skills</th><th>Base %</th><th></th></tr>
                  </thead>
                  <tbody>
                    {missile.map(row=> (
                      <tr key={row.id}>
                        <td><input value={row.skill} onChange={e=>setMissile(m=>m.map(x=> x.id===row.id? {...x,skill:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td><input value={row.skills} onChange={e=>setMissile(m=>m.map(x=> x.id===row.id? {...x,skills:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td><input value={row.base} onChange={e=>setMissile(m=>m.map(x=> x.id===row.id? {...x,base:e.target.value} : x ))} readOnly={!editMode} tabIndex={editMode?0:-1} className={editMode?'' : 'readonly-field'} /></td>
                        <td>{editMode && <button className="secondary" onClick={()=>removeMissile(row.id)}>Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && <div style={{marginTop:'.5rem'}}><button className="secondary" onClick={addMissile}>Add Missile Skill</button></div>}
              </div>
            </div>
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
                // revert personal and lists
                const p = {}
                PERSONAL_FIELDS.forEach(k => { p[k] = (character.personalCharacteristics && (character.personalCharacteristics[k] || character.personalCharacteristics[camelize(k)])) ?? '' })
                setPersonal(p)
                setSpecials(character.specials ? [...character.specials] : [])
                setMelee(character.meleeSkills ? [...character.meleeSkills] : [])
                setMissile(character.missileSkills ? [...character.missileSkills] : [])
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
