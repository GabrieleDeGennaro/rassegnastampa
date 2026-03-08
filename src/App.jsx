import { useState, useCallback, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

const USERS = [
  { username: "admin",     password: "sudamerica2025" },
  { username: "redazione", password: "monitor2025"   },
];

const SESSION_KEY = "sudamerica_session_v1";
const ARCHIVE_KEY = "sudamerica_archive_v5";
const CATS_KEY    = "sudamerica_cats_v5";
const DEFAULT_CATS = ["Da leggere","Inchiesta","Testimonianze","Geopolitica","Economia","Ambiente","Altro"];

function loadSession()    { try { return localStorage.getItem(SESSION_KEY) || ""; } catch { return ""; } }
function saveSession(u)   { try { localStorage.setItem(SESSION_KEY, u); } catch {} }
function clearSession()   { try { localStorage.removeItem(SESSION_KEY); } catch {} }
function loadArchive()    { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); } catch { return []; } }
function saveArchive(a)   { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); } catch {} }
function loadCats()       { try { return JSON.parse(localStorage.getItem(CATS_KEY) || "null") || DEFAULT_CATS; } catch { return DEFAULT_CATS; } }
function saveCatsStore(c) { try { localStorage.setItem(CATS_KEY, JSON.stringify(c)); } catch {} }

const COUNTRIES = [
  "Brasile","Argentina","Cile","Colombia","Peru","Venezuela",
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
  { id:"societa",     label:"Societa",         icon:"👥" },
  { id:"tecnologia",  label:"Tecnologia",      icon:"💻" },
  { id:"diplomazia",  label:"Diplomazia",      icon:"🤝" },
  { id:"criminalita", label:"Criminalita",     icon:"🚨" },
  { id:"sport",       label:"Sport & Cultura", icon:"🏆" },
];

const SOURCES_BY_GROUP = [
  { group:"Internazionali", sources:["El Pais (America)","Americas Quarterly","BBC Mundo","Financial Times (Latin America)","The Economist (Americas)","The New York Times (Americas)"] },
  { group:"Argentina",      sources:["Infobae","La Nacion","Clarin","Pagina/12"] },
  { group:"Brasile",        sources:["Folha de Sao Paulo","O Globo","O Estado de Sao Paulo","Nexo Jornal"] },
  { group:"Colombia",       sources:["El Tiempo","El Espectador","La Silla Vacia"] },
  { group:"Cile",           sources:["La Tercera","El Mercurio"] },
  { group:"Peru",           sources:["El Comercio"] },
  { group:"Messico",        sources:["El Universal","Reforma"] },
  { group:"Cuba",           sources:["14ymedio","CubaNet"] },
  { group:"Specializzati",  sources:["InSight Crime","LatAm Journalism Review"] },
];

const ALL_SOURCES = SOURCES_BY_GROUP.flatMap(g => g.sources);

const DATE_RANGES = [
  { id:"24h",   label:"Ultime 24h" },
  { id:"48h",   label:"Ultime 48h" },
  { id:"week",  label:"Settimana" },
  { id:"month", label:"Mese" },
];

const VOICE_TYPES = [
  { id:"popolo",    label:"Popolo",    icon:"🗣️", desc:"Cittadini, lavoratori, migranti, comunita locali" },
  { id:"politici",  label:"Politici",  icon:"🎙️", desc:"Politici, ministri, presidenti" },
  { id:"esperti",   label:"Esperti",   icon:"🔬", desc:"Analisti, accademici, ONG, think tank" },
  { id:"vittime",   label:"Vittime",   icon:"💔", desc:"Testimonianze dirette di vittime" },
  { id:"attivisti", label:"Attivisti", icon:"✊", desc:"Movimenti sociali e gruppi di protesta" },
];

const TOPIC_COLORS = {
  politica:"#e05c6a", economia:"#4ec9b0", ambiente:"#3fb950",
  sicurezza:"#f85149", diritti:"#d29922", energia:"#e8b84b",
  societa:"#bc8cff", tecnologia:"#58a6ff", diplomazia:"#ff9500",
  criminalita:"#ff6b6b", sport:"#fc6b2d", altro:"#8b949e"
};

const FLAG = {
  "Brasile":"🇧🇷","Argentina":"🇦🇷","Cile":"🇨🇱","Colombia":"🇨🇴",
  "Peru":"🇵🇪","Venezuela":"🇻🇪","Bolivia":"🇧🇴","Ecuador":"🇪🇨",
  "Uruguay":"🇺🇾","Paraguay":"🇵🇾","Suriname":"🇸🇷","Guyana":"🇬🇾",
  "Cuba":"🇨🇺","Messico":"🇲🇽","America Latina (generale)":"🌎"
};

const HINTS = [
  "Sto scrivendo un pezzo sulla crisi migratoria, cerco testimonianze di migranti venezuelani",
  "Mi servono analisi economiche sull'inflazione argentina con dati istituzionali",
  "Cerco reportage con dichiarazioni di politici sulla riforma costituzionale in Cile",
  "Sto investigando il narcotraffico, cerco articoli con voci di vittime e attivisti",
  "Mi servono reportage ambientali con testimonianze di comunita indigene",
];

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d1117;--s1:#161b22;--s2:#1c2330;--s3:#21262d;
  --bd:#30363d;--bd2:#3d444d;
  --acc:#e8b84b;--acc2:#4ec9b0;--red:#f85149;--grn:#3fb950;--blu:#58a6ff;--pur:#bc8cff;
  --tx:#e6edf3;--tx2:#c9d1d9;--mt:#8b949e;--mt2:#6e7681;
  --sidebar:260px;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font-family:'IBM Plex Sans',sans-serif;min-height:100vh}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
