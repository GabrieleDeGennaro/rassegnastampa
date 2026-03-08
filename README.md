# 🌎 Sud America Monitor

Tool di monitoraggio rassegna stampa per Sud America, Cuba e Messico.
Ricerca notizie reali in tempo reale da oltre 25 testate internazionali e regionali.

---

## 🚀 Deploy su Netlify (gratuito, ~10 minuti)

### 1. Ottieni la chiave API Anthropic
1. Vai su https://console.anthropic.com
2. Accedi o registrati
3. Menu **API Keys** → **Create Key**
4. Copia la chiave (inizia con `sk-ant-...`)

### 2. Carica su GitHub
1. Vai su https://github.com → crea account se non ce l'hai
2. **New repository** → nome: `sudamerica-monitor` → **Create**
3. Carica tutti i file di questa cartella nel repository

### 3. Deploy su Netlify
1. Vai su https://netlify.com → **Sign up with GitHub**
2. **Add new site** → **Import an existing project** → seleziona GitHub
3. Seleziona il repository `sudamerica-monitor`
4. Impostazioni build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clicca **Deploy site**

### 4. Aggiungi la chiave API ⚠️ IMPORTANTE
1. Pannello Netlify → **Site configuration** → **Environment variables**
2. **Add a variable**:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (la tua chiave)
3. **Save** → poi **Deploys** → **Trigger deploy**

Il sito sarà online su un URL tipo `https://nome-sito.netlify.app`

---

## 👤 Credenziali di accesso

Modifica il file `src/App.jsx` alla sezione `USERS`:

```js
const USERS = [
  { username: "admin",     password: "sudamerica2025" },
  { username: "redazione", password: "monitor2025"   },
]
```

Dopo ogni modifica: fai commit su GitHub → Netlify rebuilda automaticamente.

---

## ✨ Funzionalità

- 🔍 **Ricerca per bisogno giornalistico** in linguaggio naturale
- 📰 **25+ testate** organizzate per area geografica
- 🌎 **15 paesi** (Sud America, Cuba, Messico)
- 📂 **11 tematiche** selezionabili
- 🗣️ **Filtro voci**: popolo, politici, esperti, vittime, attivisti
- 📅 **Filtro data**: ultime 24h / 48h / settimana / mese
- 🔗 **Link diretti** agli articoli originali
- 📚 **Archivio preferiti** con categorie personalizzate
- 🔄 **Filtri cumulativi** sui risultati

---

## 💻 Sviluppo locale

```bash
npm install
cp .env.example .env
# Apri .env e inserisci la chiave API
npm run dev
```
