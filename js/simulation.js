// Moteur de simulation : modèle thermique et hydrique unique, jauges, habitudes, linge, événements
import {
  PRIX, RENDEMENT_CHAUDIERE, FACTEUR_NON_PURGE, CHARGE_FOND_W, LESSIVE, JOURS, PIECES, ORDRE_PIECES,
  PART_FENETRE, PART_INFILTRATION, ISOLATION, ECHANGE_PORTE, P_APPOINT, PANNEAU_WC, pieceOccupee, estJour,
  VETEMENTS, SEUIL_ENCOMBREMENT, TEMPS_REPRISER, TEMPS_AERER_VET, ACHATS, TEMPS_JOUR, TEMPS_WEEKEND,
  JOURS_HABITUDE, GESTES, PRINCIPES, EVENEMENTS, ETE, TARIFS, TEMPO, ABONNEMENTS, PLAISIRS, CHAPITRES,
} from './data.js';
import { tExt, soleil, chapitreDuJour, FACTEUR_FENETRE } from './meteo.js';
import { systemesJour, voisinJour, tempsRoutines, prixElec } from './systemes.js';

const T_HORS_GEL = 8;
const P_CORPS = 90;
const CHALEUR_FOND = { salon: 80, chambre: 30, cuisine: 60 }; // W des appareils (frigo, box…)

// ---------------------------------------------------------------- outils
export const prixGaz = (s) => PRIX.gazKwh * s.prixGazMult;
export const estWeekend = (jour) => jour % 7 >= 5;
export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export function msg(s, texte, type = 'info') { s.messages.unshift({ jour: s.jour, texte, type }); if (s.messages.length > 150) s.messages.length = 150; }
export function debloquer(s, id) {
  if (s.principes.includes(id)) return;
  s.principes.push(id);
  msg(s, `💡 Principe découvert : « ${PRINCIPES[id].titre} ». ${PRINCIPES[id].texte}`, 'principe');
}
function payer(s, montant, poste) { s.argent -= montant; s.depenses[poste] += montant; }

// ---------------------------------------------------------------- temps
export function tempsBudget(s) { return estWeekend(s.jour) ? TEMPS_WEEKEND : TEMPS_JOUR; }
export function gestesActifs(s) {
  const chauds = vetementsPortes(s).filter(id => VETEMENTS[id].iso >= 1 && !VETEMENTS[id].assis).length;
  return {
    rideaux: s.rideaux === 'nuit',
    portes: s.portes === 'fermees',
    bouillotte: s.utiliserBouillotte && s.possede.bouillotte,
    couches: chauds >= 2,
    aerer: s.aeration === 'breve',
    cuisson: s.recupCuisson,
    couperEau: !!s.sys.douche.couperEau && !s.sys.douche.seau,
    recupEau: !!s.sys.douche.recupEau && s.possede.seau && !s.sys.douche.seau,
    couvercle: !!s.sys.couvercle,
    bouilloire: !!s.sys.bouilloire,
    frigo: !!s.sys.frigoGeste,
    multiprise: !!s.sys.multipriseGeste && s.possede.multiprise,
    liste: !!s.sys.liste,
    prixKilo: !!s.sys.prixKiloGeste,
    voletsJour: !!s.voletsJour,
    ventNuit: !!s.ventNuit,
    jardiner: s.possede.potager && s.sys.potagerDepuis !== null && chapitreDuJour(s.jour).id !== 'hiver',
  };
}
export function tempsGestes(s) {
  let t = 0;
  for (const [g, on] of Object.entries(gestesActifs(s))) if (on) t += GESTES[g].temps * (s.gestes[g].habitude ? 0.5 : 1);
  return t;
}
export function tempsLibre(s) { return tempsBudget(s) - tempsGestes(s) - tempsRoutines(s) - s.tempsUtilise; }
export function prendreTemps(s, h) {
  if (tempsLibre(s) + 1e-9 < h) { msg(s, `⏳ Pas assez de temps libre aujourd'hui (il faut ${fmtH(h)}).`, 'alerte'); return false; }
  s.tempsUtilise += h;
  if (s.tempsUtilise >= 2) debloquer(s, 'temps');
  return true;
}
export const fmtH = (h) => h >= 1 ? `${Math.floor(h)} h${Math.round((h % 1) * 60) ? String(Math.round((h % 1) * 60)).padStart(2, '0') : ''}` : `${Math.round(h * 60)} min`;

// ---------------------------------------------------------------- vêtements
export function vetementsPortes(s) {
  return Object.entries(s.vetements).filter(([, v]) => v.possede && v.porte).map(([id]) => id);
}
function isoVetement(s, id) {
  const v = s.vetements[id];
  let x = VETEMENTS[id].iso;
  if (v.salete >= 100) x *= 0.5; else if (v.salete >= 70) x *= 0.8;
  x *= 1 - 0.5 * v.usure / 100;     // l'usure tasse les fibres
  return x;
}
export function isolationVetements(s, piece = 'salon') {
  let iso = 0;
  for (const id of vetementsPortes(s)) {
    if (VETEMENTS[id].assis && piece !== 'salon') continue;
    iso += isoVetement(s, id);
  }
  return iso;
}
export function encombrement(s) {
  return vetementsPortes(s).reduce((a, id) => a + (VETEMENTS[id].assis ? 0 : VETEMENTS[id].enc), 0);
}
export function coutParUsage(s, id) {
  const v = s.vetements[id];
  return v.joursPortes > 0 ? v.prixPaye / v.joursPortes : null;
}
export function acheterVetement(s, id, qualite = 'eco', prixForce = null) {
  const V = VETEMENTS[id], e = s.vetements[id];
  const offre = V[qualite];
  if (!offre || e.possede) return false;
  const prix = prixForce ?? offre.prix;
  if (s.argent < prix) return false;
  Object.assign(e, { possede: true, qualite, porte: true, salete: 0, usure: 0, joursPortes: 0, reprises: 0, prixPaye: prix });
  payer(s, prix, 'vetements');
  msg(s, `🛒 ${V.nom}${qualite === 'durable' ? ` ${offre.label} (durable)` : ' premier prix'} : −${eur(prix)}.`, 'achat');
  if (qualite === 'durable') debloquer(s, 'coutUsage');
  if (V.protege) debloquer(s, 'volume');
  return true;
}
export function aererVetement(s, id) {
  const V = VETEMENTS[id], v = s.vetements[id];
  if (!v.possede || V.peau || v.aere || v.salete >= 70 || v.salete <= 0) return false;
  if (!prendreTemps(s, TEMPS_AERER_VET)) return false;
  v.salete = Math.max(0, v.salete - 25); v.aere = true; s.aerationsVet++;
  debloquer(s, 'aererVet');
  return true;
}
// Laver à la main une pièce en contact avec la peau (sous-couche, chaussettes, t-shirt) : 8 l d'eau tiède
export const LAVAGE_MAIN = { litres: 8, kwh: 0.25, temps: 0.15, volonte: 1 };
export function laverMain(s, id) {
  const V = VETEMENTS[id], v = s.vetements[id];
  if (!v.possede || !V.peau || v.salete < 20) return false;
  if (!prendreTemps(s, LAVAGE_MAIN.temps)) return false;
  const cout = LAVAGE_MAIN.litres / 1000 * PRIX.eauM3 + LAVAGE_MAIN.kwh * PRIX.elecKwh + 0.03;
  payer(s, LAVAGE_MAIN.litres / 1000 * PRIX.eauM3, 'eau'); payer(s, LAVAGE_MAIN.kwh * PRIX.elecKwh + 0.03, 'elec');
  s.depenses.linge += cout; s.volonte -= LAVAGE_MAIN.volonte;
  v.salete = 0; v.usure += 0.5;
  debloquer(s, 'volume');
  return true;
}
export function repriser(s, id) {
  const v = s.vetements[id];
  if (!s.possede.couture || !v.possede || v.usure < 30 || v.reprises >= 2) return false;
  if (!prendreTemps(s, TEMPS_REPRISER)) return false;
  v.usure = Math.max(0, v.usure - 30); v.reprises++; s.reprises++;
  msg(s, `🪡 ${VETEMENTS[id].nom} reprisé : comme neuf ou presque.`, 'info');
  debloquer(s, 'reparer');
  return true;
}

