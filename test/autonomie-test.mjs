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
ch(m && m.version === VERSION_SAUVEGARDE && VERSION_SAUVEGARDE === 9 && m.autonomie?.planches[3].culture === 'haricot' && m.migre === 8, 'migration v8 → v9 : plan conseillé appliqué');
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
