// v1.0 : versions de sauvegarde. Toutes les anciennes versions (3 à 7) se chargent, se complètent et se jouent ;
// une sauvegarde illisible est mise de côté sans planter ; v0.2 est refusée proprement.
import fs from 'fs';
import { nouvellePartie, sauvegarder, charger, aUneSauvegarde, VERSION_SAUVEGARDE } from '../js/state.js';
import { jourSuivant, choixDilemme, resoudreDilemme, scoreFinal } from '../js/simulation.js';
import { recommandations } from '../js/tableau.js';

let ok = true;
const ko = (t) => { ok = false; console.log('✗', t); };
const memoire = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const CLE = 'economie-game-sauvegarde';
const jouer = (s, n) => { for (let i = 0; i < n && !s.fini; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false)[0].id); jourSuivant(s); } };
const sain = (s, nom) => {
  jouer(s, 40);
  const r = scoreFinal(s), R = recommandations(s);
  for (const [k, v] of Object.entries({ argent: s.argent, eco: r.economies, pat: r.patrimoine, jour: s.jour })) if (!Number.isFinite(v)) ko(`${nom} : ${k} = ${v}`);
  if (!Array.isArray(R)) ko(`${nom} : recommandations`);
  console.log(`✓ ${nom} : jour ${s.jour}, version ${s.version}, ${R.length} conseils, éco ${Math.round(r.economies)} €`);
};

// 1. aller-retour de la version courante
{ const st = memoire(), s = nouvellePartie(11, 3); jouer(s, 30); sauvegarder(s, st); const c = charger(st);
  if (typeof c !== 'object' || c.jour !== s.jour || c.version !== VERSION_SAUVEGARDE) ko('aller-retour v' + VERSION_SAUVEGARDE); else sain(c, 'aller-retour v' + VERSION_SAUVEGARDE); }
// 2. anciennes versions fournies (v0.5, v0.6)
for (const f of ['sauvegarde-v5.json', 'sauvegarde-v6.json']) {
  const st = memoire(); st.setItem(CLE, fs.readFileSync(new URL(f, import.meta.url), 'utf8'));
  if (!aUneSauvegarde(st)) ko(f + ' non reconnue');
  const c = charger(st); if (typeof c !== 'object') ko(f + ' : ' + c); else sain(c, f);
}
// 3. v0.7 (avant tableau de bord / conseiller / défis) et v0.3 / v0.4 fabriquées en retirant les champs récents
{ const s = nouvellePartie(5, 5); jouer(s, 60); const { meteo, ...x } = s;
  const v7 = structuredClone(x); v7.version = 7; delete v7.tab; delete v7.reco; delete v7.eco.defi; delete v7.eco.depJan; delete v7.sys.lessiveConseil; delete v7.sys.mediatheque;
  const st = memoire(); st.setItem(CLE, JSON.stringify(v7)); const c = charger(st);
  if (typeof c !== 'object' || c.migre !== 7) ko('v0.7 : ' + c); else sain(c, 'v0.7 → v1.0');
  const v6 = structuredClone(v7); v6.version = 6; delete v6.mor;
  st.setItem(CLE, JSON.stringify(v6)); const c6 = charger(st); if (typeof c6 !== 'object' || !c6.mor) ko('v0.6 fabriquée'); else sain(c6, 'v0.6 fabriquée → v1.0');
}
// 4. sauvegardes abîmées : JSON invalide, champs manquants, types faux, v0.2
for (const [nom, txt, attendu] of [
  ['JSON tronqué', '{"version":8,"seed":3,"jo', 'corrompue'],
  ['pas un objet', '42', 'corrompue'],
  ['sans version', '{"seed":1}', 'corrompue'],
  ['jour invalide', JSON.stringify({ ...structuredClone((({ meteo, ...r }) => r)(nouvellePartie(3, 3))), jour: 'abc' }), 'corrompue'],
  ['v0.2', '{"version":2,"jour":3}', 'ancienne'],
]) {
  const st = memoire(); st.setItem(CLE, txt); let c;
  try { c = charger(st); } catch (e) { ko(`${nom} : exception ${e.message}`); continue; }
  if (c !== attendu) ko(`${nom} : ${c} au lieu de ${attendu}`);
  else if (attendu === 'corrompue' && st.getItem(CLE + '-corrompue') !== txt) ko(`${nom} : copie de secours absente`);
  else console.log(`✓ ${nom} → ${c}`);
}
// 5. champs partiellement manquants : complétés
{ const s = nouvellePartie(9, 3); const { meteo, ...x } = s; const y = structuredClone(x); delete y.sys; delete y.auto; delete y.vetements.sweat;
  const st = memoire(); st.setItem(CLE, JSON.stringify(y)); const c = charger(st);
  if (typeof c !== 'object' || !c.sys || !c.vetements.sweat) ko('champs manquants non complétés'); else sain(c, 'champs manquants complétés'); }
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
