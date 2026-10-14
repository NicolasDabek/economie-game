// Playtest automatique (v0.9) : 4 profils de joueurs, journal des frictions.
// CHROME=/usr/bin/google-chrome node test/playtest.cjs [annees=1]  → résumé sur la sortie, captures v09_* si CAPTURES=1
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots', CAP = !!process.env.CAPTURES;
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); }); }).listen(8770);
const clic = async (p, sel, t = 2500) => { try { await p.click(sel, { timeout: t }); return true; } catch { return false; } };
const ANNEES = Number(process.argv[2] || 1);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errs = [], friction = [];
  const page = async (vp) => { const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('dialog', d => d.accept()); await p.goto('http://localhost:8770/'); await p.evaluate(() => localStorage.clear()); await p.reload(); return [ctx, p]; };
  const dilemmes = async (p) => { let n = 0; while (await p.isVisible('#dilemme')) { n++; await clic(p, '.choixDilemme:not([disabled]) >> nth=0'); await p.waitForTimeout(100); } return n; };
  const fin = (p) => p.evaluate((A) => window.__jeu().jour >= 365 * A || window.__jeu().fini, ANNEES);

  // 1. débutant : « Faire » sur la première recommandation, puis une semaine
  { const [ctx, p] = await page({ width: 1280, height: 800 }); await clic(p, '[data-duree="3"]'); await clic(p, '#btnJouer');
    let clics = 2, faits = 0, vains = 0, dil = 0;
    while (!(await fin(p))) {
      dil += await dilemmes(p);
      if (await p.isVisible('[data-appliquer="0"]')) { await clic(p, '[data-appliquer="0"]'); clics++; const t = await p.evaluate(() => [...document.querySelectorAll('.toast')].at(-1)?.textContent || ''); const tt = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join('|')); if (tt.includes('✅')) faits++; else { vains++; (globalThis.VAINS ||= []).push(t.slice(0, 60)); } }
      await clic(p, '#btnSemaine'); clics++; await p.waitForFunction(() => !document.getElementById('btnSemaine').disabled, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(250);
    }
    const r = await p.evaluate(() => { const s = window.__jeu(); return { jour: s.jour, argent: Math.round(s.argent), moral: Math.round(s.volonte), sante: Math.round(s.sante) }; });
    console.log('débutant', { clics, faits, vains, dil, ...r }, [...new Set(globalThis.VAINS || [])].slice(0, 6));
    if (vains > faits / 3) friction.push(`débutant : ${vains} « Faire » sans effet sur ${faits + vains}`);
    if (CAP) { await dilemmes(p); await p.addStyleTag({ content: '.toast,#toasts{display:none!important}' }); await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: `${out}/v09_dashboard.png`, fullPage: true }); }
    await ctx.close(); }

  // 2. joueur pressé : « Prochain événement » en boucle, on mesure les pauses
  { const [ctx, p] = await page({ width: 1280, height: 800 }); await clic(p, '[data-duree="3"]'); await clic(p, '#btnJouer');
    const arrets = []; let dil = 0, j0 = 0;
    while (!(await fin(p))) { dil += await dilemmes(p); await clic(p, '#btnEvenement'); await p.waitForFunction(() => !document.getElementById('btnEvenement').disabled, null, { timeout: 30000 }).catch(() => {}); const j = await p.evaluate(() => window.__jeu().jour); arrets.push(j - j0); j0 = j; }
    const courts = arrets.filter(x => x <= 2).length;
    console.log('pressé', { arrets: arrets.length, moyenneJours: (arrets.reduce((a, x) => a + x, 0) / arrets.length).toFixed(1), courts, dil });
    if (courts > arrets.length / 3) friction.push(`pressé : ${courts} arrêts sur ${arrets.length} après ≤ 2 jours`);
    await ctx.close(); }

  // 3. curieux : chaque section et sous-onglet après un mois et après un an
  { const [ctx, p] = await page({ width: 1280, height: 800 }); await clic(p, '#btnJouer');
    for (const etape of [30, 365]) {
      await p.evaluate((J) => { const s = window.__jeu(); }, etape);
      while ((await p.evaluate(() => window.__jeu().jour)) < etape) { await dilemmes(p); await clic(p, '#btnMois'); await p.waitForFunction(() => !document.getElementById('btnMois').disabled, null, { timeout: 30000 }).catch(() => {}); }
      await dilemmes(p);
      for (const sec of ['maison', 'vie', 'achats', 'argent', 'savoir', 'bilan']) {
        await clic(p, `[data-section="${sec}"]`);
        const subs = await p.$$eval('#onglets [data-onglet]', x => x.map(y => y.dataset.onglet));
        for (const o of subs) {
          await clic(p, `[data-onglet="${o}"]`); await p.waitForTimeout(80);
          const info = await p.evaluate(() => { const pan = [...document.querySelectorAll('.panneau')].find(x => !x.classList.contains('cache')); return { len: (pan?.innerText || '').trim().length, deborde: document.documentElement.scrollWidth > innerWidth + 1, ids: ((pan?.innerText || '').match(/\b[a-z]+[A-Z][a-zA-Z]+\b/g) || []).filter(w => !/^(kWh|kWc|MWh)$/.test(w)) }; });
          if (info.len < 60) friction.push(`curieux j${etape} : ${sec}/${o} presque vide (${info.len} car.)`);
          if (info.deborde) friction.push(`curieux j${etape} : ${sec}/${o} déborde horizontalement`);
          if (info.ids.length) friction.push(`curieux j${etape} : ${sec}/${o} identifiants internes visibles : ${[...new Set(info.ids)].slice(0, 4).join(', ')}`);
          if (CAP && etape === 365 && o === 'graphes') await p.addStyleTag({ content: '.toast,#toasts{display:none!important}' }), await p.screenshot({ path: `${out}/v09_courbes.png`, fullPage: true });
        }
      }
    }
    if (CAP) { await clic(p, '#btnReglages'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/v09_reglages.png` }); await clic(p, '#reglagesFermer'); }
    // annuler : un réglage puis Ctrl+Z
    await clic(p, '[data-section="maison"]'); await clic(p, '[data-onglet="maison"]');
    const av = await p.evaluate(() => window.__jeu().aeration); await clic(p, '[data-choix="aeration"][data-v="jamais"]'); await p.waitForTimeout(50);
    await p.keyboard.press('Control+z'); await p.waitForTimeout(100);
    const ap = await p.evaluate(() => window.__jeu().aeration);
    console.log('annuler', av, '→ jamais → Ctrl+Z →', ap); if (av !== ap) friction.push('annuler ne rétablit pas le réglage');
    await ctx.close(); }

  // 4. mobile : tailles de cibles, débordements
  { const [ctx, p] = await page({ width: 390, height: 844 }); await clic(p, '#btnJouer');
    for (let i = 0; i < 4; i++) { await dilemmes(p); await clic(p, '#btnSemaine'); await p.waitForFunction(() => !document.getElementById('btnSemaine').disabled, null, { timeout: 30000 }).catch(() => {}); }
    await dilemmes(p);
    const m = await p.evaluate(() => ({ deborde: document.documentElement.scrollWidth > innerWidth + 1, petits: [...document.querySelectorAll('button')].filter(x => { const r = x.getBoundingClientRect(); return r.width && r.height && (r.height < 28 || r.width < 28) && getComputedStyle(x).visibility !== 'hidden'; }).map(x => (x.textContent || x.getAttribute('aria-label') || '').trim().slice(0, 20)).slice(0, 8) }));
    console.log('mobile', m);
    if (m.deborde) friction.push('mobile : la page déborde horizontalement');
    if (m.petits.length) friction.push(`mobile : boutons < 28 px : ${m.petits.join(' | ')}`);
    if (CAP) { await p.screenshot({ path: `${out}/v09_mobile.png` }); await p.screenshot({ path: `${out}/v09_mobile_long.png`, fullPage: true }); }
    await ctx.close(); }

  console.log('FRICTIONS:', friction.length ? '\n - ' + friction.join('\n - ') : 'aucune');
  console.log('ERREURS:', errs); await b.close(); srv.close();
})();