.login-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(232,184,75,.08),transparent 70%);pointer-events:none}
.login-box{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:44px 42px;width:100%;max-width:400px;position:relative;z-index:1;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.login-globe{text-align:center;font-size:44px;margin-bottom:12px}
.login-h1{font-family:'Playfair Display',serif;font-size:23px;font-weight:600;margin-bottom:4px;text-align:center}
.login-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:28px}
.login-div{height:1px;background:var(--bd);margin-bottom:24px}
.login-lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);display:block;margin-bottom:6px}
.login-inp{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:11px 14px;outline:none;transition:border-color .15s;margin-bottom:14px}
.login-inp:focus{border-color:var(--acc)}
.login-inp::placeholder{color:var(--mt2)}
.login-btn{width:100%;background:var(--acc);border:none;border-radius:7px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:1.5px;padding:13px;text-transform:uppercase;transition:all .15s;margin-top:4px}
.login-btn:hover{background:#f5c96a;transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,184,75,.3)}
.login-err{background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:6px;color:var(--red);font-size:12px;padding:10px 13px;margin-top:14px;text-align:center;font-family:'IBM Plex Mono',monospace}
.login-foot{text-align:center;margin-top:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2)}

/* ── TOPBAR ── */
.topbar{position:sticky;top:0;z-index:200;background:rgba(13,17,23,.96);backdrop-filter:blur(16px);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 20px;height:52px;gap:12px}
.tb-brand{display:flex;align-items:center;gap:9px;flex:1}
.tb-badge{background:var(--acc);color:#000;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:8px;letter-spacing:2.5px;padding:3px 8px;text-transform:uppercase;border-radius:2px;flex-shrink:0}
.tb-title{font-family:'Playfair Display',serif;font-size:15px;white-space:nowrap}
.tb-nav{display:flex;gap:2px;align-items:center}
.nb{background:transparent;border:1px solid transparent;border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 11px;transition:all .15s;letter-spacing:.4px;white-space:nowrap}
.nb:hover{color:var(--tx);border-color:var(--bd2)}.nb.on{background:var(--s2);color:var(--tx);border-color:var(--acc)}
.nb.logout{color:var(--red)}.nb.logout:hover{border-color:var(--red);background:rgba(248,81,73,.08)}
.nbadge{display:inline-block;background:var(--acc);color:#000;border-radius:10px;font-size:9px;font-weight:700;padding:1px 5px;margin-left:4px}
.user-pill{background:var(--s2);border:1px solid var(--bd2);border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc2);padding:3px 10px;white-space:nowrap}
.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--grn);margin-right:5px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── APP SHELL ── */
.shell{display:flex;min-height:calc(100vh - 52px)}

/* ── SIDEBAR ── */
.sidebar{width:var(--sidebar);flex-shrink:0;background:var(--s1);border-right:1px solid var(--bd);padding:0;display:flex;flex-direction:column;position:sticky;top:52px;height:calc(100vh - 52px);overflow-y:auto;overflow-x:hidden}
.sidebar::-webkit-scrollbar{width:4px}
.sidebar::-webkit-scrollbar-track{background:transparent}
.sidebar::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:2px}

.sb-section{border-bottom:1px solid var(--bd);padding:14px 16px}
.sb-section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;cursor:pointer;user-select:none}
.sb-section-title{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:var(--mt)}
.sb-section-arr{font-size:10px;color:var(--mt2);transition:transform .2s}.sb-section-arr.open{transform:rotate(180deg)}
.sb-clear{background:none;border:none;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--mt2);cursor:pointer;letter-spacing:.5px;transition:color .15s;padding:0}
.sb-clear:hover{color:var(--red)}

/* SIDEBAR CHECKBOXES */
.sb-items{display:flex;flex-direction:column;gap:2px}
.sb-item{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:5px;cursor:pointer;transition:background .12s;user-select:none}
.sb-item:hover{background:var(--s2)}
.sb-item.on{background:rgba(232,184,75,.08)}
.sb-check{width:14px;height:14px;border:1px solid var(--bd2);border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s;background:transparent}
.sb-item.on .sb-check{background:var(--acc);border-color:var(--acc)}
.sb-check-tick{width:8px;height:8px;color:#000;font-size:8px;line-height:1;font-weight:700}
.sb-item-label{font-size:12px;color:var(--tx2);flex:1;transition:color .12s}
.sb-item.on .sb-item-label{color:var(--tx);font-weight:500}
.sb-item-count{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--mt2);background:var(--s3);padding:1px 5px;border-radius:10px}
.sb-item.on .sb-item-count{background:rgba(232,184,75,.15);color:var(--acc)}

/* SOURCE GROUPS */
.sb-src-group{margin-bottom:8px}
.sb-src-group-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:var(--mt2);margin-bottom:4px;padding-left:8px}

/* DATE PILLS in sidebar */
.sb-date-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.sb-date-btn{background:transparent;border:1px solid var(--bd);border-radius:5px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:6px 4px;text-align:center;transition:all .15s}
.sb-date-btn:hover{border-color:var(--acc);color:var(--tx)}
.sb-date-btn.on{background:rgba(88,166,255,.12);border-color:var(--blu);color:var(--blu)}

/* VOICE in sidebar */
.sb-voice-item{display:flex;align-items:flex-start;gap:8px;padding:5px 8px;border-radius:5px;cursor:pointer;transition:background .12s;user-select:none}
.sb-voice-item:hover{background:var(--s2)}
.sb-voice-item.on{background:rgba(188,140,255,.07)}
.sb-voice-item.on .sb-check{background:var(--pur);border-color:var(--pur)}
.sb-voice-item.on .sb-item-label{color:var(--pur);font-weight:500}
.sb-voice-desc{font-size:10px;color:var(--mt2);line-height:1.4;margin-top:1px}

/* ── MAIN CONTENT ── */
.main{flex:1;min-width:0;display:flex;flex-direction:column}

