// v0.9.1 : le moteur de recommandations ne doit jamais faire osciller un levier.
// Un débutant clique « Faire » sur la première recommandation CHAQUE JOUR pendant 2 ans.
// Assertions : aucun levier A → B → A en moins de 14 jours, jauges saines, et jamais deux conseils
// contradictoires sur le même levier le même jour.
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, choixDilemme, resoudreDilemme, scoreFinal } from '../js/simulation.js';
import { recommandations, appliquerConseil } from '../js/tableau.js';
import { leviers, difference, evaluer, jaugeMenacee } from '../js/arbitre.js';

let ok = true;
const ko = (t) => { ok = false; console.log('✗', t); };
for (const graine of [2026, 7]) {
  const s = nouvellePartie(graine, 2);
  const hist = {};              // levier -> [{jour, de, a}] (changements faits par un conseil)
  let clics = 0, faits = 0, conflits = 0;
  const m = { volonte: 0, sante: 0, hygiene: 0, bienetre: 0 }; let n = 0;
  while (!s.fini && s.jour < 730) {
    if (s.dilemme) { const o = choixDilemme(s).filter(o => o.possible !== false); resoudreDilemme(s, o[0].id); continue; }
    const R = recommandations(s);
    // contradictions le même jour : deux conseils qui touchent le même levier
    const vus = new Set();
    for (const r of R) for (const k of Object.keys(r.eval?.leviers || {})) { if (vus.has(k)) { conflits++; ko(`${graine} j${s.jour} deux conseils sur ${k}`); } vus.add(k); }
    if (R[0]?.action) {
      const avant = leviers(s); clics++;
      if (appliquerConseil(s, R[0].action)) faits++;
      for (const [k, [de, a]] of Object.entries(difference(avant, leviers(s)))) {
        const h = (hist[k] ||= []);
        const retour = h.find(e => e.a === de && e.de === a && s.jour - e.jour < 14);
        if (retour) ko(`${graine} oscillation ${k} : ${retour.de} → ${retour.a} (j${retour.jour}) → ${a} (j${s.jour}) — ${R[0].titre}`);
        h.push({ jour: s.jour, de, a });
      }
    }
    jourSuivant(s); n++;
    for (const g in m) m[g] += s[g];
  }
  for (const g in m) m[g] /= n;
  const r = scoreFinal(s);
  console.log(`graine ${graine} : ${clics} clics, ${faits} appliqués · moral ${m.volonte.toFixed(0)} santé ${m.sante.toFixed(0)} hygiène ${m.hygiene.toFixed(0)} bien-être ${m.bienetre.toFixed(0)} · éco ${r.economies.toFixed(0)} € · ${r.titre}`);
  if (m.volonte < 45) ko(`${graine} moral moyen ${m.volonte.toFixed(0)} < 45`);
  if (m.sante < 75) ko(`${graine} santé moyenne ${m.sante.toFixed(0)} < 75`);
  if (m.hygiene < 70) ko(`${graine} hygiène moyenne ${m.hygiene.toFixed(0)} < 70`);
  if (m.bienetre < 55) ko(`${graine} bien-être moyen ${m.bienetre.toFixed(0)} < 55`);
  if (r.economies <= 0) ko(`${graine} suivre les conseils fait perdre de l'argent`);
}
// scénario du bug : déprime + gros budget plaisirs → jamais « baisser » et « remonter » les plaisirs ensemble,
// et aucune économie sur les plaisirs ou abonnements
{
  const s = nouvellePartie(2026, 1);
  for (let i = 0; i < 40; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false)[0].id); jourSuivant(s); }
  s.sys.plaisirs = 35; s.volonte = 30; s.bienetre = 45;
  const R = recommandations(s);
  // et directement : la coupe des plaisirs est évaluée puis rejetée par la protection des jauges
  const ev = evaluer(s, { type: 'poste', id: 'plaisirs' }, appliquerConseil);
  if (ev && !jaugeMenacee(ev, s)) ko('déprime : baisser les plaisirs n\'est pas bloqué par la protection du moral');
  const surPlaisirs = R.filter(r => Object.keys(r.eval?.leviers || {}).some(k => k === 'sys.plaisirs' || k.includes('abonnements')));
  const baisse = surPlaisirs.filter(r => Object.values(r.eval.leviers).some(([de, a]) => typeof de === 'number' && a < de || de === true && a === false));
  console.log('déprime :', R.map(r => r.titre).join(' | '));
  if (baisse.length) ko('déprime : une économie sur les plaisirs/abonnements est proposée : ' + baisse.map(r => r.titre).join(', '));
  if (surPlaisirs.length > 1) ko('déprime : plusieurs conseils sur les plaisirs');
}
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
