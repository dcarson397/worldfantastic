import {useState} from 'react'
import {useRouter} from 'next/router'

export default function Topbar({onLogout}){
  const [open,setOpen] = useState(false)
  const router = useRouter()
  function logout(){
    localStorage.removeItem('wf_auth')
    if(onLogout) onLogout()
    router.push('/login')
  }
  return (
    <div className="topbar">
      <div style={{fontWeight:600}}>World Fantastic</div>
      <div style={{position:'relative'}}>
        <button aria-label="menu" className="meeple-btn" onClick={()=>setOpen(v=>!v)}>🧚</button>
        {open && (
          <div className="dropdown">
            <button className="secondary" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  )
}