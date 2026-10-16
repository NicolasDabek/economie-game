// Captures d'écran (avant/après) : CHROME=/usr/bin/google-chrome node test/captures.cjs <prefixe>
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots', pre = process.argv[2] || 'after';
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.woff2') ? 'font/woff2' : 'text/html' }); r.end(d); }); }).listen(8767);
const clic = async (p, sel) => { try { await p.click(sel, { timeout: 1500 }); return true; } catch { return false; } };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errs = [];
  for (const [nom, vp] of [['', { width: 1280, height: 800 }], ['mobile_', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8767/'); await p.waitForTimeout(500);
    if (nom === '') await p.screenshot({ path: `${out}/${pre}_onboarding.png` });
    if (pre === 'after' && nom === '') { await clic(p, '#btnTutoriel'); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${pre}_tutoriel.png` }); await clic(p, '#coachPasser'); }
    else { (await clic(p, '#btnJouer')) || (await clic(p, '#btnCommencer')); }
    await p.waitForTimeout(400);
    // un peu de jeu pour remplir les écrans
    for (let i = 0; i < 3; i++) { if (await p.isVisible('#dilemme')) await clic(p, '.choixDilemme:not([disabled]) >> nth=-1'); await clic(p, '#btnSemaine'); await p.waitForTimeout(3500); }
    while (await p.isVisible('#dilemme')) { await clic(p, '.choixDilemme:not([disabled]) >> nth=-1'); await p.waitForTimeout(200); }
    await p.screenshot({ path: `${out}/${pre}_${nom}home.png`, fullPage: nom === '' && pre === 'before' });
    if (nom === 'mobile_') { await ctx.close(); continue; }
    const sec = async (id, ancien) => { (await clic(p, `[data-section="${id}"]`)) || (ancien && await clic(p, ancien)); await p.waitForTimeout(400); };
    await sec('achats', '[data-onglet="maison"]'); await p.screenshot({ path: `${out}/${pre}_achats.png`, fullPage: pre === 'before' });
    await sec('argent', '[data-onglet="banque"]'); await p.screenshot({ path: `${out}/${pre}_argent.png`, fullPage: pre === 'before' });
    await sec('bilan', null); if (pre === 'before') await p.evaluate(() => document.getElementById('principes')?.scrollIntoView()); await p.screenshot({ path: `${out}/${pre}_savoir.png` });
    await p.evaluate(() => { const s = window.__jeu(); s.jour = 364; }); await clic(p, '#btnJour'); await p.waitForTimeout(2500);
    if (await p.isVisible('#dilemme')) await p.screenshot({ path: `${out}/${pre}_bilan.png` }); else { await sec('bilan', null); await p.screenshot({ path: `${out}/${pre}_bilan.png` }); }
    await ctx.close();
  }
  console.log('ERREURS:', errs); await b.close(); srv.close();
})();
