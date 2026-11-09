// Vérifications v1.11.1 (passe UX 11) : Échap ferme le menu, focus rendu après Réglages, plan lisible en 390, lien objectif 44 px.
// CHROME=/usr/bin/google-chrome CAPTURES=/workspace/ux-shots node test/captures-v1111.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8789);
let ok = true;
const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
const actif = (p) => p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName) : null; });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [nom, vp] of [['bureau', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
    p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
    await p.goto('http://localhost:8789/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#introSuivant'); await p.click('#btnJouer'); await p.waitForTimeout(400);
    if (await p.isVisible('#coach')) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
    await p.click('#btnJour'); await p.waitForTimeout(700); while (await p.isVisible('#dilemme')) { await p.click('.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(300); }
    // 1. Échap ferme le menu
    await p.focus('#btnMenu'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    await p.keyboard.press('Tab'); await p.waitForTimeout(50);
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    const m = await p.evaluate(() => document.getElementById('menuPartie').open);
    ch(!m && (await actif(p)) === 'btnMenu', `[${nom}] 1. Échap ferme #menuPartie et rend le focus à #btnMenu (open=${m}, focus ${await actif(p)})`);
    // 2. Réglages : fermeture par bouton et par Échap
    for (const via of ['bouton', 'Échap']) {
      await p.evaluate(() => { document.getElementById('menuPartie').open = true; document.getElementById('btnReglages').click(); }); await p.waitForTimeout(150);
      if (via === 'bouton') await p.click('#reglagesFermer'); else await p.keyboard.press('Escape');
      await p.waitForTimeout(100);
      const f = await p.evaluate(() => document.getElementById('reglages').classList.contains('cache'));
      ch(f && (await actif(p)) === 'btnMenu', `[${nom}] 2. Réglages fermés (${via}) → focus #btnMenu (obtenu ${await actif(p)})`);
    }
    // 3. libellés du plan
    await p.evaluate(() => document.getElementById('ongletMaison').click()); await p.waitForTimeout(300);
    const t = await p.evaluate(() => {
      const svg = document.querySelector('#maison svg'), k = svg.getBoundingClientRect().width / 600;
      const vis = [...svg.querySelectorAll('text')].filter(x => { for (let e = x; e && e !== svg; e = e.parentElement) if (getComputedStyle(e).display === 'none') return false; return true; }).filter(x => !/^[\s\p{Extended_Pictographic}\u200d\ufe0f]*$/u.test(x.textContent));
      const min = Math.min(...vis.map(x => parseFloat(getComputedStyle(x).fontSize) * k));
      const li = document.querySelector('.maison-liste'), liVis = li && getComputedStyle(li).display !== 'none';
      return { min, liVis, liPx: li ? parseFloat(getComputedStyle(li).fontSize) : 0, txt: li?.textContent || '' };
    });
    ch(t.min >= 12, `[${nom}] 3. textes du plan visibles ≥ 12 px (min ${t.min.toFixed(1)} px)`);
    if (nom === 'mobile') ch(t.liVis && t.liPx >= 12 && /Salon/.test(t.txt) && /Chambre/.test(t.txt), `[mobile] 3. liste lisible hors SVG (${t.liPx}px)`);
    await p.screenshot({ path: path.join(out, `v1111_${nom}_plan.png`) });
    // 4. lien objectif
    const h = await p.evaluate(() => { const x = [...document.querySelectorAll('.objectif button.lien')].find(e => e.offsetParent !== null); return x ? x.getBoundingClientRect().height : null; });
    ch(h === null || h >= 44, `[${nom}] 4. .objectif button.lien hauteur ${h === null ? 'absent ici' : h + 'px'}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