// ---------------------------------------------------------------- achats
export function acheter(s, id, occasion = false) {
  const a = ACHATS[id];
  const prix = occasion && a.occasion ? a.occasion : a.prix;
  if (s.possede[id] || s.argent < prix) return false;
  if (id === 'housse' && !s.possede.bouillotte) return false;
  const tps = a.temps + (occasion ? 1 : 0);
  if (!prendreTemps(s, tps)) return false;
  s.possede[id] = true;
  s.prixPayes = s.prixPayes || {}; s.prixPayes[id] = prix;
  payer(s, prix, 'equipement');
  msg(s, `🛒 ${a.nom}${occasion ? ' d\'occasion' : ''} : −${eur(prix)}${tps ? ` et ${fmtH(tps)}${occasion ? ' (annonce, rendez-vous)' : ' d\'installation'}` : ''}.`, 'achat');
  if (occasion) debloquer(s, 'occasion');
  if (id === 'potager') s.sys.potagerDepuis = s.jour;
  if (id === 'composteur' || id === 'cuve') debloquer(s, 'cycles');
  if (id === 'jaquette') debloquer(s, 'prolonger');
  if (id === 'thermometre') {
    debloquer(s, 'mesure');
    const d = s.dernierJour;
    if (d) {
      const pire = ORDRE_PIECES.reduce((a, b) => (d.eur[a] > d.eur[b] ? a : b));
      msg(s, `🌡️ Première mesure : c'est le ${PIECES[pire].nom.toLowerCase()} qui coûte le plus (${eur(d.eur[pire])} hier).`, 'decouverte');
    }
  }
  if (id === 'hygrometre') { debloquer(s, 'mesure'); debloquer(s, 'humidite'); }
  if (id === 'wattmetre') debloquer(s, 'mesure');
  if (id === 'calfeutrage' || id === 'boudin') debloquer(s, 'calfeutrer');
  if (id === 'rideauxTh' || id === 'housse') debloquer(s, 'prolonger');
  if (id === 'purge') debloquer(s, 'purge');
  if (id === 'robinets') debloquer(s, 'zones');
  if (id === 'solaire') { debloquer(s, 'rentabilite'); s.solaireDepuis = s.jour; }
  if (id === 'appoint') debloquer(s, 'local');
  return true;
}

// ---------------------------------------------------------------- lessive
export function coutLessive(s, opts) {
  if (opts.laverie || s.machine.enPanne) return PRIX.laverieLavage + PRIX.laverieSechage;
  const kwh = LESSIVE.kwh[opts.temp] + (opts.sechage === 'machine' ? LESSIVE.secheLingeKwh : 0);
  return kwh * PRIX.elecKwh + LESSIVE.litres / 1000 * PRIX.eauM3 + PRIX.doseLessive;
}
export function linge(s) {
  return Object.entries(s.vetements).filter(([, v]) => v.possede && v.salete >= 25).map(([id]) => id);
}
export function remplissage(s) {
  return linge(s).reduce((a, id) => a + VETEMENTS[id].poids, 0) / LESSIVE.capacite;
}
export function tempsLessive(s, opts) {
  if (opts.laverie || s.machine.enPanne) return 1.5;
  return LESSIVE.temps + (opts.sechage === 'air' ? LESSIVE.tempsEtendage : 0);
}
export function planifierLessive(s, opts) {
  if (s.lessivePrevue) { s.tempsUtilise -= s.lessivePrevue.temps; s.lessivePrevue = null; return true; }
  if (!linge(s).length) { msg(s, '🧺 Rien de sale à laver.', 'info'); return false; }
  const o = { temp: 30, sechage: 'air', midi: false, laverie: false, ...opts };
  if (s.machine.enPanne) o.laverie = true;
  const t = tempsLessive(s, o);
  if (!prendreTemps(s, t)) return false;
  s.lessivePrevue = { ...o, temps: t };
  return true;
}
export function reparerMachine(s, mode) {
  if (!s.machine.enPanne) return false;
  if (mode === 'technicien') {
    if (s.argent < PRIX.reparationTechnicien) return false;
    payer(s, PRIX.reparationTechnicien, 'imprevus');
    msg(s, `🔧 Le technicien répare le lave-linge : −${eur(PRIX.reparationTechnicien)}.`, 'info');
  } else {
    if (s.argent < PRIX.reparationPiece || !prendreTemps(s, 2)) return false;
    payer(s, PRIX.reparationPiece, 'imprevus');
    msg(s, `🔧 Tu changes toi-même la pompe (tuto vidéo, 2 h) : −${eur(PRIX.reparationPiece)}.`, 'info');
    debloquer(s, 'reparer');
  }
  s.machine.enPanne = false; s.machine.usure = 15;
  return true;
}

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
    if (id === 'cuisine' && h === 20 && cfg.recupCuisson && cfg.chaleur) { const r2 = cfg.chaleur.cuisine[19] * 0.6; x += r2; attrib.cuisson += r2; }
    q[id] = x;
    // humidité (indice en % à 18 °C)
    let src = 0, k = 0.03 * (0.4 + 0.6 * fInf);
    if (occ === id) src += estJour(h) ? 0.5 : 0.8;
    if (cfg.invites && id === 'salon' && estJour(h)) src += 1;
    if (id === 'cuisine' && (h === 12 || h === 19)) src += cfg.recupCuisson ? 5 : 4;
    if (cfg.sechageInterieur && id === 'salon' && estJour(h)) src += 1.6;
    if (Uaer > 0) k += cfg.aeration === 'breve' ? 0.45 : 0.12;
    r.hum += src - k * (r.hum - 40) + (cfg.portes === 'ouvertes' ? 0.08 * (hMoy - r.hum) : 0);
  }
  // radiateurs (chaudière gaz)
  const rad = {};
  const besoin = (id, cons) => (cons - pieces[id].t) * PIECES[id].C - q[id];
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
  return { rad, appoint, attrib, te, irr, climElec };
}

