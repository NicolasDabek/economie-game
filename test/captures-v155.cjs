// Vérifications v1.5.5 (passe UX 6, bureau 1280×800 et mobile 390×844) : CHROME=/usr/bin/google-chrome node test/captures-v155.cjs
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
  for (const [nom, vp] of [['bureau', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
    p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
    await p.goto('http://localhost:8787/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    const etat = () => p.evaluate(() => { const v = (s) => !!document.querySelector(s)?.checkVisibility(); const c = document.querySelector('#intro .modal-contenu');
      return { num: document.getElementById('introEtape').innerText.replace(/\s+/g, ' ').trim(), scen: v('#scenarios'), duree: v('#intro .duree'), jouer: v('#btnJouer'), tuto: v('#btnTutoriel'), suivant: v('#introSuivant'), retour: v('#introRetour'),
        deborde: c.scrollHeight - c.clientHeight, h: Math.round(c.getBoundingClientRect().height), cartes: document.querySelectorAll('#scenariosListe [data-scenario]').length }; });
    const e1 = await etat();
    ch(/1\s*\/\s*2/.test(e1.num) && e1.scen && !e1.duree && !e1.jouer && e1.suivant && !e1.retour, `[${nom}] 1. étape 1 : « ${e1.num} », ${e1.cartes} cartes de départ, durée masquée, « Suivant » visible ; hauteur ${e1.h} px, débordement ${e1.deborde} px`);
    if (nom === 'bureau') ch(e1.deborde <= 0, `[bureau] 1. étape 1 tient sans défiler à 1280×800 (${e1.h} px)`);
    await p.screenshot({ path: `${out}/v155_${nom}_intro_etape1.png` });
    await p.click('#scenariosListe [data-scenario] >> nth=1'); await p.click('#introSuivant'); await p.waitForTimeout(150);
    const e2 = await etat(), foc = await p.evaluate(() => document.activeElement?.dataset?.duree);
    ch(/2\s*\/\s*2/.test(e2.num) && !e2.scen && e2.duree && e2.jouer && e2.tuto && e2.retour && !e2.suivant && !!foc, `[${nom}] 1. étape 2 : « ${e2.num} », durée + Jouer / Tutoriel / Retour visibles, focus sur « ${foc} ans » ; hauteur ${e2.h} px, débordement ${e2.deborde} px`);
    await p.screenshot({ path: `${out}/v155_${nom}_intro_etape2.png` });
    await p.click('#introRetour'); await p.waitForTimeout(150); const e3 = await etat();
    const choix = await p.$$eval('#scenariosListe [data-scenario]', x => x.findIndex(e => e.getAttribute('aria-pressed') === 'true' || e.classList.contains('actif-btn') || e.getAttribute('aria-checked') === 'true'));
    ch(/1\s*\/\s*2/.test(e3.num) && e3.scen && !e3.duree, `[${nom}] 1. « Retour » revient à l'étape 1 (scénario choisi conservé : carte ${choix + 1})`);
    await p.click('#introSuivant'); await p.click('[data-duree="10"]'); await p.click('#btnJouer'); await p.waitForTimeout(400);
    const jeu = await p.evaluate(() => ({ ans: Math.round(window.__jeu().joursTotal / 365), sc: window.__jeu().scenario, cache: document.getElementById('intro').classList.contains('cache') }));
    ch(jeu.cache && jeu.ans === 10 && jeu.sc && jeu.sc !== 'standard', `[${nom}] 1. la partie démarre avec les choix des 2 étapes (${jeu.sc}, ${jeu.ans} ans)`);
    if (nom === 'bureau') {
      const a = await p.evaluate(() => { const d = document.getElementById('intro'), t = document.getElementById(d.getAttribute('aria-labelledby')); return { role: d.getAttribute('role'), lab: t?.tagName + ' « ' + t?.textContent.trim().slice(0, 40) + '… »' }; });
      ch(a.role === 'dialog' && /^H2/.test(a.lab), `2. dialogue d'accueil : aria-labelledby → ${a.lab}`);
      const h1 = await p.$$eval('h1', x => x.map(e => ({ t: e.textContent.trim(), w: e.getBoundingClientRect().width })));
      ch(h1.length === 1 && h1[0].t === 'Économie Game', `3. un seul <h1> « ${h1[0]?.t} » (visuellement masqué, ${h1[0]?.w} px)`);
      const hov = await p.evaluate(() => { let hors = 0, dans = 0; const voir = (rs, m) => { for (const r of rs) { if (r.cssRules && r.media) voir(r.cssRules, m || /hover:\s*hover/.test(r.media.mediaText)); else if (r.selectorText && /:hover/.test(r.selectorText)) m ? dans++ : hors++; } };
        for (const s of document.styleSheets) voir(s.cssRules, false); return { hors, dans }; });
      ch(hov.hors === 0 && hov.dans > 0, `4. règles :hover : ${hov.dans} dans @media (hover:hover), ${hov.hors} en dehors`);
    }
    await p.close();
  }
  await b.close(); srv.close(); console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
