import { useState, useCallback, useEffect } from "react";

// ─── API KEY ──────────────────────────────────────────────────────────────────
// Impostata come variabile d'ambiente su Netlify: VITE_ANTHROPIC_API_KEY
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// ─── UTENTI AUTORIZZATI ───────────────────────────────────────────────────────
// Modifica qui per aggiungere o cambiare username/password
const USERS = [
  { username: "admin",     password: "sudamerica2025" },
  { username: "redazione", password: "monitor2025"   },
];
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = "sudamerica_session_v1";
const ARCHIVE_KEY = "sudamerica_archive_v4";
const CATS_KEY    = "sudamerica_cats_v4";
const DEFAULT_CATS = ["Da leggere","Inchiesta","Testimonianze","Geopolitica","Economia","Ambiente","Altro"];

function loadSession()  { try { return localStorage.getItem(SESSION_KEY) || ""; }   catch { return ""; } }
function saveSession(u) { try { localStorage.setItem(SESSION_KEY, u); }             catch {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); }             catch {} }
function loadArchive()  { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); } catch { return []; } }
function saveArchive(a) { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }         catch {} }
function loadCats()     { try { return JSON.parse(localStorage.getItem(CATS_KEY) || "null") || DEFAULT_CATS; } catch { return DEFAULT_CATS; } }
function saveCatsStore(c) { try { localStorage.setItem(CATS_KEY, JSON.stringify(c)); }          catch {} }

// ─── DATA ─────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Brasile","Argentina","Cile","Colombia","Perù","Venezuela",
  "Bolivia","Ecuador","Uruguay","Paraguay","Suriname","Guyana",
  "Cuba","Messico","America Latina (generale)"
];

const TOPICS = [
  { id:"politica",    label:"Politica",        icon:"🏛️" },
  { id:"economia",    label:"Economia",        icon:"📈" },
  { id:"ambiente",    label:"Ambiente",        icon:"🌿" },
  { id:"sicurezza",   label:"Sicurezza",       icon:"🛡️" },
  { id:"diritti",     label:"Diritti Umani",   icon:"⚖️" },
  { id:"energia",     label:"Energia",         icon:"⚡" },
  { id:"societa",     label:"Società",         icon:"👥" },
  { id:"tecnologia",  label:"Tecnologia",      icon:"💻" },
  { id:"diplomazia",  label:"Diplomazia",      icon:"🤝" },
  { id:"criminalita", label:"Criminalità",     icon:"🚨" },
  { id:"sport",       label:"Sport & Cultura", icon:"🏆" },
];

const SOURCES_BY_GROUP = [
  { group:"Internazionali", sources:["El País (América)","Americas Quarterly","BBC Mundo","Financial Times (Latin America)","The Economist (Americas)","The New York Times (Americas)"] },
  { group:"Argentina",      sources:["Infobae","La Nación","Clarín","Página/12"] },
  { group:"Brasile",        sources:["Folha de São Paulo","O Globo","O Estado de São Paulo","Nexo Jornal"] },
  { group:"Colombia",       sources:["El Tiempo","El Espectador","La Silla Vacía"] },
  { group:"Cile",           sources:["La Tercera","El Mercurio"] },
  { group:"Perù",           sources:["El Comercio"] },
  { group:"Messico",        sources:["El Universal","Reforma"] },
  { group:"Cuba",           sources:["14ymedio","CubaNet"] },
  { group:"Specializzati",  sources:["InSight Crime","LatAm Journalism Review"] },
];

const ALL_SOURCES = SOURCES_BY_GROUP.flatMap(g => g.sources);

const DATE_RANGES = [
  { id:"24h",  label:"Ultime 24h" },
  { id:"48h",  label:"Ultime 48h" },
  { id:"week", label:"Ultima settimana" },
  { id:"month",label:"Ultimo mese" },
];

const VOICE_TYPES = [
  { id:"popolo",    label:"Voci del popolo",  icon:"🗣️", desc:"Testimonianze di cittadini, lavoratori, migranti, comunità locali" },
  { id:"politici",  label:"Voci politiche",   icon:"🎙️", desc:"Dichiarazioni di politici, ministri, presidenti" },
  { id:"esperti",   label:"Esperti & Analisti",icon:"🔬",desc:"Analisti, accademici, ONG, think tank" },
  { id:"vittime",   label:"Voci di vittime",  icon:"💔", desc:"Testimonianze dirette di vittime o sopravvissuti" },
  { id:"attivisti", label:"Attivisti",         icon:"✊", desc:"Movimenti sociali, attivisti, gruppi di protesta" },
];

const TOPIC_COLORS = {
  politica:"#e05c6a", economia:"#4ec9b0", ambiente:"#3fb950",
  sicurezza:"#f85149", diritti:"#d29922", energia:"#e8b84b",
  societa:"#bc8cff", tecnologia:"#58a6ff", diplomazia:"#ff9500",
  criminalita:"#ff6b6b", sport:"#fc6b2d", altro:"#8b949e"
};

const FLAG = {
  "Brasile":"🇧🇷","Argentina":"🇦🇷","Cile":"🇨🇱","Colombia":"🇨🇴",
  "Perù":"🇵🇪","Venezuela":"🇻🇪","Bolivia":"🇧🇴","Ecuador":"🇪🇨",
  "Uruguay":"🇺🇾","Paraguay":"🇵🇾","Suriname":"🇸🇷","Guyana":"🇬🇾",
  "Cuba":"🇨🇺","Messico":"🇲🇽","America Latina (generale)":"🌎"
};

