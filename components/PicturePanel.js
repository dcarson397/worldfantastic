import {useRef, useState, useEffect} from 'react'

export default function PicturePanel({character, section, onSaved, editEnabled}){
  const fileRef = useRef()
  const [image, setImage] = useState(character?.image || null)
  useEffect(()=> setImage(character?.image || null), [character])

  async function onFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = async ()=>{
      const data = reader.result
      setImage(data)
      try{
        const token = localStorage.getItem('wf_auth')
        const res = await fetch(`/api/characters?section=${encodeURIComponent(section)}`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Basic ${token}` }, body: JSON.stringify({ id: character.id, fields: { image: data } }) })
        if(!res.ok){ const d = await res.json(); alert(d.error || 'Failed to save image'); return }
        const j = await res.json()
        if(onSaved) onSaved(j.character)
      }catch(err){ alert('Failed to upload image: '+err.message) }
    }
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',borderRadius:6,background:'#fafafa'}}>
        {image ? <img src={image} style={{maxWidth:'100%',maxHeight:'100%'}} alt="character"/> : <div style={{color:'#9aa0a6'}}>No image</div>}
      </div>
      <div style={{marginTop:'.75rem'}}>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile} />
        <button className="primary" onClick={()=>{ if(!editEnabled) return alert('Enable Edit Mode to upload'); fileRef.current.click() }}>Upload New Picture</button>
      </div>
    </div>
  )
}