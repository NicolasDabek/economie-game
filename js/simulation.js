// Moteur de simulation : modèle thermique unique + jauges + habitudes
import {
  PIECES, ORDRE_PIECES, PART_FENETRE, GAIN_RIDEAU, GAIN_CALFEUTRAGE, ECHANGE_PORTE,
  PRIX_KWH, PRIX_EAU_L, JOURS, VETEMENTS, USURE_JOUR, USURE_LAVAGE, LESSIVE,
  REPARATION_MACHINE, ACHATS, GESTES, JOURS_HABITUDE, PRINCIPES, pieceOccupee, estJour,
} from './data.js';
import { tExt, soleil } from './meteo.js';

const T_HORS_GEL = 8;     // consigne "arrêt" = hors-gel
const P_CORPS = 90;       // W dégagés par une personne
const P_CUISSON = 1200;   // W perdus dans la cuisine pendant le repas du soir

/**
 * Une heure de physique pour la maison.
 * cfg : { portes, rideauxFermes, calfeutrage, consignes: {piece: T} }
 * Retourne les kWh de radiateur par pièce.
 */
export function pasHoraire(pieces, cfg, jourMeteo, h) {
  const te = tExt(jourMeteo, h);
  const irr = soleil(jourMeteo, h);
  const occ = pieceOccupee(h);
  const kPorte = ECHANGE_PORTE[cfg.portes];
  const tMoy = ORDRE_PIECES.reduce((s, p) => s + pieces[p].t, 0) / ORDRE_PIECES.length;
  const kwh = {};
  const nouv = {};
  for (const id of ORDRE_PIECES) {
    const P = PIECES[id], r = pieces[id];
    let U = P.U;
    if (cfg.calfeutrage) U *= 1 - GAIN_CALFEUTRAGE;
    if (cfg.rideauxFermes) U *= 1 - PART_FENETRE * GAIN_RIDEAU;
    let q = -U * (r.t - te);                       // pertes (W)
    q += kPorte * (tMoy - r.t) * 1.5;               // échanges entre pièces
    if (!cfg.rideauxFermes) q += irr * P.fenetre * 0.6; // soleil
    if (occ === id) q += P_CORPS;                   // corps humain
    if (id === 'cuisine' && (h === 19 || h === 12)) q += h === 19 ? P_CUISSON : P_CUISSON / 2;
    if (id === 'cuisine') q += 40;                  // frigo
    // Radiateur : complète jusqu'à la consigne, plafonné à sa puissance
    const consigne = Math.max(T_HORS_GEL, cfg.consignes[id]);
    const besoin = (consigne - r.t) * P.C - q;      // Wh pour atteindre la consigne en 1 h
    const rad = Math.min(P.pMax, Math.max(0, besoin));
    q += rad;
    nouv[id] = r.t + q / P.C;
    kwh[id] = rad / 1000;
  }
  for (const id of ORDRE_PIECES) pieces[id].t = nouv[id];
  return { kwh, te, irr };
}

export function vetementsPortes(s) {
  return Object.entries(s.vetements).filter(([, v]) => v.possede && v.porte).map(([id]) => id);
}

export function isolationVetements(s) {
  let iso = 0;
  for (const id of vetementsPortes(s)) {
    const v = s.vetements[id];
    let x = VETEMENTS[id].iso;
    if (v.salete >= 100) x *= 0.5;
    else if (v.salete >= 70) x *= 0.8;
    if (v.usure >= 80) x *= 0.7;
    iso += x;
  }
  return iso;
}

function scoreConfort(ressenti) {
  if (ressenti >= 19 && ressenti <= 24) return 100;
  if (ressenti < 19) return Math.max(0, 100 - 16 * (19 - ressenti));
  return Math.max(0, 100 - 12 * (ressenti - 24));
}

function msg(s, texte, type = 'info') { s.messages.unshift({ jour: s.jour, texte, type }); }

export function debloquer(s, id) {
  if (s.principes.includes(id)) return;
  s.principes.push(id);
  msg(s, `💡 Principe découvert : « ${PRINCIPES[id].titre} ». ${PRINCIPES[id].texte}`, 'principe');
}

