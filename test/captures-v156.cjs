// Vérifications v1.5.6 (passe UX 7, bureau 1280×800 et mobile 390×844) : CHROME=/usr/bin/google-chrome node test/captures-v156.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8787);
let ok = true;
const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
// Chevauchements (v1.5.4 : textes d'un <details> fermé ignorés, checkVisibility) : rectangles des textes visibles de <main> (rognés par l'écran et par les conteneurs défilants) contre ceux des commandes du temps
const CHEVAUCHE = () => {
  const vis = (e) => { const s = getComputedStyle(e); return e.offsetParent !== null || s.position === 'fixed'; };
  const cmd = [...document.querySelectorAll('.temps button')].filter(vis).map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
  const clip = (el) => { let r = { l: 0, t: 0, r: innerWidth, b: innerHeight };
    for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowY + s.overflowX)) { const q = p.getBoundingClientRect(); r = { l: Math.max(r.l, q.left), t: Math.max(r.t, q.top), r: Math.min(r.r, q.right), b: Math.min(r.b, q.bottom) }; } }
    return r; };
  const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n, hits = [];
  while ((n = w.nextNode())) { if (!n.textContent.trim() || !n.parentElement.offsetParent || !n.parentElement.checkVisibility()) continue; const c = clip(n.parentElement); const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) { const l = Math.max(r.left, c.l), t = Math.max(r.top, c.t), rr = Math.min(r.right, c.r), b = Math.min(r.bottom, c.b); if (rr - l < 1 || b - t < 1) continue;
      for (const k of cmd) if (Math.min(rr, k.right) - Math.max(l, k.left) > 1 && Math.min(b, k.bottom) - Math.max(t, k.top) > 1) hits.push(n.textContent.trim().slice(0, 30)); } }
  return [...new Set(hits)];
};
const jouer = async (p, n) => { for (let i = 0; i < n; i++) { await p.click('#btnJour'); await p.waitForTimeout(700); while (await p.isVisible('#dilemme')) { await p.click('.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(300); } } };
const defiler = (p, f) => p.evaluate((f) => { const s = [document.querySelector('main.app'), document.scrollingElement].find(e => e.scrollHeight > e.clientHeight + 1); if (s) s.scrollTop = f * (s.scrollHeight - s.clientHeight); }, f);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [nom, vp] of [['mobile', { width: 390, height: 844 }], ['mobile-court', { width: 360, height: 480 }], ['bureau', { width: 1280, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
    p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
    await p.goto('http://localhost:8787/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    // 1. « Suivant » visible en haut et en bas du défilement de la fenêtre d'accueil
    const suivant = (f) => p.evaluate((f) => { const c = document.querySelector('#intro .modal-contenu'); c.scrollTop = f * (c.scrollHeight - c.clientHeight);
      const r = document.getElementById('introSuivant').getBoundingClientRect(), q = c.getBoundingClientRect();
      return { haut: Math.round(r.top), bas: Math.round(r.bottom), colle: Math.round(Math.min(q.bottom, innerHeight) - r.bottom), vis: r.top >= q.top - 0.5 && r.bottom <= Math.min(q.bottom, innerHeight) + 0.5, defile: c.scrollHeight - c.clientHeight, pos: getComputedStyle(document.querySelector('.intro-e1-actions')).position }; }, f);
    const s0 = await suivant(0), s1 = await suivant(1); await suivant(0);
    ch(s0.vis && s1.vis && (nom === 'bureau' || s0.colle < 40), `[${nom}] 1. « Suivant » visible : haut de la fenêtre ${s0.haut}-${s0.bas} px, bas ${s1.haut}-${s1.bas} px (écran ${vp.height} px, ${s0.colle} px du bas, contenu à défiler ${s0.defile} px, ${s0.pos})`);
    // 2. cartes : radiogroup, une seule aria-checked, coche ✓ visible seulement sur elle
    await p.click('#scenariosListe [data-scenario] >> nth=1'); await p.waitForTimeout(100);
    const g = await p.evaluate(() => { const l = document.getElementById('scenariosListe'), c = [...l.querySelectorAll('[data-scenario]')];
      return { role: l.getAttribute('role'), lab: document.getElementById(l.getAttribute('aria-labelledby'))?.textContent, radios: c.filter(e => e.getAttribute('role') === 'radio').length, n: c.length,
        coches: c.map(e => e.getAttribute('aria-checked') === 'true' ? 'C' + (e.querySelector('.sc-coche').checkVisibility() ? '✓' : '') : e.querySelector('.sc-coche').checkVisibility() ? '✓' : '-').join(''), tab0: c.filter(e => e.tabIndex === 0).length }; });
    ch(g.role === 'radiogroup' && g.radios === g.n && g.coches === '-C✓--' && g.tab0 === 1, `[${nom}] 2. radiogroup « ${g.lab} » : ${g.radios} radios, aria-checked + ✓ sur la 2e carte seulement (${g.coches}), un seul arrêt Tab`);
    await p.focus('#scenariosListe [aria-checked="true"]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
    const k = await p.evaluate(() => { const a = document.activeElement; return { foc: a.dataset.scenario, sel: document.querySelector('#scenariosListe [aria-checked="true"]').dataset.scenario }; });
    ch(k.foc === k.sel && k.sel !== undefined, `[${nom}] 2. flèche → : sélection et focus sur « ${k.sel} »`);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
    await p.screenshot({ path: `${out}/v156_${nom}_intro_etape1.png` });
    if (nom === 'mobile-court') { await suivant(1); await p.screenshot({ path: `${out}/v156_${nom}_intro_etape1_bas.png` }); await suivant(0); }
    await p.click('#introSuivant'); await p.click('#btnJouer'); await p.waitForTimeout(300);
    const sc = await p.evaluate(() => window.__jeu().scenario);
    ch(sc === 'appartement-elec', `[${nom}] 2. la partie démarre sur la carte choisie (${sc})`);
    await p.close();
  }
  await b.close(); srv.close(); console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
