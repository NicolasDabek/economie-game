// Captures v1.1 : CHROME=/usr/bin/google-chrome SAVE=/tmp/save.json node test/captures-v11.cjs [prefixe] → /workspace/ux-shots/<prefixe>_*.png
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots', pre = process.argv[2] || 'v11';
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : 'text/html' }); r.end(d); }); }).listen(8779);
const clic = async (p, sel) => { try { await p.click(sel, { timeout: 2000 }); return true; } catch { return false; } };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const save = fs.readFileSync(process.env.SAVE || '/tmp/save.json', 'utf8'), errs = [];
  for (const [nom, vp] of [['', { width: 1280, height: 900 }], ['mobile_', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.addInitScript((sv) => { if (!sessionStorage.getItem('x')) { localStorage.setItem('economie-game-sauvegarde', sv); localStorage.setItem('economie-game-prefs', JSON.stringify({ tutoFait: true })); sessionStorage.setItem('x', '1'); } }, save);
    await p.goto('http://localhost:8779/'); await p.waitForTimeout(500);
    await clic(p, '#btnReprendre'); await p.waitForTimeout(600);
    await p.addStyleTag({ content: '#toasts{display:none!important}' });
    await p.screenshot({ path: `${out}/${pre}_${nom}accueil.png`, fullPage: !nom });
    for (const o of ['jardin', 'cuisine', 'maison', 'eau']) {
      await p.evaluate((o) => document.querySelector(`[data-onglet="${o}"], [data-aller="${o}"]`)?.click(), o); await p.waitForTimeout(400);
      await p.screenshot({ path: `${out}/${pre}_${nom}${o}.png`, fullPage: true });
    }
    // tailles minimales
    const petits = await p.evaluate(() => [...document.querySelectorAll('button, select, input, a, [role=button]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44); }).length);
    const total = await p.evaluate(() => [...document.querySelectorAll('button, select, input, a, [role=button]')].filter(e => e.getBoundingClientRect().width > 0).length);
    const texte = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.childElementCount === 0 && e.textContent.trim() && e.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(e).fontSize) < 12).length);
    console.log(`${nom || 'bureau'} : contrôles < 44 px ${petits}/${total} · textes < 12 px ${texte}`);
    await ctx.close();
  }
  console.log(errs.length ? 'ERREURS ' + errs.join(' | ') : 'aucune erreur JS');
  await b.close(); srv.close();
})();