export function acheter(s, id) {
  const a = ACHATS[id];
  if (s.possede[id] || s.argent < a.prix) return false;
  if (id === 'housse' && !s.possede.bouillotte) return false;
  s.possede[id] = true; s.argent -= a.prix; s.depenses.achats += a.prix;
  msg(s, `🛒 Achat : ${a.nom} (−${a.prix} €).`, 'achat');
  if (id === 'thermometre') {
    debloquer(s, 'mesure');
    const last = s.historique.at(-1);
    if (last) {
      const pire = ORDRE_PIECES.reduce((a, b) => (last.kwh[a] > last.kwh[b] ? a : b));
      msg(s, `🌡️ Première mesure : c'est le ${PIECES[pire].nom.toLowerCase()} qui coûte le plus (${(last.kwh[pire] * PRIX_KWH).toFixed(2)} € hier).`, 'decouverte');
    }
  }
  if (id === 'calfeutrage') debloquer(s, 'calfeutrer');
  return true;
}

export function acheterVetement(s, id) {
  const v = VETEMENTS[id], e = s.vetements[id];
  if (e.possede || s.argent < v.prix) return false;
  e.possede = true; e.porte = true; e.salete = 0; e.usure = 0;
  s.argent -= v.prix; s.depenses.achats += v.prix;
  msg(s, `🛒 Achat : ${v.nom} (−${v.prix} €).`, 'achat');
  return true;
}

function gestesActifs(s) {
  const nbCouches = vetementsPortes(s).filter(id => id !== 'tshirt').length;
  return {
    rideaux: s.rideaux === 'nuit',
    portes: s.portes === 'fermees',
    bouillotte: s.utiliserBouillotte && s.possede.bouillotte,
    couches: nbCouches >= 2,
  };
}

function faireLessive(s, log) {
  const cout = LESSIVE.kwh * PRIX_KWH + LESSIVE.litres * PRIX_EAU_L + LESSIVE.produit;
  s.argent -= cout; s.depenses.lessive += cout; s.factureSemaine += cout;
  s.volonte -= LESSIVE.volonte;
  for (const [id, v] of Object.entries(s.vetements)) {
    if (!v.possede) continue;
    v.salete = 0; v.usure += USURE_LAVAGE;
  }
  s.usureMachine += LESSIVE.usureMachine;
  if (s.usureMachine >= 100) {
    s.usureMachine = 0; s.argent -= REPARATION_MACHINE; s.depenses.imprevus += REPARATION_MACHINE;
    msg(s, `🔧 Le lave-linge lâche : réparation −${REPARATION_MACHINE} €.`, 'alerte');
  }
  log.lessive = cout;
}