/* ── SEARCH BAR ── */
.searchbar{background:var(--s1);border-bottom:1px solid var(--bd);padding:14px 20px;position:sticky;top:52px;z-index:100}
.search-row{display:flex;gap:10px;margin-bottom:10px}
.search-inp{flex:1;background:var(--bg);border:1px solid var(--bd2);border-radius:8px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:11px 16px;outline:none;transition:border-color .15s}
.search-inp:focus{border-color:var(--acc)}
.search-inp::placeholder{color:var(--mt);font-style:italic}
.btn-go{background:var(--acc);border:none;border-radius:8px;color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;padding:11px 22px;text-transform:uppercase;transition:all .15s;white-space:nowrap;flex-shrink:0}
.btn-go:hover:not(:disabled){background:#f5c96a;transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,184,75,.25)}
.btn-go:disabled{opacity:.4;cursor:not-allowed}
.hints-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.hint-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--mt2);letter-spacing:.5px;white-space:nowrap}
.hint{background:rgba(232,184,75,.06);border:1px solid rgba(232,184,75,.14);border-radius:20px;color:var(--mt);cursor:pointer;font-size:11px;padding:3px 10px;transition:all .15s}
.hint:hover{border-color:var(--acc);color:var(--acc)}

/* ── STATUS / BRIEFING ── */
.content-area{padding:16px 20px;flex:1}
.sbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s1);border:1px solid var(--bd);border-radius:6px;margin-bottom:16px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mt);min-height:40px}
.sbar.loading{border-color:var(--acc)}.sbar.error{border-color:var(--red);color:var(--red)}.sbar.success{border-color:var(--grn);color:var(--grn)}
.spin{width:12px;height:12px;border:2px solid var(--bd);border-top-color:var(--acc);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}

.briefing{background:var(--s1);border:1px solid var(--acc2);border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:13.5px;line-height:1.75;color:var(--tx2)}
.briefing-ttl{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:var(--acc2);margin-bottom:8px}

/* ── RESULTS TOOLBAR ── */
.results-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px}
.results-info{display:flex;align-items:center;gap:10px}
.results-title{font-family:'Playfair Display',serif;font-size:16px}
.results-count{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);background:var(--s1);border:1px solid var(--bd);border-radius:4px;padding:3px 8px}
.toolbar-right{display:flex;align-items:center;gap:6px}
.sort-lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2)}
.sort-btn{background:transparent;border:1px solid var(--bd);border-radius:4px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;transition:all .12s}
.sort-btn:hover{color:var(--tx);border-color:var(--mt)}.sort-btn.on{background:var(--s2);color:var(--tx);border-color:var(--acc2)}
.view-btn{background:transparent;border:1px solid var(--bd);border-radius:4px;color:var(--mt);cursor:pointer;font-size:13px;padding:4px 8px;transition:all .12s}
.view-btn:hover{color:var(--tx);border-color:var(--mt)}.view-btn.on{background:var(--s2);color:var(--tx);border-color:var(--acc2)}
.tb-div{width:1px;height:16px;background:var(--bd)}

/* ACTIVE FILTERS STRIP */
.active-strip{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;align-items:center}
.af-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--mt2);letter-spacing:.5px;white-space:nowrap}
.af-tag{display:flex;align-items:center;gap:4px;background:var(--s2);border:1px solid var(--bd2);border-radius:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--tx2);padding:2px 8px}
.af-tag button{background:none;border:none;color:var(--mt);cursor:pointer;font-size:11px;line-height:1;padding:0;transition:color .12s}.af-tag button:hover{color:var(--red)}
.af-clear-all{background:rgba(248,81,73,.06);border:1px solid rgba(248,81,73,.2);border-radius:20px;color:var(--red);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;padding:2px 8px;transition:all .12s}.af-clear-all:hover{background:rgba(248,81,73,.12)}

/* ── CARDS GRID ── */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}
.cards-list{display:flex;flex-direction:column;gap:10px}

/* ── NEWS CARD ── */
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:border-color .15s,transform .15s,box-shadow .15s;position:relative;display:flex;flex-direction:column}
.card:hover{border-color:var(--bd2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.35)}
.card-accent{height:2px;background:var(--tc,var(--acc));flex-shrink:0}

.card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column}

.card-meta{display:flex;align-items:center;gap:6px;margin-bottom:9px;flex-wrap:wrap}
.cmeta-src{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--acc);background:rgba(232,184,75,.09);padding:2px 7px;border-radius:3px;white-space:nowrap;letter-spacing:.4px}
.cmeta-topic{font-size:10px;padding:2px 7px;border-radius:3px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
.cmeta-country{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);white-space:nowrap}
.cmeta-date{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt2);white-space:nowrap}

.card-title{font-family:'Playfair Display',serif;font-size:15.5px;font-weight:600;line-height:1.42;margin-bottom:8px;color:var(--tx)}
.card-title a{color:inherit;text-decoration:none;transition:color .12s}
.card-title a:hover{color:var(--acc)}

.card-summary{font-size:12.5px;line-height:1.65;color:var(--mt);margin-bottom:10px}

