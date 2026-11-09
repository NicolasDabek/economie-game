// v1.1 : autosuffisance (planches, garde-manger, conserves, poêle, CET, migration v8 → v9)
import { nouvellePartie, charger, VERSION_SAUVEGARDE } from '../js/state.js';
import { jourSuivant, acheter, choixDilemme, resoudreDilemme, prendreTemps, payer } from '../js/simulation.js';
import { etatAutonomie, actionAutonomie, tauxAutosuffisance, nbPlanches } from '../js/autonomie.js';
let ok = true; const ch = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) ok = false; };
const o = (s) => ({ prendreTemps, payer, msg: () => {}, debloquer: () => {} });
const avancer = (s, n) => { for (let i = 0; i < n && !s.fini; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(x => x.possible !== false).at(-1).id); s.tempsUtilise = 0; jourSuivant(s); } };

const s = nouvellePartie(2026, 1); s.argent += 6000;
ch(acheter(s, 'potager') && nbPlanches(s) === 4 && etatAutonomie(s).planches[0].culture === 'salade', 'potager : 4 planches, plan conseillé');
s.tempsUtilise = 0; ch(actionAutonomie(s, 'demanderCEE', null, o(s)), 'prime CEE demandée avant le devis');
s.tempsUtilise = 0; ch(acheter(s, 'cet') && etatAutonomie(s).cet.prime === 294, 'CET : prime bonifiée 294 € (profil médian, avant 2027)');
avancer(s, 61); ch(etatAutonomie(s).cet.prime && etatAutonomie(s).cet.primeJour === null, 'prime CEE versée après 60 jours');
s.tempsUtilise = 0; acheter(s, 'poele'); actionAutonomie(s, 'bois', 'sec', o(s));
const gaz0 = s.depenses.gaz; avancer(s, 7);
ch(etatAutonomie(s).stats.boisKwh > 0, `poêle : ${Math.round(etatAutonomie(s).stats.boisKwh)} kWh de bois en une semaine`);
avancer(s, 200);
const A = etatAutonomie(s);
ch(A.stats.produitKg > 5, `potager : ${A.stats.produitKg.toFixed(1)} kg récoltés`);
ch(A.stats.alimMaison > 0, 'garde-manger consommé');
const t = tauxAutosuffisance(s); ch(t.global >= 0 && t.global <= 100 && typeof t.titre === 'string', `taux d'autosuffisance ${t.global.toFixed(0)} % (${t.titre})`);
ch(Object.values(s.depenses).every(v => Number.isFinite(v)), 'aucune dépense NaN');

// piège : CET d'occasion non RGE, pas de prime
const s2 = nouvellePartie(7, 1); s2.argent += 4000; acheter(s2, 'cet', true); ch(etatAutonomie(s2).cet.prime === 0, 'CET non RGE : aucune prime');

// migration v8 → v9
const v8 = nouvellePartie(2026, 1); v8.possede.potager = true; v8.sys.potagerDepuis = 0; delete v8.autonomie; v8.version = 8;
const st = { d: { 'economie-game-sauvegarde': JSON.stringify(v8) }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; }, removeItem(k) { delete this.d[k]; } };
const m = charger(st);
ch(m && m.version === VERSION_SAUVEGARDE && VERSION_SAUVEGARDE === 10 && m.autonomie?.planches[3].culture === 'haricot' && m.migre === 8, 'migration v8 → v10 : plan conseillé appliqué');

