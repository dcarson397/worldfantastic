import {useState} from 'react'
import {useRouter} from 'next/router'

export default function Register(){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [email,setEmail] = useState('')
  const [msg,setMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e){
    e.preventDefault()
    setMsg('Creating account...')
    const res = await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,email})})
    const data = await res.json()
    if(res.status === 202){
      setMsg('Verification email sent — check your inbox and click the link to activate your account.')
    }else if(res.status === 201){
      setMsg(data?.message || 'Account created')
    }else{
      setMsg(data?.error || 'Error')
    }
  }

  return (
    <main className="center">
      <div className="container">
        <h1>Create Account</h1>
        <form className="form" onSubmit={handleSubmit}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" required />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required />
          <button className="primary">Create</button>
        </form>
        <p style={{marginTop:'.75rem'}}>Already have an account? <a className="link" href="/login">Login</a></p>
        <p style={{marginTop:'.5rem',color:'#6b7280'}}>{msg}</p>
      </div>
      <footer className="copyright">© {new Date().getFullYear()} World Fantastic</footer>
    </main>
  )
}