/* EXCERPT */
.excerpt-wrap{background:rgba(255,255,255,.02);border:1px solid var(--bd);border-radius:6px;padding:10px 12px;margin-bottom:10px}
.excerpt-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--acc2);margin-bottom:6px}
.excerpt-text{font-size:12.5px;line-height:1.7;color:var(--tx2);font-style:italic}
.excerpt-text.collapsed{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.excerpt-toggle{background:none;border:none;color:var(--acc2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 0 0;display:block;transition:color .12s;letter-spacing:.3px}
.excerpt-toggle:hover{color:var(--acc)}

/* VOICES */
.card-voices{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.vbadge{font-size:10px;padding:2px 7px;border-radius:3px;font-family:'IBM Plex Mono',monospace;display:inline-flex;align-items:center;gap:3px}
.vb-popolo{background:rgba(188,140,255,.1);color:var(--pur);border:1px solid rgba(188,140,255,.22)}
.vb-politici{background:rgba(248,81,73,.08);color:var(--red);border:1px solid rgba(248,81,73,.18)}
.vb-esperti{background:rgba(88,166,255,.08);color:var(--blu);border:1px solid rgba(88,166,255,.18)}
.vb-vittime{background:rgba(252,107,45,.08);color:#fc6b2d;border:1px solid rgba(252,107,45,.18)}
.vb-attivisti{background:rgba(63,185,80,.08);color:var(--grn);border:1px solid rgba(63,185,80,.18)}

/* CARD FOOTER */
.card-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--bd);background:rgba(255,255,255,.01);gap:8px;flex-wrap:wrap}
.rdots{display:flex;gap:3px;align-items:center}
.rdot{width:5px;height:5px;border-radius:50%;background:var(--bd)}.rdot.on{background:var(--acc2)}
.card-actions{display:flex;gap:5px;align-items:center}
.btn-link{background:transparent;border:1px solid var(--bd2);border-radius:4px;color:var(--blu);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;text-decoration:none;transition:all .12s;display:inline-flex;align-items:center;gap:3px}.btn-link:hover{border-color:var(--blu);background:rgba(88,166,255,.07)}
.btn-save{background:transparent;border:1px solid var(--bd2);border-radius:4px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;transition:all .12s;display:inline-flex;align-items:center;gap:3px}.btn-save:hover{border-color:var(--acc);color:var(--acc)}.btn-save.saved{border-color:var(--acc);color:var(--acc);background:rgba(232,184,75,.07)}

/* LIST VIEW card variant */
.cards-list .card{flex-direction:row}
.cards-list .card-accent{width:3px;height:auto;flex-shrink:0}
.cards-list .card-body{flex-direction:row;align-items:flex-start;gap:14px;flex-wrap:wrap}
.cards-list .card-main{flex:1;min-width:200px}
.cards-list .card-side{display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0}
.cards-list .card-footer{display:none}
.cards-list .card-meta{margin-bottom:6px}

/* ── EMPTY ── */
.empty{text-align:center;padding:60px 20px;color:var(--mt)}
.empty-icon{font-size:48px;margin-bottom:14px}
.empty h3{font-family:'Playfair Display',serif;font-size:19px;color:var(--tx);margin-bottom:8px}
.empty p{font-size:13px;line-height:1.65;max-width:420px;margin:0 auto;color:var(--mt)}

/* ── ARCHIVE PAGE ── */
.arch-page{padding:20px 24px 60px}
.arch-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.arch-title{font-family:'Playfair Display',serif;font-size:22px}
.panel{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;margin-bottom:16px}
.panel-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:var(--mt);margin-bottom:12px}
.catmgr{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.cchip{display:flex;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--bd);border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all .15s;color:var(--tx2)}.cchip:hover{border-color:var(--acc2)}.cchip.on{border-color:var(--acc2);color:var(--acc2);background:rgba(78,201,176,.07)}
.cdel{background:none;border:none;color:var(--mt);cursor:pointer;font-size:13px;line-height:1;padding:0 0 0 3px;transition:color .12s}.cdel:hover{color:var(--red)}
.newcat-row{display:flex;gap:8px;margin-bottom:14px}
.cat-inp{background:var(--bg);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:8px 12px;outline:none;width:200px;transition:border-color .15s}.cat-inp:focus{border-color:var(--acc2)}
.btn-addcat{background:var(--s2);border:1px solid var(--bd2);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;transition:all .15s}.btn-addcat:hover{border-color:var(--acc2);color:var(--acc2)}
.asec{margin-bottom:26px}
.asec-ttl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mt);margin-bottom:10px;display:flex;align-items:center;gap:8px}.asec-ttl span{color:var(--acc)}
.acard{display:flex;align-items:flex-start;gap:12px;background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:13px 15px;margin-bottom:7px;transition:border-color .15s}.acard:hover{border-color:var(--bd2)}
.acard-body{flex:1}.acard-ttl{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;margin-bottom:4px;line-height:1.4}
.acard-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mt);display:flex;gap:9px;flex-wrap:wrap;margin-bottom:5px}
.acard-sum{font-size:12px;color:var(--mt);line-height:1.55}
.acard-acts{display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0}
.btn-move{background:var(--s2);border:1px solid var(--bd);border-radius:4px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;transition:all .12s;white-space:nowrap}.btn-move:hover{border-color:var(--acc2);color:var(--acc2)}
.btn-rm{background:transparent;border:none;color:var(--mt2);cursor:pointer;font-size:16px;line-height:1;transition:color .12s}.btn-rm:hover{color:var(--red)}

