// Génère js/estimations.js : gain moyen €/jour par saison de chaque équipement, mesuré par la simulation
// dans un usage type (moyenne de 3 graines). Usage : node outils/estimations.mjs
import { writeFileSync } from 'fs';
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, resoudreDilemme, choixDilemme } from '../js/simulation.js';
import { ROI_ITEMS, ACHATS } from '../js/data.js';

function partie(graine, variante) {
  const s = nouvellePartie(graine);
  s.argent = 1e6;
  const PASS = ['chemineeDIY', 'chemineePro', 'puitsDIY', 'puitsPro', 'puitsHydro', 'kitRadon'];
  const avecPassif = { chemDIY: ['chemineeDIY'], chemPro: ['chemineePro'], puitsPro: ['puitsPro', 'kitRadon'], puitsDIY: ['puitsDIY', 'chemineeDIY', 'kitRadon'], puitsHydro: ['puitsHydro', 'chemineeDIY'] }[variante];
  if (avecPassif) variante = 'base';
  const exclus0 = { base: ['vae', 'clim', 'batterie', 'thermos'], fresnel: ['fourSolaire', 'vae', 'clim', 'batterie', 'thermos'], vae: ['velo', 'clim', 'routeur', 'caisse'], clim: ['vae', 'batterie', 'thermos'] }[variante];
  const exclus = [...exclus0, ...PASS.filter(k => !(avecPassif || []).includes(k))];
  for (const id of Object.keys(ROI_ITEMS)) if (!exclus.includes(id)) { s.possede[id] = true; s.prixPayes[id] = ACHATS[id].prix; }
  s.sys.stockage = { actif: true, contenant: variante === 'vae' ? 'thermos' : 'caisse' };
  Object.assign(s.sys, { regime: 'batch', cuisineSolaire: true, multipriseGeste: true, vaisselle: 'courante' });
  s.sys.ballon.consigne = 55; s.sys.douche.minutes = 7; s.sys.douche.recupEau = true;
  s.robinets = true; s.rideaux = 'nuit'; s.utiliserBouillotte = true; s.recupCuisson = true; s.aeration = 'breve';
  s.transport.mode = variante === 'vae' ? 'vae' : 'velo'; s.transport.modeLoisirs = s.transport.mode;
  Object.assign(s.passif, { mode: 'trombe', clapetNuit: 'ferme', puitsMode: 'auto', debit: 'hygro', cave: true });
  s.possede.hygrometre = true;
  while (!s.fini) {
    if (s.jour === 84) Object.assign(s.passif, { mode: (avecPassif || []).some(k => k.startsWith('puits')) ? 'purge' : 'purgeNuit' });
    if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false).at(-1).id);
    if (s.jour === 56) s.sys.potagerDepuis = 56;
    if (s.jour === 84) { s.ventilateur = true; if (variante === 'clim') { s.climActive = true; s.climConsigne = 26; } }
    s.transport.veloEnPanne = false; s.volonte = 80;
    jourSuivant(s);
  }
  return s;
}
const acc = {};
for (const g of [2026, 7, 1789]) for (const v of ['base', 'fresnel', 'vae', 'clim', 'chemDIY', 'chemPro', 'puitsPro', 'puitsDIY', 'puitsHydro']) {
  const s = partie(g, v);
  for (const [id, r] of Object.entries(s.roi)) {
    if ((v === 'fresnel') !== (id === 'fresnel') && id === 'fresnel') continue;
    if (v === 'vae' && !['vae', 'batterie', 'thermos'].includes(id)) continue; if (v === 'clim' && id !== 'clim') continue; if (v === 'fresnel' && id !== 'fresnel') continue;
    if (v === 'base' && ['fresnel'].includes(id)) continue;
    const cible = { chemDIY: 'chemineeDIY', chemPro: 'chemineePro', puitsPro: 'puitsPro', puitsDIY: 'puitsDIY', puitsHydro: 'puitsHydro' }[v];
    if (cible ? id !== cible : ['chemineeDIY', 'chemineePro', 'puitsDIY', 'puitsPro', 'puitsHydro'].includes(id)) continue;
    const a = acc[id] ||= { hiver: [], printemps: [], ete: [] };
    for (const k of Object.keys(a)) if (r.jours[k]) a[k].push(r.saison[k] / r.jours[k]);
  }
}
const meteoDep = ['chemineeDIY', 'chemineePro', 'puitsDIY', 'puitsPro', 'puitsHydro', 'routeur', 'batterie', 'thermos', 'caisse', 'solaire', 'fresnel', 'fourSolaire', 'potager', 'composteur', 'cuve', 'velo', 'vae', 'pierre', 'sechoir'];
const out = {};
for (const [id, a] of Object.entries(acc)) {
  const m = (l) => (l.length ? Math.round(l.reduce((x, y) => x + y, 0) / l.length * 1000) / 1000 : 0);
  out[id] = { hiver: m(a.hiver), printemps: m(a.printemps), ete: m(a.ete), incertitude: meteoDep.includes(id) ? 0.5 : 0.3 };
}
writeFileSync(new URL('../js/estimations.js', import.meta.url), `// Généré par outils/estimations.mjs : gain moyen mesuré (€/jour) par saison dans un usage type, 3 graines.
// Sert à l'estimation avant achat dans la boutique et à projeter les saisons pas encore vécues.
export const ESTIMATIONS = ${JSON.stringify(out, null, 1)};
`);
console.log(out);
