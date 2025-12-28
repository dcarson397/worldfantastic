export default function Sidebar({sections, current, onSelect, characters, onCreate, selectedId, onSelectCharacter}){
  return (
    <aside className="sidebar">
      <div style={{marginBottom:'.75rem'}}>
        {sections.map(s=> (
          <div key={s.id} style={{marginBottom:'.35rem'}}>
            <button className={s.id===current? 'primary' : 'secondary'} onClick={()=>onSelect(s.id)}>{s.title}</button>
          </div>
        ))}
      </div>

      <section style={{marginTop:'1.25rem'}}>
        <h4>Characters</h4>
        <div className="characters">
          {(characters || []).map(c=> (
            <div key={c.id} onClick={()=>onSelectCharacter(c.id)} className={`character-item ${selectedId === c.id? 'selected' : ''}`}>{c.name}</div>
          ))}
          {(!characters || characters.length === 0) && <div style={{color:'#6b7280'}}>No characters</div>}
        </div>
        <div className="sidebar create-btn">
          <button className="primary" onClick={onCreate}>Create New</button>
        </div>
      </section>
    </aside>
  )
}