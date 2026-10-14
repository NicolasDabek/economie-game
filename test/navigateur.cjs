// Test navigateur (nécessite playwright-core et Chromium) : node test/navigateur.cjs
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); }); }).listen(8766);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1450, height: 1000 } }); p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8766/');
  const jour = async () => { await p.click('#btnJour'); await p.waitForTimeout(1200); while (await p.isVisible('#dilemme')) { await p.click('.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(300); } };
  await p.click('[data-duree="3"]'); await p.click('#btnCommencer');
  console.log('campagne', await p.evaluate(() => window.__jeu().joursTotal));
  await p.click('[data-acheter="thermometre"]'); await p.click('[data-acheter="hygrometre"]'); await p.click('[data-acheter="purge"]');
  await p.click('[data-onglet="linge"]');
  await p.click('[data-acheter-vet="sweat"][data-q="durable"]'); await p.click('[data-acheter-vet="souscouche"][data-q="eco"]');
  await p.click('[data-onglet="maison"]'); await p.click('[data-choix="aeration"][data-v="breve"]');
  await p.click('[data-onglet="eau"]'); await p.click('[data-acheter="pommeau"]'); await p.click('[data-set="sys.ballon.consigne"][data-v="55"]'); await p.click('[data-set="sys.douche.minutes"][data-v="7"]');
  await p.click('[data-onglet="cuisine"]'); await p.click('[data-set="sys.regime"][data-v="batch"]'); await p.click('[data-acheter="autocuiseur"]:not([data-occasion])');
  await p.click('[data-onglet="elec"]'); await p.click('[data-action="tarif"][data-v="hphc"]');
  await p.click('[data-onglet="budget"]'); await p.click('[data-set="sys.plaisirs"][data-v="10"]'); await p.click('[data-action="releves"]'); await p.click('[data-action="resilier"][data-v="streaming"]');
  await p.click('[data-onglet="jardin"]');
  await p.click('[data-onglet="transport"]'); await p.click('[data-acheter="gourde"]:not([data-occasion])'); await p.click('[data-set="transport.mode"][data-v="commun"]'); await p.click('[data-set="transport.courses"][data-v="regroupees"]'); await p.click('[data-set="transport.repas"][data-v="emporte"]');
  await p.click('[data-filtre="transport"]'); await p.click('[data-filtre="tous"]');
  // v0.5 : banque et investissement
  await p.click('[data-onglet="banque"]'); await p.click('[data-fin="profil"][data-v="modeste"]');
  await p.fill('#m-lep', '200'); await p.click('[data-fin="dep"][data-v="lep"]');
  await p.click('[data-fin="av"][data-v="enLigne"]'); await p.fill('#m-avEuros', '150'); await p.click('[data-fin="dep"][data-v="avEuros"]');
  await p.screenshot({ path: '/tmp/shotBanque.png', fullPage: true });
  await p.click('[data-onglet="invest"]'); await p.fill('#m-peaMonde', '300'); await p.click('[data-fin="dep"][data-v="peaMonde"]');
  await p.click('[data-fin="alloc"][data-v="actions"]'); await p.click('[data-fin="ans"][data-v="30"]'); await p.click('[data-fin="projeter"]');
  await p.screenshot({ path: '/tmp/shotInvest.png', fullPage: true });
  console.log('finance', await p.evaluate(() => { const f = window.__jeu().fin; return JSON.stringify({ profil: f.profil, lep: f.livrets.lep.solde, av: f.av?.euros, pea: f.pea?.verse, principes: window.__jeu().principes.filter(x => ['quinzaine', 'enveloppe', 'coutOpportunite', 'horizon', 'fraisRendement'].includes(x)) }); }));
  await p.click('[data-onglet="banque"]'); console.log('meilleur usage affiché', await p.isVisible('text=Meilleur usage de 100 €'), (await p.textContent('#pBanque')).includes('%/an'));
  await p.click('[data-onglet="maison"]');
  console.log('A', await p.evaluate(() => JSON.stringify(window.__jeu().possede)));
  await p.click('#btnJour'); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__jeu().argent += 4000; });   // test : de quoi acheter le solaire et la ventilation passive
  for (let i = 0; i < 3; i++) await jour();   // samedi : du temps libre
  await p.click('[data-onglet="elec"]'); await p.click('[data-acheter="solaire"]'); await p.click('[data-set="sys.stockage.actif"][data-v="true"]'); await p.click('[data-onglet="maison"]');
  await jour(); await p.click('[data-onglet="maison"]');
  await p.click('[data-acheter="chemineeDIY"]:not([data-occasion])');
  console.log('chantier', await p.evaluate(() => JSON.stringify(window.__jeu().passif.chantiers)));
  for (let i = 0; i < 3; i++) await jour();
  await p.click('[data-onglet="maison"]'); await p.click('[data-acheter="puitsHydro"]:not([data-occasion])');
  for (let i = 0; i < 2; i++) await jour();
  await p.click('[data-onglet="maison"]');
  await p.click('[data-set="passif.mode"][data-v="trombe"]'); await p.click('[data-set="passif.clapetNuit"][data-v="ferme"]'); await p.click('[data-set="passif.puitsMode"][data-v="auto"]'); await p.click('[data-action="regard"]');
  await jour(); await p.click('[data-onglet="maison"]');
  console.log('passif', await p.evaluate(() => { const s = window.__jeu(); return JSON.stringify({ mode: s.passif.mode, j: s.passif.j && { Pch: s.passif.j.Pch.toFixed(2), Ppuits: s.passif.j.Ppuits.toFixed(2) }, attr: [s.attribution.chemineeDIY, s.attribution.puitsHydro] }); }));
  await p.screenshot({ path: '/tmp/shot5.png', fullPage: true });
  await p.click('[data-tri="mesure"]'); await p.click('[data-principe="mesure"]');
  await p.click('[data-acheter="couture"]'); await p.click('[data-acheter="wattmetre"]');
  await p.click('[data-onglet="linge"]'); await p.click('#btnLessive'); await p.click('[data-onglet="eau"]');
  await p.click('#btnJour'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/shot1.png', fullPage: true });
  let dil = 0, bilans = 0, clics = 0, shot4 = false; const t0 = Date.now();
  await p.click('[data-routine="lessive"]').catch(() => {});
  for (let i = 0; i < 600 && !(await p.isVisible('#fin')); i++) {
    if (await p.isVisible('#dilemme')) {
      dil++; const txt = await p.textContent('#dilemmeContenu');
      if (txt.includes('Bilan de l')) { bilans++; if (bilans === 1) await p.screenshot({ path: '/tmp/shotBilan.png' }); }
      if (dil === 1) await p.screenshot({ path: '/tmp/shot3.png' });
      await p.click('.choixDilemme:not([disabled]) >> nth=-1');
    } else { clics++; await p.click(i % 3 ? '#btnEvenement' : '#btnMois'); await p.waitForFunction(() => !document.getElementById('btnMois').matches(':disabled') && true, null, { timeout: 20000 }); await p.waitForTimeout(150); }
    if (i >= 12 && !shot4 && !(await p.isVisible('#dilemme'))) { shot4 = true; await p.click('[data-onglet="maison"]'); await p.screenshot({ path: '/tmp/shot4.png', fullPage: true }); }
  }
  console.log('avance rapide', clics, 'clics', ((Date.now() - t0) / 1000).toFixed(1), 's', 'bilans', bilans, 'date', await p.textContent('#date'));
  await p.screenshot({ path: '/tmp/shot2.png', fullPage: true });
  console.log('jour', await p.evaluate(() => window.__jeu().jour), 'fin', await p.isVisible('#fin'), 'dilemmes', dil);
  // sauvegarde / rechargement
  await p.click('#btnRejouer'); await p.reload(); 
  console.log('reprendre visible', await p.isVisible('#btnReprendre'));
  await p.click('#btnReprendre'); console.log('jour rechargé', await p.evaluate(() => window.__jeu().jour));
  console.log('sys rechargé', await p.evaluate(() => typeof window.__jeu().sys.ballon.consigne));
  // sauvegarde v0.3 : migrée
  await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('economie-game-sauvegarde')); delete o.transport; o.version = 3; localStorage.setItem('economie-game-sauvegarde', JSON.stringify(o)); });
  await p.reload(); await p.click('#btnReprendre'); console.log('migration v3 → v7', await p.evaluate(() => window.__jeu().version), typeof (await p.evaluate(() => window.__jeu().transport.mode)));
  await p.click('#btnSauver'); await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('economie-game-sauvegarde')); delete o.fin; o.version = 4; localStorage.setItem('economie-game-sauvegarde', JSON.stringify(o)); });
  await p.reload(); await p.click('#btnReprendre'); console.log('migration v4 → v7', await p.evaluate(() => window.__jeu().version), await p.evaluate(() => window.__jeu().fin.livrets.livretA.solde));
  await p.click('[data-onglet="banque"]'); await p.click('[data-onglet="invest"]'); await p.click('#btnJour'); await p.waitForTimeout(1500);
  const v5 = fs.readFileSync(path.join(__dirname, 'sauvegarde-v5.json'), 'utf8');
  await p.evaluate((x) => localStorage.setItem('economie-game-sauvegarde', x), v5);
  await p.reload(); await p.click('#btnReprendre'); console.log('migration v5 → v7', await p.evaluate(() => { const s = window.__jeu(); return JSON.stringify({ v: s.version, jour: s.jour, total: s.joursTotal, salaire: s.eco?.salaire }); }));
  await p.click('#btnMois'); await p.waitForTimeout(3000); console.log('après un mois', await p.textContent('#date'));
  const v6 = fs.readFileSync(path.join(__dirname, 'sauvegarde-v6.json'), 'utf8');
  await p.evaluate((x) => localStorage.setItem('economie-game-sauvegarde', x), v6);
  await p.reload(); await p.click('#btnReprendre'); console.log('migration v6 → v7', await p.evaluate(() => { const s = window.__jeu(); return JSON.stringify({ v: s.version, jour: s.jour, mor: !!s.mor }); }));
  await p.click('#btnMois'); await p.waitForTimeout(3000); console.log('moral affiché', (await p.textContent('#jauges')).includes('tendance'));
  await p.evaluate(() => localStorage.setItem('economie-game-sauvegarde', JSON.stringify({ version: 2, jour: 9 })));
  await p.reload(); await p.waitForTimeout(300);
  console.log('ancienne sauvegarde : reprendre visible', await p.isVisible('#btnReprendre'), 'effacée', await p.evaluate(() => localStorage.getItem('economie-game-sauvegarde') === null));
  console.log('ERREURS:', errs);
  await b.close(); srv.close();
})();
