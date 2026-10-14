// Test headless : stratégie naïve vs stratégie maligne sur 8 semaines
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, scoreFinal, acheter, acheterVetement } from '../js/simulation.js';

function naive() {
  const s = nouvellePartie(2026);
  for (const p of ['salon', 'chambre', 'cuisine']) { s.pieces[p].consigneJour = 22; s.pieces[p].consigneNuit = 21; }
  while (!s.fini) { if (s.jour % 3 === 2) s.lessiveDemandee = true; jourSuivant(s); }
  return s;
}
function maligne() {
  const s = nouvellePartie(2026);
  acheter(s, 'thermometre'); acheter(s, 'calfeutrage'); acheter(s, 'bouillotte'); acheter(s, 'housse');
  acheterVetement(s, 'sweat'); acheterVetement(s, 'polaire');
  s.pieces.salon.consigneJour = 17; s.pieces.salon.consigneNuit = 13;
  s.pieces.chambre.consigneJour = 12; s.pieces.chambre.consigneNuit = 14;
  s.pieces.cuisine.consigneJour = 14; s.pieces.cuisine.consigneNuit = 10;
  s.rideaux = 'nuit'; s.utiliserBouillotte = true;
  while (!s.fini) {
    if (s.jour === 7) s.portes = 'fermees'; // un geste à la fois
    if (s.jour === 14) acheterVetement(s, 'pilou');
    if (s.jour % 7 === 6) s.lessiveDemandee = true;
    jourSuivant(s);
  }
  return s;
}
function geler() {
  const s = nouvellePartie(2026);
  for (const p of ['salon', 'chambre', 'cuisine']) { s.pieces[p].consigneJour = 0; s.pieces[p].consigneNuit = 0; }
  while (!s.fini) { if (s.jour % 4 === 3) s.lessiveDemandee = true; jourSuivant(s); }
  return s;
}
const fmt = (n, s) => { const r = scoreFinal(s); return `${n.padEnd(8)} coût ${r.cout.toFixed(0)} € | réf ${r.base.toFixed(0)} € | économies ${r.economies.toFixed(0)} € (${r.pct.toFixed(0)} %) | confort ${r.confortMoy.toFixed(0)} | santé ${r.sante.toFixed(0)} | volonté ${s.volonte.toFixed(0)} | rechutes ${s.rechutes} | habitudes ${r.habitudes} | principes ${r.principes} | titre ${r.titre}`; };
const a = naive(), b = maligne(), c = geler();
console.log(fmt('naïf', a)); console.log(fmt('malin', b)); console.log(fmt('glacial', c));
const rb = scoreFinal(b), ra = scoreFinal(a), rc = scoreFinal(c);
const ok = rb.economies > ra.economies + 100 && rb.sante > 60 && rb.confortMoy > 65 && rc.rang <= 1;
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