export function humiditeRelative(piece) {
  return Math.max(25, Math.min(99, piece.hum + (18 - piece.t) * 2.5));
}

function scoreConfort(ressenti, mini, maxi) {
  if (ressenti >= mini && ressenti <= maxi) return 100;
  if (ressenti < mini) { const d = mini - ressenti; return Math.max(0, d <= 2 ? 100 - 15 * d : 70 - 20 * (d - 2)); }
  return Math.max(0, 100 - 12 * (ressenti - maxi));
}

// ---------------------------------------------------------------- journée
export function jourSuivant(s) {
  if (s.fini || s.dilemme) return;
  const jm = s.meteo[s.jour];
  const chap = chapitreDuJour(s.jour);
  const hiver = chap.id === 'hiver', ete = chap.id === 'ete';
  const jour = { jour: s.jour, heures: [], kwhRad: { salon: 0, chambre: 0, cuisine: 0 }, eur: { salon: 0, chambre: 0, cuisine: 0 }, appointKwh: 0, elecKwh: 0, elecEur: 0, solaire: 0, climKwh: 0, tempo: jm.tempo };

  // --- moral et rechute ---
  let rechute = false;
  if (s.volonte <= 0) {
    rechute = true; s.rechutes++;
    payer(s, 25, 'imprevus'); s.volonte = 30; s.bienetre = Math.min(100, s.bienetre + 4);
    msg(s, '😩 Plus de moral : rechute ! Livraison de repas (−25 €), fenêtre entrouverte et aucun nouveau geste aujourd\'hui.', 'alerte');
  }
  const actifs = gestesActifs(s);
  const faits = {};
  for (const [g, on] of Object.entries(actifs)) faits[g] = on && (!rechute || s.gestes[g].habitude);
  let coutVolonte = 0;
  for (const [g, fait] of Object.entries(faits)) {
    if (!fait) continue;
    const st = s.gestes[g];
    if (st.habitude) continue;
    coutVolonte += GESTES[g].cout; st.pratique++;
    if (st.pratique >= JOURS_HABITUDE) { st.habitude = true; msg(s, `✅ « ${GESTES[g].nom} » est devenu une habitude : plus d'effort, moitié moins de temps.`, 'habitude'); debloquer(s, 'habitude'); }
  }

  // --- contexte des systèmes (eau chaude, cuisine, électricité, jardin, budget) ---
  const vide = () => new Array(24).fill(0);
  const ctx = {
    jm, chap, faits, elecH: vide(), chaleur: { salon: vide(), chambre: vide(), cuisine: vide() },
    couts: { nourriture: 0, eau: 0, services: 0, plaisirs: 0 }, kwh: {},
    d: { sante: 0, hygiene: 0, bienetre: 0, confort: 0 }, tCuisine: s.pieces.cuisine.t,
    msg: (t, ty) => msg(s, t, ty), debloquer: (id) => debloquer(s, id),
  };
  systemesJour(s, ctx);

  // --- lessive du jour ---
  const L = s.lessivePrevue;
  let sechageInterieur = false;
  if (L) {
    const sale = linge(s);
    const rempli = remplissage(s);
    s.lessives++; s.sommeRemplissage += Math.min(1, rempli);
    if (L.laverie) {
      payer(s, PRIX.laverieLavage + PRIX.laverieSechage, 'laverie');
      s.depenses.linge += PRIX.laverieLavage + PRIX.laverieSechage;
      msg(s, `🧺 Laverie : ${eur(PRIX.laverieLavage + PRIX.laverieSechage)} et 1 h 30.`, 'info');
    } else {
      const dehors = L.sechage === 'dehors' && s.possede.corde && !hiver;
      const kwh = LESSIVE.kwh[L.temp] + (L.sechage === 'machine' ? LESSIVE.secheLingeKwh : 0);
      const heures = L.hc ? [22, 23, 0] : L.midi ? [12, 13, 14] : [19, 20, 21];
      let reste = kwh * 1000; for (const h of heures) { const x = Math.min(2200, reste); ctx.elecH[h] += x; reste -= x; }
      ctx.kwh.lessive = kwh;
      ctx.couts.eau += LESSIVE.litres / 1000 * PRIX.eauM3;
      payer(s, PRIX.doseLessive, 'produits');
      s.depenses.linge += PRIX.doseLessive + LESSIVE.litres / 1000 * PRIX.eauM3 + kwh * PRIX.elecKwh;
      s.machine.usure += LESSIVE.usureMachine * (L.temp === 60 ? 1.3 : 1);
      sechageInterieur = L.sechage === 'air' || (L.sechage === 'dehors' && !dehors);
      if (L.temp <= 30 && rempli >= 0.75) debloquer(s, 'volume');
      if ((L.midi && s.possede.solaire) || L.hc) debloquer(s, 'decaler');
    }
    for (const id of sale) {
      const v = s.vetements[id];
      v.salete = 0;
      v.usure += L.laverie ? 3 : LESSIVE.usureVet[L.temp] + (L.sechage === 'machine' ? LESSIVE.usureSecheLinge : 0);
    }
    if (rempli < 0.5) msg(s, `🧺 Machine remplie à ${Math.round(rempli * 100)} % seulement : même coût pour moitié moins de linge.`, 'alerte');
    s.volonte -= LESSIVE.volonte;
    s.lessivePrevue = null;
    if (!L.laverie && s.machine.usure >= 100) { s.machine.enPanne = true; msg(s, '💥 Le lave-linge est en panne ! Laverie ou réparation (onglet Linge).', 'alerte'); }
  }

  // --- simulation horaire ---
  const aeration = rechute ? 'entrouverte' : s.aeration === 'breve' && !faits.aerer ? 'entrouverte' : s.aeration;
  const portes = faits.portes ? 'fermees' : 'ouvertes';
  const encomb = encombrement(s);
  const invites = s.invites && s.jour < s.invites.jusqua;
  let sommeC = 0, nC = 0, froid = 0, chaud = 0, gazKwh = 0, gazBase = 0, climBase = 0, humMax = 0, sommeil = 0, nS = 0;
  const attrJour = { calfeutrage: 0, boudin: 0, rideauxTh: 0, volets: 0, cuisson: 0 };
  const draft = hiver ? (s.possede.calfeutrage ? (s.possede.boudin ? 0 : 0.4) : (s.possede.boudin ? 0.7 : 1)) : 0;
  const lit = hiver ? 3 : chap.id === 'printemps' ? 2 : 0;
  const ventilo = s.possede.ventilateur && s.ventilateur;
  const clim = s.possede.clim && s.climActive ? s.climConsigne : null;
  let elecEur = 0, elecKwh = 0;
  for (let k = 0; k < 24; k++) {
    const h = (7 + k) % 24;
    const jr = estJour(h);
    const rideauxFermes = s.rideaux === 'fermes' || (faits.rideaux && !jr);
    const consignes = {};
    for (const p of ORDRE_PIECES) consignes[p] = jr ? s.pieces[p].consigneJour : s.pieces[p].consigneNuit;
    let central = jr ? s.central.consigneJour : s.central.consigneNuit;
    if (invites && s.invites.mode === 'chauffer' && jr) { consignes.salon = Math.max(consignes.salon, 21); central = Math.max(central, 21); }
    const cfg = {
      portes, rideauxFermes, voletsFermes: faits.rideaux && !jr, rideauxTh: s.possede.rideauxTh,
      calfeutrage: s.possede.calfeutrage, boudin: s.possede.boudin, robinets: s.possede.robinets, purge: s.possede.purge,
      consignes, central, appoint: s.possede.appoint && s.appoint.actif ? s.appoint.consigne : null,
      aeration, recupCuisson: faits.cuisson, sechageInterieur, invites, chaleur: ctx.chaleur,
      voletsJour: faits.voletsJour, ventNuit: faits.ventNuit, clim,
    };
    const r = pasHoraire(s.pieces, cfg, jm, h);
    for (const p of ORDRE_PIECES) {
      jour.kwhRad[p] += r.rad[p] / 1000;
      const e = r.rad[p] / 1000 / RENDEMENT_CHAUDIERE * prixGaz(s);
      jour.eur[p] += e; s.pieces[p].kwhSemaine += r.rad[p] / 1000; s.pieces[p].eurSemaine += e;
      gazKwh += r.rad[p] / 1000 / RENDEMENT_CHAUDIERE;
    }
    const occ = pieceOccupee(h);
    for (const a of Object.keys(attrJour)) attrJour[a] += r.attrib[a] / 1000;

    // électricité de l'heure : systèmes + appoint + clim + ventilateur + bouillotte, moins le solaire autoconsommé
    let demande = ctx.elecH[h] + r.appoint + r.climElec + (ventilo && (ete || jm.canicule) ? ETE.ventilateur : 0) + (faits.bouillotte && h === 22 ? 120 : 0);
    let auto = 0;
    if (s.possede.solaire) {
      const prod = PANNEAU_WC * r.irr / 1000 * 1.35 * 0.9;
      auto = Math.min(prod, demande);
      s.solaire.prod += prod / 1000; s.solaire.auto += auto / 1000; jour.solaire += auto / 1000;
      s.attribution.solaire += auto / 1000 * prixElec(s, h, jm.tempo);
    }
    const prix = prixElec(s, h, jm.tempo);
    elecEur += (demande - auto) / 1000 * prix; elecKwh += (demande - auto) / 1000;
    jour.eur[occ] += r.appoint / 1000 * prix;
    jour.appointKwh += r.appoint / 1000; jour.climKwh += r.climElec / 1000;
    s.depenses.climEur = (s.depenses.climEur || 0) + r.climElec / 1000 * prix;
    s.depenses.appointEur = (s.depenses.appointEur || 0) + r.appoint / 1000 * prix;

    // le voisin : 21 °C partout, clim à 25 °C l'été, portes et rideaux ouverts, aère brièvement
    const rb = pasHoraire(s.base.pieces, { portes: 'ouvertes', rideauxFermes: false, voletsFermes: false, robinets: true, purge: true,
      consignes: { salon: 21, chambre: 21, cuisine: 21 }, aeration: 'breve', chaleur: s.base.chaleur, clim: ete ? 25 : null }, jm, h);
    gazBase += (rb.rad.salon + rb.rad.chambre + rb.rad.cuisine) / 1000 / RENDEMENT_CHAUDIERE;
    climBase += rb.climElec / 1000;

    // ressenti et confort
    const P = s.pieces[occ];
    const hr = humiditeRelative(P);
    humMax = Math.max(humMax, hr);
    const pHum = hr > 65 ? Math.min(1.5, (hr - 65) / 10) : 0;
    const vent = ventilo && (ete || jm.canicule || P.t > 25) ? 2.5 : 0;
    let ressenti, sc;
    if (!jr) {
      let bonusLit = lit;
      if (faits.bouillotte && hiver) { const n = (h + 1) % 24; bonusLit += s.possede.housse ? 3 : (n < 3 ? 3.5 : 0.5); }
      ressenti = P.t + bonusLit - pHum - vent;
      sc = scoreConfort(ressenti, 18, 24.5);
      sommeil += sc; nS++;
    } else {
      ressenti = P.t + isolationVetements(s, occ) - draft - pHum - vent;
      if (P.t < 17) ressenti -= (17 - P.t) * 0.8;
      if (jm.nuage < 0.3 && occ === 'salon' && !rideauxFermes && !(faits.voletsJour) && h >= 10 && h <= 15) ressenti += hiver ? 1 : 0.5;
      const haut = ete ? 26.5 : 24.5;
      sc = occ === 'cuisine' ? scoreConfort(ressenti, 18.5, haut - 1) : scoreConfort(ressenti, 21, haut);
      if (encomb > SEUIL_ENCOMBREMENT) sc -= 8 * (encomb - SEUIL_ENCOMBREMENT) * (occ === 'cuisine' ? 2 : 1);
      if (invites && s.invites.mode === 'pull' && occ === 'salon') sc -= 10;
    }
    sc = Math.max(0, sc);
    sommeC += sc; nC++;
    if (ressenti < 16) froid += 16 - ressenti;
    if (ressenti > 29) chaud += ressenti - 29;
    jour.heures.push({ h, te: r.te, t: { salon: s.pieces.salon.t, chambre: s.pieces.chambre.t, cuisine: s.pieces.cuisine.t }, ressenti, hr, prix });
  }

  // --- factures du jour ---
  payer(s, gazKwh * prixGaz(s), 'gaz');
  payer(s, elecEur, 'elec');
  payer(s, ctx.couts.eau, 'eau');
  payer(s, ctx.couts.nourriture, 'nourriture');
  payer(s, ctx.couts.services, 'services');
  payer(s, ctx.couts.plaisirs, 'plaisirs');
  const aboJour = (TARIFS[s.sys.tarif].aboMois * 12 + PRIX.aboGazAn) / 365;
  payer(s, aboJour, 'abonnements');
  s.depenses.eauChaudeEur = (s.depenses.eauChaudeEur || 0) + (ctx.kwh.ballon || 0) * (elecKwh > 0 ? elecEur / elecKwh : PRIX.elecKwh);
  const coutJour = gazKwh * prixGaz(s) + elecEur + aboJour + ctx.couts.eau;
  s.factureSemaine += coutJour;
  jour.elecKwh = elecKwh; jour.elecEur = elecEur;
  const eurGazUtile = prixGaz(s) / RENDEMENT_CHAUDIERE;
  for (const a of Object.keys(attrJour)) s.attribution[a] += attrJour[a] * eurGazUtile;
  if (s.possede.purge) s.attribution.purge += gazKwh * prixGaz(s) * 0.08;
  else if (gazKwh > 0) { const surcout = gazKwh * prixGaz(s) * 0.08; payer(s, surcout, 'gaz'); s.factureSemaine += surcout; }
  if (jm.tempo === 'rouge' && s.sys.tarif === 'tempo') {
    const hpRouge = jour.heures.filter(x => x.prix > 0.5).length;
    if (hpRouge) debloquer(s, 'tempo');
  }

  // --- voisin ---
  const vz = voisinJour(s, jm, chap);
  s.base.gaz += gazBase * prixGaz(s);
  s.base.elec += vz.elec + climBase * PRIX.elecKwh;
  s.base.clim = (s.base.clim || 0) + climBase * PRIX.elecKwh;
  s.base.eauChaude = (s.base.eauChaude || 0) + vz.eauChaude;
  s.base.eau += vz.eau;
  s.base.nourriture = (s.base.nourriture || 0) + vz.nourriture;
  s.base.services = (s.base.services || 0) + vz.services;
  s.base.plaisirs = (s.base.plaisirs || 0) + vz.plaisirs;
  s.base.abonnements += aboJour;
  if (s.jour % 3 === 2) {
    const l = (LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh + LESSIVE.litres / 1000 * PRIX.eauM3 + PRIX.doseLessive;
    s.base.elec += (LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh;
    s.base.eau += LESSIVE.litres / 1000 * PRIX.eauM3; s.base.produits += PRIX.doseLessive;
    s.base.linge = (s.base.linge || 0) + l;
  }

  // --- vêtements ---
  let sale = false, devenuSale = false;
  const protege = vetementsPortes(s).some(id => VETEMENTS[id].protege);
  for (const id of vetementsPortes(s)) {
    const V = VETEMENTS[id], v = s.vetements[id];
    const avant = v.salete;
    v.salete = Math.min(130, v.salete + V.sal * (protege && !V.peau ? 0.4 : 1) * (ete ? 1.4 : 1));
    if (avant < 100 && v.salete >= 100) devenuSale = true;
    v.usure += V[v.qualite].usure; v.joursPortes++;
    if (v.salete >= 100) sale = true;
  }
  for (const [id, v] of Object.entries(s.vetements)) {
    v.aere = false;
    if (v.possede && v.usure >= 100) {
      const V = VETEMENTS[id];
      msg(s, `🧵 ${V.nom} usé jusqu'à la corde (coût par usage : ${eur(v.joursPortes ? v.prixPaye / v.joursPortes : 0)}/jour).`, 'alerte');
      if (V.depart) { Object.assign(v, { usure: 0, salete: 0, joursPortes: 0, prixPaye: 5 }); payer(s, 5, 'vetements'); msg(s, 'Nouveau t-shirt : −5 €.', 'achat'); }
      else { v.possede = false; v.porte = false; }
    }
  }
  if (sale) debloquer(s, 'sale');
  if (devenuSale) msg(s, '🧺 Des vêtements sont sales : ils isolent moins, l\'hygiène et la santé en pâtissent.', 'alerte');

  // --- humidité, moisissures ---
  if (humMax > 75) {
    s.moisissure++;
    if (s.moisissure === 3) msg(s, s.possede.hygrometre ? `💧 Humidité à ${Math.round(humMax)} % : moisissures en vue. Aère brièvement !` : '💧 De la buée ruisselle sur les vitres et une odeur de moisi apparaît…', 'alerte');
  } else s.moisissure = Math.max(0, s.moisissure - 1);
  if (s.aeration === 'breve' && faits.aerer) debloquer(s, 'aeration');

  // --- jauges ---
  const confortJour = Math.max(0, sommeC / nC + ctx.d.confort);
  s.confort = s.confort * 0.6 + confortJour * 0.4;
  // hygiène : corps (douche), vêtements, cuisine, moisissures
  let dHyg = ctx.d.hygiene;
  if (sale) dHyg -= 3.5;
  if (s.moisissure >= 3) dHyg -= 1.5;
  s.hygiene = Math.max(0, Math.min(100, s.hygiene + dHyg));
  // bien-être : plaisirs, repos, alimentation, social, lumière, sommeil
  const libre = Math.max(0, tempsLibre(s));
  const sommeilScore = nS ? sommeil / nS : 70;
  let dBE = ctx.d.bienetre + Math.min(1.5, libre * 0.3) - 2.5;
  if (sommeilScore < 60) dBE -= 1.5; else if (sommeilScore > 85) dBE += 0.5;
  if (s.rideaux === 'fermes') dBE -= 1;                 // vivre dans le noir
  if (s.hygiene < 30) dBE -= 1.5;                       // gêne sociale
  if (invites) dBE += s.invites.mode === 'pull' ? -1 : 2;
  if (faits.ventNuit && !s.possede.moustiquaire) dBE -= 1; // moustiques
  s.bienetre = Math.max(0, Math.min(100, s.bienetre + dBE - 0.08 * (s.bienetre - 55)));
  // santé
  let dSante = froid > 0 ? -0.3 * froid : 1.0;
  dSante -= Math.min(4, 0.05 * chaud);
  if (sale) dSante -= 1;
  if (s.moisissure >= 3) dSante -= 1;
  if (s.hygiene < 35) dSante -= 0.8;
  if (s.bienetre < 25) dSante -= 0.4;
  dSante += ctx.d.sante;
  s.sante = Math.max(0, Math.min(100, s.sante + dSante));
  if (s.sante < 35 && !s.malade) {
    s.malade = true; payer(s, 25, 'imprevus'); s.volonte -= 15;
    msg(s, '🤧 Tu tombes malade : médecin et pharmacie (−25 € restant à charge) et moral en berne.', 'alerte');
  } else if (s.sante > 55) s.malade = false;
  // moral (volonté) : nourri par le bien-être, usé par les nouveaux gestes
  s.volonte = Math.max(0, Math.min(100, s.volonte + 0.5 + (confortJour - 75) / 20 + (s.bienetre - 55) / 20 - coutVolonte));
  if (globalThis.TRACE) globalThis.TRACE(s, { froid, chaud, confortJour, sommeilScore, dSante });
  const sm = s.sommes;
  sm.confort += confortJour; sm.sante += s.sante; sm.volonte += s.volonte; sm.hygiene += s.hygiene; sm.bienetre += s.bienetre;

  // --- découvertes ---
  const ref = s.possede.robinets ? s.pieces.salon : s.central;
  if (hiver) {
    if (ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'ecart');
    if (s.jour >= 3 && ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'masse');
    if (isolationVetements(s) >= 2.5 && ref.consigneJour <= 19 && confortJour > 70) debloquer(s, 'gens');
    if (faits.portes && s.possede.robinets && Math.min(s.pieces.cuisine.consigneJour, s.pieces.chambre.consigneJour) <= 16) debloquer(s, 'zones');
    if (faits.rideaux) debloquer(s, 'rideau');
    if (jm.nuage < 0.3 && s.rideaux !== 'fermes') debloquer(s, 'soleil');
    if (faits.bouillotte && (s.possede.robinets ? s.pieces.chambre.consigneNuit : s.central.consigneNuit) <= 16) debloquer(s, 'lit');
    if (s.possede.housse && faits.bouillotte) debloquer(s, 'prolonger');
  }
  if (ete && (faits.voletsJour || faits.ventNuit)) debloquer(s, 'inverse');
  if (ete && faits.ventNuit && faits.voletsJour) debloquer(s, 'fraicheur');
  if (jour.climKwh > 0) debloquer(s, 'clim');
  if (s.moisissure >= 3) debloquer(s, 'humidite');
  if (faits.couvercle || s.possede.autocuiseur || s.possede.marmite) debloquer(s, 'pression');
  if (faits.liste || (s.sys.regime === 'batch' && s.possede.boites)) debloquer(s, 'gaspillage');
  if (faits.prixKilo) debloquer(s, 'prixKilo');
  if (faits.multiprise && s.possede.wattmetre) debloquer(s, 'veilles');
  if (s.possede.led && s.possede.wattmetre) debloquer(s, 'lumiere');
  if (faits.frigo && s.sys.frigo.reglage >= 4) debloquer(s, 'frigo');
  if (s.sys.plaisirs > 0 && s.sys.plaisirs <= 20 && s.jour > 20 && s.volonte > 50) debloquer(s, 'plaisir');

  // --- bilan ---
  jour.confort = confortJour; jour.rechute = rechute; jour.cout = coutJour; jour.gazKwh = gazKwh; jour.kwh = ctx.kwh; jour.gaspillage = ctx.gaspillage; jour.litres = ctx.litres;
  s.dernierJour = jour;
  s.historique.push({ jour: s.jour, cout: coutJour, confort: confortJour });
  if (s.historique.length > 140) s.historique.shift();
  s.sommeConfort += confortJour; s.nbJours++;
  s.tempsUtilise = 0;
  s.jour++;
  if (s.jour % 7 === 0) {
    s.factures.push({ semaine: s.jour / 7, montant: s.factureSemaine, parPiece: Object.fromEntries(ORDRE_PIECES.map(p => [p, s.pieces[p].eurSemaine])) });
    msg(s, `📄 Facture de la semaine ${s.jour / 7} (gaz, électricité, eau, abonnements) : ${eur(s.factureSemaine)}.`, 'facture');
    s.factureSemaine = 0;
    for (const p of ORDRE_PIECES) { s.pieces[p].kwhSemaine = 0; s.pieces[p].eurSemaine = 0; }
  }
  if (s.invites && s.jour >= s.invites.jusqua) s.invites = null;
  if (s.jour >= JOURS) { s.fini = true; return; }
  verifierEvenements(s);
}

// ---------------------------------------------------------------- événements
export function evenementsAVenir(s) {
  return EVENEMENTS.filter(e => e.jour >= s.jour && s.jour >= e.jour - e.annonce && !s.evenementsVus.includes(e.id));
}
function verifierEvenements(s) {
  const c = chapitreDuJour(s.jour);
  if (c.index === 0 && s.jour > 0 && !s.evenementsVus.includes('chap-' + c.id)) { s.dilemme = 'chap-' + c.id; return; }
  for (const e of EVENEMENTS) {
    if (e.annonce && s.jour === e.jour - e.annonce) msg(s, `📅 Annonce : ${e.titre}, dans ${e.annonce} jours. ${e.texte}`, 'annonce');
    if (s.jour === e.jour && !s.evenementsVus.includes(e.id)) {
      if (e.id === 'panne' && s.machine.enPanne) { s.evenementsVus.push(e.id); continue; }
      s.dilemme = e.id;
    }
  }
}
const TEXTES_CHAPITRE = {
  printemps: 'Deux mois ont passé. Les jours rallongent, il fait 10 à 14 °C dehors : le chauffage peut presque s\'arrêter, le soleil devient un allié et le jardin s\'éveille.',
  ete: 'Juillet. Le danger n\'est plus le froid mais la chaleur : volets fermés le jour, fenêtres ouvertes la nuit, cuisson dehors… tout s\'inverse. Pense à ranger les pulls !',
};
export function titreDilemme(s) {
  if (s.dilemme?.startsWith('chap-')) { const id = s.dilemme.slice(5); const c = CHAPITRES.find(x => x.id === id); return { titre: `Chapitre : ${c.nom} (${c.debut})`, texte: TEXTES_CHAPITRE[id] }; }
  return EVENEMENTS.find(x => x.id === s.dilemme) || { titre: '', texte: '' };
}
const refus = (s) => (s.sys.refusTentations >= 2 ? 'La règle des 48 h est devenue un réflexe : aucun effort.' : 'Un peu frustrant (−2 bien-être).');
export function choixDilemme(s) {
  if (s.dilemme?.startsWith('chap-')) return [{ id: 'ok', texte: 'Continuer', effet: 'Ta maison, tes équipements, tes habitudes et ton argent te suivent.' }];
  switch (s.dilemme) {
    case 'invites': return [
      { id: 'chauffer', texte: 'Chauffer le salon à 21 °C pendant deux jours', effet: 'Coûte du gaz, invités ravis.' },
      { id: 'preter', texte: 'Leur prêter plaid et bouillotte', effet: 'Gratuit et chaleureux. Il faut avoir un plaid ou une bouillotte.', possible: s.possede.bouillotte || s.vetements.plaid.possede },
      { id: 'pull', texte: '« Prenez un pull, on vit à 18 °C ici »', effet: 'Gratuit mais tendu (−10 moral, bien-être en baisse).' },
    ];
    case 'promo': return [
      { id: 'acheter', texte: 'Acheter la doudoune premier prix à 12,50 €', effet: 'Bonne affaire… si tu en avais besoin. Elle s\'usera vite.', possible: !s.vetements.doudoune.possede && s.argent >= 12.5 },
      { id: 'attendre', texte: 'Appliquer la règle des 48 h', effet: refus(s) },
    ];
    case 'livraison': return [
      { id: 'commander', texte: 'Commander (17 €)', effet: 'Un vrai plaisir ce soir (+3 bien-être).' },
      { id: 'restes', texte: 'Réchauffer les restes du batch', effet: 'Gratuit et bon. Il faut cuisiner en grandes quantités.', possible: s.sys.regime === 'batch' },
      { id: 'attendre', texte: 'Ignorer la notification', effet: refus(s) },
    ];
    case 'robot': return [
      { id: 'acheter', texte: 'Acheter le robot cuiseur (199 €)', effet: 'Il finira sans doute au grenier avec le robot pâtissier…' },
      { id: 'attendre', texte: 'Attendre 48 h', effet: refus(s) },
    ];
    case 'promoPerissable': return [
      { id: 'acheter', texte: 'Prendre le lot (12 €)', effet: 'Moins cher au kilo… si tu manges tout en 2 jours. Gaspillage +15 % pendant 5 jours.' },
      { id: 'congeler', texte: 'Prendre le lot et cuisiner en grande quantité', effet: 'Avec les boîtes et le batch, rien n\'est perdu (12 €, −6 € de courses).', possible: s.possede.boites && s.sys.regime === 'batch' },
      { id: 'passer', texte: 'Passer : ce n\'était pas sur la liste', effet: 'Aucun gaspillage.' },
    ];
    case 'canicule': return [{ id: 'ok', texte: 'Compris', effet: 'Volets, nuits ouvertes, ventilateur, cuisson dehors… ou clim.' }];
    case 'barbecue': return [
      { id: 'maison', texte: 'Apporter une salade et un pain maison (5 €, 1 h)', effet: '+6 bien-être, les voisins adorent.', possible: tempsLibre(s) >= 1 },
      { id: 'achat', texte: 'Acheter chips et boissons (15 €)', effet: '+6 bien-être.' },
      { id: 'decliner', texte: 'Décliner pour économiser', effet: '−4 bien-être.' },
    ];
    case 'hausse': return [{ id: 'ok', texte: 'Compris', effet: 'Chaque kWh de gaz coûte désormais 12 % de plus.' }];
    case 'panne': return [
      { id: 'technicien', texte: `Appeler un technicien (${eur(PRIX.reparationTechnicien)})`, effet: 'Réparé tout de suite.', possible: s.argent >= PRIX.reparationTechnicien },
      { id: 'diy', texte: `Réparer toi-même (pièce ${eur(PRIX.reparationPiece)} + 2 h)`, effet: 'Il faut 2 h de temps libre aujourd\'hui.', possible: tempsLibre(s) >= 2 && s.argent >= PRIX.reparationPiece },
      { id: 'laverie', texte: 'Laisser en panne et aller à la laverie', effet: `${eur(PRIX.laverieLavage + PRIX.laverieSechage)} et 1 h 30 par lessive. Tu pourras réparer plus tard.` },
    ];
    default: return [];
  }
}
function refuser(s) {
  if (s.sys.refusTentations < 2) s.bienetre = Math.max(0, s.bienetre - 2);
  s.sys.refusTentations++;
  if (s.sys.refusTentations >= 2) debloquer(s, 'regle48');
}
export function resoudreDilemme(s, choix) {
  const id = s.dilemme;
  if (!id) return;
  const opt = choixDilemme(s).find(o => o.id === choix);
  if (!opt || opt.possible === false) return false;
  if (id === 'invites') {
    s.invites = { mode: choix, jusqua: s.jour + 2 };
    if (choix === 'chauffer') s.volonte += 5;
    if (choix === 'preter') { s.volonte += 3; debloquer(s, 'lit'); }
    if (choix === 'pull') s.volonte -= 10;
  }
  if (id === 'promo') { if (choix === 'acheter') acheterVetement(s, 'doudoune', 'eco', 12.5); else refuser(s); }
  if (id === 'livraison') {
    if (choix === 'commander') { payer(s, 17, 'plaisirs'); s.bienetre = Math.min(100, s.bienetre + 3); }
    else if (choix === 'restes') { s.bienetre = Math.min(100, s.bienetre + 1); debloquer(s, 'gaspillage'); }
    else refuser(s);
  }
  if (id === 'robot') { if (choix === 'acheter') { payer(s, 199, 'imprevus'); s.bienetre = Math.min(100, s.bienetre + 2); msg(s, '🤖 Robot cuiseur acheté (−199 €). Il prend la poussière…', 'alerte'); } else refuser(s); }
  if (id === 'promoPerissable') {
    if (choix === 'acheter') { payer(s, 12, 'nourriture'); s.promoPerissable = s.jour + 5; }
    if (choix === 'congeler') { payer(s, 6, 'nourriture'); debloquer(s, 'gaspillage'); }
    if (choix === 'passer') debloquer(s, 'prixKilo');
  }
  if (id === 'barbecue') {
    if (choix === 'maison') { payer(s, 5, 'plaisirs'); s.tempsUtilise += 1; s.bienetre = Math.min(100, s.bienetre + 6); }
    if (choix === 'achat') { payer(s, 15, 'plaisirs'); s.bienetre = Math.min(100, s.bienetre + 6); }
    if (choix === 'decliner') s.bienetre = Math.max(0, s.bienetre - 4);
  }
  if (id === 'hausse') { s.prixGazMult = 1.12; msg(s, '📈 Le gaz passe à ' + prixGaz(s).toFixed(4).replace('.', ',') + ' €/kWh.', 'alerte'); }
  if (id === 'panne') {
    s.machine.enPanne = true;
    if (choix === 'technicien' || choix === 'diy') reparerMachine(s, choix);
    else msg(s, '🧺 Machine en panne : les lessives se feront à la laverie.', 'info');
  }
  s.volonte = Math.max(0, Math.min(100, s.volonte));
  s.evenementsVus.push(id);
  s.dilemme = null;
  return true;
}

// ---------------------------------------------------------------- score
export const eur = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export function capitalInvesti(s) {
  return Object.entries(ACHATS).filter(([k, a]) => a.invest && s.possede[k]).reduce((t, [k, a]) => t + (s.prixPayes?.[k] ?? a.prix), 0)
    + Object.values(s.vetements).filter(v => v.possede).reduce((t, v) => t + v.prixPaye, 0);
}
// Part des investissements « consommée » pendant la partie : prix / durée de vie (années), et usure des vêtements
export function amortissement(s) {
  const equip = Object.entries(ACHATS).filter(([k]) => s.possede[k]).reduce((t, [k, a]) => t + (s.prixPayes?.[k] ?? a.prix) / a.vie, 0);
  const vet = Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye * Math.min(1, v.usure / 100) : 0), 0)
    + (s.depenses.vetements - Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye : 0), 0));
  return { equip, vet };
}
const POSTES = ['gaz', 'elec', 'eau', 'produits', 'laverie', 'nourriture', 'services', 'plaisirs', 'imprevus'];
export function coutVariable(s) {
  const d = s.depenses;
  return POSTES.reduce((t, k) => t + (d[k] || 0), 0) + d.equipement + d.vetements - (d.reventes || 0);
}
export function coutBaseVariable(s) { const b = s.base; return b.gaz + b.elec + b.eau + b.produits + (b.nourriture || 0) + (b.services || 0) + (b.plaisirs || 0); }
export function moyennes(s) {
  const n = Math.max(1, s.nbJours), m = s.sommes;
  return { confort: m.confort / n, sante: m.sante / n, moral: m.volonte / n, hygiene: m.hygiene / n, bienetre: m.bienetre / n };
}

