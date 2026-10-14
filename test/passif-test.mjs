// Tests de la ventilation passive (cheminée solaire + puits canadien) : node test/passif-test.mjs
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, resoudreDilemme, choixDilemme, acheter, tempsLibre, planifierLessive } from '../js/simulation.js';
import { analyseROI } from '../js/roi.js';
import { chapitreDuJour } from '../js/meteo.js';
import { ACHATS } from '../js/data.js';

let ok = true;
const verif = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) ok = false; };

// partie type : chauffage réglé, été avec volets ; équipement posé dès le début (sans chantier)
function partie(seed, items, regl = {}, hook) {
  const s = nouvellePartie(seed);
  s.argent = 1e6;
  for (const id of [...items, 'hygrometre']) { s.possede[id] = true; s.prixPayes[id] = ACHATS[id].prix; }
  Object.assign(s.passif, regl.hiver || {});
  const st = { tSalonEteApm: [], gaz: 0, hrMax: 0 };
  while (!s.fini) {
    if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false).at(-1).id);
    const c = chapitreDuJour(s.jour);
    if (c.id === 'ete' && c.index === 0) { Object.assign(s.passif, regl.ete || {}); if (regl.volets) { s.voletsJour = true; s.ventNuit = true; } }
    if (c.id === 'printemps' && c.index === 0) Object.assign(s.passif, regl.printemps || {});
    hook?.(s, c);
    if (s.jour % 3 === 2 && !s.lessivePrevue) planifierLessive(s, { temp: 30, sechage: 'air' });
    s.volonte = Math.max(s.volonte, 60);
    jourSuivant(s);
    const j = s.historique?.at?.(-1);
    if (c.id === 'ete' && s.dernierJour) for (const x of s.dernierJour.heures) if (x.h >= 14 && x.h <= 18) st.tSalonEteApm.push(x.t.salon);
    st.hrMax = Math.max(st.hrMax, s.passif.j?.hrMax || 0);
  }
  st.gaz = s.depenses.gaz;
  return { s, st };
}
const ans = (s, id) => { const r = analyseROI(s, id); const net = r.annuel - r.entretienAn; return { r, ans: net > 0 ? r.prix / net : Infinity }; };
const moy = (l) => l.reduce((a, b) => a + b, 0) / Math.max(1, l.length);

