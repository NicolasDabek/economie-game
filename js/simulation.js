// Moteur de simulation : modèle thermique et hydrique unique, jauges, habitudes, linge, événements
import {
  PRIX, RENDEMENT_CHAUDIERE, FACTEUR_NON_PURGE, CHARGE_FOND_W, LESSIVE, JOURS, PIECES, ORDRE_PIECES,
  PART_FENETRE, PART_INFILTRATION, ISOLATION, ECHANGE_PORTE, P_APPOINT, PANNEAU_WC, pieceOccupee, estJour,
  VETEMENTS, SEUIL_ENCOMBREMENT, TEMPS_REPRISER, TEMPS_AERER_VET, ACHATS, TEMPS_JOUR, TEMPS_WEEKEND,
  JOURS_HABITUDE, GESTES, PRINCIPES, EVENEMENTS,
} from './data.js';
import { tExt, soleil } from './meteo.js';

const T_HORS_GEL = 8;
const P_CORPS = 90;
const CHALEUR_FOND = { salon: 80, chambre: 30, cuisine: 60 }; // W des appareils (frigo, box…)

// ---------------------------------------------------------------- outils
export const prixGaz = (s) => PRIX.gazKwh * s.prixGazMult;
export const estWeekend = (jour) => jour % 7 >= 5;
export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
function msg(s, texte, type = 'info') { s.messages.unshift({ jour: s.jour, texte, type }); if (s.messages.length > 150) s.messages.length = 150; }
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
  };
}
export function tempsGestes(s) {
  let t = 0;
  for (const [g, on] of Object.entries(gestesActifs(s))) if (on) t += GESTES[g].temps * (s.gestes[g].habitude ? 0.5 : 1);
  return t;
}
export function tempsLibre(s) { return tempsBudget(s) - tempsGestes(s) - s.tempsUtilise; }
function prendreTemps(s, h) {
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
export function acheter(s, id) {
  const a = ACHATS[id];
  if (s.possede[id] || s.argent < a.prix) return false;
  if (id === 'housse' && !s.possede.bouillotte) return false;
  if (!prendreTemps(s, a.temps)) return false;
  s.possede[id] = true;
  payer(s, a.prix, a.invest ? 'equipement' : 'imprevus');
  if (!a.invest) { s.depenses.imprevus -= a.prix; s.depenses.equipement += a.prix; }
  msg(s, `🛒 ${a.nom} : −${eur(a.prix)}${a.temps ? ` et ${fmtH(a.temps)} d'installation` : ''}.`, 'achat');
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
    const U = Uautre + Ufen * fFen + Uinf * fInf + Uaer;
    let x = -U * (r.t - te) + kPorte * (tMoy - r.t) * 1.5 + CHALEUR_FOND[id];
    if (!cfg.rideauxFermes) x += irr * P.fenetre * 0.6;
    if (occ === id) x += P_CORPS * (cfg.invites && id === 'salon' && estJour(h) ? 3 : 1);
    if (id === 'cuisine' && h === 12) x += 500;
    if (id === 'cuisine' && h === 19) x += 1000;
    if (id === 'cuisine' && h === 20 && cfg.recupCuisson) { x += 600; attrib.cuisson += 600; }
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
  const chauffeRad = {};
  for (const id of ORDRE_PIECES) {
    const tot = q[id] + rad[id] + (id === occ ? appoint : 0);
    pieces[id].t += tot / PIECES[id].C;
    chauffeRad[id] = rad[id] > 0 || (id === occ && appoint > 0);
  }
  // une isolation n'économise que si le chauffage tourne
  const chauffe = ORDRE_PIECES.some(id => chauffeRad[id]);
  if (!chauffe) for (const k of Object.keys(attrib)) attrib[k] = 0;
  return { rad, appoint, attrib, te, irr };
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
  const jour = { jour: s.jour, heures: [], kwhRad: { salon: 0, chambre: 0, cuisine: 0 }, eur: { salon: 0, chambre: 0, cuisine: 0 }, appointKwh: 0, elecKwh: 0, solaire: 0 };

  // --- volonté et rechute ---
  let rechute = false;
  if (s.volonte <= 0) {
    rechute = true; s.rechutes++;
    payer(s, 25, 'imprevus'); s.volonte = 30;
    msg(s, '😩 Plus de volonté : rechute ! Livraison de repas (−25 €), fenêtre entrouverte et aucun nouveau geste aujourd\'hui.', 'alerte');
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

  // --- lessive du jour ---
  const L = s.lessivePrevue;
  let lessiveKwh = 0, heureLessive = -1, sechageInterieur = false;
  if (L) {
    const sale = linge(s);
    const rempli = remplissage(s);
    s.lessives++; s.sommeRemplissage += Math.min(1, rempli);
    if (L.laverie) {
      payer(s, PRIX.laverieLavage + PRIX.laverieSechage, 'laverie');
      msg(s, `🧺 Laverie : ${eur(PRIX.laverieLavage + PRIX.laverieSechage)} et 1 h 30.`, 'info');
    } else {
      lessiveKwh = LESSIVE.kwh[L.temp] + (L.sechage === 'machine' ? LESSIVE.secheLingeKwh : 0);
      heureLessive = L.midi ? 13 : 20;
      payer(s, LESSIVE.litres / 1000 * PRIX.eauM3, 'eau');
      payer(s, PRIX.doseLessive, 'produits');
      s.machine.usure += LESSIVE.usureMachine * (L.temp === 60 ? 1.3 : 1);
      sechageInterieur = L.sechage === 'air';
      if (L.temp <= 30 && rempli >= 0.75) debloquer(s, 'volume');
      if (L.midi && s.possede.solaire) debloquer(s, 'decaler');
    }
    for (const id of sale) {
      const v = s.vetements[id];
      v.salete = 0;
      v.usure += L.laverie ? 3 : LESSIVE.usureVet[L.temp] + (L.sechage === 'machine' ? LESSIVE.usureSecheLinge : 0);
    }
    if (rempli < 0.5) msg(s, `🧺 Machine remplie à ${Math.round(rempli * 100)} % seulement : même coût pour moitié moins de linge.`, 'alerte');
    s.volonte -= LESSIVE.volonte;
    s.lessivePrevue = null;
    if (!L.laverie && s.machine.usure >= 100) {
      s.machine.enPanne = true;
      msg(s, '💥 Le lave-linge est en panne ! Laverie ou réparation (carte « Linge »).', 'alerte');
    }
  }

  // --- simulation horaire ---
  const aeration = rechute ? 'entrouverte' : s.aeration === 'breve' && !faits.aerer ? 'entrouverte' : s.aeration;
  const portes = faits.portes ? 'fermees' : 'ouvertes';
  const encomb = encombrement(s);
  const invites = s.invites && s.jour < s.invites.jusqua;
  let sommeC = 0, nC = 0, froid = 0, gazKwh = 0, gazBase = 0, elecBase = 0, humMax = 0;
  const attrJour = { calfeutrage: 0, boudin: 0, rideauxTh: 0, volets: 0, cuisson: 0 };
  const draft = s.possede.calfeutrage ? (s.possede.boudin ? 0 : 0.4) : (s.possede.boudin ? 0.7 : 1);
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
      aeration, recupCuisson: faits.cuisson, sechageInterieur, invites,
    };
    const r = pasHoraire(s.pieces, cfg, jm, h);
    for (const p of ORDRE_PIECES) {
      jour.kwhRad[p] += r.rad[p] / 1000;
      const e = r.rad[p] / 1000 / RENDEMENT_CHAUDIERE * prixGaz(s);
      jour.eur[p] += e; s.pieces[p].kwhSemaine += r.rad[p] / 1000; s.pieces[p].eurSemaine += e;
      gazKwh += r.rad[p] / 1000 / RENDEMENT_CHAUDIERE;
    }
    const occ = pieceOccupee(h);
    jour.eur[occ] += r.appoint / 1000 * PRIX.elecKwh;
    for (const a of Object.keys(attrJour)) attrJour[a] += r.attrib[a] / 1000;

    // électricité et solaire (autoconsommation sans batterie)
    let demande = CHARGE_FOND_W + r.appoint + (h === heureLessive ? lessiveKwh * 1000 : 0) + (faits.bouillotte && h === 22 ? 120 : 0);
    let auto = 0;
    if (s.possede.solaire) {
      const prod = PANNEAU_WC * r.irr / 1000 * 1.35 * 0.9;
      auto = Math.min(prod, demande);
      s.solaire.prod += prod / 1000; s.solaire.auto += auto / 1000; jour.solaire += auto / 1000;
    }
    jour.appointKwh += r.appoint / 1000;
    jour.elecKwh += (demande - auto) / 1000;

    // le voisin « tout chauffé » : 21 °C partout, purgé, portes et rideaux ouverts, aère brièvement
    const rb = pasHoraire(s.base.pieces, { portes: 'ouvertes', rideauxFermes: false, voletsFermes: false, robinets: true, purge: true,
      consignes: { salon: 21, chambre: 21, cuisine: 21 }, aeration: 'breve' }, jm, h);
    gazBase += (rb.rad.salon + rb.rad.chambre + rb.rad.cuisine) / 1000 / RENDEMENT_CHAUDIERE;
    elecBase += CHARGE_FOND_W / 1000;

    // ressenti et confort
    const P = s.pieces[occ];
    const hr = humiditeRelative(P);
    humMax = Math.max(humMax, hr);
    const pHum = hr > 65 ? Math.min(1.5, (hr - 65) / 10) : 0;
    let ressenti, sc;
    if (!jr) {
      let lit = 3;
      if (faits.bouillotte) { const n = (h + 1) % 24; lit += s.possede.housse ? 3 : (n < 3 ? 3.5 : 0.5); }
      ressenti = P.t + lit - pHum;
      sc = scoreConfort(ressenti, 18, 25);
    } else {
      ressenti = P.t + isolationVetements(s, occ) - draft - pHum;
      if (P.t < 17) ressenti -= (17 - P.t) * 0.8;               // mains et visage froids
      if (jm.nuage < 0.3 && occ === 'salon' && !rideauxFermes && h >= 10 && h <= 15) ressenti += 1;
      sc = occ === 'cuisine' ? scoreConfort(ressenti, 18.5, 23) : scoreConfort(ressenti, 21, 24.5);
      if (encomb > SEUIL_ENCOMBREMENT) sc -= 8 * (encomb - SEUIL_ENCOMBREMENT) * (occ === 'cuisine' ? 2 : 1);
      if (invites && s.invites.mode === 'pull' && occ === 'salon') sc -= 10;
    }
    sc = Math.max(0, sc);
    sommeC += sc; nC++;
    if (ressenti < 16) froid += 16 - ressenti;
    jour.heures.push({ h, te: r.te, t: { salon: s.pieces.salon.t, chambre: s.pieces.chambre.t, cuisine: s.pieces.cuisine.t }, ressenti, hr });
  }

  // --- factures du jour ---
  payer(s, gazKwh * prixGaz(s), 'gaz');
  const elecLinge = L && !L.laverie ? lessiveKwh : 0;
  const elecEur = jour.elecKwh * PRIX.elecKwh;
  payer(s, elecEur, 'elec');
  s.depenses.appointEur = (s.depenses.appointEur || 0) + jour.appointKwh * PRIX.elecKwh;
  const aboJour = (PRIX.aboElecMois * 12 + PRIX.aboGazAn) / 365;
  payer(s, aboJour, 'abonnements');
  const coutJour = gazKwh * prixGaz(s) + elecEur + aboJour + (L ? (L.laverie ? PRIX.laverieLavage + PRIX.laverieSechage : LESSIVE.litres / 1000 * PRIX.eauM3) : 0);
  s.factureSemaine += coutJour;
  s.depenses.linge += L ? (L.laverie ? PRIX.laverieLavage + PRIX.laverieSechage : elecLinge * PRIX.elecKwh + LESSIVE.litres / 1000 * PRIX.eauM3 + PRIX.doseLessive) : 0;
  const gainSolaire = jour.solaire * PRIX.elecKwh;
  s.attribution.solaire += gainSolaire;
  const eurGazUtile = prixGaz(s) / RENDEMENT_CHAUDIERE;
  for (const a of Object.keys(attrJour)) s.attribution[a] += attrJour[a] * eurGazUtile;
  // purge : sans elle, la chaudière tourne plus longtemps à bas régime (−8 % de rendement estimé)
  if (s.possede.purge) s.attribution.purge += gazKwh * prixGaz(s) * 0.08;
  else { const surcout = gazKwh * prixGaz(s) * 0.08; payer(s, surcout, 'gaz'); s.factureSemaine += surcout; }

  // voisin
  s.base.gaz += gazBase * prixGaz(s);
  s.base.elec += elecBase * PRIX.elecKwh;
  s.base.abonnements += aboJour;
  if (s.jour % 3 === 2) { // lessive tous les 3 jours, 40 °C + sèche-linge, machine à moitié vide
    s.base.elec += (LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh;
    s.base.eau += LESSIVE.litres / 1000 * PRIX.eauM3; s.base.produits += PRIX.doseLessive;
    s.base.linge = (s.base.linge || 0) + (LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh + LESSIVE.litres / 1000 * PRIX.eauM3 + PRIX.doseLessive;
  }

  // --- vêtements ---
  let sale = false, devenuSale = false;
  const protege = vetementsPortes(s).some(id => VETEMENTS[id].protege);
  for (const id of vetementsPortes(s)) {
    const V = VETEMENTS[id], v = s.vetements[id];
    const avant = v.salete;
    v.salete = Math.min(130, v.salete + V.sal * (protege && !V.peau ? 0.4 : 1));
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
  if (devenuSale) { msg(s, '🧺 Des vêtements sont sales : ils isolent moins et la santé en pâtit.', 'alerte'); }

  // --- humidité, moisissures ---
  if (humMax > 75) {
    s.moisissure++;
    if (s.moisissure === 3) msg(s, s.possede.hygrometre ? `💧 Humidité à ${Math.round(humMax)} % : moisissures en vue. Aère brièvement !` : '💧 De la buée ruisselle sur les vitres et une odeur de moisi apparaît…', 'alerte');
  } else s.moisissure = Math.max(0, s.moisissure - 1);
  if (s.aeration === 'breve' && faits.aerer) debloquer(s, 'aeration');

  // --- jauges ---
  const confortJour = sommeC / nC;
  s.confort = s.confort * 0.6 + confortJour * 0.4;
  let dSante = froid > 0 ? -0.3 * froid : 1.2;
  if (sale) dSante -= 1.5;
  if (s.moisissure >= 3) dSante -= 1;
  s.sante = Math.max(0, Math.min(100, s.sante + dSante));
  if (s.sante < 35 && !s.malade) {
    s.malade = true; payer(s, 25, 'imprevus'); s.volonte -= 15;
    msg(s, '🤧 Tu tombes malade : médecin et pharmacie (−25 € restant à charge) et moral en berne.', 'alerte');
  } else if (s.sante > 55) s.malade = false;
  const libre = Math.max(0, tempsLibre(s));
  s.volonte = Math.max(0, Math.min(100, s.volonte + 1 + (confortJour - 75) / 15 + libre * 0.5 - coutVolonte));

  // --- découvertes ---
  const ref = s.possede.robinets ? s.pieces.salon : s.central;
  if (ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'ecart');
  if (s.jour >= 3 && ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'masse');
  if (isolationVetements(s) >= 2.5 && ref.consigneJour <= 19 && confortJour > 70) debloquer(s, 'gens');
  if (faits.portes && s.possede.robinets && Math.min(s.pieces.cuisine.consigneJour, s.pieces.chambre.consigneJour) <= 16) debloquer(s, 'zones');
  if (faits.rideaux) debloquer(s, 'rideau');
  if (jm.nuage < 0.3 && s.rideaux !== 'fermes') debloquer(s, 'soleil');
  if (faits.bouillotte && (s.possede.robinets ? s.pieces.chambre.consigneNuit : s.central.consigneNuit) <= 16) debloquer(s, 'lit');
  if (s.possede.housse && faits.bouillotte) debloquer(s, 'prolonger');
  if (s.moisissure >= 3) debloquer(s, 'humidite');

  // --- bilan ---
  jour.confort = confortJour; jour.rechute = rechute; jour.cout = coutJour; jour.gazKwh = gazKwh;
  s.dernierJour = jour;
  s.historique.push({ jour: s.jour, cout: coutJour, confort: confortJour });
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
  for (const e of EVENEMENTS) {
    if (e.annonce && s.jour === e.jour - e.annonce) msg(s, `📅 Annonce : ${e.titre}, dans ${e.annonce} jours. ${e.texte}`, 'annonce');
    if (s.jour === e.jour && !s.evenementsVus.includes(e.id)) {
      if (e.id === 'panne' && s.machine.enPanne) { s.evenementsVus.push(e.id); continue; }
      s.dilemme = e.id;
    }
  }
}
export function choixDilemme(s) {
  switch (s.dilemme) {
    case 'invites': return [
      { id: 'chauffer', texte: 'Chauffer le salon à 21 °C pendant deux jours', effet: 'Coûte du gaz, invités ravis (+5 volonté).' },
      { id: 'preter', texte: 'Leur prêter plaid et bouillotte', effet: 'Gratuit et chaleureux (+3 volonté). Il faut avoir un plaid ou une bouillotte.', possible: s.possede.bouillotte || s.vetements.plaid.possede },
      { id: 'pull', texte: '« Prenez un pull, on vit à 18 °C ici »', effet: 'Gratuit mais tendu (−10 volonté, confort en baisse).' },
    ];
    case 'promo': return [
      { id: 'acheter', texte: 'Acheter la doudoune premier prix à 12,50 €', effet: 'Bonne affaire… si tu en avais besoin. Elle s\'usera vite.', possible: !s.vetements.doudoune.possede && s.argent >= 12.5 },
      { id: 'attendre', texte: 'Appliquer la règle des 48 h et passer son chemin', effet: 'Un peu frustrant (−3 volonté).' },
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
  if (id === 'promo') {
    if (choix === 'acheter') acheterVetement(s, 'doudoune', 'eco', 12.5);
    else s.volonte -= 3;
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
  return Object.entries(ACHATS).filter(([k, a]) => a.invest && s.possede[k]).reduce((t, [, a]) => t + a.prix, 0)
    + Object.values(s.vetements).filter(v => v.possede).reduce((t, v) => t + v.prixPaye, 0);
}

// Part des investissements « consommée » cet hiver : prix / durée de vie, et usure des vêtements
export function amortissement(s) {
  const equip = Object.entries(ACHATS).filter(([k]) => s.possede[k]).reduce((t, [, a]) => t + a.prix / a.vie, 0);
  const vet = Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye * Math.min(1, v.usure / 100) : 0), 0)
    + (s.depenses.vetements - Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye : 0), 0));
  return { equip, vet };
}
export function coutVariable(s) {
  const d = s.depenses;
  return d.gaz + d.elec + d.eau + d.produits + d.laverie + d.equipement + d.vetements + d.imprevus;
}
export function coutBaseVariable(s) { const b = s.base; return b.gaz + b.elec + b.eau + b.produits; }

export function scoreFinal(s) {
  const d = s.depenses, b = s.base;
  const am = amortissement(s);
  const tresorerie = coutVariable(s);
  const cout = tresorerie - d.equipement - d.vetements + am.equip + am.vet, base = coutBaseVariable(s);
  const economies = base - cout;
  const pct = base > 0 ? economies / base * 100 : 0;
  const confortMoy = s.nbJours ? s.sommeConfort / s.nbJours : 0;
  const habitudes = Object.values(s.gestes).filter(g => g.habitude).length;
  const domaines = [
    { nom: 'Chauffage (gaz + appoint)', valeur: b.gaz - d.gaz - (d.appointEur || 0) },
    { nom: 'Linge (lessive, séchage, laverie)', valeur: (b.linge || 0) - d.linge },
    { nom: 'Électricité solaire autoconsommée', valeur: s.attribution.solaire },
    { nom: 'Équipements (part amortie cet hiver)', valeur: -am.equip },
    { nom: 'Vêtements (part usée)', valeur: -am.vet },
    { nom: 'Imprévus (rechutes, maladie, pannes)', valeur: -d.imprevus },
  ];
  const reste = economies - domaines.reduce((a, x) => a + x.valeur, 0);
  if (Math.abs(reste) >= 0.5) domaines.push({ nom: 'Autres (bouillotte, arrondis)', valeur: reste });
  const invest = Object.entries(ACHATS).filter(([k, a]) => s.possede[k] && s.attribution[k] !== undefined)
    .map(([k, a]) => ({ nom: a.nom, prix: a.prix, gain: s.attribution[k], rentable: s.attribution[k] >= a.prix, amorti: s.attribution[k] >= a.prix / a.vie,
      retour: s.attribution[k] > 0 ? a.prix / (s.attribution[k] / Math.max(1, s.nbJours)) : Infinity }));
  if (s.recupCuisson || s.attribution.cuisson > 0) invest.push({ nom: 'Récupérer la chaleur de la cuisson (geste)', prix: 0, gain: s.attribution.cuisson, rentable: true, retour: 0 });
  const isole = Object.values(s.attribution).reduce((a, x) => a + x, 0) - s.attribution.solaire;
  const consignes = { nom: 'Baisser et zoner les consignes, s\'habiller chaudement', gain: Math.max(0, b.gaz - d.gaz - isole) };
  const candidats = [consignes, ...invest];
  const meilleure = candidats.reduce((a, c) => (c.gain > a.gain ? c : a));
  const TITRES = ['Dépensier', 'Malin', 'Optimiseur', 'Autonome', 'Maître de la sobriété'];
  let rang = pct < 12 ? 0 : pct < 22 ? 1 : pct < 33 ? 2 : pct < 38 ? 3 : 4;
  let note = '';
  if (rang >= 3 && (confortMoy < 72 || s.sante < 75)) { rang = 2; note = 'Autonome et Maître exigent un confort moyen ≥ 72 % et une santé ≥ 75 %.'; }
  if (rang === 4 && (s.principes.length < 16 || habitudes < 4)) { rang = 3; note = 'Le titre suprême demande 16 principes et 4 habitudes.'; }
  if (s.sante < 50 || confortMoy < 55) { rang = (s.sante < 30 || confortMoy < 35) ? 0 : Math.min(rang, 1); note = 'Des économies payées par ton corps : confort ou santé trop bas.'; }
  return { cout, base, economies, pct, confortMoy, sante: s.sante, habitudes, principes: s.principes.length, titre: TITRES[rang], rang, note,
    domaines, invest, meilleure, tresorerie, amort: am, capital: capitalInvesti(s), abonnements: d.abonnements };
}
