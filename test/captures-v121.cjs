// Captures et contrastes v1.2.1 : CHROME=/usr/bin/google-chrome node test/captures-v121.cjs → /workspace/ux-shots/v121_*.png
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots';
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8783);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); let ok = true;
  p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
  await p.goto('http://localhost:8783/'); await p.evaluate(() => { const b = document.getElementById('introSuivant'); if (b && b.offsetParent) b.click(); }); await p.click('#btnJouer'); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/v121_mobile_accueil_j1.png` });
  // 1. rien sous le bouton flottant en bas de page
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
  const recouvre = await p.evaluate(() => { const fab = document.querySelector('.temps').getBoundingClientRect(), cartes = [...document.querySelectorAll('#tableau .tb-carte')]; const der = cartes.at(-1).getBoundingClientRect(); return der.bottom > fab.top + 1; });
  console.log(recouvre ? '✗ dernière carte sous « Jour suivant »' : '✓ dernière carte au-dessus de « Jour suivant »'); if (recouvre) ok = false;
  await p.screenshot({ path: `${out}/v121_mobile_bas.png` });
  await p.evaluate(() => scrollTo(0, 0));
  // 2. date sur une ligne
  const hDate = await p.evaluate(() => document.querySelector('.tb-date').getBoundingClientRect().height);
  console.log(hDate < 30 ? `✓ date sur une ligne (${Math.round(hDate)} px) : ${await p.textContent('.date-courte')}` : `✗ date sur plusieurs lignes (${hDate} px)`); if (hDate >= 30) ok = false;
  // 3. menu
  await p.click('#btnMenu'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/v121_mobile_menu.png` });
  console.log('menu :', (await p.$$eval('.menu-liste button', x => x.map(y => y.innerText.trim()))).join(' | '), '· année :', await p.textContent('#menuAnnee'));
  await p.click('#btnMenu');
  // 4. lien d'évitement
  await p.focus('.sauter'); const hs = await p.evaluate(() => document.activeElement.classList.contains('sauter') ? document.activeElement.getBoundingClientRect().height : -1);
  console.log(hs >= 44 ? `✓ « Aller au jeu » ${Math.round(hs)} px` : `✗ « Aller au jeu » ${hs} px`); if (hs < 44) ok = false;
  // 5. contraste : texte blanc sur les pixels les plus clairs du bandeau sous chaque texte
  const zones = await p.evaluate(() => ['#date', '#heure', '.jauge .lib span', '.jauge .lib b', 'details.plus-jauges>summary', '#btnMenu'].map(sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { sel, x: r.x, y: r.y, w: r.width, h: r.height }; }));
  await p.evaluate(() => document.activeElement?.blur()); await p.mouse.move(0, 800);
  await p.evaluate(() => document.querySelectorAll('#ciel *').forEach(e => { e.style.color = 'transparent'; e.style.textShadow = 'none'; e.querySelectorAll('svg').forEach(s => s.style.visibility = 'hidden'); }));
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 300 } });
  fs.writeFileSync('/tmp/bandeau.png', buf); fs.writeFileSync('/tmp/zones.json', JSON.stringify(zones));
  console.log(ok ? 'OK' : 'ÉCHEC'); await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})();
