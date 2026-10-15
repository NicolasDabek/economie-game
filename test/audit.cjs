// v1.0 : audit navigateur avant publication.
// Parcourt chaque onglet en bureau (1280), mobile (390), thème sombre, et au clavier seul ; relève :
// valeurs cassées (NaN, Infinity, undefined), débordements, contrastes < 4,5:1 (3:1 pour le gros texte),
// boutons trop petits sur mobile, éléments focusables sans nom, focus invisible, modales qui piègent ou laissent fuir le focus,
// erreurs et avertissements console, incohérences des chiffres entre tableau de bord, bilan et écran de fin.
// CHROME=/usr/bin/google-chrome node test/audit.cjs   (CAPTURES=1 : captures /workspace/ux-shots/v1_*.png)
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = '/workspace/ux-shots', CAP = !!process.env.CAPTURES;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8771);
const pb = [], errs = [];
const note = (t) => { if (!pb.includes(t)) pb.push(t); };
const ONGLETS = ['maison', 'linge', 'eau', 'elec', 'routines', 'cuisine', 'budget', 'transport', 'jardin', 'b-maison', 'b-eau', 'b-cuisine', 'b-elec', 'b-transport', 'b-jardin', 'rentab', 'banque', 'invest', 'principes', 'combos', 'glossaire', 'journal', 'resume', 'factures', 'graphes', 'aide'];
const SECTION = { maison: 'maison', linge: 'maison', eau: 'maison', elec: 'maison', routines: 'maison', cuisine: 'vie', budget: 'vie', transport: 'vie', jardin: 'vie', 'b-maison': 'achats', 'b-eau': 'achats', 'b-cuisine': 'achats', 'b-elec': 'achats', 'b-transport': 'achats', 'b-jardin': 'achats', rentab: 'achats', banque: 'argent', invest: 'argent', principes: 'savoir', combos: 'savoir', glossaire: 'savoir', journal: 'savoir', aide: 'savoir', resume: 'bilan', factures: 'bilan', graphes: 'bilan' };

