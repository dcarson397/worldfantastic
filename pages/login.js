import {useState} from 'react'
import {useRouter} from 'next/router'

export default function Login(){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [msg,setMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e){
    e.preventDefault()
    setMsg('Logging in...')
    const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})})
    if(res.ok){
      // store basic auth credentials for future requests (simple demo)
      const token = btoa(`${username}:${password}`)
      localStorage.setItem('wf_auth', token)
      setMsg('Login successful. Redirecting...')
      setTimeout(()=>router.push('/dashboard'),600)
    }else{
      const data = await res.json()
      setMsg(data?.error || 'Invalid credentials')
    }
  }

  return (
    <main className="center">
      <div className="container">
        <h1>Login</h1>
        <form className="form" onSubmit={handleSubmit}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" required />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required />
          <button className="primary">Login</button>
        </form>
        <p style={{marginTop:'.75rem'}}>No account? <a className="link" href="/register">Create one</a></p>
        <p style={{marginTop:'.5rem',color:'#6b7280'}}>{msg}</p>
      </div>
      <footer className="copyright">© {new Date().getFullYear()} World Fantastic</footer>
    </main>
  )
}
