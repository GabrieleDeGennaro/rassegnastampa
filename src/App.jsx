import { useState, useCallback, useEffect } from 'react'
import Login from './Login.jsx'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// ⚠️  INSERISCI QUI LA TUA CHIAVE API ANTHROPIC
// Ottienila su: https://console.anthropic.com/
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

const COUNTRIES = [
  'Brasile','Argentina','Cile','Colombia','Perù','Venezuela',
  'Bolivia','Ecuador','Uruguay','Paraguay','Suriname','Guyana',
  'Cuba','America Latina (generale)'
]

const TOPICS = [
  { id:'politica',   label:'Politica',       icon:'🏛️' },
  { id:'economia',   label:'Economia',       icon:'📈' },
  { id:'ambiente',   label:'Ambiente',       icon:'🌿' },
  { id:'sicurezza',  label:'Sicurezza',      icon:'🛡️' },
  { id:'diritti',    label:'Diritti Umani',  icon:'⚖️' },
  { id:'energia',    label:'Energia',        icon:'⚡' },
  { id:'societa',    label:'Società',        icon:'👥' },
  { id:'tecnologia', label:'Tecnologia',     icon:'💻' },
  { id:'diplomazia', label:'Diplomazia',     icon:'🤝' },
  { id:'sport',      label:'Sport & Cultura',icon:'🏆' },
]

const TOPIC_COLORS = {
  politica:'#e05c6a', economia:'#4ec9b0', ambiente:'#3fb950',
  sicurezza:'#f85149', diritti:'#d29922', energia:'#e8b84b',
  societa:'#bc8cff',  tecnologia:'#58a6ff', diplomazia:'#ff9500',
  sport:'#fc6b2d',    altro:'#8b949e'
}

const FLAG = {
  'Brasile':'🇧🇷','Argentina':'🇦🇷','Cile':'🇨🇱','Colombia':'🇨🇴',
  'Perù':'🇵🇪','Venezuela':'🇻🇪','Bolivia':'🇧🇴','Ecuador':'🇪🇨',
  'Uruguay':'🇺🇾','Paraguay':'🇵🇾','Suriname':'🇸🇷','Guyana':'🇬🇾',
  'Cuba':'🇨🇺','America Latina (generale)':'🌎'
}

const ARCHIVE_KEY = 'sudamerica_archive_v3'
const CATS_KEY    = 'sudamerica_cats_v3'
const SESSION_KEY = 'sudamerica_session'
const DEFAULT_CATS = ['Da leggere','Geopolitica','Economia','Ambiente','Altro']

