// Captures et vérifications v1.3.0 (scénarios de départ) : CHROME=/usr/bin/google-chrome node test/captures-v130.cjs → /workspace/ux-shots/v130_*.png
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.env.CAPTURES || '/tmp/economie-captures';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8785);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); let ok = true;
  const ch = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };
  p.on('pageerror', e => { ok = false; console.log('ERREUR', e.message); });
  await p.goto('http://localhost:8785/'); await p.waitForTimeout(400);
  const n = await p.$$eval('[data-scenario]', x => x.length); ch(n === 4, `${n} scénarios proposés à l'accueil`);
  const petits = await p.$$eval('[data-scenario]', x => x.filter(e => e.getBoundingClientRect().height < 44).length); ch(petits === 0, 'boutons de scénario ≥ 44 px');
  await p.click('[data-scenario="appartement-elec"]'); await p.waitForTimeout(150);
  ch(await p.getAttribute('[data-scenario="appartement-elec"]', 'aria-pressed') === 'true', 'choix « appartement » marqué (aria-pressed)');
  ch((await p.textContent('#pitchLogement')).includes('30 m²'), `accroche : « ${await p.textContent('#pitchLogement')} »`);
  await p.evaluate(() => document.querySelector('#scenarios').scrollIntoView({ block: 'start' })); await p.waitForTimeout(150);
  await p.screenshot({ path: `${out}/v130_mobile_scenarios.png` });
  await p.click('#btnJouer'); await p.waitForTimeout(500);
  const etat = await p.evaluate(() => JSON.parse(localStorage.getItem('economie-game-sauvegarde') || '{}'));
  ch(etat.scenario === 'appartement-elec' && etat.version === 10, `partie lancée et sauvegardée : scénario ${etat.scenario}, format v${etat.version}`);
  ch((await p.textContent('#menuAnnee')).includes('Appart'), `menu : « ${await p.textContent('#menuAnnee')} »`);
  const jour = async () => { await p.click('#btnJour'); await p.waitForTimeout(1200); while (await p.isVisible('#dilemme')) { await p.click('.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(300); } };
  for (let i = 0; i < 3; i++) await jour();
  await p.click('[data-section="maison"]'); await p.waitForTimeout(200);
  if (await p.isVisible('[data-onglet="maison"]')) await p.click('[data-onglet="maison"]');
  await p.waitForTimeout(300);
  ch(await p.evaluate(() => document.body.textContent.includes('Convecteurs électriques')), 'réglages du chauffage : convecteurs électriques');
  ch(!(await p.evaluate(() => !!document.querySelector('[data-acheter="purge"]'))), 'pas de purge des radiateurs à vendre avec des convecteurs');
  await p.click('[data-section="accueil"]'); await p.waitForTimeout(200);
  await p.evaluate(() => { document.getElementById('toasts')?.style.setProperty('display', 'none'); scrollTo(0, 0); }); await p.waitForTimeout(150);
  await p.screenshot({ path: `${out}/v130_mobile_appart_j4.png` });
  await p.click('#btnMenu'); await p.waitForTimeout(200); await p.evaluate(() => document.activeElement?.blur()); await p.mouse.move(0, 830);
  await p.screenshot({ path: `${out}/v130_mobile_appart_menu.png` }); await p.click('#btnMenu');
  // rechargement : le scénario suit la sauvegarde
  await p.reload(); await p.waitForTimeout(300); await p.click('#btnReprendre'); await p.waitForTimeout(300);
  ch((await p.textContent('#menuAnnee')).includes('Appart'), 'partie reprise : scénario conservé');
  // ancienne sauvegarde v9 : maison au gaz conservée
  await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('economie-game-sauvegarde')); o.version = 9; delete o.scenario; localStorage.setItem('economie-game-sauvegarde', JSON.stringify(o)); });
  await p.reload(); await p.waitForTimeout(300); await p.click('#btnReprendre'); await p.waitForTimeout(300);
  ch((await p.textContent('#menuAnnee')).includes('Maison 45'), `migration v9 → v10 : « ${await p.textContent('#menuAnnee')} »`);
  console.log(ok ? 'OK' : 'ÉCHEC'); await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})();
