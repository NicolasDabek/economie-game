// Étape du jour : météo et chauffage heure par heure (joueur et voisin), électricité, solaire, ressenti
import { RENDEMENT_CHAUDIERE, ORDRE_PIECES, PIECES, PANNEAU_WC, pieceOccupee, estJour, SEUIL_ENCOMBREMENT, ETE, STOCKAGE, SC } from '../data.js';
import { prixElec } from '../systemes.js';
import { passifHeure, passifCumul, debutJourPassif, hasCheminee, typePuits } from '../passif.js';
import { encombrement, eur, isolationVetements, prixGaz } from '../simulation.js';
import { humiditeRelative, pasHoraire, scoreConfort } from '../thermique.js';

export function heuresDuJour(s, v) {
  const { ctx, jm, chap, hiver, ete, jour, faits, rechute, sechageInterieur } = v;
  let poeleKwh = 0;
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
  let elecEur = 0, elecKwh = 0, chauffElecEur = 0, chauffElecKwh = 0, radBaseKwh = 0;
  const elecChauffage = SC.chauffage === 'elec';   // v1.3 : convecteurs, rendement 1, payés au prix de l'heure (Tempo compris)
  const surplusH = new Array(24).fill(0), jourElec = new Array(24);
  s.battSoc ||= 0;
  debutJourPassif(s);
  if (jm.canicule) s.joursCanicule = (s.joursCanicule || 0) + 1;
  const tirageLinge = sechageInterieur && hasCheminee(s) && s.passif.mode !== 'ferme';
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
      calfeutrage: s.possede.calfeutrage, boudin: s.possede.boudin, robinets: s.possede.robinets, purge: s.possede.purge || elecChauffage,
      consignes, central, appoint: s.possede.appoint && s.appoint.actif ? s.appoint.consigne : null,
      aeration, recupCuisson: faits.cuisson, sechageInterieur: tirageLinge ? 'tirage' : sechageInterieur, invites, chaleur: ctx.chaleur,
      passif: passifHeure(s, jm, h, chap, ORDRE_PIECES.reduce((a, p) => a + s.pieces[p].t, 0) / 3),
      voletsJour: faits.voletsJour, ventNuit: faits.ventNuit, clim,
      // le poêle chauffe le salon jusqu'à la consigne voulue pour la pièce (on charge moins de bûches quand il fait doux)
      poele: ctx.poele && ctx.poele.heures.has(h) ? { p: ctx.poele.p, cible: Math.max(17, s.possede.robinets ? consignes.salon : central) } : null,
    };
    const r = pasHoraire(s.pieces, cfg, jm, h);
    poeleKwh += r.poele / 1000;
    const pr = cfg.passif;
    if (pr) {
      passifCumul(s, pr, h, Object.fromEntries(ORDRE_PIECES.map(p => [p, humiditeRelative(s.pieces[p])])));
      // gains mesurés : gaz évité quand le chauffage tourne, clim évitée quand elle tourne
      const radTot = r.rad.salon + r.rad.chambre + r.rad.cuisine;
      const pxClim = prixElec(s, h, jm.tempo) * ETE.climElec / ETE.climFroid / 1000;
      // une chaleur apportée hors chauffe mais sous 22 °C est stockée dans les murs et évite du chauffage plus tard
      const tMoyP = ORDRE_PIECES.reduce((a, p) => a + s.pieces[p].t, 0) / 3;
      const utile = radTot > 0 || (!ete && tMoyP < 22);
      const pxC = elecChauffage ? prixElec(s, h, jm.tempo) : prixGaz(s) / RENDEMENT_CHAUDIERE;
      const gain = (P) => P > 0 && utile ? (radTot > 0 ? Math.min(P, radTot) : P) / 1000 * pxC
        : P < 0 && radTot > 0 ? P / 1000 * pxC
        : P < 0 && r.climElec > 0 ? -P * pxClim : 0;
      const idC = s.possede.chemineePro ? 'chemineePro' : 'chemineeDIY', idP = typePuits(s);
      if (hasCheminee(s)) s.attribution[idC] = (s.attribution[idC] || 0) + gain(pr.Pch);
      if (idP) s.attribution[idP] = (s.attribution[idP] || 0) + gain(pr.Ppuits) - pr.fanW / 1000 * prixElec(s, h, jm.tempo);
    }
    // v1.5 : gain des robinets thermostatiques (jamais mesuré avant : « 0 € » dans la rentabilité). Sans eux, le thermostat du salon
    // pousse toutes les pièces à sa consigne : chaque pièce plus fraîche perd en plus U × (consigne salon − sa température).
    // 80 % seulement : une partie de cette chaleur passe déjà du salon aux autres pièces à travers les cloisons.
    if (s.possede.robinets && !ete && jm.tMoy < 15) {
      const ref = consignes.salon; let w = 0;
      for (const p of ORDRE_PIECES) if (p !== 'salon') w += PIECES[p].U * Math.max(0, ref - Math.max(consignes[p], s.pieces[p].t));
      if (w > 0) s.attribution.robinets = (s.attribution.robinets || 0) + 0.8 * w / 1000 * (elecChauffage ? prixElec(s, h, jm.tempo) : prixGaz(s) / RENDEMENT_CHAUDIERE);
    }
    for (const p of ORDRE_PIECES) {
      jour.kwhRad[p] += r.rad[p] / 1000;
      const e = elecChauffage ? r.rad[p] / 1000 * prixElec(s, h, jm.tempo) : r.rad[p] / 1000 / RENDEMENT_CHAUDIERE * prixGaz(s);
      jour.eur[p] += e; s.pieces[p].kwhSemaine += r.rad[p] / 1000; s.pieces[p].eurSemaine += e;
      if (elecChauffage) { chauffElecEur += e; chauffElecKwh += r.rad[p] / 1000; } else gazKwh += r.rad[p] / 1000 / RENDEMENT_CHAUDIERE;
    }
    const occ = pieceOccupee(h);
    for (const a of Object.keys(attrJour)) attrJour[a] += r.attrib[a] / 1000;

    // électricité de l'heure : systèmes + appoint + clim + ventilateur + bouillotte, moins le solaire autoconsommé
    let demande = (pr ? pr.fanW : 0) + ctx.elecH[h] + r.appoint + r.climElec + (ventilo && (ete || jm.canicule) ? ETE.ventilateur : 0) + (faits.bouillotte && h === 22 ? 120 : 0);
    let auto = 0, prod = 0, surplus = 0, decharge = 0;
    const prix = prixElec(s, h, jm.tempo);
    if (s.possede.solaire) {
      prod = PANNEAU_WC * r.irr / 1000 * 1.35 * 0.9;
      auto = Math.min(prod, demande);
      surplus = prod - auto;
      s.solaire.prod += prod / 1000; s.solaire.auto += auto / 1000; jour.solaire += auto / 1000;
      s.attribution.solaire += auto / 1000 * prix;
      // batterie : charge sur le surplus, décharge quand le panneau ne suffit plus
      if (s.possede.batterie) {
        const cap = STOCKAGE.batterieUtile * 1000;
        if (surplus > 0) { const c = Math.min(surplus, cap - s.battSoc, 1000); s.battSoc += c * STOCKAGE.batterieRendement; surplus -= c; }
        else if (demande > auto && s.battSoc > 0) { decharge = Math.min(demande - auto, s.battSoc, 800); s.battSoc -= decharge; auto += decharge;
          s.attribution.batterie = (s.attribution.batterie || 0) + decharge / 1000 * prix; }
      }
      surplusH[h] = surplus;
    }
    jourElec[h] = { prod, demande, surplus, prix };
    if (ventilo && (ete || jm.canicule)) s.attribution.ventilateur = (s.attribution.ventilateur || 0) - ETE.ventilateur / 1000 * prix;
    if (r.climElec) s.attribution.clim = (s.attribution.clim || 0) - r.climElec / 1000 * prix;
    elecEur += (demande - auto) / 1000 * prix; elecKwh += (demande - auto) / 1000;
    jour.eur[occ] += r.appoint / 1000 * prix;
    jour.appointKwh += r.appoint / 1000; jour.climKwh += r.climElec / 1000;
    s.depenses.climEur = (s.depenses.climEur || 0) + r.climElec / 1000 * prix;
    s.depenses.appointEur = (s.depenses.appointEur || 0) + r.appoint / 1000 * prix;

    // le voisin : 21 °C partout, clim à 25 °C l'été, portes et rideaux ouverts, aère brièvement
    const rb = pasHoraire(s.base.pieces, { portes: 'ouvertes', rideauxFermes: false, voletsFermes: false, robinets: true, purge: true,
      consignes: { salon: 21, chambre: 21, cuisine: 21 }, aeration: 'breve', chaleur: s.base.chaleur, clim: ete ? 25 : null }, jm, h);
    if (elecChauffage) radBaseKwh += (rb.rad.salon + rb.rad.chambre + rb.rad.cuisine) / 1000;   // le voisin reste en option Base
    else gazBase += (rb.rad.salon + rb.rad.chambre + rb.rad.cuisine) / 1000 / RENDEMENT_CHAUDIERE;
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
  return { poeleKwh, sommeC, nC, froid, chaud, gazKwh, gazBase, climBase, humMax, sommeil, nS, attrJour, elecEur, elecKwh, chauffElecEur, chauffElecKwh, radBaseKwh, surplusH, jourElec, elecChauffage, ventilo, invites };
}