const climEte = (s, c) => { if (c.id === 'ete' && c.index === 0) { s.climActive = true; s.climConsigne = 26; } };
const SAISONS = { hiver: { mode: 'trombe', clapetNuit: 'ferme', puitsMode: 'auto' }, printemps: { mode: 'trombe' }, ete: { mode: 'purgeNuit', puitsMode: 'auto' }, volets: true };
const tab = [];
for (const seed of [2026, 7, 1789]) {
  const ref = partie(seed, [], SAISONS);
  const ch = partie(seed, ['chemineeDIY', 'clim'], SAISONS, climEte);
  const pp = partie(seed, ['puitsPro', 'kitRadon'], { ...SAISONS, ete: { puitsMode: 'auto' } });
  const combo = partie(seed, ['chemineeDIY', 'puitsDIY', 'kitRadon'], { ...SAISONS, ete: { mode: 'purge', puitsMode: 'auto', debit: 'hygro' } });
  console.log("gaz ref", ref.st.gaz.toFixed(0), "chem", ch.st.gaz.toFixed(0), "combo", combo.st.gaz.toFixed(0), "attr chem", ch.s.attribution.chemineeDIY.toFixed(0), "attr combo", (combo.s.attribution.chemineeDIY + combo.s.attribution.puitsDIY).toFixed(0));
  const a1 = ans(ch.s, 'chemineeDIY'), a2 = ans(pp.s, 'puitsPro'), a3 = ans(combo.s, 'puitsDIY'), a3c = ans(combo.s, 'chemineeDIY');
  const ansCombo = (a3.r.prix + a3c.r.prix) / Math.max(1e-6, a3.r.annuel + a3c.r.annuel - a3.r.entretienAn);
  const dT = moy(ref.st.tSalonEteApm) - moy(combo.st.tSalonEteApm);
  tab.push({ seed, chem: a1.ans, puitsPro: a2.ans, combo: ansCombo, dT, combos: Object.keys(combo.s.combos).filter(k => ['climTerre', 'respirationHiver', 'purgeNocturne', 'sechoirTirage', 'caveNaturelle'].includes(k)) });
  console.log(`graine ${seed} : cheminée DIY ${a1.r.annuel.toFixed(0)} €/an → ${a1.ans.toFixed(1)} ans · puits pro ${a2.r.annuel.toFixed(0)} €/an → ${a2.ans.toFixed(0)} ans · puits DIY + cheminée (clim évitée ${a3.r.climEvitee.toFixed(0)} €/an) ${(a3.r.annuel + a3c.r.annuel).toFixed(0)} €/an → ${ansCombo.toFixed(1)} ans · salon été 14-18 h ${dT.toFixed(1)} °C plus frais · combos ${tab.at(-1).combos.join(', ')}`);
  verif(a1.ans >= 4 && a1.ans <= 8, `${seed} cheminée DIY seule : retour ${a1.ans.toFixed(1)} ans`);
  verif(Math.abs(ch.s.attribution.chemineeDIY - (ref.st.gaz - ch.st.gaz)) < 0.4 * (ref.st.gaz - ch.st.gaz), `${seed} gain attribué cohérent avec le gaz réellement économisé`);
  verif(a2.ans > 50, `${seed} puits pro seul : jamais ou presque (gain ${a2.r.annuel.toFixed(0)} €/an, entretien ${a2.r.entretienAn} €/an)`);
  verif(ansCombo >= 12 && ansCombo <= 25, `${seed} puits DIY + cheminée, clim mobile évitée : ${ansCombo.toFixed(1)} ans (réaliste : 12-25)`);
  verif(dT >= 2, `${seed} clim de la Terre : salon nettement plus frais l'après-midi d'été`);
  verif(combo.s.combos.climTerre && combo.s.combos.respirationHiver, `${seed} combos clim de la Terre et respiration d'hiver`);
}
// piège : clapet laissé ouvert
{
  const f = partie(2026, ['chemineeDIY'], SAISONS), o = partie(2026, ['chemineeDIY'], { ...SAISONS, hiver: { mode: 'trombe', clapetNuit: 'ouvert' } });
  console.log(`clapet fermé ${f.st.gaz.toFixed(0)} € de gaz, laissé ouvert ${o.st.gaz.toFixed(0)} €`);
  verif(o.st.gaz > f.st.gaz + 20 && o.s.passif.contreTirage > 10 && o.s.principes.includes?.('clapet') !== false, 'contre-tirage : le clapet ouvert coûte du gaz');
}
// anti-combo serre humide
{
  const n = partie(2026, ['chemineeDIY', 'puitsDIY', 'kitRadon'], { ...SAISONS, ete: { mode: 'purge', puitsMode: 'on', debit: 'normal' } });
  const r = partie(2026, ['chemineeDIY', 'puitsDIY', 'kitRadon'], { ...SAISONS, ete: { mode: 'purge', puitsMode: 'on', debit: 'reduit' } });
  console.log(`serre humide : débit normal ${n.s.passif.serreJours} j (HR max ${n.st.hrMax.toFixed(0)} %), débit réduit ${r.s.passif.serreJours} j`);
  verif(n.s.combos.serreHumide && n.s.passif.serreJours > (r.s.passif.serreJours || 0), 'anti-combo serre humide détecté, évité en réduisant le débit');
}
// radon (graine paire = zone radon)
{
  const sans = partie(2026, ['puitsPro'], SAISONS), avec = partie(2026, ['puitsPro', 'kitRadon'], SAISONS);
  verif(sans.s.passif.zoneRadon && sans.s.passif.radonJours > 0 && avec.s.passif.radonJours === 0 && sans.s.sommes.sante < avec.s.sommes.sante, `radon : santé moyenne ${(sans.s.sommes.sante / 126).toFixed(0)} sans kit vs ${(avec.s.sommes.sante / 126).toFixed(0)} avec`);
}
// pente ratée (DIY)
{
  const b = partie(2026, ['puitsDIY', 'kitRadon'], SAISONS), m = partie(2026, ['puitsDIY', 'kitRadon'], SAISONS, (s) => { if (s.jour === 0) s.passif.penteRatee = true; });
  verif(m.s.passif.stagnant > 2 && m.s.sommes.hygiene < b.s.sommes.hygiene, `pente ratée : ${m.s.passif.stagnant.toFixed(1)} L stagnants, hygiène moyenne ${(m.s.sommes.hygiene / 126).toFixed(0)} vs ${(b.s.sommes.hygiene / 126).toFixed(0)}`);
}
// chantier : achat réel, temps libre bloqué, service à la fin
{
  const s = nouvellePartie(7); s.argent = 5000;
  verif(acheter(s, 'chemineeDIY') && tempsLibre(s) <= 0, 'chantier : le temps libre est pris');
  verif(!acheter(s, 'chemineePro'), 'une seule cheminée');
  for (let i = 0; i < 3; i++) jourSuivant(s);
  verif(s.passif.chantiers.every(c => c.reste === 0) && tempsLibre(s) > 0, 'chantier terminé après 3 jours');
}
console.log(ok ? 'OK' : 'ÉCHEC');
process.exit(ok ? 0 : 1);
