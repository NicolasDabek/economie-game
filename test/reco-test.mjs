// v0.9.1 : le moteur de recommandations ne doit jamais faire osciller un levier.
// Un débutant clique « Faire » sur la première recommandation CHAQUE JOUR pendant 2 ans.
// Assertions : aucun levier A → B → A en moins de 14 jours, jauges saines, et jamais deux conseils
// contradictoires sur le même levier le même jour.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, choixDilemme, resoudreDilemme, scoreFinal } from '../js/simulation.js';
import { recommandations, appliquerConseil, suivreConseil, conseillerDispo, CORVEES } from '../js/tableau.js';
import { leviers, difference, evaluer, jaugeMenacee, ignorer, cleConseil } from '../js/arbitre.js';

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
      if (suivreConseil(s, R[0])) faits++;
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
// v0.9.2 : quota du conseiller et bouton « Ignorer »
{
  const s = nouvellePartie(2026, 1);
  for (let i = 0; i < 20; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false)[0].id); jourSuivant(s); }
  let n = 0;
  for (let k = 0; k < 10; k++) { const r = recommandations(s).find(r => r.action && !CORVEES.has(r.action.type)); if (r && suivreConseil(s, r)) n++; }
  if (n > 3) ko(`quota : ${n} conseils suivis le même jour (max 3)`);
  if (conseillerDispo(s).reste !== 0) ko('quota : le conseiller devrait être épuisé');
  const R = recommandations(s), cible = R[0];
  if (!cible) ko('ignorer : aucun conseil à ignorer');
  else {
    ignorer(s, cible);
    const cle = cleConseil(cible);
    for (let j = 0; j < 29; j++) { if (recommandations(s).some(r => cleConseil(r) === cle)) { ko(`ignorer : « ${cible.titre} » revient au bout de ${j} j`); break; } if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false)[0].id); jourSuivant(s); }
    console.log('ignorer :', cible.titre, '→ masqué 30 j');
  }
}
// v1.5 (passe GD 4) : aucun petit équipement (< 60 €) ne doit faire perdre plus de 20 € nets sur 5 ans au maître.
// Hors champ : les objets dont le gain n'est pas monétaire et l'annonce le dit (« indirect » : sécurité, confort sous la pluie,
// bouillotte ; « confort » : le ventilateur, qui coûte son électricité contre la chaleur d'été).
{
  const out = execFileSync(process.execPath, [fileURLToPath(new URL('./sim-test.mjs', import.meta.url))], { env: { ...process.env, SEUL: 'roi-maitre' }, encoding: 'utf8', maxBuffer: 1 << 26 });
  const ligne = out.split('\n').find(l => l.startsWith('ROI_MAITRE '));
  if (!ligne) ko('rentabilité maître : sortie introuvable');
  else {
    const T = JSON.parse(ligne.slice(11)), petits = T.filter(x => x.prix < 60 && !x.indirect && !x.confort);
    for (const x of petits) if (x.net5 < -20) ko(`rentabilité maître : ${x.nom} (${x.prix} €) perd ${-x.net5} € nets sur 5 ans (mesuré ${x.mesure} €)`);
    console.log('rentabilité maître, équipements < 60 € :', petits.map(x => `${x.nom.slice(0, 24)} ${x.net5} €`).join(' · '));
  }
}
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
