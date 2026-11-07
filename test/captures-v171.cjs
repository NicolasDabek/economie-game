// Vérifications v1.7.1 (passe UX 9) : tutoriel (#coach) modal au clavier, et bouton « Mois » sur mobile.
// CHROME=/usr/bin/google-chrome CAPTURES=/workspace/ux-shots node test/captures-v171.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8788);
let ok = true;
const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
const actif = (p) => p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.textContent.trim().slice(0, 30)) : null; });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [nom, vp] of [['bureau', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
    p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
    await p.goto('http://localhost:8788/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    // ouverture depuis le bouton d'aide, focus mémorisé
    await p.evaluate(() => { document.getElementById('intro').classList.add('cache'); document.getElementById('menuPartie').open = true; }); await p.focus('#btnAide'); await p.keyboard.press('Enter');
    await p.waitForTimeout(250);
    const at = await p.evaluate(() => { const c = document.getElementById('coach'); return { modal: c.getAttribute('aria-modal'), role: c.getAttribute('role'), vis: !c.classList.contains('cache') }; });
    ch(at.vis && at.role === 'dialog' && at.modal === 'true', `[${nom}] 1. #coach role=dialog aria-modal=${at.modal}`);
    ch(await actif(p) === 'coachSuiv', `[${nom}] 1. focus initial sur #coachSuiv (obtenu ${await actif(p)})`);
    await p.screenshot({ path: path.join(out, `v171_${nom}_coach_ouvert.png`) });
    // piège Tab / Maj+Tab : 12 pressions, le focus ne sort jamais de la bulle (ou de l'élément mis en lumière)
    const dans = () => p.evaluate(() => { const a = document.activeElement, bu = document.querySelector('.coach-bulle'); return !!(bu.contains(a) || a.closest?.('.coach') || a.classList.contains('coach-cible') || a.matches?.('[data-acheter]')); });
    let sorties = [];
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (!(await dans())) sorties.push(await actif(p)); }
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Shift+Tab'); if (!(await dans())) sorties.push(await actif(p)); }
    ch(!sorties.length, `[${nom}] 1. Tab et Maj+Tab restent dans la bulle (${sorties.length ? 'sorti vers ' + sorties.join(', ') : '24 pressions'})`);
    // v1.11.1 (passe UX 10) : le focus tourne vraiment (il ne reste pas collé sur un seul bouton)
    const vusT = new Set(), vusS = new Set();
    for (let i = 0; i < 8; i++) { await p.keyboard.press('Tab'); vusT.add(await actif(p)); }
    for (let i = 0; i < 8; i++) { await p.keyboard.press('Shift+Tab'); vusS.add(await actif(p)); }
    ch(vusT.size >= 2 && vusS.size >= 2, `[${nom}] 1b. Tab et Maj+Tab bouclent (${[...vusT].join(',')} / ${[...vusS].join(',')})`);
    // Échap ferme, focus rendu à #btnAide
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    const ferme = await p.evaluate(() => document.getElementById('coach').classList.contains('cache'));
    ch(ferme && ['btnAide', 'btnMenu'].includes(await actif(p)), `[${nom}] 1. Échap ferme le tutoriel et rend le focus au déclencheur (#btnAide, ou #btnMenu si le menu s'est refermé) (obtenu ${await actif(p)})`);
    // 2. bouton « Mois »
    const m = await p.evaluate(() => { const pl = document.getElementById('btnPlusTemps'), mo = document.getElementById('btnMois');
      return { moisVis: mo.offsetParent !== null, label: pl.getAttribute('aria-label'), title: pl.getAttribute('title'), exp: pl.getAttribute('aria-expanded'), ctl: pl.getAttribute('aria-controls') }; });
    if (nom === 'mobile') {
      ch(!m.moisVis && /mois/i.test(m.label) && /mois/i.test(m.title) && m.exp === 'false' && /btnMois/.test(m.ctl || ''), `[mobile] 2. « Mois » replié derrière ⏩ : aria-label « ${m.label} », title, aria-expanded=${m.exp}, aria-controls=${m.ctl}`);
      await p.screenshot({ path: path.join(out, 'v171_mobile_temps_replie.png') });
      await p.evaluate(() => document.getElementById('btnPlusTemps').click()); await p.waitForTimeout(150);
      const o = await p.evaluate(() => ({ vis: document.getElementById('btnMois').offsetParent !== null, exp: document.getElementById('btnPlusTemps').getAttribute('aria-expanded') }));
      ch(o.vis && o.exp === 'true', `[mobile] 2. ⏩ déplie Semaine / Mois / Prochain événement (aria-expanded=${o.exp}, Mois visible ${o.vis})`);
      await p.screenshot({ path: path.join(out, 'v171_mobile_temps_deplie.png') });
    } else ch(m.moisVis, `[bureau] 2. « Mois » visible directement`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