const HINT_EXAMPLES = [
  "Sto scrivendo un pezzo sulla crisi migratoria, cerco testimonianze di migranti venezuelani",
  "Mi servono analisi economiche sull'inflazione argentina con dati istituzionali",
  "Cerco reportage con dichiarazioni di politici sulla riforma costituzionale in Cile",
  "Sto investigando il narcotraffico, cerco articoli con voci di vittime e attivisti",
  "Mi servono reportage ambientali con testimonianze di comunità indigene",
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d1117;--s1:#161b22;--s2:#1c2330;
  --bd:#30363d;--bd2:#3d444d;
  --acc:#e8b84b;--acc2:#4ec9b0;--red:#f85149;--grn:#3fb950;--blu:#58a6ff;--pur:#bc8cff;
  --tx:#e6edf3;--tx2:#c9d1d9;--mt:#8b949e;--mt2:#6e7681
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font-family:'IBM Plex Sans',sans-serif;min-height:100vh}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
.login-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(232,184,75,.07),transparent 70%);pointer-events:none}
.login-box{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:42px 40px;width:100%;max-width:400px;position:relative;z-index:1}
.login-logo{text-align:center;margin-bottom:28px}
.login-globe{font-size:40px;display:block;margin-bottom:10px}
.login-h1{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;margin-bottom:4px}
.login-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);letter-spacing:2px;text-transform:uppercase}
.login-div{height:1px;background:var(--bd);margin:22px 0}
.login-label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);display:block;margin-bottom:7px}
.login-input{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:11px 14px;outline:none;transition:border-color .15s;margin-bottom:14px}
.login-input:focus{border-color:var(--acc)}
.login-input::placeholder{color:var(--mt2)}
.login-btn{width:100%;background:var(--acc);border:none;border-radius:7px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:1.5px;padding:13px;text-transform:uppercase;transition:all .15s;margin-top:4px}
.login-btn:hover{background:#f5c96a;transform:translateY(-1px)}
.login-error{background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:6px;color:var(--red);font-size:12px;padding:10px 13px;margin-top:14px;text-align:center;font-family:'IBM Plex Mono',monospace}
.login-foot{text-align:center;margin-top:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2)}

/* ── TOPBAR ── */
.topbar{position:sticky;top:0;z-index:100;background:rgba(13,17,23,.95);backdrop-filter:blur(16px);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:54px;gap:12px}
.tb-brand{display:flex;align-items:center;gap:9px}
.tb-badge{background:var(--acc);color:#000;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:9px;letter-spacing:2px;padding:3px 8px;text-transform:uppercase;border-radius:2px}
.tb-title{font-family:'Playfair Display',serif;font-size:16px}
.tb-nav{display:flex;gap:3px;align-items:center}
.nb{background:transparent;border:1px solid transparent;border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 12px;transition:all .15s;letter-spacing:.5px}
.nb:hover{color:var(--tx);border-color:var(--bd2)}.nb.on{background:var(--s2);color:var(--tx);border-color:var(--acc)}
.nb.logout{color:var(--red)}.nb.logout:hover{border-color:var(--red);background:rgba(248,81,73,.08)}
.nbadge{display:inline-block;background:var(--acc);color:#000;border-radius:10px;font-size:9px;font-weight:700;padding:1px 5px;margin-left:4px}
.user-pill{background:var(--s2);border:1px solid var(--bd2);border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc2);padding:3px 10px}
.tb-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);text-align:right;line-height:1.5}
.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--grn);margin-right:5px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── PAGE ── */
.page{padding:22px 24px 60px;max-width:1500px;margin:0 auto;width:100%}
.panel{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;margin-bottom:16px}