/* ── MODAL ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px}
.modal{background:var(--s1);border:1px solid var(--bd2);border-radius:12px;padding:22px 24px;min-width:280px;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.modal-ttl{font-family:'Playfair Display',serif;font-size:17px;margin-bottom:14px}
.modal-cats{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.modal-cat{background:var(--s2);border:1px solid var(--bd);border-radius:6px;color:var(--tx2);cursor:pointer;font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:9px 14px;text-align:left;transition:all .15s}.modal-cat:hover{border-color:var(--acc2);color:var(--acc2)}
.modal-cancel{background:transparent;border:1px solid var(--bd);border-radius:6px;color:var(--mt);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 16px;width:100%;transition:all .15s}.modal-cancel:hover{color:var(--tx)}

.api-warn{background:rgba(232,184,75,.07);border:1px solid rgba(232,184,75,.25);border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--acc);line-height:1.6}
.api-warn code{background:rgba(232,184,75,.15);padding:1px 5px;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:11px}

@media(max-width:900px){
  :root{--sidebar:220px}
  .cards-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .shell{flex-direction:column}
  .sidebar{width:100%;height:auto;position:relative;top:0;border-right:none;border-bottom:1px solid var(--bd)}
  .searchbar{position:relative;top:0}
  .tb-title{display:none}
  .topbar{padding:0 12px}
}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function RDots({ s }) {
  const n = Math.max(1, Math.min(5, Math.round((s || 5) / 2)));
  return <div className="rdots">{[1,2,3,4,5].map(i=><div key={i} className={`rdot ${i<=n?"on":""}`}/>)}</div>;
}

function VBadge({ type }) {
  const v = VOICE_TYPES.find(x=>x.id===type);
  if (!v) return null;
  return <span className={`vbadge vb-${type}`}>{v.icon} {v.label}</span>;
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
  );
}

// ─── SIDEBAR COMPONENT ───────────────────────────────────────────────────────

function SidebarSection({ title, children, defaultOpen=true, count=0, onClear }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sb-section">
      <div className="sb-section-hdr" onClick={()=>setOpen(p=>!p)}>
        <span className="sb-section-title">{title}</span>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          {count>0 && onClear && <button className="sb-clear" onClick={e=>{e.stopPropagation();onClear()}}>{count} x</button>}
          <span className={`sb-section-arr ${open?"open":""}`}>▼</span>
        </div>
      </div>
      {open && children}
    </div>
  );
}

function SbCheckItem({ label, icon, checked, onClick, count, voiceDesc }) {
  return (
    <div className={`${voiceDesc?"sb-voice-item":"sb-item"} ${checked?"on":""}`} onClick={onClick}>
      <div className="sb-check">{checked&&<span className="sb-check-tick">✓</span>}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
          {icon&&<span style={{fontSize:"12px"}}>{icon}</span>}
          <span className="sb-item-label">{label}</span>
          {count!==undefined&&<span className="sb-item-count">{count}</span>}
        </div>
        {voiceDesc&&<div className="sb-voice-desc">{voiceDesc}</div>}
      </div>
    </div>
  );
}

function Sidebar({ selC, setSelC, selT, setSelT, selS, setSelS, selV, setSelV, selDate, setSelDate, articles }) {
  const toggle = (set, val) => set(p=>p.includes(val)?p.filter(x=>x!==val):[...p,val]);

  // count articles per filter value
  const cC = {}, cT = {}, cS = {}, cV = {};
  articles.forEach(a=>{
    cC[a.country]=(cC[a.country]||0)+1;
    cT[a.topic]=(cT[a.topic]||0)+1;
    cS[a.source]=(cS[a.source]||0)+1;
    (a.voices||[]).forEach(v=>{cV[v]=(cV[v]||0)+1;});
  });

  return (
    <aside className="sidebar">
      <SidebarSection title="Paese" defaultOpen={true} count={selC.length} onClear={()=>setSelC([])}>
        <div className="sb-items">
          {COUNTRIES.map(c=>(
            <SbCheckItem key={c} label={`${FLAG[c]||""} ${c}`} checked={selC.includes(c)}
              onClick={()=>toggle(setSelC,c)} count={articles.length?cC[c]:undefined}/>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Tematica" defaultOpen={true} count={selT.length} onClear={()=>setSelT([])}>
        <div className="sb-items">
          {TOPICS.map(t=>(
            <SbCheckItem key={t.id} label={t.label} icon={t.icon} checked={selT.includes(t.id)}
              onClick={()=>toggle(setSelT,t.id)} count={articles.length?cT[t.id]:undefined}/>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Tipo di voci" defaultOpen={true} count={selV.length} onClear={()=>setSelV([])}>
        <div className="sb-items">
          {VOICE_TYPES.map(v=>(
            <SbCheckItem key={v.id} label={v.label} icon={v.icon} checked={selV.includes(v.id)}
              onClick={()=>toggle(setSelV,v.id)} count={articles.length?cV[v.id]:undefined}
              voiceDesc={v.desc}/>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Periodo" defaultOpen={true} count={selDate?1:0} onClear={()=>setSelDate("")}>
        <div className="sb-date-grid">
          {DATE_RANGES.map(d=>(
            <button key={d.id} className={`sb-date-btn ${selDate===d.id?"on":""}`}
              onClick={()=>setSelDate(p=>p===d.id?"":d.id)}>
              {d.label}
            </button>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Testate" defaultOpen={false} count={selS.length} onClear={()=>setSelS([])}>
        <div>
          {SOURCES_BY_GROUP.map(g=>(
            <div key={g.group} className="sb-src-group">
              <div className="sb-src-group-lbl">{g.group}</div>
              <div className="sb-items">
                {g.sources.map(s=>(
                  <SbCheckItem key={s} label={s} checked={selS.includes(s)}
                    onClick={()=>toggle(setSelS,s)} count={articles.length?cS[s]:undefined}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SidebarSection>
    </aside>
  );
}

// ─── NEWS CARD ────────────────────────────────────────────────────────────────

function NewsCard({ a, onSave, saved, listView }) {
  const [excerptOpen, setExcerptOpen] = useState(false);
  const color = TOPIC_COLORS[a.topic]||TOPIC_COLORS.altro;
  const to = TOPICS.find(x=>x.id===a.topic);
  const hasUrl = a.url && a.url !== "#" && a.url !== "";

  const meta = (
    <div className="card-meta">
      <span className="cmeta-src">{a.source}</span>
      <span className="cmeta-topic" style={{background:color+"1a",color}}>{to?.icon} {to?.label||a.topic}</span>
      <span className="cmeta-country">{FLAG[a.country]||"🌎"} {a.country}</span>
      <span className="cmeta-date">{a.date}</span>
    </div>
  );

  const title = (
    <div className="card-title">
      {hasUrl
        ? <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
        : a.title
      }
    </div>
  );

  const excerpt = a.excerpt && (
    <div className="excerpt-wrap">
      <div className="excerpt-lbl">Estratto tradotto</div>
      <div className={`excerpt-text ${excerptOpen?"":"collapsed"}`}>{a.excerpt}</div>
      <button className="excerpt-toggle" onClick={()=>setExcerptOpen(p=>!p)}>
        {excerptOpen ? "Chiudi ▲" : "Leggi di piu ▼"}
      </button>
    </div>
  );

  const voices = a.voices?.length>0 && (
    <div className="card-voices">{a.voices.map(v=><VBadge key={v} type={v}/>)}</div>
  );

  const actions = (
    <div className="card-actions">
      <RDots s={a.relevance}/>
      {hasUrl
        ? <a className="btn-link" href={a.url} target="_blank" rel="noreferrer">Articolo ↗</a>
        : <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"var(--mt2)"}}>—</span>
      }
      <button className={`btn-save ${saved?"saved":""}`} onClick={()=>onSave(a)}>
        {saved?"★":"☆"} {saved?"Salvato":"Salva"}
      </button>
    </div>
  );

  if (listView) {
    return (
      <div className="card">
        <div className="card-accent" style={{"--tc":color}}/>
        <div className="card-body">
          <div className="card-main">
            {meta}
            {title}
            <div className="card-summary">{a.summary}</div>
            {excerpt}
            {voices}
          </div>
          <div className="card-side">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-accent" style={{"--tc":color}}/>
      <div className="card-body">
        {meta}
        {title}
        <div className="card-summary">{a.summary}</div>
        {excerpt}
        {voices}
      </div>
      <div className="card-footer">
        {actions}
      </div>
    </div>
  );
}

// ─── ARCHIVE PAGE ─────────────────────────────────────────────────────────────

function ArchivePage({ archive, cats, onRemove, onMove, onAddCat, onRemoveCat }) {
  const [activeCat, setActiveCat] = useState("tutte");
  const [newCat, setNewCat] = useState("");
  const addCat = () => { const n=newCat.trim(); if(n&&!cats.includes(n)){onAddCat(n);setNewCat("");} };
  const sections = activeCat==="tutte"?cats:[activeCat];
  return (
    <div className="arch-page">
      <div className="arch-hdr">
        <div className="arch-title">Archivio & Preferiti</div>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"var(--mt)"}}>{archive.length} articoli</span>
      </div>
      <div className="panel">
        <div className="panel-lbl">Gestisci categorie</div>
        <div className="newcat-row">
          <input className="cat-inp" placeholder="Nuova categoria..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}/>
          <button className="btn-addcat" onClick={addCat}>+ Aggiungi</button>
        </div>
        <div className="catmgr">
          <div className={`cchip ${activeCat==="tutte"?"on":""}`} onClick={()=>setActiveCat("tutte")}>
            Tutte ({archive.length})
          </div>
          {cats.map(c=>{
            const n=archive.filter(a=>a.category===c).length;
            return (
              <div key={c} className={`cchip ${activeCat===c?"on":""}`} onClick={()=>setActiveCat(c)}>
                {c} ({n})
                <button className="cdel" onClick={e=>{e.stopPropagation();onRemoveCat(c);}}>x</button>
              </div>
            );
          })}
        </div>
      </div>
      {archive.length===0&&<div className="empty"><div className="empty-icon">📌</div><h3>Archivio vuoto</h3><p>Premi Salva su un articolo per aggiungerlo.</p></div>}
      {sections.map(cat=>{
        const items=archive.filter(a=>a.category===cat);
        if(!items.length)return null;
        return (
          <div key={cat} className="asec">
            <div className="asec-ttl">{cat} <span>({items.length})</span></div>
            {items.map(a=>{
              const color=TOPIC_COLORS[a.topic]||TOPIC_COLORS.altro;
              const to=TOPICS.find(x=>x.id===a.topic);
              const hasUrl=a.url&&a.url!=="#"&&a.url!=="";
              return (
                <div key={a.savedAt} className="acard">
                  <div className="acard-body">
                    <div className="acard-ttl">{a.title}</div>
                    <div className="acard-meta">
                      <span>{FLAG[a.country]||"🌎"} {a.country}</span>
                      <span style={{color}}>{to?.icon} {to?.label||a.topic}</span>
                      <span>{a.source}</span><span>{a.date}</span>
                    </div>
                    {a.voices?.length>0&&<div className="card-voices" style={{margin:"5px 0"}}>{a.voices.map(v=><VBadge key={v} type={v}/>)}</div>}
                    <div className="acard-sum">{a.summary}</div>
                  </div>
                  <div className="acard-acts">
                    <button className="btn-rm" onClick={()=>onRemove(a)}>x</button>
                    {hasUrl&&<a className="btn-link" href={a.url} target="_blank" rel="noreferrer">↗</a>}
                    <button className="btn-move" onClick={()=>onMove(a)}>Sposta</button>
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
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    const found = USERS.find(x=>x.username===u.trim()&&x.password===p);
    if (found) { onLogin(found.username); }
    else { setErr("Credenziali non valide. Riprova."); setP(""); }
  };
  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-globe">🌎</div>
        <div className="login-h1">Sud America Monitor</div>
        <div className="login-sub">Rassegna Stampa — Accesso Riservato</div>
        <div className="login-div"/>
        <label className="login-lbl">Username</label>
        <input className="login-inp" type="text" placeholder="username" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus/>
        <label className="login-lbl">Password</label>
        <input className="login-inp" type="password" placeholder="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        <button className="login-btn" onClick={submit}>Accedi</button>
        {err&&<div className="login-err">{err}</div>}
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
  const [articles, setArticles]   = useState([]);
  const [summary, setSummary]     = useState("");
  const [status, setStatus]       = useState({ type:"idle", msg:"" });
  const [lastFetch, setLastFetch] = useState(null);
  const [sortBy, setSortBy]       = useState("relevance");
  const [listView, setListView]   = useState(false);
  const [archive, setArchive]     = useState(loadArchive);
  const [cats, setCats]           = useState(loadCats);
  const [saveModal, setSaveModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  // result filters (client-side, cumulative)
  const [rfT, setRfT] = useState([]);
  const [rfC, setRfC] = useState([]);
  const [rfS, setRfS] = useState([]);
  const [rfV, setRfV] = useState([]);

  useEffect(()=>saveArchive(archive),[archive]);
  useEffect(()=>saveCatsStore(cats),[cats]);

  const today = new Date().toLocaleDateString("it-IT",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const toggle = (set,val) => set(p=>p.includes(val)?p.filter(x=>x!==val):[...p,val]);
  const handleLogin  = u => { saveSession(u); setUser(u); };
  const handleLogout = () => { clearSession(); setUser(""); };

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    if (!API_KEY) { setStatus({ type:"error", msg:"API key mancante. Imposta VITE_ANTHROPIC_API_KEY su Netlify." }); return; }

    const cStr = selC.length>0 ? selC.join(", ") : "tutti i paesi del Sud America, Cuba e Messico";
    const tStr = selT.length>0 ? selT.map(t=>TOPICS.find(x=>x.id===t)?.label).join(", ") : "tutte le tematiche";
    const sStr = selS.length>0 ? selS.join(", ") : ALL_SOURCES.join(", ");
    const vStr = selV.length>0 ? selV.map(v=>VOICE_TYPES.find(x=>x.id===v)?.desc).join("; ") : "";
    const dStr = selDate ? DATE_RANGES.find(d=>d.id===selDate)?.label : "ultime 48 ore";

    setStatus({ type:"loading", msg:"Ricerca notizie reali in corso..." });
    setArticles([]); setSummary(""); setRfT([]); setRfC([]); setRfS([]); setRfV([]);

    const voiceNote = vStr
      ? `\nPRIORITA: cerca articoli contenenti: ${vStr}.`
      : `\nPer ogni articolo, identifica quali voci sono presenti tra: popolo (cittadini/lavoratori/migranti), politici, esperti, vittime, attivisti.`;

    const intentNote = intent.trim()
      ? `\n\nBISOGNO GIORNALISTICO: "${intent.trim()}"\nSeleziona e adatta gli articoli a questo bisogno specifico.`
      : "";

    const prompt = `Sei un sistema di monitoraggio giornalistico specializzato in Sud America, Cuba e Messico. Oggi e' ${today}.

Usa il web search per trovare NOTIZIE REALI e RECENTI (${dStr}):
- Paesi: ${cStr}
- Tematiche: ${tStr}
- Testate PRIORITARIE: ${sStr}
${voiceNote}${intentNote}

REGOLE:
1. URL: fornisci URL DIRETTO all'articolo (non homepage). Se non trovato, stringa vuota.
2. ESTRATTO: traduci in italiano 3-5 frasi significative dall'articolo originale, preferendo passaggi con citazioni o dati concreti.
3. Trova 10-14 articoli.

Rispondi SOLO con JSON valido senza backtick:
{
  "summary": "Briefing giornalistico 4-5 frasi: situazione regione, temi emergenti, tipologie di fonti disponibili",
  "articles": [
    {
      "id": 1,
      "title": "Titolo tradotto in italiano",
      "summary": "Riassunto analitico 2-3 frasi: contesto, fatti chiave, impatto",
      "excerpt": "Estratto tradotto in italiano di 3-5 frasi significative dall'articolo, con citazioni dirette se presenti",
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
Il campo voices deve contenere SOLO le voci effettivamente presenti.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":API_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:6000,
          system:"Sei un assistente di monitoraggio giornalistico. Rispondi SOLO con JSON valido senza markdown.",
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
        parsed = JSON.parse(clean.slice(clean.indexOf("{"),clean.lastIndexOf("}")+1));
      } catch { throw new Error("Errore parsing risposta JSON"); }
      setArticles(parsed.articles||[]);
      setSummary(parsed.summary||"");
      setLastFetch(new Date().toLocaleTimeString("it-IT"));
      setStatus({ type:"success", msg:`${parsed.articles?.length||0} articoli trovati — ${new Date().toLocaleTimeString("it-IT")}` });
    } catch(e) {
      setStatus({ type:"error", msg:`Errore: ${e.message}` });
    }
  }, [selC, selT, selS, selV, selDate, intent, today]);

  // ── CLIENT FILTER + SORT ──────────────────────────────────────────────────
  const filtered = articles.filter(a => {
    if (rfT.length && !rfT.includes(a.topic))    return false;
    if (rfC.length && !rfC.includes(a.country))  return false;
    if (rfS.length && !rfS.includes(a.source))   return false;
    if (rfV.length && !rfV.some(v=>a.voices?.includes(v))) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => {
    if (sortBy==="relevance") return (b.relevance||0)-(a.relevance||0);
    if (sortBy==="date") {
      const p = d=>{if(!d)return 0;const s=d.split("/");return s.length===3?new Date(s[2],s[1]-1,s[0]).getTime():0;};
      return p(b.date)-p(a.date);
    }
    if (sortBy==="source") return (a.source||"").localeCompare(b.source||"");
    return 0;
  });

  const avT=[...new Set(articles.map(a=>a.topic))];
  const avC=[...new Set(articles.map(a=>a.country))];
  const avS=[...new Set(articles.map(a=>a.source))];
  const avV=[...new Set(articles.flatMap(a=>a.voices||[]))];

  // active result-filter pills
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

      {/* TOPBAR */}
      <div className="topbar">
        <div className="tb-brand">
          <span className="tb-badge">Monitor</span>
          <span className="tb-title">Sud America · Rassegna Stampa</span>
        </div>
        <div className="tb-nav">
          <button className={`nb ${view==="monitor"?"on":""}`} onClick={()=>setView("monitor")}>Rassegna</button>
          <button className={`nb ${view==="archive"?"on":""}`} onClick={()=>setView("archive")}>
            Archivio {archive.length>0&&<span className="nbadge">{archive.length}</span>}
          </button>
          <span className="user-pill">{user}</span>
          <button className="nb logout" onClick={handleLogout}>Esci</button>
        </div>
      </div>

      {saveModal&&<Modal title="Salva in categoria" cats={cats} onSelect={confirmSave} onClose={()=>setSaveModal(null)}/>}
      {moveModal&&<Modal title="Sposta in categoria" cats={cats} onSelect={confirmMove} onClose={()=>setMoveModal(null)}/>}

      {/* ARCHIVE */}
      {view==="archive" && (
        <ArchivePage archive={archive} cats={cats}
          onRemove={a=>setArchive(p=>p.filter(x=>x.savedAt!==a.savedAt))}
          onMove={a=>setMoveModal(a)}
          onAddCat={n=>setCats(p=>[...p,n])}
          onRemoveCat={c=>{setCats(p=>p.filter(x=>x!==c));setArchive(p=>p.map(a=>a.category===c?{...a,category:"Altro"}:a));}}
        />
      )}

      {/* MONITOR */}
      {view==="monitor" && (
        <div className="shell">
          {/* SIDEBAR */}
          <Sidebar
            selC={selC} setSelC={setSelC}
            selT={selT} setSelT={setSelT}
            selS={selS} setSelS={setSelS}
            selV={selV} setSelV={setSelV}
            selDate={selDate} setSelDate={setSelDate}
            articles={articles}
          />

          {/* MAIN */}
          <div className="main">
            {/* SEARCH BAR */}
            <div className="searchbar">
              {!API_KEY&&(
                <div className="api-warn">
                  API Key mancante. Su Netlify: Site configuration > Environment variables > aggiungi <code>VITE_ANTHROPIC_API_KEY</code>
                </div>
              )}
              <div className="search-row">
                <input className="search-inp"
                  placeholder="Descrivi il tuo bisogno giornalistico o un tema di ricerca..."
                  value={intent} onChange={e=>setIntent(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&fetchNews()}/>
                <button className="btn-go" onClick={fetchNews} disabled={status.type==="loading"}>
                  {status.type==="loading" ? "Cerco..." : "Cerca"}
                </button>
              </div>
              <div className="hints-row">
                <span className="hint-lbl">Esempi:</span>
                {HINTS.map((h,i)=>(
                  <button key={i} className="hint" onClick={()=>setIntent(h)}>
                    {h.length>48 ? h.slice(0,48)+"..." : h}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTENT */}
            <div className="content-area">

              {/* STATUS */}
              <div className={`sbar ${status.type}`}>
                {status.type==="loading"&&<div className="spin"/>}
                {status.type==="idle"&&<span><span className="pulse"/>Pronto — usa i filtri a sinistra e/o descrivi il bisogno, poi premi Cerca.</span>}
                {status.type!=="idle"&&<span>{status.msg}</span>}
              </div>

              {/* BRIEFING */}
              {summary&&(
                <div className="briefing">
                  <div className="briefing-ttl">Briefing Giornalistico</div>
                  {summary}
                </div>
              )}

              {/* RESULTS */}
              {articles.length>0&&(
                <>
                  {/* TOOLBAR */}
                  <div className="results-toolbar">
                    <div className="results-info">
                      <div className="results-title">Risultati</div>
                      <div className="results-count">{sorted.length} / {articles.length}</div>
                    </div>
                    <div className="toolbar-right">
                      <span className="sort-lbl">Ordina:</span>
                      {[{id:"relevance",l:"Rilevanza"},{id:"date",l:"Data"},{id:"source",l:"Testata"}].map(s=>(
                        <button key={s.id} className={`sort-btn ${sortBy===s.id?"on":""}`} onClick={()=>setSortBy(s.id)}>{s.l}</button>
                      ))}
                      <div className="tb-div"/>
                      <button className={`view-btn ${!listView?"on":""}`} title="Vista griglia" onClick={()=>setListView(false)}>⊞</button>
                      <button className={`view-btn ${listView?"on":""}`} title="Vista lista" onClick={()=>setListView(true)}>☰</button>
                    </div>
                  </div>

                  {/* RESULT FILTER PILLS */}
                  {(avT.length>1||avC.length>1||avS.length>1||avV.length>1)&&(
                    <div className="active-strip">
                      <span className="af-lbl">Filtra risultati:</span>
                      {avT.map(t=>{const to=TOPICS.find(x=>x.id===t);return <div key={t} className={`af-tag ${rfT.includes(t)?"":"" }`} style={{cursor:"pointer"}} onClick={()=>toggle(setRfT,t)}>{to?.icon} {to?.label||t}</div>;})}
                      {avV.map(v=>{const vo=VOICE_TYPES.find(x=>x.id===v);return <div key={v} className="af-tag" style={{cursor:"pointer"}} onClick={()=>toggle(setRfV,v)}>{vo?.icon} {vo?.label||v}</div>;})}
                      {avC.slice(0,5).map(c=><div key={c} className="af-tag" style={{cursor:"pointer"}} onClick={()=>toggle(setRfC,c)}>{FLAG[c]} {c}</div>)}
                      {avS.slice(0,4).map(s=><div key={s} className="af-tag" style={{cursor:"pointer"}} onClick={()=>toggle(setRfS,s)}>{s}</div>)}
                    </div>
                  )}

                  {/* ACTIVE PILLS */}
                  {pills.length>0&&(
                    <div className="active-strip">
                      <span className="af-lbl">Attivi:</span>
                      {pills.map(p=><div key={p.key} className="af-tag" style={{background:"rgba(232,184,75,.08)",borderColor:"rgba(232,184,75,.3)"}}>{p.label}<button onClick={p.rm}>x</button></div>)}
                      {pills.length>1&&<button className="af-clear-all" onClick={()=>{setRfT([]);setRfC([]);setRfS([]);setRfV([]);}}>rimuovi tutti</button>}
                    </div>
                  )}

                  {/* CARDS */}
                  <div className={listView?"cards-list":"cards-grid"}>
                    {sorted.map(a=>(
                      <NewsCard key={a.id} a={a} listView={listView}
                        onSave={a=>{if(!inArchive(a))setSaveModal(a);}}
                        saved={inArchive(a)}/>
                    ))}
                  </div>

                  {sorted.length===0&&(
                    <div className="empty">
                      <div className="empty-icon">🔍</div>
                      <h3>Nessun risultato con i filtri attivi</h3>
                      <p>Rimuovi qualche filtro per vedere piu articoli.</p>
                    </div>
                  )}
                </>
              )}

              {articles.length===0&&status.type!=="loading"&&status.type!=="error"&&(
                <div className="empty">
                  <div className="empty-icon">🌎</div>
                  <h3>Pronto per la ricerca</h3>
                  <p>Usa i filtri nella sidebar a sinistra per selezionare paesi, temi e testate. Poi descrivi il tuo bisogno giornalistico e premi Cerca.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
