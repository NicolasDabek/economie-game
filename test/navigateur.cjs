// Test navigateur (nécessite playwright-core et Chromium) : node test/navigateur.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); }); }).listen(8766);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1450, height: 1000 } }); p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8766/');
  await p.click('#btnCommencer');
  await p.click('[data-acheter="thermometre"]'); await p.click('[data-acheter="hygrometre"]'); await p.click('[data-acheter="purge"]');
  await p.click('[data-acheter-vet="sweat"][data-q="durable"]'); await p.click('[data-acheter-vet="souscouche"][data-q="eco"]');
  await p.click('[data-choix="aeration"][data-v="breve"]');
  console.log('A', await p.evaluate(() => JSON.stringify(window.__jeu().possede)));
  await p.click('#btnJour'); await p.waitForTimeout(1500);
  await p.click('[data-acheter="solaire"]');
  await p.click('[data-acheter="couture"]'); await p.click('[data-acheter="wattmetre"]');
  await p.click('#btnLessive');
  await p.click('#btnJour'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/shot1.png', fullPage: true });
  let dil = 0;
  for (let i = 0; i < 20 && !(await p.isVisible('#fin')); i++) {
    if (await p.isVisible('#dilemme')) { dil++; if (dil === 1) await p.screenshot({ path: '/tmp/shot3.png' }); await p.click('.choixDilemme:not([disabled]) >> nth=-1'); }
    await p.click('#btnSemaine'); await p.waitForTimeout(2500);
  }
  await p.screenshot({ path: '/tmp/shot2.png', fullPage: true });
  console.log('jour', await p.evaluate(() => window.__jeu().jour), 'fin', await p.isVisible('#fin'), 'dilemmes', dil);
  // sauvegarde / rechargement
  await p.click('#btnRejouer'); await p.reload(); 
  console.log('reprendre visible', await p.isVisible('#btnReprendre'));
  await p.click('#btnReprendre'); console.log('jour rechargé', await p.evaluate(() => window.__jeu().jour));
  console.log('ERREURS:', errs);
  await b.close(); srv.close();
})();