/* ── INTENT BOX ── */
.intent-box{background:linear-gradient(135deg,rgba(232,184,75,.05),rgba(78,201,176,.05));border:1px solid rgba(232,184,75,.25);border-radius:12px;padding:18px 20px;margin-bottom:18px}
.intent-lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--acc);margin-bottom:10px}
.intent-row{display:flex;gap:10px}
.intent-input{flex:1;background:rgba(13,17,23,.6);border:1px solid var(--bd2);border-radius:8px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:12px 16px;outline:none;transition:border-color .15s;resize:none;min-height:56px}
.intent-input:focus{border-color:var(--acc)}
.intent-input::placeholder{color:var(--mt);font-style:italic}
.btn-search{background:var(--acc);border:none;border-radius:8px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:1px;padding:0 22px;text-transform:uppercase;transition:all .15s;white-space:nowrap;min-height:56px;line-height:1.4}
.btn-search:hover:not(:disabled){background:#f5c96a;transform:translateY(-1px)}
.btn-search:disabled{opacity:.45;cursor:not-allowed}
.hints{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.hint{background:rgba(232,184,75,.07);border:1px solid rgba(232,184,75,.15);border-radius:20px;color:var(--mt);cursor:pointer;font-size:11px;padding:4px 11px;transition:all .15s;font-family:'IBM Plex Sans',sans-serif}
.hint:hover{border-color:var(--acc);color:var(--acc)}

/* ── FILTERS ── */
.ftoggle{display:flex;align-items:center;gap:10px;padding:11px 16px;background:var(--s1);border:1px solid var(--bd);border-radius:8px;cursor:pointer;transition:all .15s;user-select:none;margin-bottom:1px}
.ftoggle:hover{border-color:var(--bd2)}.ftoggle.open{border-radius:8px 8px 0 0;border-bottom-color:transparent}
.ftoggle-lbl{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--tx2);flex:1}
.ftoggle-sum{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc);margin-right:8px}
.ftoggle-arr{color:var(--mt);transition:transform .2s;font-size:12px}.ftoggle-arr.open{transform:rotate(180deg)}
.fbody{background:var(--s1);border:1px solid var(--bd);border-top:none;border-radius:0 0 8px 8px;padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:20px;margin-bottom:16px}
.fs-title{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--mt);margin-bottom:10px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:transparent;border:1px solid var(--bd);color:var(--mt);font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;padding:4px 11px;border-radius:20px;cursor:pointer;transition:all .15s}
.chip:hover{border-color:var(--acc);color:var(--tx)}
.chip.on-y{background:var(--acc);border-color:var(--acc);color:#000;font-weight:600}
.chip.on-t{background:rgba(78,201,176,.15);border-color:var(--acc2);color:var(--acc2);font-weight:500}
.chip.on-p{background:rgba(188,140,255,.15);border-color:var(--pur);color:var(--pur);font-weight:500}
.chip.on-b{background:rgba(88,166,255,.12);border-color:var(--blu);color:var(--blu);font-weight:500}
.sg-lbl{font-size:10px;color:var(--mt2);font-family:'IBM Plex Mono',monospace;letter-spacing:.5px;margin:8px 0 4px}

/* ── STATUS ── */
.sbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s1);border:1px solid var(--bd);border-radius:6px;margin-bottom:18px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mt);min-height:40px}
.sbar.loading{border-color:var(--acc)}.sbar.error{border-color:var(--red);color:var(--red)}.sbar.success{border-color:var(--grn);color:var(--grn)}
.spin{width:13px;height:13px;border:2px solid var(--bd);border-top-color:var(--acc);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── BRIEFING ── */
.briefing{background:var(--s1);border:1px solid var(--acc2);border-radius:10px;padding:16px 18px;margin-bottom:18px;font-size:13.5px;line-height:1.75;color:var(--tx2)}
.briefing-ttl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--acc2);margin-bottom:9px}

/* ── RESULTS ── */
.res-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px}
.res-title{font-family:'Playfair Display',serif;font-size:17px}
.res-count{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mt)}
.af-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
.af-pill{display:flex;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--bd2);border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--tx2);padding:3px 10px}
.af-pill button{background:none;border:none;color:var(--mt);cursor:pointer;font-size:12px;line-height:1;padding:0;transition:color .15s}.af-pill button:hover{color:var(--red)}
.af-clear{cursor:pointer;background:rgba(248,81,73,.08);border:1px solid var(--red);border-radius:20px;color:var(--red);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:3px 10px}
.rc-bar{display:flex;align-items:center;gap:7px;margin-bottom:16px;flex-wrap:wrap}
.sb{background:transparent;border:1px solid var(--bd);border-radius:5px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 11px;transition:all .15s}
.sb:hover{color:var(--tx);border-color:var(--mt)}.sb.on{background:var(--s2);color:var(--tx);border-color:var(--acc2)}
.rc-div{width:1px;height:16px;background:var(--bd);margin:0 2px}
.rc-lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2)}

/* ── CARDS ── */
.ngrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;transition:border-color .15s,transform .15s,box-shadow .15s;position:relative;overflow:hidden;display:flex;flex-direction:column}
.card:hover{border-color:var(--acc);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--tc,var(--acc))}
.card-top{display:flex;align-items:flex-start;gap:6px;margin-bottom:9px;flex-wrap:wrap}
.csrc{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc);letter-spacing:.5px;background:rgba(232,184,75,.09);padding:2px 7px;border-radius:3px;white-space:nowrap}
.ctopic{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
.cctry{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);white-space:nowrap}
.cdate-top{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2);white-space:nowrap}
.ctitle{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;line-height:1.45;margin-bottom:8px;flex:1}
.csum{font-size:12.5px;line-height:1.65;color:var(--mt);margin-bottom:10px}
.voices{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.vbadge{font-size:10px;padding:2px 8px;border-radius:3px;font-family:'IBM Plex Mono',monospace;display:flex;align-items:center;gap:3px}
.vb-popolo{background:rgba(188,140,255,.12);color:var(--pur);border:1px solid rgba(188,140,255,.25)}
.vb-politici{background:rgba(248,81,73,.1);color:var(--red);border:1px solid rgba(248,81,73,.2)}
.vb-esperti{background:rgba(88,166,255,.1);color:var(--blu);border:1px solid rgba(88,166,255,.2)}
.vb-vittime{background:rgba(252,107,45,.1);color:#fc6b2d;border:1px solid rgba(252,107,45,.2)}
.vb-attivisti{background:rgba(63,185,80,.1);color:var(--grn);border:1px solid rgba(63,185,80,.2)}
.cfoot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bd);padding-top:10px;gap:8px;flex-wrap:wrap;margin-top:auto}
.cbtns{display:flex;gap:6px;align-items:center}
.btn-link{background:transparent;border:1px solid var(--bd2);border-radius:5px;color:var(--blu);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:4px}.btn-link:hover{border-color:var(--blu);background:rgba(88,166,255,.08)}
.btn-save{background:transparent;border:1px solid var(--bd2);border-radius:5px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;transition:all .15s;display:inline-flex;align-items:center;gap:4px}.btn-save:hover{border-color:var(--acc);color:var(--acc)}.btn-save.saved{border-color:var(--acc);color:var(--acc);background:rgba(232,184,75,.08)}
.rdots{display:flex;gap:3px;align-items:center}.rdot{width:5px;height:5px;border-radius:50%;background:var(--bd)}.rdot.on{background:var(--acc2)}

