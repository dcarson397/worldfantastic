import {useEffect, useState} from 'react'
import {useRouter} from 'next/router'

export default function Profile(){
  const [user,setUser] = useState(null)
  const [msg,setMsg] = useState('')
  const router = useRouter()

  useEffect(()=>{
    // redirect to dashboard (protected) which serves as the app's main page
    router.push('/dashboard')
  },[])

  function logout(){
    localStorage.removeItem('wf_auth')
    router.push('/')
  }

  return (
    <main className="center">
      <div className="container">
        <h1>Profile</h1>
        {msg && <p style={{color:'#6b7280'}}>{msg}</p>}
        {user && (
          <div>
            <p>Welcome, <strong>{user.username}</strong></p>
            <button className="secondary" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
      <footer className="copyright">© {new Date().getFullYear()} World Fantastic</footer>
    </main>
  )
}