export function scoreFinal(s) {
  const d = s.depenses, b = s.base;
  const am = amortissement(s);
  const tresorerie = coutVariable(s);
  const cout = tresorerie - d.equipement - d.vetements + am.equip + am.vet;
  const base = coutBaseVariable(s);
  const economies = base - cout;
  const pct = base > 0 ? economies / base * 100 : 0;
  const moy = moyennes(s);
  const habitudes = Object.values(s.gestes).filter(g => g.habitude).length;
  const elecPlayer = d.elec - (d.climEur || 0) - (d.appointEur || 0) - (d.eauChaudeEur || 0);
  const elecBase = b.elec - (b.clim || 0) - (b.eauChaude || 0);
  const domaines = [
    { nom: 'Chauffage (gaz + appoint)', valeur: b.gaz - d.gaz - (d.appointEur || 0) },
    { nom: 'Rafraîchissement (clim)', valeur: (b.clim || 0) - (d.climEur || 0) },
    { nom: 'Eau chaude (ballon)', valeur: (b.eauChaude || 0) - (d.eauChaudeEur || 0) },
    { nom: 'Eau', valeur: b.eau - d.eau },
    { nom: 'Alimentation', valeur: (b.nourriture || 0) - d.nourriture },
    { nom: 'Autre électricité (veilles, éclairage, cuisson, linge, solaire)', valeur: elecBase - elecPlayer },
    { nom: 'Abonnements et services', valeur: (b.services || 0) - d.services },
    { nom: 'Plaisirs', valeur: (b.plaisirs || 0) - d.plaisirs },
    { nom: 'Linge (produits, laverie)', valeur: b.produits - d.produits - d.laverie },
    { nom: 'Équipements (part amortie)', valeur: -am.equip },
    { nom: 'Vêtements (part usée)', valeur: -am.vet },
    { nom: 'Imprévus (rechutes, maladie, pannes, achats impulsifs)', valeur: -d.imprevus },
    { nom: 'Reventes', valeur: d.reventes || 0 },
  ];
  const reste = economies - domaines.reduce((a, x) => a + x.valeur, 0);
  if (Math.abs(reste) >= 0.5) domaines.push({ nom: 'Autres (bouillotte, arrondis)', valeur: reste });
  const invest = Object.entries(ACHATS).filter(([k]) => s.possede[k] && s.attribution[k] !== undefined)
    .map(([k, a]) => ({ nom: a.nom, prix: a.prix, gain: s.attribution[k], rentable: s.attribution[k] >= a.prix, amorti: s.attribution[k] >= a.prix / a.vie }));
  if (s.attribution.cuisson > 0) invest.push({ nom: 'Récupérer la chaleur de la cuisson (geste)', prix: 0, gain: s.attribution.cuisson, rentable: true });
  const candidats = domaines.filter(x => x.valeur > 0 && !x.nom.startsWith('Autres') && !x.nom.startsWith('Reventes')).map(x => ({ nom: x.nom, gain: x.valeur }));
  const meilleure = candidats.reduce((a, c) => (c.gain > a.gain ? c : a), { nom: '—', gain: 0 });
  const TITRES = ['Dépensier', 'Malin', 'Optimiseur', 'Autonome', 'Maître de la sobriété'];
  let rang = pct < 8 ? 0 : pct < 18 ? 1 : pct < 28 ? 2 : pct < 40 ? 3 : 4;
  const notes = [];
  const equilibre = moy.confort >= 70 && moy.sante >= 70 && moy.hygiene >= 60 && moy.bienetre >= 55 && moy.moral >= 30;
  if (rang >= 3 && !equilibre) { rang = 2; notes.push('Autonome et Maître exigent en moyenne : confort ≥ 70, santé ≥ 70, hygiène ≥ 60, bien-être ≥ 55, moral ≥ 30.'); }
  if (rang === 4 && (s.principes.length < 28 || habitudes < 8)) { rang = 3; notes.push('Le titre suprême demande 28 principes et 8 habitudes.'); }
  if (rang >= 2 && (moy.hygiene < 45 || moy.bienetre < 40 || s.rechutes > 4)) { rang = 1; notes.push('Économies payées par ton hygiène, ton bien-être ou tes rechutes.'); }
  if (moy.sante < 50 || moy.confort < 55 || moy.hygiene < 30 || moy.bienetre < 25) { rang = 0; notes.push('Une sobriété qui abîme : santé, confort, hygiène ou bien-être effondrés.'); }
  return { cout, base, economies, pct, moy, confortMoy: moy.confort, sante: s.sante, habitudes, principes: s.principes.length, titre: TITRES[rang], rang, note: notes.join(' '),
    domaines, invest, meilleure, tresorerie, amort: am, capital: capitalInvesti(s), abonnements: d.abonnements };
}

// Contexte d'actions pour les systèmes (eau, cuisine, budget…)
export function actions(s) {
  return { prendreTemps: (s2, h) => prendreTemps(s2, h), msg: (t, ty) => msg(s, t, ty), debloquer: (id) => debloquer(s, id) };
}
