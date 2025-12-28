import Link from 'next/link'

const smallPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAKklEQVR4nO3BMQEAAADCoPVPbQhPoAAAAAAAAAAAAAAAAAAAAAAAAAAAADwG7AAAX9E0sQAAAABJRU5ErkJggg==" // small placeholder

export default function Home(){
  return (
    <main className="center">
      <div className="container">
        <header>
          <h1>World Fantastic</h1>
        </header>

        <img src={`data:image/png;base64,${smallPngBase64}`} alt="World Fantastic" width="240" height="240" />

        <div className="actions">
          <Link href="/register"><button className="primary">Create New Account</button></Link>
          <Link href="/login"><button className="secondary">Login to Existing Account</button></Link>
        </div>
      </div>

      <footer className="copyright">© {new Date().getFullYear()} World Fantastic</footer>
    </main>
  )
}
