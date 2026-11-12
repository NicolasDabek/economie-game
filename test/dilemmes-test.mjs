// v2.1 (passe GD 12) : options de dilemme qui coûtent du temps libre (comparer, negocier, occasion, maison)
import { nouvellePartie, sauvegarder, charger } from '../js/state.js';
import { choixDilemme, resoudreDilemme, tempsLibre, COUT_TEMPS_DILEMME } from '../js/simulation.js';
let ko = 0; const ch = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) ko++; };
const memoire = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const opt = (s, id) => choixDilemme(s).find(o => o.id === id);
for (const [cle, h] of Object.entries(COUT_TEMPS_DILEMME)) {
  const [dil, choix] = cle.split(':');
  // 1. pas assez de temps libre : option désactivée, résolution refusée, rien n'est débité
  let s = nouvellePartie(2026, 1, 'standard'); s.dilemme = dil;
  s.tempsUtilise += tempsLibre(s) - h / 2;
  const avant = s.tempsUtilise;
  ch(opt(s, choix)?.possible === false && opt(s, choix).temps === h, `${cle} : désactivée avec ${tempsLibre(s).toFixed(2)} h libres (coût ${h} h)`);
  ch(resoudreDilemme(s, choix) === false && s.tempsUtilise === avant && s.dilemme === dil, `${cle} : résolution refusée, aucun temps débité`);
  // 2. jour de chantier : temps libre nul, option désactivée
  s = nouvellePartie(2026, 1, 'standard'); s.dilemme = dil;
  s.passif.chantiers.push({ id: 'test', reste: 1 });
  ch(opt(s, choix)?.possible === false, `${cle} : désactivée un jour de chantier`);
  // 3. assez de temps : débit exact, temps libre ≥ 0
  s = nouvellePartie(2026, 1, 'standard'); s.dilemme = dil; s.argent = 5000;
  const l0 = tempsLibre(s);
  ch(opt(s, choix)?.possible !== false, `${cle} : possible avec ${l0.toFixed(2)} h libres`);
  ch(resoudreDilemme(s, choix) === true && Math.abs(l0 - tempsLibre(s) - h) < 1e-9 && tempsLibre(s) >= -1e-9, `${cle} : ${h} h débitées exactement, temps libre ${tempsLibre(s).toFixed(2)} h ≥ 0`);
  ch(!s.dilemme, `${cle} : dilemme résolu`);
  // 4. même verdict après recharge de la sauvegarde
  s = nouvellePartie(2026, 1, 'standard'); s.dilemme = dil; s.tempsUtilise += tempsLibre(s) - h / 2;
  const st = memoire(); sauvegarder(s, st); const r = charger(st);
  ch(r && opt(r, choix)?.possible === opt(s, choix).possible && Math.abs(tempsLibre(r) - tempsLibre(s)) < 1e-9, `${cle} : même verdict après recharge`);
}
// 5. déblocage « temps » : dès 2 h utilisées dans la journée, comme pour tout autre usage du temps
{ const s = nouvellePartie(2026, 1, 'standard'); s.dilemme = 'rentree'; s.argent = 5000; s.tempsUtilise = 0;
  resoudreDilemme(s, 'occasion');
  ch(s.principes.includes('temps'), 'rentrée occasion (2 h) : principe « temps » débloqué'); }
{ const s = nouvellePartie(2026, 1, 'standard'); s.dilemme = 'renego'; s.tempsUtilise = 0;
  resoudreDilemme(s, 'negocier');
  ch(!s.principes.includes('temps'), 'renégociation (30 min) : principe « temps » pas encore débloqué'); }
if (ko) { console.log(`${ko} échec(s)`); process.exit(1); } else console.log('OK');
