// Rentabilité mesurée des équipements (v0.4)
// Gain mesuré = ce que le même usage aurait coûté sans l'équipement (contrefactuel calculé chaque jour par la simulation).
import { ACHATS, ROI_ITEMS, FINANCE } from './data.js';
import { chapitreDuJour } from './meteo.js';
import { ESTIMATIONS } from './estimations.js';

const SAISONS = ['hiver', 'printemps', 'ete'];

// appelé chaque fin de journée : série cumulée, gains par saison, entretien payé
export function suivreROI(s) {
  s.roi ||= {};
  const saison = chapitreDuJour(Math.max(0, s.jour - 1)).id;
  for (const id of Object.keys(ROI_ITEMS)) {
    if (!s.possede[id]) continue;
    const r = s.roi[id] ||= { depuis: s.jour, serie: [], saison: { hiver: 0, printemps: 0, ete: 0 }, jours: { hiver: 0, printemps: 0, ete: 0 }, dernier: 0, entretien: 0 };
    const cumul = s.attribution[id] || 0;
    const g = cumul - r.dernier; r.dernier = cumul;
    r.saison[saison] += g; r.jours[saison]++;
    const e = (ROI_ITEMS[id].entretien || 0) / 365;
    r.entretien += e; s.argent -= e; s.depenses.entretien = (s.depenses.entretien || 0) + e;
    r.serie.push(Math.round((cumul - r.entretien) * 100) / 100);
  }
}

const prixPaye = (s, id) => s.prixPayes?.[id] ?? ACHATS[id].prix;

// gain €/jour par saison : mesuré si la saison a été vécue avec l'objet, sinon estimation
function parJour(s, id) {
  const r = s.roi?.[id], est = ESTIMATIONS[id] || { hiver: 0, printemps: 0, ete: 0 };
  const o = {};
  for (const k of SAISONS) o[k] = r && r.jours[k] >= 5 ? { v: r.saison[k] / r.jours[k], mesure: true } : { v: est[k] || 0, mesure: false };
  return o;
}

export function analyseROI(s, id) {
  const a = ACHATS[id], P = ROI_ITEMS[id], r = s.roi?.[id];
  const prix = prixPaye(s, id), occasion = prix < a.prix;
  const pj = parJour(s, id);
  const annuel = SAISONS.reduce((t, k) => t + pj[k].v * FINANCE.joursSaison[k], 0);
  const infl = FINANCE[{ energie: 'inflationEnergie', eau: 'inflationEau', carburant: 'inflationCarburant', alim: 'inflationAlim' }[P.poste]] ?? 0.02;
  const vieAns = occasion ? Math.max(1, a.vie * 0.6) : a.vie;
  const mesure = r ? r.dernier : 0, entretienPaye = r ? r.entretien : 0;
  const jours = r ? r.serie.length : 0;
  // projection annuelle : gain qui s'érode (dégradation), prix de l'énergie qui monte, entretien, coût d'opportunité (Livret A)
  // achat de clim évité (puits + cheminée en « clim de la Terre », sans clim achetée) : borne basse de la fourchette
  const climEvitee = P.climEvitee && s.combos?.climTerre && !s.possede.clim ? P.climEvitee[0] : 0;
  const proj = [];
  let cumul = mesure - entretienPaye + climEvitee, payback = null;
  const t0 = jours / 365;
  for (let y = 1; y <= FINANCE.annees; y++) {
    const facteur = Math.pow(1 + infl, y - 1) * Math.pow(1 - (P.degr || 0), y - 1);
    cumul += (y - 1 < vieAns ? annuel * facteur : 0) * (y === 1 ? Math.max(0, 1 - t0) : 1) - (P.entretien || 0) * (y === 1 ? Math.max(0, 1 - t0) : 1);
    const opportunite = prix * (Math.pow(1 + FINANCE.livretA, y) - 1);
    const residuel = prix * (P.revente || 0) * Math.max(0, 1 - y / vieAns);
    proj.push({ an: y, cumul, net: cumul - prix - opportunite + residuel, residuel, opportunite });
  }
  // date de retour : atteint (jour de jeu) ou projeté (mois)
  let atteint = null;
  if (r) { const i = r.serie.findIndex(v => v >= prix); if (i >= 0) atteint = r.depuis + i + 1; }
  if (atteint === null && annuel - (P.entretien || 0) > 0) payback = Math.max(0, (prix - (mesure - entretienPaye + climEvitee)) / ((annuel - (P.entretien || 0)) / 12));
  const residuelAuj = prix * (P.revente || 0) * Math.max(0, 1 - t0 / vieAns);
  const incertitude = pj.ete.mesure && pj.hiver.mesure && pj.printemps.mesure ? 0.15 : (ESTIMATIONS[id]?.incertitude ?? 0.4);
  return {
    id, nom: a.nom, prix, prixNeuf: a.prix, occasion, mesure, entretienPaye, entretienAn: P.entretien || 0, jours, pj, annuel, vieAns,
    degr: P.degr || 0, residuelAuj, proj, atteint, payback, incertitude, note: P.note || '', serie: r ? r.serie : [],
    net5: proj.at(-1).net, climEvitee, climEviteeFourchette: P.climEvitee, ratio: proj.at(-1).net / Math.max(1, prix),
  };
}

export function tableauROI(s) {
  return Object.keys(ROI_ITEMS).filter(id => s.possede[id]).map(id => analyseROI(s, id));
}

// estimation avant achat (boutique) : retour estimé et fourchette
export function estimationAchat(id, occasion = false) {
  const a = ACHATS[id], e = ESTIMATIONS[id], P = ROI_ITEMS[id];
  if (!e || !P) return null;
  const prix = occasion && a.occasion ? a.occasion : a.prix;
  const annuel = SAISONS.reduce((t, k) => t + (e[k] || 0) * FINANCE.joursSaison[k], 0) - (P.entretien || 0);
  if (annuel <= 0.5) return { annuel, mois: null, prix };
  const u = e.incertitude ?? 0.4;
  const m = prix / annuel * 12;
  return { annuel, prix, mois: m, min: m / (1 + u), max: m / Math.max(0.2, 1 - u) };
}
