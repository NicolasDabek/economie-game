// Test v0.5 : banque (quinzaines, LEP, PEL, SCPI, découvert), calage des marchés, projection,
// et les trois stratégies d'arbitrage équipement / placement sur 3 graines.
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, actions, acheter, scoreFinal, choixDilemme, resoudreDilemme, planifierLessive, payer } from '../js/simulation.js';
import { nouvelEtatFinance, deposer, retirer, ouvrirAV, changerProfil, eligibleLEP, valeurs, valeurLiquidation, gainFinancier, pasMarche, projection, financeJour, calDuJour, dateTexte } from '../js/finance.js';
import { estimationAchat } from '../js/roi.js';
import { ROI_ITEMS, ACHATS, BANQUE, MARCHES } from '../js/data.js';
import { makeRng } from '../js/rng.js';

let ok = true;
const ch = (c, t) => { if (!c) { ok = false; console.log('✗', t); } else console.log('✓', t); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ---- calendrier
ch(calDuJour(0) === 0 && dateTexte(calDuJour(56)) === '6 avril 2027' && dateTexte(calDuJour(84)) === '1 juillet 2027', 'calendrier : 1er déc., 6 avril, 1er juillet');

// ---- quinzaines : 1 000 € déposés le 1er décembre -> 1000 × 1,7 % × q/24 au 31/12 ; dépôt le 2 décembre -> une quinzaine de moins
function finSeule(profil = 'median') { const s = { seed: 1, argent: 5000, volonte: 50, jour: 0, depenses: {}, base: {}, coutVoisinCumul: 0, fin: nouvelEtatFinance(profil), principes: [] }; s.fin.livrets.livretA.solde = s.fin.livrets.livretA.debutQ = 0; s.fin.voisin.livret.solde = s.fin.voisin.livret.debutQ = 0; s.fin.epargneInitiale = s.fin.apport = 0; return s; }
import * as F from '../js/finance.js';
{
  const a = finSeule(); a.fin.cal = -1; deposer(a, 'livretA', 1000); F.avancerCalendrier(a, 30);   // jusqu'au 31 décembre inclus
  const b = finSeule(); b.fin.cal = 0; deposer(b, 'livretA', 1000); F.avancerCalendrier(b, 30);    // dépôt le 2 décembre
  const ia = a.fin.livrets.livretA.interets, ib = b.fin.livrets.livretA.interets;
  ch(near(ia, 1000 * 0.017 * 2 / 24, 0.01) && near(ib, 1000 * 0.017 / 24, 0.01), `quinzaines : dépôt le 1er = ${ia.toFixed(2)} €, le 2 = ${ib.toFixed(2)} € (2 vs 1 quinzaine)`);
  const r = finSeule(); r.fin.cal = -1; deposer(r, 'livretA', 1000); F.avancerCalendrier(r, 13); retirer(r, 'livretA', 1000); F.avancerCalendrier(r, 30);
  ch(r.fin.livrets.livretA.interets < 0.01, 'quinzaines : un retrait le 14 annule la quinzaine en cours');
}
// ---- LEP
{ const m = finSeule('modeste'), d = finSeule('median'); ch(eligibleLEP(m) && !eligibleLEP(d) && deposer(m, 'lep', 500).ok && !deposer(d, 'lep', 500).ok, 'LEP : éligible si RFR ≤ 23 028 €, refusé sinon'); 
  ch(!changerProfil(m, 'aise'), 'profil verrouillé après le premier placement'); }
// ---- plafonds
{ const s = finSeule(); s.argent = 30000; ch(!deposer(s, 'livretA', 23000).ok && deposer(s, 'livretA', 22950).ok, 'plafond du Livret A 22 950 €'); }
// ---- PEL : clôture avant 2 ans au taux du CEL, versement minimum, pas de retrait partiel
{ const s = finSeule(); ch(!deposer(s, 'pel', 100).ok && deposer(s, 'pel', 1000).ok, 'PEL : ouverture 225 € minimum');
  F.avancerCalendrier(s, 364); const avant = s.argent; const r = retirer(s, 'pel', 10);
  const attendu = (s.fin.pel === null) && near(s.argent - avant, (1000 + 45 * 12) + (1000 + 45 * 6) * 0.0125 * (1 - 0.30), 3);
  ch(attendu, `PEL clôturé après 1 an : ${(s.argent - avant).toFixed(2)} € (taux CEL 1,25 %, PFU 30 %) ; ${r.msg}`); }
// ---- SCPI : frais, délai de jouissance, retrait différé
{ const s = finSeule(); deposer(s, 'scpi', 1000); const v0 = valeurLiquidation(s);
  ch(near(v0, 900, 1), 'SCPI : revente immédiate = −10 % (frais de souscription)');
  F.avancerCalendrier(s, 100); ch(s.fin.scpi.loyers === 0, 'SCPI : pas de loyers pendant le délai de jouissance (4 mois)');
  F.avancerCalendrier(s, 200); ch(s.fin.scpi.loyers > 6 && s.fin.scpi.loyers < 7, `SCPI : loyers nets versés ensuite (${s.fin.scpi.loyers.toFixed(2)} € pour 2 mois sur 1 000 € : 4,91 % moins impôt TMI 11 % + 17,2 % après abattement de 30 %)`);
  retirer(s, 'scpi', 500); F.avancerCalendrier(s, 230); ch(!!s.fin.scpi.retrait, 'SCPI : retrait non exécuté avant 60 jours (illiquidité)');
  const a = s.argent; F.avancerCalendrier(s, 270); ch(!s.fin.scpi.retrait && s.argent > a + 440, `SCPI : retrait exécuté après le délai, au prix de retrait (${Math.round(s.argent - a)} € dont loyers)`); }
// ---- découvert : agios et commissions, virement automatique
{ const s = finSeule(); s.fin.autoLivret = false; s.argent = -800; F.avancerCalendrier(s, 29);
  ch(s.fin.agios > 80 && s.fin.agios < 100, `découvert de 800 € pendant un mois : ${s.fin.agios.toFixed(2)} € d'agios et commissions`);
  const t = finSeule(); deposer(t, 'livretA', 1000); t.argent = -300; F.avancerCalendrier(t, 2); ch(t.argent >= 0 && t.fin.agios === 0, 'virement automatique depuis le livret : pas d\'agios'); }
// ---- calage des marchés
{ const rng = makeRng(42), e = { regime: 0, cours: { monde: 100, cac: 100, oblig: 100 } }, an = [];
  for (let y = 0; y < 1000; y++) { const c0 = e.cours.monde; for (let d = 0; d < 365; d++) pasMarche(e, rng); an.push(e.cours.monde / c0 - 1); }
  const m = an.reduce((a, b) => a + b) / an.length, sd = Math.sqrt(an.reduce((a, b) => a + (b - m) ** 2, 0) / an.length);
  ch(m > 0.06 && m < 0.09 && sd > 0.13 && sd < 0.19 && Math.min(...an) < -0.25, `ETF monde : moyenne ${(m * 100).toFixed(1)} %/an, volatilité ${(sd * 100).toFixed(1)} %, pire année ${(Math.min(...an) * 100).toFixed(0)} %`); }
// ---- projection
{ const l = projection(2026, 1200, 20, 'livret'), a = projection(2026, 1200, 20, 'actions'), a1 = projection(2026, 1200, 1, 'actions');
  ch(near(l.p50.nominal, 1200 * ((1.017 ** 20 - 1) / 0.017) * 1.017, 50), `projection Livret A 20 ans : ${Math.round(l.p50.nominal)} €`);
  ch(a.p50.nominal > l.p50.nominal * 1.3 && a.p10.nominal < a.p90.nominal * 0.5 && a.perte < 0.15 && a1.perte > 0.15, `projection ETF 20 ans : médiane ${Math.round(a.p50.nominal)} €, pertes ${Math.round(a.perte * 100)} % des scénarios (1 an : ${Math.round(a1.perte * 100)} %)`); }

// ---- les trois stratégies sur toute la partie
const eqTriees = Object.keys(ROI_ITEMS).filter(id => ACHATS[id]).map(id => ({ id, e: estimationAchat(id) })).filter(x => x.e && x.e.annuel > 0).map(x => ({ id: x.id, taux: x.e.annuel / ACHATS[x.id].prix, prix: ACHATS[x.id].prix })).sort((a, b) => b.taux - a.taux);
function jouer(seed, strat) {
  const s = nouvellePartie(seed); const c = actions(s);
  s.central = { consigneJour: 19, consigneNuit: 16 }; s.aeration = 'breve';
  while (!s.fini) {
    if (s.dilemme) { const o = choixDilemme(s).filter(o => o.possible !== false); resoudreDilemme(s, (o.find(x => x.id === 'laverie') || o.find(x => x.id === 'attendre') || o.at(-1)).id); }
    if (s.jour % 7 === 6) planifierLessive(s, { temp: 30, sechage: 'air' });
    if (strat === 'toutPlacer' && s.jour === 0) { retirer(s, 'livretA', 1e9, c); deposer(s, 'peaMonde', Math.floor(s.argent), c); }
    if (strat === 'toutAcheter') { if (s.jour === 0) retirer(s, 'livretA', 1e9, c); for (const x of eqTriees) if (!s.possede[x.id]) acheter(s, x.id); }
    if (strat === 'prioritaire') {
      for (const x of eqTriees) if (x.taux > 0.15 && !s.possede[x.id] && s.argent - x.prix > 300) acheter(s, x.id);
      if (s.jour === 3) { const surplus = s.fin.livrets.livretA.solde - 2500; if (surplus > 0) { ouvrirAV(s, 'enLigne'); retirer(s, 'livretA', surplus, c); deposer(s, 'avEuros', surplus, c); } }
    }
    jourSuivant(s);
  }
  return scoreFinal(s);
}
for (const seed of [2026, 7, 1789]) {
  const R = Object.fromEntries(['prioritaire', 'toutPlacer', 'toutAcheter'].map(k => [k, jouer(seed, k)]));
  console.log(`  graine ${seed} : ` + Object.entries(R).map(([k, r]) => `${k} éco ${Math.round(r.economies)} € (placements ${Math.round(r.fin.net)}, banque ${Math.round(r.domaines.find(d => d.nom.startsWith('Banque')).valeur)}) patrimoine ${Math.round(r.patrimoine)} € moral ${Math.round(r.moy.moral)}`).join(' | '));
  ch(R.prioritaire.economies > R.toutPlacer.economies && R.prioritaire.economies > R.toutAcheter.economies, `graine ${seed} : équipements rentables puis placement > tout placer et > tout acheter`);
}
console.log(ok ? '\nOK' : '\nÉCHEC'); process.exit(ok ? 0 : 1);