/** Avance d'un jour complet (24 h, 7 h -> 7 h). */
export function jourSuivant(s) {
  if (s.fini) return;
  const jm = s.meteo[s.jour];
  const log = { jour: s.jour, heures: [], kwh: { salon: 0, chambre: 0, cuisine: 0 }, lessive: 0 };

  // --- Volonté : rechute si épuisée ---
  let rechute = false;
  if (s.volonte <= 0) {
    rechute = true; s.rechutes++;
    s.argent -= 28; s.depenses.imprevus += 28; s.volonte = 35;
    msg(s, '😩 Plus de volonté : rechute ! Livraison de repas (−28 €) et aucun nouveau geste aujourd\'hui.', 'alerte');
  }
  const actifs = gestesActifs(s);
  const faits = {};
  for (const [g, on] of Object.entries(actifs)) faits[g] = on && (!rechute || s.gestes[g].habitude);
  let coutVolonte = 0;
  for (const [g, fait] of Object.entries(faits)) {
    if (!fait) continue;
    const st = s.gestes[g];
    if (!st.habitude) {
      coutVolonte += GESTES[g].cout; st.pratique++;
      if (st.pratique >= JOURS_HABITUDE) {
        st.habitude = true;
        msg(s, `✅ « ${GESTES[g].nom} » est devenu une habitude : plus aucun effort.`, 'habitude');
        debloquer(s, 'habitude');
      }
    }
  }

  // --- Lessive ---
  if (s.lessiveDemandee) { faireLessive(s, log); s.lessiveDemandee = false; }

  // --- Simulation horaire ---
  const portes = faits.portes ? 'fermees' : 'ouvertes';
  const isoBase = isolationVetements(s);
  const couchesPortees = rechute && !s.gestes.couches.habitude && actifs.couches;
  const iso = couchesPortees ? Math.min(isoBase, 2) : isoBase;
  let sommeC = 0, nC = 0, heuresFroid = 0, minRessenti = 99;
  let coutJour = 0, coutBase = 0;
  const sommeil = [];
  for (let k = 0; k < 24; k++) {
    const h = (7 + k) % 24;
    const jour = estJour(h);
    const rideauxFermes = s.rideaux === 'fermes' || (faits.rideaux && !jour);
    const consignes = {};
    for (const p of ORDRE_PIECES) consignes[p] = jour ? s.pieces[p].consigneJour : s.pieces[p].consigneNuit;
    const r = pasHoraire(s.pieces, { portes, rideauxFermes, calfeutrage: s.possede.calfeutrage, consignes }, jm, h);
    for (const p of ORDRE_PIECES) { log.kwh[p] += r.kwh[p]; s.pieces[p].kwhTotal += r.kwh[p]; s.pieces[p].kwhSemaine += r.kwh[p]; }

    // Référence "tout chauffé" : 21 °C partout, portes ouvertes, rideaux ouverts, rien d'acheté
    const rb = pasHoraire(s.baseline.pieces, { portes: 'ouvertes', rideauxFermes: false, calfeutrage: false,
      consignes: { salon: 21, chambre: 21, cuisine: 21 } }, jm, h);
    coutBase += (rb.kwh.salon + rb.kwh.chambre + rb.kwh.cuisine) * PRIX_KWH;

    // Ressenti
    const occ = pieceOccupee(h);
    const tPiece = s.pieces[occ].t;
    let ressenti;
    if (!jour) {
      // Au lit : couette + bouillotte
      let bonusLit = 3;
      if (faits.bouillotte) {
        const heureNuit = (h + 24 - 23) % 24; // 0 à 23 h
        bonusLit += s.possede.housse ? 3 : (heureNuit < 3 ? 3.5 : 0.5);
      }
      ressenti = tPiece + bonusLit;
      sommeil.push(ressenti);
    } else {
      ressenti = tPiece + iso - (s.possede.calfeutrage ? 0 : 1);
      if (jm.nuage < 0.3 && occ === 'salon' && !rideauxFermes && h >= 10 && h <= 15) ressenti += 1;
    }
    const sc = scoreConfort(ressenti);
    sommeC += sc; nC++;
    if (ressenti < 16) heuresFroid += 16 - ressenti;
    minRessenti = Math.min(minRessenti, ressenti);
    log.heures.push({ h, te: r.te, t: { salon: s.pieces.salon.t, chambre: s.pieces.chambre.t, cuisine: s.pieces.cuisine.t }, ressenti, rad: r.kwh });
  }
  if (faits.bouillotte) { coutJour += 0.1 * PRIX_KWH; }
  const kwhJour = log.kwh.salon + log.kwh.chambre + log.kwh.cuisine;
  coutJour += kwhJour * PRIX_KWH;
  s.argent -= coutJour; s.depenses.chauffage += coutJour; s.factureSemaine += coutJour;
  // Référence : même lessive tous les 4 jours
  if (s.jour % 4 === 3) coutBase += LESSIVE.kwh * PRIX_KWH + LESSIVE.litres * PRIX_EAU_L + LESSIVE.produit;
  s.baseline.cout += coutBase;

  // --- Vêtements : saleté et usure ---
  let sale = false;
  for (const id of vetementsPortes(s)) {
    const v = s.vetements[id];
    v.salete = Math.min(130, v.salete + VETEMENTS[id].salParJour);
    v.usure += USURE_JOUR;
    if (v.salete >= 100) sale = true;
    if (v.usure >= 100) {
      v.possede = false; v.porte = id === 'tshirt';
      if (id === 'tshirt') { v.possede = true; v.usure = 0; v.salete = 0; s.argent -= 6; s.depenses.achats += 6; }
      msg(s, `🧵 ${VETEMENTS[id].nom} usé jusqu'à la corde${id === 'tshirt' ? ' : nouveau t-shirt (−6 €)' : ', il faut le racheter'}.`, 'alerte');
    }
  }
  if (sale) { debloquer(s, 'sale'); msg(s, '🧺 Tes vêtements sont sales : ils isolent moins et ta santé en pâtit. Pense à la lessive.', 'alerte'); }

  // --- Jauges ---
  const confortJour = sommeC / nC;
  s.confort = s.confort * 0.6 + confortJour * 0.4;
  let dSante = heuresFroid > 0 ? -0.35 * heuresFroid : 1.5;
  if (sale) dSante -= 2;
  const nuitMoy = sommeil.reduce((a, b) => a + b, 0) / sommeil.length;
  if (nuitMoy < 16) { dSante -= 2; s.volonte -= 4; }
  s.sante = Math.max(0, Math.min(100, s.sante + dSante));
  if (s.sante < 35 && !s.malade) {
    s.malade = true; s.argent -= 20; s.depenses.imprevus += 20; s.volonte -= 15;
    msg(s, '🤧 Tu tombes malade : pharmacie (−20 €) et moral en berne. Il fait trop froid !', 'alerte');
  } else if (s.sante > 55) s.malade = false;
  s.volonte = Math.max(0, Math.min(100, s.volonte + 4 + (confortJour - 75) / 10 - coutVolonte));

  // --- Découvertes ---
  const consJ = s.pieces.salon.consigneJour, consN = s.pieces.chambre.consigneNuit;
  if (Math.max(s.pieces.salon.consigneJour - s.pieces.salon.consigneNuit, s.pieces.chambre.consigneJour - s.pieces.chambre.consigneNuit) >= 3) debloquer(s, 'ecart');
  if (isoBase >= 2 && consJ <= 19 && confortJour > 70) debloquer(s, 'gens');
  if (faits.portes && (s.pieces.cuisine.consigneJour <= 16 || s.pieces.chambre.consigneJour <= 16)) debloquer(s, 'zones');
  if (faits.rideaux) debloquer(s, 'rideau');
  if (jm.nuage < 0.3 && s.rideaux !== 'fermes') debloquer(s, 'soleil');
  if (faits.bouillotte && consN <= 16) debloquer(s, 'lit');
  if (faits.bouillotte && s.possede.housse) debloquer(s, 'stockage');
  if (s.jour >= 3 && consJ - s.pieces.salon.consigneNuit >= 3) debloquer(s, 'masse');

  // --- Bilan ---
  log.cout = coutJour; log.coutBase = coutBase; log.confort = confortJour; log.minRessenti = minRessenti; log.rechute = rechute;
  s.historique.push(log);
  s.sommeConfort += confortJour; s.nbJours++;
  s.jour++;
  if (s.jour % 7 === 0) {
    s.factures.push({ semaine: s.jour / 7, montant: s.factureSemaine, parPiece: Object.fromEntries(ORDRE_PIECES.map(p => [p, s.pieces[p].kwhSemaine * PRIX_KWH])) });
    msg(s, `📄 Facture de la semaine ${s.jour / 7} : ${s.factureSemaine.toFixed(2)} €.`, 'facture');
    s.factureSemaine = 0;
    for (const p of ORDRE_PIECES) s.pieces[p].kwhSemaine = 0;
  }
  if (s.jour >= JOURS) s.fini = true;
}