// exécuté dans la page : contrôles visuels de l'écran courant
function controle(ctx) {
  const res = [];
  const vis = (e) => { const r = e.getBoundingClientRect(), st = getComputedStyle(e); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && !e.closest('.cache,[hidden]'); };
  const txt = document.body.innerText;
  const m = txt.match(/\bNaN\b|Infinity|undefined|\[object Object\]|\bnull\b €/); if (m) res.push(`valeur cassée « ${m[0]} » : …${txt.slice(Math.max(0, m.index - 60), m.index + 10).replace(/\s+/g, ' ')}…`);
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    const large = [...document.querySelectorAll('body *')].filter(e => vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.tb-barres svg,.defile,table,pre')).slice(0, 2).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + [...e.classList].join('.'));
    res.push('débordement horizontal : ' + large.join(', '));
  }
  // contraste
  const rgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 1]; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fond = (e) => { let x = e; let acc = null; while (x && x.nodeType === 1) { const st = getComputedStyle(x); if (st.backgroundImage !== 'none' && !st.backgroundImage.includes('gradient')) return null; const c = rgb(st.backgroundColor); if ((c[3] ?? 1) > 0.9) return c; if (st.backgroundImage.includes('gradient')) { const g = st.backgroundImage.match(/rgba?\([^)]+\)/); if (g) return rgb(g[0]); } x = x.parentElement; } return [255, 255, 255]; };
  let n = 0;
  const zone = [...document.querySelectorAll('.panneau:not(.cache) *, #ciel *, .vue:not(.cache) *, .modal:not(.cache) *, #intro:not(.cache) *, #dilemme:not(.cache) *')];
  for (const e of zone) {
    if (n > 6) break;
    if (!vis(e) || e.closest('svg,canvas,[aria-hidden="true"]')) continue;
    const t = [...e.childNodes].filter(c => c.nodeType === 3 && c.textContent.trim().length > 1).map(c => c.textContent.trim()).join(' ');
    if (!t || /^[\p{Extended_Pictographic}\s️]+$/u.test(t)) continue;
    const st = getComputedStyle(e); if (e.disabled || e.closest('[disabled]') || Number(st.opacity) < 0.6) continue;
    const bg = fond(e); if (!bg) continue;
    const fg = rgb(st.color), a = fg[3] ?? 1; const f2 = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const L1 = lum(f2), L2 = lum(bg), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const gros = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.6 && Number(st.fontWeight) >= 700);
    if (cr < (gros ? 3 : 4.5)) { n++; res.push(`contraste ${cr.toFixed(2)}:1 « ${t.slice(0, 40)} » (${e.tagName.toLowerCase()}.${[...e.classList].join('.')})`); }
  }
  // boutons : nom accessible ; taille sur mobile
  for (const b of document.querySelectorAll('button, a[href], input, select, [role="tab"]')) {
    if (!vis(b)) continue;
    const nom = (b.getAttribute('aria-label') || b.innerText || b.title || b.value || (b.labels?.[0]?.innerText) || b.getAttribute('aria-labelledby') || '').trim();
    if (!nom) res.push(`élément focusable sans nom : ${b.outerHTML.slice(0, 80)}`);
    if (ctx.mobile) { const r = b.getBoundingClientRect(); if ((r.height < 24 || r.width < 24) && !b.closest('.raccourcis,.lien-texte') && b.tagName !== 'A' && b.type !== 'range') res.push(`cible tactile ${Math.round(r.width)}×${Math.round(r.height)} : ${(nom || b.tagName).slice(0, 30)}`); }
  }
  return res.slice(0, 12);
}

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = async (vp, nom, opts = {}) => {
    const ctx = await b.newContext({ viewport: vp, colorScheme: opts.sombre ? 'dark' : 'light', reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${nom} : ${e.message}`));
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(`${nom} console.${m.type()} : ${m.text()}`); });
    p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8771/'); await p.evaluate(() => localStorage.clear()); await p.reload();
    return [ctx, p];
  };
  const clic = async (p, sel) => { try { await p.click(sel, { timeout: 2500 }); return true; } catch { return false; } };
  let dernierEchec = '';
  const dilemmes = async (p) => { for (let i = 0; i < 40 && await p.isVisible('#dilemme'); i++) { try { await p.click('.choixDilemme:not([disabled]) >> nth=0', { timeout: 2500 }); } catch (e) { dernierEchec = e.message.split('\n').slice(0, 8).join(' | '); } await p.waitForTimeout(60); }
    if (await p.isVisible('#dilemme')) { note('choix bloquant : ' + (await p.textContent('#dilemme')).replace(/\s+/g, ' ').slice(0, 80) + ' — ' + dernierEchec); await p.evaluate(() => { window.__jeu().dilemme = null; document.getElementById('dilemme').classList.add('cache'); }); } };
  const avancer = async (p, jours) => { const fin = (await p.evaluate(() => window.__jeu().jour)) + jours; for (let k = 0; k < jours / 30 * 4 + 10 && !(await p.evaluate(() => window.__jeu().fini)) && (await p.evaluate(() => window.__jeu().jour)) < fin; k++) { await dilemmes(p); await clic(p, '#btnMois'); await p.waitForFunction(() => !document.getElementById('btnMois').disabled || window.__jeu().fini, null, { timeout: 30000 }).catch(() => {}); } if (0) for (let k = 0; k < jours / 30; k++) { await dilemmes(p); await clic(p, '#btnMois'); await p.waitForFunction(() => !document.getElementById('btnMois').disabled || window.__jeu().fini, null, { timeout: 30000 }).catch(() => {}); } await dilemmes(p); };
  const tous = async (p, nom, mobile) => {
    for (const o of ONGLETS) {
      await clic(p, `[data-section="${SECTION[o]}"]`);
      if (!await clic(p, `[data-onglet="${o}"]`)) continue;
      await p.waitForTimeout(60);
      for (const x of await p.evaluate(controle, { mobile })) note(`${nom} › ${o} : ${x}`);
    }
    for (const v of ['tableau', 'maison']) { await clic(p, `[data-vue="${v}"]`); await p.waitForTimeout(60); for (const x of await p.evaluate(controle, { mobile })) note(`${nom} › vue ${v} : ${x}`); }
  };

  // 1. bureau, premier écran puis 10 premières minutes (tutoriel complet)
  { const [ctx, p] = await page({ width: 1280, height: 800 }, 'bureau');
    for (const x of await p.evaluate(controle, {})) note(`bureau › accueil : ${x}`);
    if (CAP) await p.screenshot({ path: `${out}/v1_accueil.png` });
    await clic(p, '[data-duree="3"]'); await clic(p, '#btnTutoriel'); let etapes = 0;
    while (await p.isVisible('.coach') && etapes < 30) { etapes++; if (CAP && etapes === 2) await p.screenshot({ path: `${out}/v1_tutoriel.png` }); for (const x of await p.evaluate(controle, {})) note(`bureau › tutoriel ${etapes} : ${x}`); if (!await clic(p, '#coachSuiv')) break; await p.waitForTimeout(100); }
    console.log('tutoriel', etapes, 'étapes');
    console.time('j0');
    await tous(p, 'bureau j0', false);
    console.timeEnd('j0'); await avancer(p, 200); console.log('jour', await p.evaluate(() => window.__jeu().jour)); console.time('j200'); await tous(p, 'bureau j200', false); console.timeEnd('j200');
    if (CAP) { await clic(p, '[data-vue="tableau"]'); await p.screenshot({ path: `${out}/v1_tableau.png`, fullPage: true }); await clic(p, '[data-section="bilan"]'); await clic(p, '[data-onglet="graphes"]'); await p.screenshot({ path: `${out}/v1_graphes.png`, fullPage: true }); await clic(p, '[data-section="savoir"]'); await clic(p, '[data-onglet="aide"]'); await p.screenshot({ path: `${out}/v1_aide.png`, fullPage: true }); }
    // chiffres : tableau de bord = bilan = écran de fin
    const lire = () => p.evaluate(() => { const t = document.querySelector('#tableau')?.innerText || ''; const m = t.match(/Économisé vs voisin\s*([−\-]?[\d\s]+,\d\d\s?€)/); return m?.[1]?.replace(/\s/g, ''); });
        await clic(p, '[data-vue="tableau"]'); const tb = await lire();
    await clic(p, '[data-section="bilan"]'); await clic(p, '[data-onglet="resume"]');
    const bilan = await p.evaluate(() => (document.querySelector('.panneau:not(.cache)')?.innerText.match(/Économies vs voisin\s*([−\-]?[\d\s]+,\d\d\s?€)/) || [])[1]?.replace(/\s/g, ''));
    console.log('économies tableau de bord', tb, '· bilan', bilan);
    if (tb && bilan && tb !== bilan) note(`chiffres : tableau de bord ${tb} ≠ bilan ${bilan}`);
    await avancer(p, 1200);
    if (await p.isVisible('#fin')) {
      const fin = await p.evaluate(() => document.getElementById('fin').innerText);
      if (/NaN|undefined|Infinity/.test(fin)) note('écran de fin : valeur cassée');
      const r = await p.evaluate(async () => { const s = window.__jeu(); const m = await import('/js/simulation.js'); return m.eur(m.scoreFinal(s).economies); }).catch(() => null);
      if (r && !fin.replace(/\s/g, '').includes(r.replace(/\s/g, ''))) note(`écran de fin : économies ${r} absentes`);
      if (CAP) await p.screenshot({ path: `${out}/v1_fin.png`, fullPage: true });
    } else note('fin de campagne non atteinte');
    await ctx.close(); }

  // 2. mobile 390 px
  { const [ctx, p] = await page({ width: 390, height: 844 }, 'mobile');
    for (const x of await p.evaluate(controle, { mobile: true })) note(`mobile › accueil : ${x}`);
    await clic(p, '#btnJouer'); await tous(p, 'mobile j0', true); await avancer(p, 120); await tous(p, 'mobile j120', true);
    if (CAP) { await clic(p, '[data-vue="tableau"]'); await p.screenshot({ path: `${out}/v1_mobile.png` }); await p.screenshot({ path: `${out}/v1_mobile_long.png`, fullPage: true }); }
    await ctx.close(); }

  // 3. thème sombre
  { const [ctx, p] = await page({ width: 1280, height: 800 }, 'sombre', { sombre: true });
    await clic(p, '#btnJouer'); await avancer(p, 60); await tous(p, 'sombre', false);
    if (CAP) { await clic(p, '[data-vue="tableau"]'); await p.screenshot({ path: `${out}/v1_sombre.png`, fullPage: true }); }
    await ctx.close(); }

  // 4. clavier seul : tout le parcours de base sans souris
  { const [ctx, p] = await page({ width: 1280, height: 800 }, 'clavier');
    const actif = () => p.evaluate(() => { const e = document.activeElement; const st = getComputedStyle(e); return { tag: e.tagName, id: e.id, txt: (e.getAttribute('aria-label') || e.innerText || '').slice(0, 30), visible: st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0 || st.boxShadow !== 'none', dans: (sel) => 0 }; });
    // l'accueil : Tab jusqu'à « Jouer » puis Entrée
    let trouve = false;
    for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); const a = await actif(); if (a.tag !== 'BODY' && !a.visible) note(`clavier : focus invisible sur ${a.tag}#${a.id} « ${a.txt} »`); if (a.id === 'btnJouer') { trouve = true; break; } }
    if (!trouve) note('clavier : « Jouer » inatteignable au clavier'); else await p.keyboard.press('Enter');
    await p.waitForTimeout(200);
    if (await p.isVisible('#intro')) note('clavier : l\'accueil ne se ferme pas avec Entrée');
    // raccourcis
    const j0 = await p.evaluate(() => window.__jeu().jour); await p.keyboard.press('j'); await p.waitForTimeout(2500);
    if (await p.evaluate(() => window.__jeu().jour) === j0 && !await p.isVisible('#dilemme')) note('clavier : J n\'avance pas d\'un jour');
    await dilemmes(p);
    // modale réglages : ? ouvre, le focus y entre et y reste, Échap ferme et rend le focus
    await p.keyboard.press('?'); await p.waitForTimeout(150);
    if (!await p.isVisible('#reglages')) note('clavier : ? n\'ouvre pas les réglages');
    else {
      let dehors = 0; for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); if (!await p.evaluate(() => !!document.activeElement.closest('#reglages'))) dehors++; }
      if (dehors) note(`clavier : le focus sort de la modale des réglages (${dehors}/25 Tab)`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(100);
      if (await p.isVisible('#reglages')) note('clavier : Échap ne ferme pas les réglages');
    }
    // parcours des sections au clavier : 1..6 et Tab dans le panneau, tout focus visible
    for (const k of ['1', '2', '3', '4', '5', '6']) { await p.keyboard.press(k); await p.waitForTimeout(80); }
    let inv = 0; for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); const a = await actif(); if (a.tag !== 'BODY' && !a.visible) { inv++; if (inv <= 3) note(`clavier : focus invisible sur ${a.tag}#${a.id} « ${a.txt} »`); } }
    // dilemme au clavier : le focus doit être dans la fenêtre
    await p.keyboard.press('e'); await p.waitForTimeout(3000);
    if (await p.isVisible('#dilemme')) { const dedans = await p.evaluate(() => !!document.activeElement.closest('#dilemme')); if (!dedans) note('clavier : un choix s\'ouvre sans y placer le focus'); }
    await ctx.close(); }

  // 5. sauvegarde abîmée : le jeu démarre quand même
  { const [ctx, p] = await page({ width: 1280, height: 800 }, 'corrompue');
    await p.evaluate(() => { localStorage.setItem('economie-game-sauvegarde', '{"version":8,"jour":'); localStorage.setItem('economie-game-ui', '{"vus":null,'); }); await p.reload(); await p.waitForTimeout(300);
    if (!await p.isVisible('#btnJouer')) note('sauvegarde abîmée : l\'accueil ne s\'affiche pas');
    await clic(p, '#btnJouer'); await p.waitForTimeout(200);
    const ok = await p.evaluate(() => typeof window.__jeu().jour === 'number'); if (!ok) note('sauvegarde abîmée : partie non démarrée');
    await ctx.close(); }

  await b.close(); srv.close();
  console.log('PROBLÈMES:', pb.length ? '\n - ' + pb.join('\n - ') : 'aucun');
  console.log('ERREURS:', errs.length ? '\n - ' + [...new Set(errs)].slice(0, 20).join('\n - ') : 'aucune');
  process.exit(pb.length || errs.length ? 1 : 0);
})();
