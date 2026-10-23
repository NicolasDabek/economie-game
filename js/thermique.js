// Physique horaire : bilan thermique et hydrique des 3 pièces (extrait de simulation.js en v1.3.2)
import { FACTEUR_NON_PURGE, PIECES, ORDRE_PIECES, PART_FENETRE, PART_INFILTRATION, ISOLATION, ECHANGE_PORTE, P_APPOINT, pieceOccupee, estJour, ETE } from './data.js';
import { tExt, soleil, FACTEUR_FENETRE } from './meteo.js';

const T_HORS_GEL = 8;
const P_CORPS = 90;
const CHALEUR_FOND = { salon: 80, chambre: 30, cuisine: 60 }; // W des appareils (frigo, box…)

// ---------------------------------------------------------------- physique horaire
/**
 * Une heure de physique. Retourne la chaleur des radiateurs (Wh utiles), l'appoint (Wh élec) et les économies attribuées.
 */
export function pasHoraire(pieces, cfg, jm, h) {
  const te = tExt(jm, h), irr = soleil(jm, h);
  const occ = pieceOccupee(h);
  const kPorte = ECHANGE_PORTE[cfg.portes];
  const tMoy = ORDRE_PIECES.reduce((a, p) => a + pieces[p].t, 0) / ORDRE_PIECES.length;
  const hMoy = ORDRE_PIECES.reduce((a, p) => a + pieces[p].hum, 0) / ORDRE_PIECES.length;
  const q = {}, attrib = { calfeutrage: 0, boudin: 0, rideauxTh: 0, volets: 0, cuisson: 0 };
  const fact = cfg.purge ? 1 : FACTEUR_NON_PURGE;
  for (const id of ORDRE_PIECES) {
    const P = PIECES[id], r = pieces[id];
    const dT = Math.max(0, r.t - te);
    const Ufen = P.U * PART_FENETRE, Uinf = P.U * PART_INFILTRATION, Uautre = P.U - Ufen - Uinf;
    let fFen = 1, fInf = 1;
    if (cfg.rideauxFermes) fFen *= 1 - (cfg.rideauxTh ? ISOLATION.rideauThermique : ISOLATION.rideauSimple);
    if (cfg.voletsFermes) fFen *= 1 - ISOLATION.volets;
    const voletsJour = cfg.voletsJour && estJour(h);
    if (voletsJour) fFen *= 0.7;
    if (cfg.calfeutrage) fInf *= 1 - ISOLATION.calfeutrage;
    if (cfg.boudin) fInf *= 1 - ISOLATION.boudin;
    // économies attribuées (W évités)
    attrib.calfeutrage += cfg.calfeutrage ? Uinf * ISOLATION.calfeutrage * dT : 0;
    attrib.boudin += cfg.boudin ? Uinf * (cfg.calfeutrage ? 1 - ISOLATION.calfeutrage : 1) * ISOLATION.boudin * dT : 0;
    if (cfg.rideauxFermes && cfg.rideauxTh) attrib.rideauxTh += Ufen * (ISOLATION.rideauThermique - ISOLATION.rideauSimple) * dT;
    if (cfg.voletsFermes) attrib.volets += Ufen * (cfg.rideauxFermes ? 1 - (cfg.rideauxTh ? 0.5 : 0.25) : 1) * ISOLATION.volets * dT;
    // aération
    let Uaer = 0;
    if (cfg.aeration === 'entrouverte' && id !== 'cuisine' && estJour(h)) Uaer = 12;
    if (cfg.aeration === 'breve' && (h === 8 || h === 20)) Uaer = 12;
    if (cfg.ventNuit && id !== 'cuisine' && (h >= 22 || h < 7) && te < r.t) Uaer += ETE.ventNocturne;
    const U = Uautre + Ufen * fFen + Uinf * fInf + Uaer;
    let x = -U * (r.t - te) + kPorte * (tMoy - r.t) * 1.5 + CHALEUR_FOND[id];
    if (!cfg.rideauxFermes) x += irr * P.fenetre * 0.6 * (FACTEUR_FENETRE[jm.chap] ?? 1) * (voletsJour ? 1 - ETE.voletsJour : 1);
    if (occ === id) x += P_CORPS * (cfg.invites && id === 'salon' && estJour(h) ? 3 : 1);
    if (cfg.chaleur && cfg.chaleur[id]) x += cfg.chaleur[id][h];
    if (cfg.passif) x += cfg.passif.W[id];
    if (id === 'cuisine' && h === 20 && cfg.recupCuisson && cfg.chaleur) { const r2 = cfg.chaleur.cuisine[19] * 0.6; x += r2; attrib.cuisson += r2; }
    q[id] = x;
    // humidité (indice en % à 18 °C)
    let src = 0, k = 0.03 * (0.4 + 0.6 * fInf);
    if (occ === id) src += estJour(h) ? 0.5 : 0.8;
    if (cfg.invites && id === 'salon' && estJour(h)) src += 1;
    if (id === 'cuisine' && (h === 12 || h === 19)) src += cfg.recupCuisson ? 5 : 4;
    if (cfg.sechageInterieur && id === 'salon' && estJour(h)) src += cfg.sechageInterieur === 'tirage' ? 0.8 : 1.6;
    if (Uaer > 0) k += cfg.aeration === 'breve' ? 0.45 : 0.12;
    r.hum += src - k * (r.hum - 40) + (cfg.portes === 'ouvertes' ? 0.08 * (hMoy - r.hum) : 0);
    if (cfg.passif) r.hum += cfg.passif.k[id] * (cfg.passif.idxIn - r.hum);
  }
  const besoin = (id, cons) => (cons - pieces[id].t) * PIECES[id].C - q[id];
  // poêle à bois (v1.3) : chauffe le salon jusqu'à sa cible, puissance limitée
  let poele = 0;
  if (cfg.poele) { poele = Math.min(cfg.poele.p, Math.max(0, besoin('salon', cfg.poele.cible))); q.salon += poele; }
  // radiateurs (chaudière gaz)
  const rad = {};
  if (cfg.robinets) {
    for (const id of ORDRE_PIECES) rad[id] = Math.min(PIECES[id].pMax * fact, Math.max(0, besoin(id, Math.max(T_HORS_GEL, cfg.consignes[id]))));
  } else {
    // un seul thermostat dans le salon : tous les radiateurs suivent
    const cons = Math.max(T_HORS_GEL, cfg.central);
    const frac = Math.min(1, Math.max(0, besoin('salon', cons) / (PIECES.salon.pMax * fact)));
    for (const id of ORDRE_PIECES) rad[id] = PIECES[id].pMax * fact * frac;
    for (const id of ORDRE_PIECES) { // hors-gel garanti par pièce
      const hg = besoin(id, T_HORS_GEL);
      if (hg > rad[id]) rad[id] = Math.min(PIECES[id].pMax * fact, hg);
    }
  }
  // appoint électrique dans la pièce occupée
  let appoint = 0;
  if (cfg.appoint) {
    const reste = besoin(occ, cfg.appoint) - rad[occ];
    appoint = Math.min(P_APPOINT, Math.max(0, reste));
  }
  // climatisation de la pièce occupée
  let climElec = 0, froid = 0;
  if (cfg.clim) {
    const b = besoin(occ, cfg.clim) - rad[occ];
    if (b < 0) { froid = Math.min(ETE.climFroid, -b); climElec = froid * ETE.climElec / ETE.climFroid; }
  }
  const chauffeRad = {};
  for (const id of ORDRE_PIECES) {
    const tot = q[id] + rad[id] + (id === occ ? appoint - froid : 0);
    pieces[id].t += tot / PIECES[id].C;
    chauffeRad[id] = rad[id] > 0 || (id === occ && appoint > 0);
  }
  // une isolation n'économise que si le chauffage tourne
  const chauffe = ORDRE_PIECES.some(id => chauffeRad[id]);
  if (!chauffe) for (const k of Object.keys(attrib)) attrib[k] = 0;
  return { rad, appoint, attrib, te, irr, climElec, poele };
}

export function humiditeRelative(piece) {
  return Math.max(25, Math.min(99, piece.hum + (18 - piece.t) * 2.5));
}

export function scoreConfort(ressenti, mini, maxi) {
  if (ressenti >= mini && ressenti <= maxi) return 100;
  if (ressenti < mini) { const d = mini - ressenti; return Math.max(0, d <= 2 ? 100 - 15 * d : 70 - 20 * (d - 2)); }
  return Math.max(0, 100 - 12 * (ressenti - maxi));
}
