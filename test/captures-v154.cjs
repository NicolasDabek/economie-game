// Vérifications v1.5.4 (passe UI/UX 5, bureau 1280×800 et mobile 390×844) : CHROME=/usr/bin/google-chrome node test/captures-v154.cjs
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
    await p.goto('http://localhost:8787/'); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = document.getElementById('introSuivant'); if (b && b.offsetParent) b.click(); }); await p.click('#btnJouer'); await p.waitForTimeout(500);
    await p.addStyleTag({ content: '#toasts{display:none!important}' });
    // 1. Bilan du jour 1 : état vide, ni titre « Dépensier » ni jauges à 0 %
    await p.click('[data-section="bilan"]'); await p.waitForTimeout(250);
    if (await p.$('[data-onglet="resume"]')) { await p.click('[data-onglet="resume"]'); await p.waitForTimeout(200); }
    const r1 = await p.$eval('#resume', e => e.innerText);
    ch(/disponible à partir de demain/.test(r1) && !/Dépensier|Titre si la partie/.test(r1) && !/0 %/.test(r1), `[${nom}] 1. Bilan du jour 1 : « ${r1.split('\n')[0]} » (pas de titre, pas de jauges à 0 %)`);
    await p.screenshot({ path: `${out}/v154_${nom}_bilan_j1.png` });
    // 4. sous-onglets du Bilan (et de chaque section) entièrement visibles
    const secs = await p.$$eval('#sections [role=tab]', x => x.map(e => e.dataset.section));
    const coupes = [];
    for (const sc of secs) { await p.click(`[data-section="${sc}"]`); await p.waitForTimeout(200);
      const r = await p.$$eval('#onglets [role=tab]', x => x.filter(e => e.offsetParent).map(e => { const q = e.getBoundingClientRect(), n = e.parentElement.getBoundingClientRect(); return { t: e.textContent.trim(), ok: q.left >= n.left - 0.5 && q.right <= n.right + 0.5 && q.right <= innerWidth && e.scrollWidth <= e.clientWidth + 1 }; }));
      const n = await p.$eval('#onglets', e => ({ sw: e.scrollWidth, cw: e.clientWidth, h: Math.round(e.getBoundingClientRect().height) }));
      for (const x of r) if (!x.ok) coupes.push(`${sc}/${x.t}`);
      if (n.sw > n.cw + 1) coupes.push(`${sc} (défilement ${n.sw} > ${n.cw})`);
      if (sc === 'bilan') console.log(`  [${nom}] sous-onglets du Bilan : ${r.map(x => x.t).join(' · ')} ; hauteur ${n.h} px, largeur ${n.sw} / ${n.cw} px`); }
    ch(coupes.length === 0, `[${nom}] 4. aucun sous-onglet coupé, dans les ${secs.length} sections${coupes.length ? ' : ' + coupes.join(', ') : ''}`);
    await p.click('[data-section="bilan"]'); await p.waitForTimeout(200); await defiler(p, 0);
    if (nom === 'mobile') await p.screenshot({ path: `${out}/v154_mobile_bilan_onglets.png` });
    // 2. petits textes des cartes .stats (après une journée jouée)
    await jouer(p, 1); await p.click('[data-section="bilan"]'); await p.waitForTimeout(200);
    if (await p.$('[data-onglet="resume"]')) { await p.click('[data-onglet="resume"]'); await p.waitForTimeout(200); }
    const fs2 = await p.$$eval('.stats small', x => x.filter(e => e.offsetParent).map(e => parseFloat(getComputedStyle(e).fontSize)));
    const rem = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    ch(fs2.length > 0 && Math.min(...fs2) >= 0.75 * rem - 0.01, `[${nom}] 2. .stats small : ${[...new Set(fs2)].join(' / ')} px ≥ .75rem (${0.75 * rem} px), ${fs2.length} textes`);
    const r1b = await p.$eval('#resume', e => e.innerText);
    ch(/Titre si la partie/.test(r1b), `[${nom}] 1. au jour 2, le bilan complet revient`);
    // 3. clavier : un seul arrêt Tab par liste d'onglets, ← → Début Fin
    const tl = await p.$$eval('[role=tablist]', x => x.filter(l => l.offsetParent || getComputedStyle(l).position === 'fixed').map(l => ({ id: l.id || l.getAttribute('aria-label'), n0: [...l.querySelectorAll('[role=tab]')].filter(b => b.getAttribute('tabindex') === '0').length, n: l.querySelectorAll('[role=tab]').length })));
    ch(tl.length >= 2 && tl.every(x => x.n0 === 1), `[${nom}] 3. tabindex itinérant (roving) : ${tl.map(x => `${x.id} ${x.n0}/${x.n}`).join(', ')}`);
    const etat = () => p.evaluate(() => ({ sel: document.querySelector('#sections [aria-selected=true]')?.dataset.section, foc: document.activeElement?.dataset?.section }));
    await p.focus('#sections [aria-selected=true]');
    const e0 = await etat(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); const e1 = await etat();
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250); const e2 = await etat();
    await p.keyboard.press('End'); await p.waitForTimeout(250); const e3 = await etat();
    await p.keyboard.press('Home'); await p.waitForTimeout(250); const e4 = await etat();
    ch(e1.sel !== e0.sel && e1.foc === e1.sel && e2.sel === e0.sel && e2.foc === e0.sel && e3.sel === secs.at(-1) && e3.foc === e3.sel && e4.sel === secs[0] && e4.foc === e4.sel,
      `[${nom}] 3. sections au clavier : ${e0.sel} →(→) ${e1.sel} →(←) ${e2.sel} →(Fin) ${e3.sel} →(Début) ${e4.sel}, le focus suit`);
    await p.click('[data-section="bilan"]'); await p.waitForTimeout(200);
    await p.focus('#onglets [aria-selected=true]'); const o0 = await p.evaluate(() => document.activeElement.dataset.onglet);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
    const o1 = await p.evaluate(() => ({ foc: document.activeElement.dataset.onglet, sel: document.querySelector('#onglets [aria-selected=true]')?.dataset.onglet }));
    ch(o1.sel && o1.sel !== o0 && o1.foc === o1.sel, `[${nom}] 3. sous-onglets au clavier : ${o0} → ${o1.sel}, le focus suit`);
    // 5. bas de chaque onglet : rien sous « Jour suivant » / ⏩, et réserve ≥ hauteur des commandes
    const res = [];
    for (const sc of secs) { await p.click(`[data-section="${sc}"]`); await p.waitForTimeout(200);
      const ss = await p.$$eval('#onglets [role=tab]', x => x.filter(e => e.offsetParent).map(e => e.dataset.onglet));
      for (const o of (ss.length ? ss : [null])) { if (o) { await p.click(`[data-onglet="${o}"]`); await p.waitForTimeout(200); }
        await defiler(p, 1); await p.waitForTimeout(120);
        const h = await p.evaluate(() => { const T = document.querySelector('.temps'), t = T.getBoundingClientRect(), a = document.querySelector('main.app'); return { fixe: getComputedStyle(T).position === 'fixed', barre: Math.round(innerHeight - t.top), pad: Math.round(parseFloat(getComputedStyle(a).paddingBottom)) }; });
        const x = await p.evaluate(CHEVAUCHE); if (x.length) res.push(`${sc}${o ? '/' + o : ''} : ${x.join(' | ')}`);
        if (h.fixe && h.pad < h.barre) res.push(`${sc}${o ? '/' + o : ''} : réserve ${h.pad} < barre ${h.barre}`);
        if (sc === secs[0] && !res.length) console.log(h.fixe ? `  [${nom}] réserve sous le contenu ${h.pad} px, commandes du temps ${h.barre} px depuis le bas` : `  [${nom}] commandes du temps en barre fixe hors du contenu (${h.barre} px)`); } }
    ch(res.length === 0, `[${nom}] 5. bas de chaque onglet : aucun texte sous les commandes du temps${res.length ? ' : ' + res.join(' ; ') : ''}`);
    if (nom === 'mobile') { await p.click('[data-section="bilan"]'); await p.waitForTimeout(200); await defiler(p, 1); await p.waitForTimeout(100); await p.screenshot({ path: `${out}/v154_mobile_bas.png` }); }
    await p.close();
  }
  await b.close(); srv.close(); console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
