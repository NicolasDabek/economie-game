// Météo d'hiver : aléatoire faible, déterministe par graine, prévisions à 3 jours
import { makeRng } from './rng.js';
import { JOURS } from './data.js';

export function genererMeteo(seed) {
  const rng = makeRng(seed);
  const jours = [];
  let anomalie = 0, nuage = 0.6;
  for (let d = 0; d < JOURS + 4; d++) {
    // Courbe saisonnière : 5 °C début décembre -> 2 °C mi-janvier -> 4 °C
    const saison = 5 - 3 * Math.sin(Math.PI * Math.min(d, JOURS) / JOURS);
    anomalie = 0.7 * anomalie + (rng() - 0.5) * 3;
    // Vague de froid annoncée semaines 4-5
    const vague = d >= 24 && d < 31 ? -4 * Math.sin(Math.PI * (d - 24) / 7) : 0;
    nuage = Math.min(1, Math.max(0, 0.6 * nuage + 0.4 * rng() + (rng() - 0.5) * 0.3));
    const tMoy = saison + anomalie + vague + (1 - nuage) * -1; // ciel clair = nuit plus froide
    const amplitude = 2 + 4 * (1 - nuage);
    jours.push({ tMoy, amplitude, nuage, ...decrire(nuage, tMoy) });
  }
  return jours;
}

function decrire(nuage, t) {
  if (t < 0 && nuage > 0.7) return { icone: '🌨️', libelle: 'Neige' };
  if (nuage < 0.3) return { icone: '☀️', libelle: 'Ensoleillé' };
  if (nuage < 0.6) return { icone: '⛅', libelle: 'Éclaircies' };
  return { icone: '☁️', libelle: 'Couvert' };
}

export function tExt(jour, h) {
  // minimum vers 6 h, maximum vers 15 h
  return jour.tMoy + jour.amplitude / 2 * Math.cos((h - 15) / 24 * 2 * Math.PI);
}

// Irradiance solaire sur une fenêtre sud (W/m²)
export function soleil(jour, h) {
  if (h < 9 || h > 16) return 0;
  return 420 * Math.sin(Math.PI * (h - 8.5) / 8.5) * (1 - 0.9 * jour.nuage);
}

// Prévision : légère erreur, croissante avec l'échéance
export function prevision(meteo, d, seed) {
  const rng = makeRng(seed * 31 + d * 7);
  const out = [];
  for (let k = 1; k <= 3; k++) {
    const j = meteo[d + k];
    if (!j) break;
    const err = (rng() - 0.5) * 1.2 * k;
    out.push({ ...j, tMin: Math.round(j.tMoy - j.amplitude / 2 + err), tMax: Math.round(j.tMoy + j.amplitude / 2 + err) });
  }
  return out;
}