/* ── EMPTY ── */
.empty{text-align:center;padding:60px 20px;color:var(--mt)}.empty .ei{font-size:42px;margin-bottom:13px}
.empty h3{font-family:'Playfair Display',serif;font-size:18px;color:var(--tx);margin-bottom:7px}.empty p{font-size:13px;line-height:1.65;max-width:440px;margin:0 auto}

/* ── ARCHIVE ── */
.arch-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.arch-title{font-family:'Playfair Display',serif;font-size:22px}
.catmgr{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.cchip{display:flex;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--bd);border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all .15s;color:var(--tx2)}.cchip:hover{border-color:var(--acc2)}.cchip.on{border-color:var(--acc2);color:var(--acc2);background:rgba(78,201,176,.08)}
.cdel{background:none;border:none;color:var(--mt);cursor:pointer;font-size:13px;line-height:1;padding:0 0 0 2px;transition:color .15s}.cdel:hover{color:var(--red)}
.newcat-row{display:flex;gap:8px;margin-bottom:16px}
.cat-inp{background:var(--s1);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:8px 13px;outline:none;width:220px;transition:border-color .15s}.cat-inp:focus{border-color:var(--acc2)}
.btn-addcat{background:var(--s2);border:1px solid var(--bd2);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;transition:all .15s}.btn-addcat:hover{border-color:var(--acc2);color:var(--acc2)}
.asec{margin-bottom:26px}.asec-ttl{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);margin-bottom:10px;display:flex;align-items:center;gap:8px}.asec-ttl span{color:var(--acc)}
.acard{display:flex;align-items:flex-start;gap:13px;background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:14px 16px;margin-bottom:8px;transition:border-color .15s}.acard:hover{border-color:var(--bd2)}
.acard-body{flex:1}.acard-ttl{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;margin-bottom:5px;line-height:1.4}
.acard-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);display:flex;gap:10px;flex-wrap:wrap;margin-bottom:5px}
.acard-sum{font-size:12px;color:var(--mt);line-height:1.55}
.acard-acts{display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0}
.btn-move{background:var(--s2);border:1px solid var(--bd);border-radius:5px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;transition:all .15s;white-space:nowrap}.btn-move:hover{border-color:var(--acc2);color:var(--acc2)}
.btn-rm{background:transparent;border:none;color:var(--mt2);cursor:pointer;font-size:17px;line-height:1;transition:color .15s}.btn-rm:hover{color:var(--red)}

