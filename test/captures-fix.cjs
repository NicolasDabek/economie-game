// Captures v0.8.1 : CHROME=/usr/bin/google-chrome node test/captures-fix.cjs  → /workspace/ux-shots/fix_*.png
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots';
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); }); }).listen(8768);
const clic = async (p, sel) => { try { await p.click(sel, { timeout: 2000 }); return true; } catch { return false; } };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errs = [];
  for (const [nom, vp] of [['', { width: 1280, height: 800 }], ['mobile_', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8768/'); await p.waitForTimeout(400);
    await clic(p, '#btnJouer'); await p.waitForTimeout(400);
    // gauges au départ (7 h : aube, pas la lune)
    await p.screenshot({ path: `${out}/fix_${nom}jauges.png`, clip: { x: 0, y: 0, width: vp.width, height: nom ? 260 : 140 } });
    console.log(nom || 'bureau', 'astre à 7 h :', await p.textContent('#astre'));
    const vis = await p.evaluate(() => [...document.querySelectorAll('#jauges .jauge')].map(j => { const r = j.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.width > 40; }));
    console.log('jauges visibles', vis.filter(Boolean).length, '/', vis.length);
    for (let i = 0; i < 2; i++) { while (await p.isVisible('#dilemme')) await clic(p, '.choixDilemme:not([disabled]) >> nth=-1'); await clic(p, '#btnSemaine'); await p.waitForTimeout(3000); }
    while (await p.isVisible('#dilemme')) await clic(p, '.choixDilemme:not([disabled]) >> nth=-1');
    await clic(p, '[data-vue="tableau"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/fix_${nom}dashboard.png`, fullPage: true });
    if (nom) { await ctx.close(); continue; }
    // « Y aller » depuis une recommandation
    await clic(p, '.tb-reco [data-aller]'); await p.waitForTimeout(300);
    console.log('Y aller → onglet', await p.evaluate(() => document.querySelector('#onglets [aria-selected="true"]')?.dataset.onglet));
    // réabonnement
    await clic(p, '[data-section="maison"]'); await clic(p, '[data-onglet="budget"]');
    await clic(p, '[data-action="resilier"][data-v="streaming"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('[data-action="reabonner"]')?.scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: `${out}/fix_reabonner.png` });
    await clic(p, '[data-action="reabonner"][data-v="streaming"]'); await p.waitForTimeout(200);
    console.log('streaming actif après réabonnement :', await p.evaluate(() => window.__jeu().sys.abonnements.streaming.actif));
    // étiquettes d'habitude
    await clic(p, '[data-vue="maison"]'); await clic(p, '[data-section="maison"]'); await clic(p, '[data-onglet="maison"]');
    await clic(p, '[data-choix="portes"][data-v="fermees"]'); await p.evaluate(() => { const s = window.__jeu(); s.gestes.portes.habitude = true; s.gestes.portes.pratique = 10; });
    await clic(p, '[data-choix="portes"][data-v="ouvertes"]'); await p.waitForTimeout(200);
    console.log('étiquette portes après réouverture :', await p.evaluate(() => document.querySelector('[data-tag-geste="portes"]')?.textContent));
    await p.evaluate(() => document.getElementById('gestes').scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: `${out}/fix_habitudes.png` });
    await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: `${out}/fix_maison.png` });
    await ctx.close();
  }
  console.log('ERREURS:', errs); await b.close(); srv.close();
})();
