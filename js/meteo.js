// Météo de la campagne (v0.6) : plusieurs années, quatre saisons, déterministe par graine.
// Normales mensuelles d'une ville moyenne du Centre-Est (Météo-France 1991-2020, ~Dijon/Orléans) ; anomalies AR(1),
// une vague de froid par hiver, 0 à 2 canicules par été (+0,04 °C/an de tendance).
// Tempo comme RTE : 22 jours rouges max (1er nov.-31 mars, en semaine), 43 blancs max (pas le dimanche), année Tempo au 1er septembre.
import { makeRng } from './rng.js';
import { CHAPITRES, CAMPAGNE, joursCampagne } from './data.js';

const J = 86400000;
export const dateDuJour = (d) => new Date(CAMPAGNE.debut + d * J);
const SAISON_MOIS = {}; for (const c of CHAPITRES) for (const m of c.mois) SAISON_MOIS[m] = c;
const DEBUT_SAISON = { hiver: [11, 1], printemps: [2, 1], ete: [5, 1], automne: [8, 1] };
// année de campagne (0 = déc. 2026 - nov. 2027)
export const anneeDuJour = (d) => { const x = dateDuJour(d); return x.getUTCFullYear() - 2026 - (x.getUTCMonth() < 11 ? 1 : 0); };
export function chapitreDuJour(d) {
  const x = dateDuJour(Math.max(0, d)), m = x.getUTCMonth(), c = SAISON_MOIS[m];
  const [mm] = DEBUT_SAISON[c.saison];
  const y = x.getUTCFullYear() - (c.saison === 'hiver' && m < 11 ? 1 : 0);
  const debut = Date.UTC(y, mm, 1), fin = Date.UTC(y, mm + 3, 1);
  const index = Math.round((x - debut) / J);
  const doy = Math.round((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / J);
  return { ...c, index, jours: Math.round((fin - debut) / J), debutJeu: d - index, doy, annee: anneeDuJour(d) };
}
// normales de température moyenne journalière (°C), janvier → décembre
const NORMALES = [3.6, 4.4, 7.8, 10.6, 14.6, 18.2, 20.6, 20.3, 16.4, 12.3, 7.4, 4.3];
const NUAGE = [0.62, 0.58, 0.5, 0.45, 0.42, 0.32, 0.25, 0.27, 0.36, 0.5, 0.62, 0.65];
function normale(x) {
  const m = x.getUTCMonth(), j = x.getUTCDate() - 1, dans = new Date(Date.UTC(x.getUTCFullYear(), m + 1, 0)).getUTCDate();
  const f = j / dans - 0.5, autre = f < 0 ? (m + 11) % 12 : (m + 1) % 12;
  const w = Math.abs(f);
  return { t: NORMALES[m] * (1 - w) + NORMALES[autre] * w, n: NUAGE[m] * (1 - w) + NUAGE[autre] * w };
}
export const JOURS_TOTAL = joursCampagne(CAMPAGNE.anneesDefaut);

export function genererMeteo(seed, annees = CAMPAGNE.anneesDefaut) {
  const rng = makeRng(seed);
  const total = joursCampagne(annees) + 4;
  // calendrier des vagues : année 0 identique aux versions précédentes (froid 25-31 déc., canicule 15-21 juillet)
  const froid = [], canic = [];
  for (let a = 0; a <= annees; a++) {
    const r = makeRng(seed * 131 + a * 17);
    const debutFroid = a === 0 ? 24 : 15 + Math.floor(r() * 55);
    froid.push([joursCampagne(a) + debutFroid, 7]);
    const n = a === 0 ? 1 : (r() < 0.85 ? 1 : 0) + (r() < 0.3 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const deb = a === 0 ? 226 : 205 + Math.floor(r() * 60) + k * 18, len = a === 0 ? 7 : 5 + Math.floor(r() * 4);
      canic.push([joursCampagne(a) + deb, len]);
    }
  }
  const dansVague = (v, d) => { for (const [deb, len] of v) if (d >= deb && d < deb + len) return [d - deb, len]; return null; };
  const jours = [];
  let anomalie = 0, nuage = 0.6, rouges = 0, blancs = 0, anTempo = -1;
  for (let d = 0; d < total; d++) {
    const c = chapitreDuJour(d), x = dateDuJour(d), mois = x.getUTCMonth();
    const N = normale(x);
    anomalie = 0.7 * anomalie + (rng() - 0.5) * 3;
    let tBase = N.t + 0.04 * c.annee;
    const vf = dansVague(froid, d); if (vf) tBase -= 4 * Math.sin(Math.PI * vf[0] / vf[1]);
    const vc = dansVague(canic, d), canicule = !!vc;
    if (vc) tBase += 7 * Math.sin(Math.PI * (vc[0] + 1) / (vc[1] + 1));
    nuage = Math.min(1, Math.max(0, 0.5 * nuage + 0.5 * (N.n + (rng() - 0.5) * 0.9)));
    if (canicule) nuage = Math.min(nuage, 0.15);
    const ete = c.saison === 'ete';
    const tMoy = tBase + anomalie + (1 - nuage) * (ete ? 1 : -1);
    const amplitude = (ete ? 6 : 2) + (ete ? 6 : 4) * (1 - nuage);
    // Tempo
    const tAn = x.getUTCFullYear() - (mois < 8 ? 1 : 0);
    if (tAn !== anTempo) { anTempo = tAn; rouges = 0; blancs = 0; }
    const jourSem = d % 7;
    let tempo = 'bleu';
    const hiverTempo = mois >= 10 || mois <= 2;
    if (hiverTempo && jourSem < 5 && rouges < 22 && (tMoy < 2.5 || rng() < 0.08)) { tempo = 'rouge'; rouges++; }
    else if (jourSem < 6 && blancs < 43 && rng() < (hiverTempo ? 0.3 : mois >= 3 && mois <= 4 ? 0.08 : 0.02)) { tempo = 'blanc'; blancs++; }
    jours.push({ tMoy, amplitude, nuage, tempo, canicule, chap: c.id, saison: c.saison, doy: c.doy, ...decrire(nuage, tMoy, canicule) });
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

// Irradiance sur un plan bien orienté (panneau, four solaire), W/m² : durée du jour et hauteur du soleil selon la date (latitude 47° N)
export function soleil(jour, h) {
  const s = Math.sin(2 * Math.PI * ((jour.doy ?? 15) - 80) / 365);
  const duree = 12 + 3.9 * s, midi = 13 + 0.5 * (s > 0 ? 1 : 0), lever = midi - duree / 2, coucher = midi + duree / 2, pic = 650 + 200 * s;
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
    out.push({ ...j, tempo: k === 1 ? j.tempo : null, tMin: Math.round(j.tMoy - j.amplitude / 2 + err), tMax: Math.round(j.tMoy + j.amplitude / 2 + err) });
  }
  return out;
}