/* ── MODAL ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px}
.modal{background:var(--s1);border:1px solid var(--bd2);border-radius:12px;padding:22px 24px;min-width:280px;max-width:360px}
.modal-ttl{font-family:'Playfair Display',serif;font-size:17px;margin-bottom:14px}
.modal-cats{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
.modal-cat{background:var(--s2);border:1px solid var(--bd);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:9px 14px;text-align:left;transition:all .15s}.modal-cat:hover{border-color:var(--acc2);color:var(--acc2)}
.modal-cancel{background:transparent;border:1px solid var(--bd);border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 16px;width:100%;transition:all .15s}.modal-cancel:hover{color:var(--tx)}

.api-warn{background:rgba(232,184,75,.08);border:1px solid rgba(232,184,75,.3);border-radius:8px;padding:14px 16px;margin-bottom:18px;font-size:13px;color:var(--acc);line-height:1.6}
.api-warn code{background:rgba(232,184,75,.15);padding:1px 6px;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:12px}
.api-warn a{color:var(--blu)}

@media(max-width:768px){.ngrid{grid-template-columns:1fr}.topbar{padding:0 14px}.page{padding:14px 14px 50px}.tb-title{display:none}.fbody{grid-template-columns:1fr}.intent-row{flex-direction:column}.btn-search{min-height:44px;padding:12px}}
`;

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function RDots({ s }) {
  const n = Math.max(1, Math.min(5, Math.round((s || 5) / 2)));
  return <div className="rdots">{[1,2,3,4,5].map(i => <div key={i} className={`rdot ${i<=n?"on":""}`}/>)}</div>;
}

function VBadge({ type }) {
  const v = VOICE_TYPES.find(x => x.id === type);
  if (!v) return null;
  return <span className={`vbadge vb-${type}`}>{v.icon} {v.label}</span>;
}

function Modal({ title, cats, onSelect, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-ttl">{title}</div>
        <div className="modal-cats">{cats.map(c => <button key={c} className="modal-cat" onClick={() => onSelect(c)}>{c}</button>)}</div>
        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}

function NewsCard({ a, onSave, saved }) {
  const color = TOPIC_COLORS[a.topic] || TOPIC_COLORS.altro;
  const to = TOPICS.find(x => x.id === a.topic);
  const hasUrl = a.url && a.url !== "#" && a.url !== "";
  return (
    <div className="card" style={{"--tc": color}}>
      <div className="card-top">
        <span className="csrc">{a.source}</span>
        <span className="ctopic" style={{background:color+"22",color}}>{to?.icon} {to?.label||a.topic}</span>
        <span className="cctry">{FLAG[a.country]||"🌎"} {a.country}</span>
        <span className="cdate-top">{a.date}</span>
      </div>
      <div className="ctitle">{a.title}</div>
      <div className="csum">{a.summary}</div>
      {a.voices?.length > 0 && (
        <div className="voices">{a.voices.map(v => <VBadge key={v} type={v}/>)}</div>
      )}
      <div className="cfoot">
        <RDots s={a.relevance}/>
        <div className="cbtns">
          {hasUrl
            ? <a className="btn-link" href={a.url} target="_blank" rel="noreferrer">↗ Articolo</a>
            : <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"var(--mt2)"}}>—</span>
          }
          <button className={`btn-save ${saved?"saved":""}`} onClick={() => onSave(a)}>
            {saved ? "★ Salvato" : "☆ Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArchivePage({ archive, cats, onRemove, onMove, onAddCat, onRemoveCat }) {
  const [activeCat, setActiveCat] = useState("tutte");
  const [newCat, setNewCat] = useState("");
  const addCat = () => { const n = newCat.trim(); if (n && !cats.includes(n)) { onAddCat(n); setNewCat(""); } };
  const sections = activeCat === "tutte" ? cats : [activeCat];
  return (
    <div className="page">
      <div className="arch-hdr">
        <div className="arch-title">📚 Archivio & Preferiti</div>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"var(--mt)"}}>{archive.length} articoli salvati</span>
      </div>
      <div className="panel">
        <div className="fs-title" style={{marginBottom:"12px"}}>▸ Gestisci categorie</div>
        <div className="newcat-row">
          <input className="cat-inp" placeholder="Nuova categoria…" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}/>
          <button className="btn-addcat" onClick={addCat}>+ Aggiungi</button>
        </div>
        <div className="catmgr">
          <div className={`cchip ${activeCat==="tutte"?"on":""}`} onClick={()=>setActiveCat("tutte")}>
            Tutte <span style={{color:"var(--mt)",fontSize:"11px"}}>({archive.length})</span>
          </div>
          {cats.map(c => {
            const n = archive.filter(a=>a.category===c).length;
            return (
              <div key={c} className={`cchip ${activeCat===c?"on":""}`} onClick={()=>setActiveCat(c)}>
                {c} <span style={{color:"var(--mt)",fontSize:"11px"}}>({n})</span>
                <button className="cdel" onClick={e=>{e.stopPropagation();onRemoveCat(c)}}>×</button>
              </div>
            );
          })}
        </div>
      </div>
      {archive.length===0 && (
        <div className="empty"><div className="ei">📌</div><h3>Nessun articolo salvato</h3><p>Premi <strong>☆ Salva</strong> su un articolo per aggiungerlo.</p></div>
      )}
      {sections.map(cat => {
        const items = archive.filter(a=>a.category===cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="asec">
            <div className="asec-ttl">{cat} <span>({items.length})</span></div>
            {items.map(a => {
              const color = TOPIC_COLORS[a.topic]||TOPIC_COLORS.altro;
              const to = TOPICS.find(x=>x.id===a.topic);
              const hasUrl = a.url && a.url !== "#" && a.url !== "";
              return (
                <div key={a.savedAt} className="acard">
                  <div className="acard-body">
                    <div className="acard-ttl">{a.title}</div>
                    <div className="acard-meta">
                      <span>{FLAG[a.country]||"🌎"} {a.country}</span>
                      <span style={{color}}>{to?.icon} {to?.label||a.topic}</span>
                      <span>{a.source}</span><span>{a.date}</span>
                    </div>
                    {a.voices?.length>0&&<div className="voices" style={{marginTop:"5px"}}>{a.voices.map(v=><VBadge key={v} type={v}/>)}</div>}
                    <div className="acard-sum">{a.summary}</div>
                  </div>
                  <div className="acard-acts">
                    <button className="btn-rm" onClick={()=>onRemove(a)}>×</button>
                    {hasUrl&&<a className="btn-link" href={a.url} target="_blank" rel="noreferrer">↗</a>}
                    <button className="btn-move" onClick={()=>onMove(a)}>📁 Sposta</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const found = USERS.find(u => u.username === username.trim() && u.password === password);
    if (found) { onLogin(found.username); }
    else { setError("Credenziali non valide. Riprova."); setPassword(""); }
  };
  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <span className="login-globe">🌎</span>
          <div className="login-h1">Sud America Monitor</div>
          <div className="login-sub">Rassegna Stampa · Accesso Riservato</div>
        </div>
        <div className="login-div"/>
        <label className="login-label">Username</label>
        <input className="login-input" type="text" placeholder="Inserisci username" value={username}
          onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus/>
        <label className="login-label">Password</label>
        <input className="login-input" type="password" placeholder="Inserisci password" value={password}
          onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        <button className="login-btn" onClick={submit}>→ Accedi</button>
        {error && <div className="login-error">{error}</div>}
        <div className="login-foot">Accesso riservato agli utenti autorizzati</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]           = useState(loadSession);
  const [view, setView]           = useState("monitor");
  const [intent, setIntent]       = useState("");
  const [selC, setSelC]           = useState([]);
  const [selT, setSelT]           = useState([]);
  const [selS, setSelS]           = useState([]);
  const [selV, setSelV]           = useState([]);
  const [selDate, setSelDate]     = useState("");
  const [filtersOpen, setFO]      = useState(true);
  const [articles, setArticles]   = useState([]);
  const [summary, setSummary]     = useState("");
  const [status, setStatus]       = useState({ type:"idle", msg:"" });
  const [lastFetch, setLastFetch] = useState(null);
  const [sortBy, setSortBy]       = useState("relevance");
  const [archive, setArchive]     = useState(loadArchive);
  const [cats, setCats]           = useState(loadCats);
  const [saveModal, setSaveModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  // result filters
  const [rfT, setRfT] = useState([]);
  const [rfC, setRfC] = useState([]);
  const [rfS, setRfS] = useState([]);
  const [rfV, setRfV] = useState([]);

  useEffect(()=>saveArchive(archive),[archive]);
  useEffect(()=>saveCatsStore(cats),[cats]);

  const today = new Date().toLocaleDateString("it-IT",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const toggle = (set, val) => set(p => p.includes(val) ? p.filter(x=>x!==val) : [...p,val]);

  const handleLogin  = u => { saveSession(u); setUser(u); };
  const handleLogout = () => { clearSession(); setUser(""); };

  const filterSummary = [
    selC.length && `${selC.length} paesi`,
    selT.length && `${selT.length} temi`,
    selS.length && `${selS.length} testate`,
    selV.length && `${selV.length} voci`,
    selDate && DATE_RANGES.find(d=>d.id===selDate)?.label,
  ].filter(Boolean).join(" · ");

  const fetchNews = useCallback(async () => {
    if (!API_KEY) { setStatus({ type:"error", msg:"API key mancante. Imposta VITE_ANTHROPIC_API_KEY su Netlify." }); return; }
    const cStr = selC.length>0 ? selC.join(", ") : "tutti i paesi del Sud America, Cuba e Messico";
    const tStr = selT.length>0 ? selT.map(t=>TOPICS.find(x=>x.id===t)?.label).join(", ") : "tutte le tematiche";
    const sStr = selS.length>0 ? selS.join(", ") : ALL_SOURCES.join(", ");
    const vStr = selV.length>0 ? selV.map(v=>VOICE_TYPES.find(x=>x.id===v)?.desc).join("; ") : "";
    const dStr = selDate ? DATE_RANGES.find(d=>d.id===selDate)?.label : "ultime 48 ore";

    setStatus({ type:"loading", msg:"🔎 Ricerca notizie reali in corso con web search…" });
    setArticles([]); setSummary(""); setRfT([]); setRfC([]); setRfS([]); setRfV([]);

    const voiceNote = vStr
      ? `\nPriorità SPECIALE: cerca articoli con ${vStr}.`
      : `\nPer ogni articolo identifica voci presenti tra: popolo (cittadini/lavoratori), politici, esperti, vittime, attivisti.`;
    const intentNote = intent.trim()
      ? `\n\nBISOGNO GIORNALISTICO: "${intent.trim()}"\nSeleziona articoli utili a questo bisogno. Privilegia quelli che contengono il tipo di fonti e voci richieste.`
      : "";

    const prompt = `Sei un sistema di monitoraggio giornalistico specializzato in Sud America, Cuba e Messico. Oggi è ${today}.

Usa il web search per trovare NOTIZIE REALI e RECENTI (${dStr}):
- Paesi: ${cStr}
- Tematiche: ${tStr}
- Testate PRIORITARIE: ${sStr}
${voiceNote}${intentNote}

REGOLA URL: fornisci URL DIRETTO all'articolo specifico (non homepage). Se non trovato, stringa vuota.

Trova 10-14 articoli. Rispondi SOLO con JSON valido senza backtick:
{
  "summary": "Briefing giornalistico 3-5 frasi: stato della regione, temi emergenti, tipi di voci disponibili",
  "articles": [
    {
      "id": 1,
      "title": "Titolo tradotto in italiano",
      "summary": "Riassunto 2-3 frasi includendo chi parla e cosa dice",
      "country": "uno tra: ${COUNTRIES.join(", ")}",
      "topic": "politica|economia|ambiente|sicurezza|diritti|energia|societa|tecnologia|diplomazia|criminalita|sport|altro",
      "source": "Nome testata",
      "date": "GG/MM/AAAA",
      "relevance": 8,
      "url": "URL diretto articolo o stringa vuota",
      "voices": ["popolo","politici","esperti","vittime","attivisti"]
    }
  ]
}
Il campo voices deve contenere solo le voci EFFETTIVAMENTE presenti nell'articolo.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:5000,
          system:"Sei un assistente di monitoraggio geopolitico e giornalistico. Rispondi SOLO con JSON valido senza markdown.",
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:prompt }]
        })
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const raw = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      let parsed;
      try {
        const clean = raw.replace(/```json|```/g,"").trim();
        parsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}")+1));
      } catch { throw new Error("Errore parsing risposta JSON"); }
      setArticles(parsed.articles||[]);
      setSummary(parsed.summary||"");
      setLastFetch(new Date().toLocaleTimeString("it-IT"));
      setStatus({ type:"success", msg:`✓ ${parsed.articles?.length||0} articoli trovati — ${new Date().toLocaleTimeString("it-IT")}` });
    } catch(e) {
      setStatus({ type:"error", msg:`Errore: ${e.message}` });
    }
  }, [selC, selT, selS, selV, selDate, intent, today]);

  // client-side cumulative filter
  const filtered = articles.filter(a => {
    if (rfT.length && !rfT.includes(a.topic))   return false;
    if (rfC.length && !rfC.includes(a.country)) return false;
    if (rfS.length && !rfS.includes(a.source))  return false;
    if (rfV.length && !rfV.some(v=>a.voices?.includes(v))) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => {
    if (sortBy==="relevance") return (b.relevance||0)-(a.relevance||0);
    if (sortBy==="date") {
      const p = d => { if(!d)return 0; const s=d.split("/"); return s.length===3?new Date(s[2],s[1]-1,s[0]).getTime():0; };
      return p(b.date)-p(a.date);
    }
    if (sortBy==="source") return (a.source||"").localeCompare(b.source||"");
    return 0;
  });

  const avT = [...new Set(articles.map(a=>a.topic))];
  const avC = [...new Set(articles.map(a=>a.country))];
  const avS = [...new Set(articles.map(a=>a.source))];
  const avV = [...new Set(articles.flatMap(a=>a.voices||[]))];

  const pills = [
    ...rfT.map(t=>({key:"t:"+t,label:TOPICS.find(x=>x.id===t)?.label||t,rm:()=>setRfT(p=>p.filter(x=>x!==t))})),
    ...rfC.map(c=>({key:"c:"+c,label:`${FLAG[c]||""} ${c}`,rm:()=>setRfC(p=>p.filter(x=>x!==c))})),
    ...rfS.map(s=>({key:"s:"+s,label:s,rm:()=>setRfS(p=>p.filter(x=>x!==s))})),
    ...rfV.map(v=>({key:"v:"+v,label:VOICE_TYPES.find(x=>x.id===v)?.label||v,rm:()=>setRfV(p=>p.filter(x=>x!==v))})),
  ];

  const inArchive = a => archive.some(x=>x.title===a.title&&x.source===a.source);
  const confirmSave = cat => { setArchive(p=>[...p,{...saveModal,category:cat,savedAt:Date.now()}]); setSaveModal(null); };
  const confirmMove = cat => { setArchive(p=>p.map(a=>a.savedAt===moveModal.savedAt?{...a,category:cat}:a)); setMoveModal(null); };

  if (!user) return <><style>{CSS}</style><LoginPage onLogin={handleLogin}/></>;

  return (
    <>
      <style>{CSS}</style>

      <div className="topbar">
        <div className="tb-brand">
          <span className="tb-badge">Monitor</span>
          <span className="tb-title">Sud America · Rassegna Stampa</span>
        </div>
        <div className="tb-nav">
          <button className={`nb ${view==="monitor"?"on":""}`} onClick={()=>setView("monitor")}>📰 Rassegna</button>
          <button className={`nb ${view==="archive"?"on":""}`} onClick={()=>setView("archive")}>
            📚 Archivio {archive.length>0&&<span className="nbadge">{archive.length}</span>}
          </button>
          <span className="user-pill">👤 {user}</span>
          <button className="nb logout" onClick={handleLogout}>⏏ Esci</button>
        </div>
        <div className="tb-meta"><span className="pulse"/>{today}{lastFetch&&<><br/>Agg. {lastFetch}</>}</div>
      </div>

      {saveModal && <Modal title="Salva in categoria" cats={cats} onSelect={confirmSave} onClose={()=>setSaveModal(null)}/>}
      {moveModal && <Modal title="Sposta in categoria" cats={cats} onSelect={confirmMove} onClose={()=>setMoveModal(null)}/>}

      {view==="archive" && (
        <ArchivePage archive={archive} cats={cats}
          onRemove={a=>setArchive(p=>p.filter(x=>x.savedAt!==a.savedAt))}
          onMove={a=>setMoveModal(a)}
          onAddCat={n=>setCats(p=>[...p,n])}
          onRemoveCat={c=>{setCats(p=>p.filter(x=>x!==c));setArchive(p=>p.map(a=>a.category===c?{...a,category:"Altro"}:a));}}
        />
      )}

      {view==="monitor" && (
        <div className="page">
          {!API_KEY && (
            <div className="api-warn">
              ⚠️ <strong>API Key mancante.</strong> Su Netlify vai in <em>Site configuration → Environment variables</em> e aggiungi:<br/>
              <code>VITE_ANTHROPIC_API_KEY</code> = la tua chiave <code>sk-ant-...</code><br/>
              Poi riavvia il deploy. Ottieni la chiave su <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a>
            </div>
          )}

          {/* INTENT */}
          <div className="intent-box">
            <div className="intent-lbl">🎯 Bisogno giornalistico o tema di ricerca</div>
            <div className="intent-row">
              <textarea className="intent-input" rows={2}
                placeholder='Es: «Sto scrivendo un pezzo sulla crisi migratoria e cerco testimonianze di migranti venezuelani» oppure «Mi servono analisi economiche sull'inflazione argentina»'
                value={intent} onChange={e=>setIntent(e.target.value)}/>
              <button className="btn-search" onClick={fetchNews} disabled={status.type==="loading"}>
                {status.type==="loading"?"⏳\nCerco":"▶\nCerca"}
              </button>
            </div>
            <div className="hints">
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"var(--mt2)"}}>Esempi:</span>
              {HINT_EXAMPLES.map((h,i)=><button key={i} className="hint" onClick={()=>setIntent(h)}>{h.slice(0,55)}…</button>)}
            </div>
          </div>

          {/* FILTERS */}
          <div>
            <div className={`ftoggle ${filtersOpen?"open":""}`} onClick={()=>setFO(p=>!p)}>
              <span className="ftoggle-lbl">⚙ Filtri di ricerca</span>
              {filterSummary && <span className="ftoggle-sum">{filterSummary}</span>}
              <span className={`ftoggle-arr ${filtersOpen?"open":""}`}>▼</span>
            </div>
            {filtersOpen && (
              <div className="fbody">
                <div>
                  <div className="fs-title">🌎 Paese</div>
                  <div className="chips">{COUNTRIES.map(c=><button key={c} className={`chip ${selC.includes(c)?"on-y":""}`} onClick={()=>toggle(setSelC,c)}>{FLAG[c]} {c}</button>)}</div>
                </div>
                <div>
                  <div className="fs-title">📂 Tematica</div>
                  <div className="chips">{TOPICS.map(t=><button key={t.id} className={`chip ${selT.includes(t.id)?"on-y":""}`} onClick={()=>toggle(setSelT,t.id)}>{t.icon} {t.label}</button>)}</div>
                </div>
                <div>
                  <div className="fs-title">🗣️ Tipo di voci cercate</div>
                  <div className="chips">{VOICE_TYPES.map(v=><button key={v.id} className={`chip ${selV.includes(v.id)?"on-p":""}`} onClick={()=>toggle(setSelV,v.id)} title={v.desc}>{v.icon} {v.label}</button>)}</div>
                </div>
                <div>
                  <div className="fs-title">📅 Periodo</div>
                  <div className="chips">{DATE_RANGES.map(d=><button key={d.id} className={`chip ${selDate===d.id?"on-b":""}`} onClick={()=>setSelDate(p=>p===d.id?"":d.id)}>{d.label}</button>)}</div>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <div className="fs-title">📰 Testate <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:"10px",color:"var(--mt2)"}}>— nessuna selezione = tutte</span></div>
                  {SOURCES_BY_GROUP.map(g=>(
                    <div key={g.group}>
                      <div className="sg-lbl">{g.group}</div>
                      <div className="chips" style={{marginBottom:"8px"}}>
                        {g.sources.map(s=><button key={s} className={`chip ${selS.includes(s)?"on-t":""}`} onClick={()=>toggle(setSelS,s)}>{s}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STATUS */}
          <div className={`sbar ${status.type}`}>
            {status.type==="loading"&&<div className="spin"/>}
            {status.type==="idle"&&<span>🌐 Descrivi il tuo bisogno e/o seleziona i filtri, poi premi Cerca.</span>}
            {status.type!=="idle"&&<span>{status.msg}</span>}
          </div>

          {/* BRIEFING */}
          {summary&&<div className="briefing"><div className="briefing-ttl">◈ Briefing Giornalistico</div>{summary}</div>}

          {/* RESULTS */}
          {articles.length>0&&(
            <>
              <div className="res-hdr">
                <div className="res-title">Risultati</div>
                <div className="res-count">{sorted.length}/{articles.length} articoli</div>
              </div>
              {pills.length>0&&(
                <div className="af-bar">
                  <span className="rc-lbl">Filtri attivi:</span>
                  {pills.map(p=><div key={p.key} className="af-pill">{p.label}<button onClick={p.rm}>×</button></div>)}
                  {pills.length>1&&<button className="af-clear" onClick={()=>{setRfT([]);setRfC([]);setRfS([]);setRfV([]);}}>× Rimuovi tutti</button>}
                </div>
              )}
              <div className="rc-bar">
                <span className="rc-lbl">Ordina:</span>
                {[{id:"relevance",l:"Rilevanza"},{id:"date",l:"Data"},{id:"source",l:"Testata"}].map(s=>(
                  <button key={s.id} className={`sb ${sortBy===s.id?"on":""}`} onClick={()=>setSortBy(s.id)}>{s.l}</button>
                ))}
                <div className="rc-div"/>
                <span className="rc-lbl">Filtra:</span>
                {avT.map(t=>{const to=TOPICS.find(x=>x.id===t);return <button key={t} className={`sb ${rfT.includes(t)?"on":""}`} onClick={()=>toggle(setRfT,t)}>{to?.icon} {to?.label||t}</button>;})}
                {avV.map(v=>{const vo=VOICE_TYPES.find(x=>x.id===v);return <button key={v} className={`sb ${rfV.includes(v)?"on":""}`} onClick={()=>toggle(setRfV,v)}>{vo?.icon} {vo?.label||v}</button>;})}
                {avC.slice(0,6).map(c=><button key={c} className={`sb ${rfC.includes(c)?"on":""}`} onClick={()=>toggle(setRfC,c)}>{FLAG[c]} {c}</button>)}
                {avS.slice(0,5).map(s=><button key={s} className={`sb ${rfS.includes(s)?"on":""}`} onClick={()=>toggle(setRfS,s)}>{s}</button>)}
              </div>
              <div className="ngrid">
                {sorted.map(a=><NewsCard key={a.id} a={a} onSave={a=>{if(!inArchive(a))setSaveModal(a)}} saved={inArchive(a)}/>)}
              </div>
              {sorted.length===0&&<div className="empty"><div className="ei">🔍</div><h3>Nessun risultato con questi filtri</h3><p>Rimuovi qualche filtro per vedere più articoli.</p></div>}
            </>
          )}

          {articles.length===0&&status.type!=="loading"&&status.type!=="error"&&(
            <div className="empty">
              <div className="ei">🌎</div>
              <h3>Pronto per la ricerca</h3>
              <p>Descrivi il tuo bisogno giornalistico oppure seleziona i filtri, poi premi <strong>▶ Cerca</strong> per avviare la ricerca in tempo reale.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
