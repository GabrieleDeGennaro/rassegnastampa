import { useState } from 'react'

// ─── UTENTI AUTORIZZATI ───────────────────────────────────────────────────────
// Modifica qui per aggiungere/cambiare credenziali
const USERS = [
  { username: "admin",    password: "sudamerica2025" },
  { username: "redazione", password: "monitor2025"   },
]
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font-family:'IBM Plex Sans',sans-serif}
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#0d1117;position:relative;overflow:hidden}
.login-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(232,184,75,.07) 0%,transparent 70%);pointer-events:none}
.login-box{background:#161b22;border:1px solid #30363d;border-radius:14px;padding:42px 40px;width:100%;max-width:400px;position:relative;z-index:1}
.login-logo{text-align:center;margin-bottom:28px}
.login-logo .globe{font-size:40px;display:block;margin-bottom:10px}
.login-logo h1{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;margin-bottom:4px}
.login-logo p{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8b949e;letter-spacing:2px;text-transform:uppercase}
.login-divider{height:1px;background:#30363d;margin-bottom:26px}
.login-field{margin-bottom:16px}
.login-label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8b949e;display:block;margin-bottom:7px}
.login-input{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:7px;color:#e6edf3;font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:11px 14px;outline:none;transition:border-color .15s}
.login-input:focus{border-color:#e8b84b}
.login-input::placeholder{color:#6e7681}
.login-btn{width:100%;background:#e8b84b;border:none;border-radius:7px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:1.5px;padding:13px;text-transform:uppercase;transition:all .15s;margin-top:6px}
.login-btn:hover{background:#f5c96a;transform:translateY(-1px)}
.login-error{background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:6px;color:#f85149;font-size:12.5px;padding:10px 13px;margin-top:14px;text-align:center;font-family:'IBM Plex Mono',monospace}
.login-footer{text-align:center;margin-top:22px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#6e7681}
`

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const found = USERS.find(u => u.username === username.trim() && u.password === password)
    if (found) {
      onLogin(found.username)
    } else {
      setError('Credenziali non valide. Riprova.')
      setPassword('')
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-logo">
            <span className="globe">🌎</span>
            <h1>Sud America Monitor</h1>
            <p>Rassegna Stampa · Accesso Riservato</p>
          </div>
          <div className="login-divider" />

          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              className="login-input"
              type="text"
              placeholder="Inserisci username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="Inserisci password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button className="login-btn" onClick={handleSubmit}>
            → Accedi
          </button>

          {error && <div className="login-error">{error}</div>}

          <div className="login-footer">Accesso riservato agli utenti autorizzati</div>
        </div>
      </div>
    </>
  )
}
