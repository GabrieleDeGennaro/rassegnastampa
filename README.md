# 🌎 Sud America Monitor

Tool di monitoraggio rassegna stampa per il Sud America e Cuba.

---

## 🚀 Deploy su Netlify (gratuito, ~10 minuti)

### Passo 1 — Ottieni la chiave API Anthropic
1. Vai su [console.anthropic.com](https://console.anthropic.com/)
2. Registrati o accedi
3. Vai su **API Keys** → **Create Key**
4. Copia la chiave (inizia con `sk-ant-...`)

### Passo 2 — Crea il repository su GitHub
1. Vai su [github.com](https://github.com) e crea un account (gratis)
2. Clicca **New repository** → nome: `sudamerica-monitor` → **Create**
3. Carica tutti i file di questo progetto nel repository

### Passo 3 — Deploy su Netlify
1. Vai su [netlify.com](https://netlify.com) e accedi con GitHub
2. Clicca **Add new site** → **Import an existing project**
3. Seleziona il tuo repository `sudamerica-monitor`
4. Impostazioni build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clicca **Deploy site**

### Passo 4 — Aggiungi la chiave API (IMPORTANTE)
1. Nel pannello Netlify → **Site settings** → **Environment variables**
2. Clicca **Add a variable**
3. Key: `VITE_ANTHROPIC_API_KEY`
4. Value: la tua chiave `sk-ant-...`
5. Clicca **Save** → poi **Trigger deploy** per rifare il build

---

## 👤 Credenziali di accesso

Le credenziali sono configurate nel file `src/Login.jsx`:

```js
const USERS = [
  { username: "admin",     password: "sudamerica2025" },
  { username: "redazione", password: "monitor2025"   },
]
```

**Per aggiungere/modificare utenti:** apri `src/Login.jsx` e modifica l'array `USERS`.  
Dopo ogni modifica, fai commit su GitHub — Netlify rebuilderà automaticamente.

---

## 💻 Sviluppo locale

```bash
# Installa dipendenze
npm install

# Crea il file .env
cp .env.example .env
# Poi apri .env e inserisci la tua chiave API

# Avvia in sviluppo
npm run dev

# Build produzione
npm run build
```

---

## ⚠️ Note di sicurezza

- La chiave API è **lato client** (necessario per chiamate dirette ad Anthropic)
- Per uso professionale con molti utenti, considera di aggiungere un backend proxy
- Le credenziali di login sono **client-side** — adatte per uso interno/privato
- Per sicurezza enterprise, usa Netlify Identity o un auth provider dedicato
