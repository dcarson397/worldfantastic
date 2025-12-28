import Topbar from './Topbar'

export default function Layout({children,onLogout}){
  return (
    <div className="app-container">
      <div style={{width:220}}></div>
      <div style={{flex:1}}>
        <Topbar onLogout={onLogout} />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}