export function coutTotal(s) {
  return s.depenses.chauffage + s.depenses.lessive + s.depenses.achats + s.depenses.imprevus;
}

export function scoreFinal(s) {
  const cout = coutTotal(s);
  const economies = s.baseline.cout - cout;
  const pct = s.baseline.cout > 0 ? economies / s.baseline.cout * 100 : 0;
  const confortMoy = s.nbJours ? s.sommeConfort / s.nbJours : 0;
  const habitudes = Object.values(s.gestes).filter(g => g.habitude).length;
  const TITRES = ['Dépensier', 'Malin', 'Optimiseur', 'Autonome', 'Maître de la sobriété'];
  let rang = pct < 15 ? 0 : pct < 35 ? 1 : pct < 50 ? 2 : pct < 62 ? 3 : 4;
  let note = '';
  if (rang === 4 && (s.principes.length < 8 || habitudes < 3)) { rang = 3; note = 'Il te manque des principes ou des habitudes pour le titre suprême.'; }
  if (s.sante < 50 || confortMoy < 55) { rang = (s.sante < 30 || confortMoy < 35) ? 0 : Math.min(rang, 1); note = 'Des économies payées par ton corps : confort ou santé trop bas.'; }
  return { cout, base: s.baseline.cout, economies, pct, confortMoy, sante: s.sante, habitudes, principes: s.principes.length, titre: TITRES[rang], rang, note };
}