function loadArchive() { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]') } catch { return [] } }
function saveArchive(a) { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)) } catch {} }
function loadCats() { try { return JSON.parse(localStorage.getItem(CATS_KEY)||'null')||DEFAULT_CATS } catch { return DEFAULT_CATS } }
function saveCatsStore(c) { try { localStorage.setItem(CATS_KEY, JSON.stringify(c)) } catch {} }
function loadSession() { try { return localStorage.getItem(SESSION_KEY)||'' } catch { return '' } }
function saveSession(u) { try { localStorage.setItem(SESSION_KEY, u) } catch {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY) } catch {} }

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--s1:#161b22;--s2:#1c2330;--bd:#30363d;--bd2:#3d444d;--acc:#e8b84b;--acc2:#4ec9b0;--red:#f85149;--grn:#3fb950;--blu:#58a6ff;--tx:#e6edf3;--tx2:#c9d1d9;--mt:#8b949e;--mt2:#6e7681}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font-family:'IBM Plex Sans',sans-serif;min-height:100vh}
.topbar{position:sticky;top:0;z-index:100;background:rgba(13,17,23,.93);backdrop-filter:blur(14px);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;gap:16px}
.topbar-brand{display:flex;align-items:center;gap:10px}
.topbar-badge{background:var(--acc);color:#000;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:9px;letter-spacing:2px;padding:3px 9px;text-transform:uppercase;border-radius:2px}
.topbar-title{font-family:'Playfair Display',serif;font-size:17px}
.topbar-nav{display:flex;gap:4px;align-items:center}
.nav-btn{background:transparent;border:1px solid transparent;border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 14px;transition:all .15s;letter-spacing:.5px}
.nav-btn:hover{color:var(--tx);border-color:var(--bd2)}
.nav-btn.active{background:var(--s2);color:var(--tx);border-color:var(--acc)}
.nav-btn.logout{color:var(--red);border-color:transparent}
.nav-btn.logout:hover{border-color:var(--red);background:rgba(248,81,73,.08)}
.nbadge{display:inline-block;background:var(--acc);color:#000;border-radius:10px;font-size:9px;font-weight:700;padding:1px 6px;margin-left:5px}
.topbar-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);text-align:right}
.user-pill{background:var(--s2);border:1px solid var(--bd2);border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc2);padding:3px 10px}
.pulse{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--grn);margin-right:6px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.page{padding:26px 28px 60px;max-width:1440px;margin:0 auto;width:100%}
.panel{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:17px 19px;margin-bottom:16px}
.panel-lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);margin-bottom:11px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{background:transparent;border:1px solid var(--bd);color:var(--mt);font-family:'IBM Plex Sans',sans-serif;font-size:12px;padding:5px 12px;border-radius:20px;cursor:pointer;transition:all .15s}
.chip:hover{border-color:var(--acc);color:var(--tx)}
.chip.on{background:var(--acc);border-color:var(--acc);color:#000;font-weight:600}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:16px}
.qbar{display:flex;gap:10px;margin-bottom:16px}
.qinput{flex:1;background:var(--s1);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:12px 16px;outline:none;transition:border-color .15s}
.qinput:focus{border-color:var(--acc)}
.qinput::placeholder{color:var(--mt)}
.btn-run{background:var(--acc);border:none;border-radius:8px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:1px;padding:12px 22px;text-transform:uppercase;transition:all .15s;white-space:nowrap}
.btn-run:hover:not(:disabled){background:#f5c96a;transform:translateY(-1px)}
.btn-run:disabled{opacity:.45;cursor:not-allowed}
.sbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s1);border:1px solid var(--bd);border-radius:6px;margin-bottom:20px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mt);min-height:40px}
.sbar.loading{border-color:var(--acc)}.sbar.error{border-color:var(--red);color:var(--red)}.sbar.success{border-color:var(--grn);color:var(--grn)}
.spin{width:13px;height:13px;border:2px solid var(--bd);border-top-color:var(--acc);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.briefing{background:var(--s1);border:1px solid var(--acc2);border-radius:10px;padding:17px 19px;margin-bottom:20px;font-size:14px;line-height:1.75;color:var(--tx2)}
.briefing-ttl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--acc2);margin-bottom:9px}
.ftabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.ftab{background:transparent;border:1px solid var(--bd);border-radius:4px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 11px;transition:all .15s;letter-spacing:.5px}
.ftab:hover{color:var(--tx);border-color:var(--mt)}.ftab.on{background:var(--s2);color:var(--tx);border-color:var(--acc2)}
.ngrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;transition:border-color .15s,transform .15s,box-shadow .15s;position:relative;overflow:hidden;display:flex;flex-direction:column}
.card:hover{border-color:var(--acc);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--tc,var(--acc))}
.card-top{display:flex;align-items:center;gap:7px;margin-bottom:9px;flex-wrap:wrap}
.csrc{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc);letter-spacing:.8px;text-transform:uppercase;background:rgba(232,184,75,.09);padding:2px 7px;border-radius:3px}
.ctopic{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'IBM Plex Mono',monospace;letter-spacing:.3px}
.cctry{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt)}
.ctitle{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;line-height:1.45;margin-bottom:8px;flex:1}
.csum{font-size:12.5px;line-height:1.65;color:var(--mt);margin-bottom:11px}
.cfoot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bd);padding-top:10px;gap:8px;flex-wrap:wrap}
.cdate{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2)}
.cbtns{display:flex;gap:6px;align-items:center}
.btn-link{background:transparent;border:1px solid var(--bd2);border-radius:5px;color:var(--blu);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
.btn-link:hover{border-color:var(--blu);background:rgba(88,166,255,.08)}
.btn-save{background:transparent;border:1px solid var(--bd2);border-radius:5px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
.btn-save:hover{border-color:var(--acc);color:var(--acc)}.btn-save.saved{border-color:var(--acc);color:var(--acc);background:rgba(232,184,75,.08)}
.rdots{display:flex;gap:3px;align-items:center}.rdot{width:5px;height:5px;border-radius:50%;background:var(--bd)}.rdot.on{background:var(--acc2)}
.empty{text-align:center;padding:70px 20px;color:var(--mt)}.empty .ei{font-size:44px;margin-bottom:14px}.empty h3{font-family:'Playfair Display',serif;font-size:19px;color:var(--tx);margin-bottom:7px}.empty p{font-size:13.5px;line-height:1.65;max-width:400px;margin:0 auto}
.arch-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.arch-title{font-family:'Playfair Display',serif;font-size:22px}
.catmgr{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.cchip{display:flex;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--bd);border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all .15s;color:var(--tx2)}
.cchip:hover{border-color:var(--acc2)}.cchip.on{border-color:var(--acc2);color:var(--acc2);background:rgba(78,201,176,.08)}
.cdel{background:none;border:none;color:var(--mt);cursor:pointer;font-size:13px;line-height:1;padding:0 0 0 2px;transition:color .15s}.cdel:hover{color:var(--red)}
.newcat-row{display:flex;gap:8px;margin-bottom:18px}
.cat-inp{background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:8px 13px;outline:none;width:220px;transition:border-color .15s}.cat-inp:focus{border-color:var(--acc2)}
.btn-addcat{background:var(--s2);border:1px solid var(--bd2);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;transition:all .15s}.btn-addcat:hover{border-color:var(--acc2);color:var(--acc2)}
.asec{margin-bottom:28px}.asec-ttl{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);margin-bottom:11px;display:flex;align-items:center;gap:8px}.asec-ttl span{color:var(--acc)}
.acard{display:flex;align-items:flex-start;gap:13px;background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:14px 16px;margin-bottom:8px;transition:border-color .15s}.acard:hover{border-color:var(--bd2)}
.acard-body{flex:1}.acard-ttl{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;margin-bottom:5px;line-height:1.4}
.acard-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.acard-sum{font-size:12.5px;color:var(--mt);line-height:1.55}
.acard-acts{display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0}
.btn-move{background:var(--s2);border:1px solid var(--bd);border-radius:5px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;transition:all .15s;white-space:nowrap}.btn-move:hover{border-color:var(--acc2);color:var(--acc2)}
.btn-rm{background:transparent;border:none;color:var(--mt2);cursor:pointer;font-size:17px;line-height:1;transition:color .15s}.btn-rm:hover{color:var(--red)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px}
.modal{background:var(--s1);border:1px solid var(--bd2);border-radius:12px;padding:22px 24px;min-width:280px;max-width:360px}
.modal-ttl{font-family:'Playfair Display',serif;font-size:17px;margin-bottom:14px}
.modal-cats{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
.modal-cat{background:var(--s2);border:1px solid var(--bd);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:9px 14px;text-align:left;transition:all .15s}.modal-cat:hover{border-color:var(--acc2);color:var(--acc2)}
.modal-cancel{background:transparent;border:1px solid var(--bd);border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 16px;width:100%;transition:all .15s}.modal-cancel:hover{border-color:var(--bd2);color:var(--tx)}
.api-warn{background:rgba(232,184,75,.08);border:1px solid rgba(232,184,75,.3);border-radius:8px;padding:14px 16px;margin-bottom:18px;font-size:13px;color:var(--acc);line-height:1.6}
.api-warn a{color:var(--blu)}
@media(max-width:720px){.cgrid{grid-template-columns:1fr}.ngrid{grid-template-columns:1fr}.topbar{padding:0 14px}.page{padding:14px 14px 50px}.topbar-title{display:none}}
`

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function RDots({ s }) {
  const n = Math.max(1,Math.min(5,Math.round((s||5)/2)))
  return <div className="rdots">{[1,2,3,4,5].map(i=><div key={i} className={`rdot ${i<=n?'on':''}`}/>)}</div>
}

function Modal({ title, cats, onSelect, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-ttl">{title}</div>
        <div className="modal-cats">{cats.map(c=><button key={c} className="modal-cat" onClick={()=>onSelect(c)}>{c}</button>)}</div>
        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  )
}

function NewsCard({ a, onSave, saved }) {
  const color = TOPIC_COLORS[a.topic]||TOPIC_COLORS.altro
  const to = TOPICS.find(x=>x.id===a.topic)
  const hasUrl = a.url && a.url !== '#' && a.url !== ''
  return (
    <div className="card" style={{'--tc':color}}>
      <div className="card-top">
        <span className="csrc">{a.source}</span>
        <span className="ctopic" style={{background:color+'22',color}}>{to?.icon} {to?.label||a.topic}</span>
        <span className="cctry">{FLAG[a.country]||'🌎'} {a.country}</span>
      </div>
      <div className="ctitle">{a.title}</div>
      <div className="csum">{a.summary}</div>
      <div className="cfoot">
        <span className="cdate">{a.date}</span>
        <div className="cbtns">
          <RDots s={a.relevance}/>
          {hasUrl
            ? <a className="btn-link" href={a.url} target="_blank" rel="noreferrer">↗ Articolo</a>
            : <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:'10px',color:'var(--mt2)'}}>—</span>
          }
          <button className={`btn-save ${saved?'saved':''}`} onClick={()=>onSave(a)}>
            {saved?'★':'☆'} {saved?'Salvato':'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchivePage({ archive, cats, onRemove, onMove, onAddCat, onRemoveCat }) {
  const [activeCat, setActiveCat] = useState('tutte')
  const [newCat, setNewCat] = useState('')

  const addCat = () => {
    const n = newCat.trim()
    if (n && !cats.includes(n)) { onAddCat(n); setNewCat('') }
  }

  const sections = activeCat === 'tutte' ? cats : [activeCat]

  return (
    <div className="page">
      <div className="arch-hdr">
        <div className="arch-title">📚 Archivio & Preferiti</div>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:'11px',color:'var(--mt)'}}>{archive.length} articoli salvati</span>
      </div>
      <div className="panel">
        <div className="panel-lbl">▸ Gestisci categorie</div>
        <div className="newcat-row">
          <input className="cat-inp" placeholder="Nuova categoria…" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()}/>
          <button className="btn-addcat" onClick={addCat}>+ Aggiungi</button>
        </div>
        <div className="catmgr">
          <div className={`cchip ${activeCat==='tutte'?'on':''}`} onClick={()=>setActiveCat('tutte')}>
            Tutte <span style={{color:'var(--mt)',fontSize:'11px'}}>({archive.length})</span>
          </div>
          {cats.map(c=>{
            const n = archive.filter(a=>a.category===c).length
            return (
              <div key={c} className={`cchip ${activeCat===c?'on':''}`} onClick={()=>setActiveCat(c)}>
                {c} <span style={{color:'var(--mt)',fontSize:'11px'}}>({n})</span>
                <button className="cdel" onClick={e=>{e.stopPropagation();onRemoveCat(c)}}>×</button>
              </div>
            )
          })}
        </div>
      </div>
      {archive.length===0 && (
        <div className="empty">
          <div className="ei">📌</div>
          <h3>Nessun articolo salvato</h3>
          <p>Premi <strong>☆ Salva</strong> su un articolo della rassegna per aggiungerlo qui.</p>
        </div>
      )}
      {sections.map(cat => {
        const items = archive.filter(a=>a.category===cat)
        if (!items.length) return null
        return (
          <div key={cat} className="asec">
            <div className="asec-ttl">{cat} <span>({items.length})</span></div>
            {items.map(a => {
              const color = TOPIC_COLORS[a.topic]||TOPIC_COLORS.altro
              const to = TOPICS.find(x=>x.id===a.topic)
              const hasUrl = a.url && a.url !== '#' && a.url !== ''
              return (
                <div key={a.savedAt} className="acard">
                  <div className="acard-body">
                    <div className="acard-ttl">{a.title}</div>
                    <div className="acard-meta">
                      <span>{FLAG[a.country]||'🌎'} {a.country}</span>
                      <span style={{color}}>{to?.icon} {to?.label||a.topic}</span>
                      <span>{a.source}</span>
                      <span>{a.date}</span>
                    </div>
                    <div className="acard-sum">{a.summary}</div>
                  </div>
                  <div className="acard-acts">
                    <button className="btn-rm" onClick={()=>onRemove(a)}>×</button>
                    {hasUrl && <a className="btn-link" href={a.url} target="_blank" rel="noreferrer">↗</a>}
                    <button className="btn-move" onClick={()=>onMove(a)}>📁 Sposta</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]             = useState(loadSession)
  const [view, setView]             = useState('monitor')
  const [selC, setSelC]             = useState([])
  const [selT, setSelT]             = useState([])
  const [query, setQuery]           = useState('')
  const [articles, setArticles]     = useState([])
  const [summary, setSummary]       = useState('')
  const [status, setStatus]         = useState({ type:'idle', msg:'' })
  const [filter, setFilter]         = useState('tutti')
  const [lastFetch, setLastFetch]   = useState(null)
  const [archive, setArchive]       = useState(loadArchive)
  const [cats, setCats]             = useState(loadCats)
  const [saveModal, setSaveModal]   = useState(null)
  const [moveModal, setMoveModal]   = useState(null)

  useEffect(()=>saveArchive(archive),[archive])
  useEffect(()=>saveCatsStore(cats),[cats])

  const today = new Date().toLocaleDateString('it-IT',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  const handleLogin = (username) => { saveSession(username); setUser(username) }
  const handleLogout = () => { clearSession(); setUser('') }

  const toggleC = c => setSelC(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])
  const toggleT = t => setSelT(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])

  const fetchNews = useCallback(async () => {
    if (!ANTHROPIC_API_KEY) {
      setStatus({ type:'error', msg:'API key non configurata. Imposta VITE_ANTHROPIC_API_KEY nel file .env' })
      return
    }
    const cStr = selC.length>0 ? selC.join(', ') : 'tutti i paesi del Sud America e Cuba'
    const tStr = selT.length>0 ? selT.map(t=>TOPICS.find(x=>x.id===t)?.label).join(', ') : 'tutte le tematiche'
    const extra = query.trim() ? `\nFocus aggiuntivo: "${query}"` : ''

    setStatus({ type:'loading', msg:'🔎 Ricerca notizie reali in corso (web search attivo)…' })
    setArticles([]); setSummary('')

    const prompt = `Sei un sistema di monitoraggio giornalistico specializzato in Sud America e Cuba. Oggi è ${today}.

Usa il web search per trovare NOTIZIE REALI E RECENTI (ultime 48 ore) riguardanti:
- Paesi: ${cStr}
- Tematiche: ${tStr}${extra}

Cerca su Reuters, AP News, BBC, AFP, El País, Folha de S.Paulo, Infobae, The Guardian, Al Jazeera, ANSA.
Per ogni articolo trovato, includi l'URL reale e diretto all'articolo originale.

Trova 8-12 articoli. Rispondi SOLO con JSON valido (no backtick, no markdown):
{
  "summary": "Briefing esecutivo 3-4 frasi",
  "articles": [
    {
      "id": 1,
      "title": "Titolo tradotto in italiano",
      "summary": "Riassunto 2-3 frasi in italiano",
      "country": "uno tra: ${COUNTRIES.join(', ')}",
      "topic": "politica|economia|ambiente|sicurezza|diritti|energia|societa|tecnologia|diplomazia|sport|altro",
      "source": "Nome fonte",
      "date": "Data articolo",
      "relevance": 8,
      "url": "URL diretto articolo (stringa vuota se non trovato)"
    }
  ]
}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key': ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:4000,
          system:'Sei un assistente di monitoraggio geopolitico e giornalistico. Rispondi SOLO con JSON valido senza markdown.',
          tools:[{ type:'web_search_20250305', name:'web_search' }],
          messages:[{ role:'user', content:prompt }]
        })
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const raw = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('')
      let parsed
      try {
        const clean = raw.replace(/```json|```/g,'').trim()
        parsed = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}')+1))
      } catch { throw new Error('Errore parsing JSON risposta') }
      setArticles(parsed.articles||[])
      setSummary(parsed.summary||'')
      setLastFetch(new Date().toLocaleTimeString('it-IT'))
      setStatus({ type:'success', msg:`✓ ${parsed.articles?.length||0} articoli trovati — ${new Date().toLocaleTimeString('it-IT')}` })
    } catch(e) {
      setStatus({ type:'error', msg:`Errore: ${e.message}` })
    }
  }, [selC, selT, query, today])

  const topicCounts={}, countryCounts={}
  articles.forEach(a=>{ topicCounts[a.topic]=(topicCounts[a.topic]||0)+1; countryCounts[a.country]=(countryCounts[a.country]||0)+1 })
  const filtered = filter==='tutti' ? articles : articles.filter(a=>a.topic===filter||a.country===filter)

  const inArchive = a => archive.some(x=>x.title===a.title&&x.source===a.source)
  const handleSave = a => { if (!inArchive(a)) setSaveModal(a) }
  const confirmSave = cat => { setArchive(p=>[...p,{...saveModal,category:cat,savedAt:Date.now()}]); setSaveModal(null) }
  const confirmMove = cat => { setArchive(p=>p.map(a=>a.savedAt===moveModal.savedAt?{...a,category:cat}:a)); setMoveModal(null) }
  const doRemove = a => setArchive(p=>p.filter(x=>x.savedAt!==a.savedAt))
  const addCat = n => setCats(p=>[...p,n])
  const removeCat = c => { setCats(p=>p.filter(x=>x!==c)); setArchive(p=>p.map(a=>a.category===c?{...a,category:'Altro'}:a)) }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <>
      <style>{CSS}</style>
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-badge">Monitor</span>
          <span className="topbar-title">Sud America · Rassegna Stampa</span>
        </div>
        <div className="topbar-nav">
          <button className={`nav-btn ${view==='monitor'?'active':''}`} onClick={()=>setView('monitor')}>📰 Rassegna</button>
          <button className={`nav-btn ${view==='archive'?'active':''}`} onClick={()=>setView('archive')}>
            📚 Archivio {archive.length>0&&<span className="nbadge">{archive.length}</span>}
          </button>
          <span className="user-pill">👤 {user}</span>
          <button className="nav-btn logout" onClick={handleLogout}>⏏ Esci</button>
        </div>
        <div className="topbar-meta"><span className="pulse"/>{today}{lastFetch&&<><br/>Agg. {lastFetch}</>}</div>
      </div>

      {saveModal && <Modal title="Salva in categoria" cats={cats} onSelect={confirmSave} onClose={()=>setSaveModal(null)}/>}
      {moveModal && <Modal title="Sposta in categoria" cats={cats} onSelect={confirmMove} onClose={()=>setMoveModal(null)}/>}

      {view==='archive' && <ArchivePage archive={archive} cats={cats} onRemove={doRemove} onMove={a=>setMoveModal(a)} onAddCat={addCat} onRemoveCat={removeCat}/>}

      {view==='monitor' && (
        <div className="page">
          {!ANTHROPIC_API_KEY && (
            <div className="api-warn">
              ⚠️ <strong>API Key mancante.</strong> Crea un file <code>.env</code> nella cartella del progetto con:<br/>
              <code>VITE_ANTHROPIC_API_KEY=sk-ant-...</code><br/>
              Ottieni la tua chiave su <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a>
            </div>
          )}
          <div className="cgrid">
            <div className="panel">
              <div className="panel-lbl">▸ Paese</div>
              <div className="chips">{COUNTRIES.map(c=><button key={c} className={`chip ${selC.includes(c)?'on':''}`} onClick={()=>toggleC(c)}>{FLAG[c]} {c}</button>)}</div>
            </div>
            <div className="panel">
              <div className="panel-lbl">▸ Tematica</div>
              <div className="chips">{TOPICS.map(t=><button key={t.id} className={`chip ${selT.includes(t.id)?'on':''}`} onClick={()=>toggleT(t.id)}>{t.icon} {t.label}</button>)}</div>
            </div>
          </div>
          <div className="qbar">
            <input className="qinput" placeholder='Focus specifico, es. "elezioni Bolivia"…' value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchNews()}/>
            <button className="btn-run" onClick={fetchNews} disabled={status.type==='loading'}>{status.type==='loading'?'⏳ Cerco…':'▶ Aggiorna'}</button>
          </div>
          <div className={`sbar ${status.type}`}>
            {status.type==='loading'&&<div className="spin"/>}
            {status.type==='idle'&&<span>🌐 Seleziona filtri e premi Aggiorna — ricerca web in tempo reale.</span>}
            {status.type!=='idle'&&<span>{status.msg}</span>}
          </div>
          {summary&&<div className="briefing"><div className="briefing-ttl">◈ Briefing Esecutivo</div>{summary}</div>}
          {articles.length>0&&(
            <div className="ftabs">
              <button className={`ftab ${filter==='tutti'?'on':''}`} onClick={()=>setFilter('tutti')}>Tutti ({articles.length})</button>
              {Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).map(([t,n])=>{const to=TOPICS.find(x=>x.id===t);return <button key={t} className={`ftab ${filter===t?'on':''}`} onClick={()=>setFilter(t)}>{to?.icon} {to?.label||t} ({n})</button>})}
              {Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([c,n])=><button key={c} className={`ftab ${filter===c?'on':''}`} onClick={()=>setFilter(c)}>{FLAG[c]} {c} ({n})</button>)}
            </div>
          )}
          {filtered.length>0&&<div className="ngrid">{filtered.map(a=><NewsCard key={a.id} a={a} onSave={handleSave} saved={inArchive(a)}/>)}</div>}
          {articles.length===0&&status.type!=='loading'&&status.type!=='error'&&(
            <div className="empty"><div className="ei">🌎</div><h3>Nessuna notizia caricata</h3><p>Seleziona filtri e premi <strong>▶ Aggiorna</strong>.</p></div>
          )}
        </div>
      )}
    </>
  )
}