// ---------------------------------------------------------------- v1.11 (passe GD 11)
{
  const { CONSERVES } = await import('../js/data.js');
  const { garderMangerJour, planAntigaspi } = await import('../js/autonomie.js');
  const { debloquer } = await import('../js/simulation.js');
  const { PRINCIPES } = await import('../js/principes.js');
  const { rendreGardeManger } = await import('../js/onglets-autonomie.js');
  const B = CONSERVES.bocaux, r2 = (x) => Math.round(x * 100) / 100;
  const frais = (s, kg) => etatAutonomie(s).stock.push({ cat: 'frais', nom: 'Tomate', kg, valeurKg: 4, coutKg: 0, maison: true, bocal: true, lacto: false, entre: s.jour, fin: s.jour + 7 });
  const oReel = (s) => ({ prendreTemps, payer, msg: () => {}, debloquer: (id) => debloquer(s, id) });
  // fournée de 12 kg dont un bocal raté (risque forcé à 100 % à la marmite), puis consommation jusqu'à épuisement
  const fournee = (prevenu) => {
    const s = nouvellePartie(2026, 1), A = etatAutonomie(s); s.argent += 1000; frais(s, 12);
    if (prevenu) { s.tempsUtilise = 0; actionAutonomie(s, 'consignesConserve', null, oReel(s)); }
    const r0 = B.risqueMarmite; B.risqueMarmite = 1; s.tempsUtilise = 0; const fait = actionAutonomie(s, 'bocaux', null, oReel(s)); B.risqueMarmite = r0;
    const lots = A.stock.filter(l => l.cat === 'bocaux').map(l => ({ kg: r2(l.kg), risque: !!l.risque }));
    const g0 = { kg: A.stats.gaspilleKg, eur: A.stats.gaspilleEur };
    const ctx = { d: { sante: 0 }, couts: { imprevus: 0 }, msg: () => {}, debloquer: (id) => debloquer(s, id) };
    let mange = 0, ingereApresAlerte = 0;
    for (let k = 0; k < 400 && A.stock.some(l => l.cat === 'bocaux'); k++) {
      const avantAlerte = s.principes.includes('douteJeter'), ing0 = A.stats.suspectIngereKg || 0;
      const gm = garderMangerJour(s, ctx, A, { cout: 3 }); mange += gm.maison;
      if (avantAlerte) ingereApresAlerte += (A.stats.suspectIngereKg || 0) - ing0;
    }
    return { s, A, fait, lots, g0, mange, ingereApresAlerte, ctx };
  };
  { const { A, fait, lots, g0, ingereApresAlerte, ctx } = fournee(false);
    ch(fait && lots.length === 2 && lots.some(l => l.risque && l.kg === 0.5) && lots.some(l => !l.risque && l.kg === 11.5), `fournée 12 kg, un bocal raté : lots ${JSON.stringify(lots)} (0,5 kg suspect à part, 11,5 kg sains)`);
    const ing = A.stats.suspectIngereKg || 0, ec = A.stats.suspectEcarteKg || 0;
    ch(A.stats.intox === 1 && ctx.d.sante === -20 && Math.abs(ing + ec - 0.5) < 1e-9, `sans les consignes : 1 intoxication, ${r2(ing)} kg ingérés + ${r2(ec)} kg jetés après l'alerte = 0,5 kg suspect`);
    ch(ingereApresAlerte === 0, 'aucun kg suspect ingéré après l\'alerte');
    ch(Math.abs((A.stats.gaspilleKg - g0.kg) - ec) < 1e-9 && Math.abs(r2(A.stats.gaspilleEur - g0.eur) - r2(ec * B.valeurKg)) < 0.005, `pertes réconciliées : ${r2(A.stats.gaspilleKg - g0.kg)} kg, ${r2(A.stats.gaspilleEur - g0.eur)} € = ${r2(ec)} kg × ${B.valeurKg} €/kg`); }
  { const { A, s, mange, g0 } = fournee(true);
    ch(A.stats.intox === 0 && (A.stats.suspectIngereKg || 0) === 0 && Math.abs((A.stats.suspectEcarteKg || 0) - 0.5) < 1e-9, 'fixture préventive (consignes lues avant la 1re fournée) : 0 intoxication, 0,5 kg écarté, rien d\'ingéré');
    ch(Math.abs(mange - 11.5 * B.valeurKg) < 0.01 && Math.abs(r2(A.stats.gaspilleEur - g0.eur) - r2(0.5 * B.valeurKg)) < 0.005, `le reste de la fournée se mange : ${r2(mange)} € consommés (11,5 kg), ${r2(A.stats.gaspilleEur - g0.eur)} € perdus`);
    ch(s.principes.includes('douteJeter') && A.consignesLues === 0, 'principe « Dans le doute, on jette » appris sans intoxication'); }
  // le risque n'est pas supprimé : au stérilisateur ou à la marmite, sans consignes, la probabilité de bocal raté est inchangée
  ch(B.risqueMarmite === 0.06 && B.risqueSterilisateur === 0.01, 'risques de bocal raté inchangés (6 % marmite, 1 % stérilisateur)');
  // migration prudente d'une sauvegarde où tout un lot de 12 kg portait le risque
  { const v = nouvellePartie(2026, 1); etatAutonomie(v).stock.push({ cat: 'bocaux', nom: 'Bocaux', kg: 12, valeurKg: B.valeurKg, coutKg: 0, maison: true, risque: true, entre: 0, fin: 365 });
    const { meteo, ...x } = v; const st2 = { d: { 'economie-game-sauvegarde': JSON.stringify(x) }, getItem(k) { return this.d[k] ?? null; }, setItem(k, val) { this.d[k] = val; }, removeItem(k) { delete this.d[k]; } };
    const m2 = charger(st2), L = m2?.autonomie?.stock?.filter(l => l.cat === 'bocaux') || [];
    ch(L.length === 2 && L.some(l => l.risque && Math.abs(l.kg - 0.5) < 1e-9) && L.some(l => !l.risque && Math.abs(l.kg - 11.5) < 1e-9), `migration : ancien lot 12 kg « à risque » → 0,5 kg suspect + 11,5 kg sains (${L.map(l => r2(l.kg) + (l.risque ? ' suspect' : '')).join(', ')})`); }
  // textes = données
  const P = PRINCIPES.conserver.pourquoi, eurKg = String(B.valeurKg).replace('.', ',') + ' €/kg';
  ch(P.includes(`${B.temps} h`) && P.includes(eurKg) && !P.includes('3 h') && !P.includes('~5 €'), `principe « Stériliser » : ${B.temps} h et ${eurKg} comme les données`);
  ch(PRINCIPES.conserver.sources?.length >= 2 && PRINCIPES.douteJeter.sources?.length >= 2, 'conseils sanitaires sourcés (ANSES, santé.fr, ministère de l\'Agriculture)');
  // avertissement avant la première fournée
  { const s = nouvellePartie(2026, 1); s.argent += 500; acheter(s, 'potager'); const h = rendreGardeManger(s, 8);
    ch(h.includes('Avant ta première fournée') && h.includes('data-autonomie="consignesConserve"'), 'avertissement et consignes visibles avant la première fournée'); }
  // antigaspi : kg urgents, capacité conservable, temps et matériel manquants ; jamais de temps négatif
  { const s = nouvellePartie(2026, 1), A = etatAutonomie(s); A.stock.push({ cat: 'frais', nom: 'Tomate', kg: 15, valeurKg: 4, coutKg: 0, maison: true, bocal: true, lacto: false, entre: 0, fin: s.jour + 3 });
    const P1 = planAntigaspi(s, 1), P3 = planAntigaspi(s, 3);
    ch(Math.abs(P1.urgentKg - 15) < 1e-9 && P1.bocauxKg === 12 && P1.conservable === 0 && P1.tempsManquant === 1 && P1.manque.some(m => m.startsWith('stérilisateur')) && P1.options.some(o => o.action === 'bocaux' && !o.possible), `1 h libre : 15 kg urgents, fournée 12 kg impossible (manque 1 h), stérilisateur manquant signalé`);
    ch(P3.conservable === 12 && P3.options.find(o => o.action === 'bocaux').possible, '3 h libres : 12 kg conservables en bocaux');
    s.tempsUtilise = 0; const libre0 = s.tempsUtilise; ch(actionAutonomie(s, 'menuAntigaspi', null, o(s)) && A.menuAntigaspiJusqua === s.jour + 6 && !actionAutonomie(s, 'menuAntigaspi', null, o(s)), 'menu antigaspi : décidé pour 7 jours, pas deux fois');
    ch(s.tempsUtilise - libre0 === 0.25, 'menu antigaspi : 15 min de temps'); }
}
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
