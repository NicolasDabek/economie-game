// Vérifications v1.3.1 (passe UI/UX 3, mobile 390×844) : CHROME=/usr/bin/google-chrome node test/captures-v131.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8786);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); let ok = true;
  const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
  p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
  await p.goto('http://localhost:8786/'); await p.waitForTimeout(400);
  const bas = await p.$$eval('#btnTutoriel,#btnJouer', x => x.map(e => Math.round(e.getBoundingClientRect().bottom)));
  ch(bas.every(v => v <= 844), `1. boutons de l'accueil au-dessus de la ligne de flottaison (bas à ${bas.join(' / ')} px ≤ 844)`);
  await p.screenshot({ path: `${out}/v131_mobile_accueil.png` });
  await p.click('#btnJouer'); await p.waitForTimeout(500);
  for (let i = 0; i < 5; i++) { await p.click('#btnJour'); await p.waitForTimeout(900); while (await p.isVisible('#dilemme')) { await p.click('.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(300); } }
  await p.evaluate(() => document.getElementById('toasts')?.style.setProperty('display', 'none'));
  const couvre = async () => p.evaluate(() => { scrollTo(0, document.body.scrollHeight); const t = document.querySelector('.temps').getBoundingClientRect();
    const a = [...document.querySelectorAll('.tb-alertes li, .tb-carte')].filter(e => e.offsetParent).pop().getBoundingClientRect();
    const al = document.querySelector('.tb-alertes').getBoundingClientRect(); return { alertesBas: Math.round(al.bottom), dernierBas: Math.round(a.bottom), tempsHaut: Math.round(t.top) }; });
  let c = await couvre(); ch(c.dernierBas <= c.tempsHaut && c.alertesBas <= c.tempsHaut, `2./3. défilé en bas : dernière carte ${c.dernierBas} px, alertes ${c.alertesBas} px, « Jour suivant » commence à ${c.tempsHaut} px`);
  await p.click('#btnPlusTemps'); await p.waitForTimeout(200); c = await couvre();
  ch(c.dernierBas <= c.tempsHaut, `3. ⏩ ouvert : dernière carte ${c.dernierBas} px ≤ commandes ${c.tempsHaut} px`); await p.click('#btnPlusTemps');
  const pl = await p.evaluate(() => { const e = document.getElementById('btnPlusTemps'); return [e.getAttribute('aria-label'), e.getAttribute('title')]; });
  ch(pl[0] && pl[1], `4. ⏩ aria-label « ${pl[0]} », title « ${pl[1]} »`);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(100);
  if (await p.$('summary:has-text("autres conseils")')) await p.click('summary:has-text("autres conseils")');
  const ig = await p.$$eval('[data-ignorer]', x => x.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { tag: e.tagName, h: r.height, w: r.width, bord: s.borderTopStyle !== 'none' && s.borderTopColor !== 'rgba(0, 0, 0, 0)', sl: s.textDecorationLine }; }));
  ch(ig.length > 0 && ig.every(x => x.tag === 'BUTTON' && x.h >= 44 && x.w >= 44 && x.bord && x.sl === 'none'), `5. ${ig.length} « Ignorer » : vrais boutons bordés ≥ 44 px (${ig.map(x => Math.round(x.w) + '×' + Math.round(x.h)).join(', ')})`);
  await p.evaluate(() => { const e = document.querySelector('[data-ignorer]'); e?.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(150);
  await p.screenshot({ path: `${out}/v131_mobile_ignorer.png` });
  await b.close(); srv.close(); console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
})();
