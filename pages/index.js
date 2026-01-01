import Link from 'next/link'

export default function Home(){
  return (
    <main className="home-screen">
      <div className="home-image-container">
        <img src="/front.png" alt="World Fantastic" className="home-image" />
        <div className="home-actions">
          <Link href="/register"><button className="primary">Create New Account</button></Link>
          <Link href="/login"><button className="secondary">Login to Existing Account</button></Link>
        </div>
      </div>

      <footer className="copyright">© {new Date().getFullYear()} World Fantastic</footer>
    </main>
  )
}
