// Météo des trois chapitres (hiver -> printemps -> été) : aléatoire faible, déterministe par graine.
// Couleurs Tempo générées comme RTE : rouges en semaine par grand froid, blancs fréquents en hiver, bleus l'été.
import { makeRng } from './rng.js';
import { CHAPITRES } from './data.js';

export function chapitreDuJour(d) {
  let debut = 0;
  for (const c of CHAPITRES) { if (d < debut + c.jours) return { ...c, index: d - debut, debutJeu: debut }; debut += c.jours; }
  const c = CHAPITRES.at(-1); return { ...c, index: c.jours - 1, debutJeu: debut - c.jours };
}
export const JOURS_TOTAL = CHAPITRES.reduce((a, c) => a + c.jours, 0);

export function genererMeteo(seed) {
  const rng = makeRng(seed);
  const jours = [];
  let anomalie = 0, nuage = 0.6, rouges = 0;
  for (let d = 0; d < JOURS_TOTAL + 4; d++) {
    const c = chapitreDuJour(d);
    const x = Math.min(1, c.index / c.jours);
    anomalie = 0.7 * anomalie + (rng() - 0.5) * 3;
    let tBase = c.id === 'hiver' ? 5 - 3 * Math.sin(Math.PI * x) : c.id === 'printemps' ? 10 + 4 * x : 21 + 3 * Math.sin(Math.PI * x);
    // Événements climatiques : vague de froid (hiver j24-30), canicule (été j14-20)
    if (c.id === 'hiver' && c.index >= 24 && c.index < 31) tBase -= 4 * Math.sin(Math.PI * (c.index - 24) / 7);
    const canicule = c.id === 'ete' && c.index >= 14 && c.index < 21;
    if (canicule) tBase += 7 * Math.sin(Math.PI * (c.index - 13) / 8);
    const nuageMoy = c.id === 'hiver' ? 0.6 : c.id === 'printemps' ? 0.45 : 0.25;
    nuage = Math.min(1, Math.max(0, 0.5 * nuage + 0.5 * (nuageMoy + (rng() - 0.5) * 0.9)));
    if (canicule) nuage = Math.min(nuage, 0.15);
    const tMoy = tBase + anomalie + (1 - nuage) * (c.id === 'ete' ? 1 : -1);
    const amplitude = (c.id === 'ete' ? 6 : 2) + (c.id === 'ete' ? 6 : 4) * (1 - nuage);
    // Tempo
    const jourSem = d % 7;
    let tempo = 'bleu';
    if (c.id === 'hiver') {
      if (jourSem < 5 && rouges < 10 && (tMoy < 2.5 || rng() < 0.12)) { tempo = 'rouge'; rouges++; }
      else if (jourSem < 6 && rng() < 0.4) tempo = 'blanc';
    } else if (c.id === 'printemps' && jourSem < 6 && rng() < 0.12) tempo = 'blanc';
    jours.push({ tMoy, amplitude, nuage, tempo, canicule, chap: c.id, ...decrire(nuage, tMoy, canicule) });
  }
  return jours;
}

function decrire(nuage, t, canicule) {
  if (canicule) return { icone: '🥵', libelle: 'Canicule' };
  if (t < 0 && nuage > 0.7) return { icone: '🌨️', libelle: 'Neige' };
  if (nuage < 0.3) return { icone: '☀️', libelle: 'Ensoleillé' };
  if (nuage < 0.6) return { icone: '⛅', libelle: 'Éclaircies' };
  return { icone: '☁️', libelle: 'Couvert' };
}

export function tExt(jour, h) {
  return jour.tMoy + jour.amplitude / 2 * Math.cos((h - 15) / 24 * 2 * Math.PI);
}

// Irradiance sur un plan bien orienté (panneau, four solaire), W/m²
const SOLEIL = { hiver: [8.5, 16.5, 450], printemps: [7, 19.5, 750], ete: [6, 21, 850] };
export function soleil(jour, h) {
  const [lever, coucher, pic] = SOLEIL[jour.chap] || SOLEIL.hiver;
  if (h < lever || h > coucher) return 0;
  return pic * Math.sin(Math.PI * (h - lever) / (coucher - lever)) * (1 - 0.9 * jour.nuage);
}
// Part du soleil qui entre par une fenêtre sud verticale (soleil haut en été)
export const FACTEUR_FENETRE = { hiver: 0.95, printemps: 0.6, ete: 0.35 };

export function prevision(meteo, d, seed) {
  const rng = makeRng(seed * 31 + d * 7);
  const out = [];
  for (let k = 1; k <= 3; k++) {
    const j = meteo[d + k];
    if (!j) break;
    const err = (rng() - 0.5) * 1.2 * k;
    // Comme chez RTE, la couleur Tempo n'est connue que la veille
    out.push({ ...j, tempo: k === 1 ? j.tempo : null, tMin: Math.round(j.tMoy - j.amplitude / 2 + err), tMax: Math.round(j.tMoy + j.amplitude / 2 + err) });
  }
  return out;
}
