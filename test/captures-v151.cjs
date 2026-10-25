// Vérifications v1.5.1 (passe UI/UX 4, bureau 1280×800 et mobile 390×844) : CHROME=/usr/bin/google-chrome node test/captures-v151.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8787);
let ok = true;
const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
// Chevauchements : rectangles des textes visibles de <main> (rognés par l'écran et par les conteneurs défilants) contre ceux des commandes du temps
const CHEVAUCHE = () => {
  const vis = (e) => { const s = getComputedStyle(e); return e.offsetParent !== null || s.position === 'fixed'; };
  const cmd = [...document.querySelectorAll('.temps button')].filter(vis).map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
  const clip = (el) => { let r = { l: 0, t: 0, r: innerWidth, b: innerHeight };
    for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowY + s.overflowX)) { const q = p.getBoundingClientRect(); r = { l: Math.max(r.l, q.left), t: Math.max(r.t, q.top), r: Math.min(r.r, q.right), b: Math.min(r.b, q.bottom) }; } }
    return r; };
  const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n, hits = [];
  while ((n = w.nextNode())) { if (!n.textContent.trim() || !n.parentElement.offsetParent) continue; const c = clip(n.parentElement); const rg = document.createRange(); rg.selectNodeContents(n);
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
    p.on('dialog', d => { p._conf = d.message(); d.dismiss(); });
    await p.goto('http://localhost:8787/'); await p.waitForTimeout(400);
    // 1. boutons de l'accueil au-dessus de la ligne de flottaison
    const bas = await p.$$eval('#btnTutoriel,#btnJouer', x => x.map(e => Math.round(e.getBoundingClientRect().bottom)));
    ch(bas.every(v => v <= vp.height), `[${nom}] 1. « Commencer le tutoriel » / « Jouer directement » : bas à ${bas.join(' / ')} px ≤ ${vp.height}`);
    await p.screenshot({ path: `${out}/v151_${nom}_accueil.png` });
    await p.click('#btnJouer'); await p.waitForTimeout(500); await jouer(p, 5);
    await p.addStyleTag({ content: '#toasts{display:none!important}' });
    // 4. hauteur du bandeau (#ciel)
    const hCiel = await p.$eval('#ciel', e => Math.round(e.getBoundingClientRect().height));
    if (nom === 'mobile') ch(hCiel <= 130, `[mobile] 4. bandeau #ciel : ${hCiel} px (cible ~120, ≤ 130)`); else console.log(`  [bureau] bandeau #ciel : ${hCiel} px`);
    await p.click('.plus-jauges>summary'); await p.waitForTimeout(150);
    const sec = await p.$$eval('.jauges-sec .jauge', x => x.filter(e => e.offsetParent).length);
    ch(sec === 5, `[${nom}] 4. « +5 jauges » ouvre bien les 5 jauges secondaires (${sec})`);
    await p.screenshot({ path: `${out}/v151_${nom}_jauges.png` });
    await p.click('.plus-jauges>summary'); await p.waitForTimeout(150);
    // 2. rien ne chevauche les commandes du temps (haut, milieu, bas du défilement ; ⏩ ouvert sur mobile)
    // bureau : haut, milieu et bas du défilement ; mobile : « Jour suivant » reste un bouton flottant (motif FAB), on vérifie le bas de page, ⏩ fermé et ouvert
    const res = [];
    for (const f of nom === 'bureau' ? [0, 0.5, 1] : [1]) { await defiler(p, f); await p.waitForTimeout(100); res.push(...await p.evaluate(CHEVAUCHE)); if (f === 0 || nom === 'mobile') await p.screenshot({ path: `${out}/v151_${nom}_tableau.png` }); }
    if (nom === 'mobile') { await p.click('#btnPlusTemps'); await p.waitForTimeout(150); await defiler(p, 1); res.push(...await p.evaluate(CHEVAUCHE)); await p.click('#btnPlusTemps'); }
    ch(res.length === 0, `[${nom}] 2. aucun texte sous « Jour suivant » / Semaine / Mois / Prochain événement (${nom === 'bureau' ? 'haut, milieu, bas' : 'bas de page, ⏩ fermé et ouvert'})${res.length ? ' : ' + [...new Set(res)].join(' | ') : ''}`);
    await defiler(p, 0);
    // 3. Recommencer dans le menu ⋯, destructif, confirmation conservée
    const hors = await p.$eval('#btnNouvelle', e => !!e.closest('.menu-liste') && !e.checkVisibility());
    await p.click('#btnMenu'); await p.waitForTimeout(150);
    const r3 = await p.$eval('#btnNouvelle', e => ({ vis: e.checkVisibility(), dern: e === e.parentElement.lastElementChild, cls: e.className, coul: getComputedStyle(e).color, bord: getComputedStyle(e).borderTopStyle }));
    const mal = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--mal)'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ch(hors && r3.vis && r3.dern && r3.coul === mal && r3.bord !== 'none', `[${nom}] 3. « Recommencer » dans le menu ⋯ (caché menu fermé : ${hors}, visible menu ouvert : ${r3.vis}, dernier item : ${r3.dern}, séparé : ${r3.bord}, couleur ${r3.coul} = --mal ${mal})`);
    await p.screenshot({ path: `${out}/v151_${nom}_menu.png` });
    const date0 = await p.textContent('#date'); p._conf = null; await p.click('#btnNouvelle'); await p.waitForTimeout(200);
    ch(!!p._conf && /irréversible/.test(p._conf) && (await p.textContent('#date')) === date0, `[${nom}] 3. confirmation demandée (« ${(p._conf || '').slice(0, 40)}… »), refusée : partie intacte`);
    // 5. curseurs du thermostat de même largeur
    await p.click('[data-section="maison"]'); await p.waitForTimeout(200);
    if (await p.$('[data-onglet="maison"]')) await p.click('[data-onglet="maison"]').catch(() => {});
    await p.waitForTimeout(150);
    const lg = await p.$$eval('#thermostats input[type=range]', x => x.filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().width)));
    ch(lg.length >= 2 && Math.max(...lg) - Math.min(...lg) <= 1, `[${nom}] 5. curseurs du thermostat : ${lg.join(' / ')} px`);
    await p.$eval('#thermostats', e => e.scrollIntoView({ block: 'start' })); await p.waitForTimeout(100);
    await p.screenshot({ path: `${out}/v151_${nom}_thermostat.png` });
    await p.close();
  }
  await b.close(); srv.close(); console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
