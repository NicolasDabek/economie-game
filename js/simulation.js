// Moteur de simulation : modèle thermique et hydrique unique, jauges, habitudes, linge, événements
import { PRIX, INDICES, RENDEMENT_CHAUDIERE, FACTEUR_NON_PURGE, LESSIVE, JOURS, PIECES, ORDRE_PIECES, PART_FENETRE, PART_INFILTRATION, ISOLATION, ECHANGE_PORTE, P_APPOINT, PANNEAU_WC, pieceOccupee, estJour, VETEMENTS, SEUIL_ENCOMBREMENT, TEMPS_REPRISER, TEMPS_AERER_VET, ACHATS, TEMPS_JOUR, TEMPS_WEEKEND, JOURS_HABITUDE, HABITUDE_OUBLI, GESTES, PRINCIPES, EVENEMENTS, ETE, TARIFS, CHAPITRES, STOCKAGE, ROI_ITEMS, ARGENT_DEPART, LAVAGE_MAIN, SC, appliquerScenario, horsScenario } from './data.js';
import { stockerSurplus, detecterCombos } from './combos.js';
import { tExt, soleil, chapitreDuJour, FACTEUR_FENETRE } from './meteo.js';
import { systemesJour, voisinJour, tempsRoutines, prixElec } from './systemes.js';
import { transportJour, voisinTransport, tempsTransport } from './transport.js';
import { suivreROI } from './roi.js';
import { financeJour, gainFinancier, valeurLiquidation, valeurs } from './finance.js';
import { appliquerIndices, debutJourCampagne, mensualiser, choixCampagne, titreCampagne, resoudreCampagne, resteAVivre } from './annee.js';
import { anneeDuJour, dateDuJour } from './meteo.js';
import { nouvelEtatMoral, moralJour, santeJour, coutRechute, paliersJour } from './moral.js';
import { palierMoral, palierBE, EFFETS_PALIERS as EP } from './paliers.js';
import { makeRng } from './rng.js';
import { surAchat, poeleJour, poeleConsommer, autonomieSoir, actionAutonomie, etatAutonomie } from './autonomie.js';
import { instantaneMois } from './tableau.js';
import { gestesDuJour } from './journee/gestes.js';
import { lessiveDuJour } from './journee/lessive.js';
import { heuresDuJour } from './journee/heures.js';
import { facturesDuJour } from './journee/factures.js';
import { voisinDuJour } from './journee/voisin.js';
import { jaugesDuJour } from './journee/jauges.js';
import { decouvertesDuJour } from './journee/decouvertes.js';
import { passifHeure, passifCumul, passifJour, debutJourPassif, hasCheminee, typePuits, chantierEnCours, nouvelEtatPassif } from './passif.js';


// ---------------------------------------------------------------- outils
export const prixGaz = (s) => PRIX.gazKwh * s.prixGazMult;
export const estWeekend = (jour) => jour % 7 >= 5;
export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export function msg(s, texte, type = 'info') { s.messages.unshift({ jour: s.jour, texte, type }); if (s.messages.length > 150) s.messages.length = 150; }
export function debloquer(s, id) {
  if (s.principes.includes(id) || !PRINCIPES[id]) return;
  s.principes.push(id);
  s.volonte = Math.min(100, (s.volonte || 0) + 1);   // la satisfaction de comprendre
  msg(s, `💡 Principe découvert : « ${PRINCIPES[id].titre} ». ${PRINCIPES[id].texte}`, 'principe');
}
export function payer(s, montant, poste) { s.argent -= montant; s.depenses[poste] = (s.depenses[poste] || 0) + montant; }

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
    ecoconduite: !!s.transport?.ecoconduite && !s.transport.voitureVendue && s.transport.mode === 'voiture',
    gamelle: s.transport?.repas === 'emporte',
    jardiner: s.possede.potager && s.sys.potagerDepuis !== null && chapitreDuJour(s.jour).id !== 'hiver',
    feuBois: !!s.possede.poele && s.autonomie?.poele?.mode !== 'eteint' && (chapitreDuJour(s.jour).doy >= 288 || chapitreDuJour(s.jour).doy < 115),
    poules: !!s.possede.poules && (s.autonomie?.poules?.n || 0) > 0,
    toilettesSeches: !!s.possede.toilettesSeches && !!s.autonomie?.toilettes,
    levain: s.sys.pain === 'levain',
  };
}
export function tempsGestes(s) {
  let t = 0;
  for (const [g, on] of Object.entries(gestesActifs(s))) if (on) t += GESTES[g].temps * (s.gestes[g].habitude ? 0.5 : 1);
  return t;
}
export function tempsLibre(s) {
  const t = tempsBudget(s) - tempsGestes(s) - tempsRoutines(s) - tempsTransport(s) - s.tempsUtilise;
  return chantierEnCours(s) ? Math.min(t, 0) : t;   // jour de chantier : tout le temps libre y passe
}
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
export { LAVAGE_MAIN };
export function laverMain(s, id) {
  const V = VETEMENTS[id], v = s.vetements[id];
  if (!v.possede || !V.peau || v.salete < 20) return false;
  if (!prendreTemps(s, LAVAGE_MAIN.temps)) return false;
  const cout = LAVAGE_MAIN.litres / 1000 * PRIX.eauM3 + LAVAGE_MAIN.kwh * PRIX.elecKwh + LAVAGE_MAIN.savon;
  // eau et électricité arrivent sur la facture de la semaine (et la mensualité d'énergie) ; le savon va en produits
  const eauL = LAVAGE_MAIN.litres / 1000 * PRIX.eauM3, elecL = LAVAGE_MAIN.kwh * PRIX.elecKwh;
  payer(s, eauL, 'eau'); payer(s, elecL, 'elec'); payer(s, LAVAGE_MAIN.savon, 'produits');
  s.factureSemaine += eauL + elecL; mensualiser(s, elecL);
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
  if (s.possede[id] || s.argent < prix || horsScenario(id)) return false;
  if (id === 'housse' && !s.possede.bouillotte) return false;
  if (a.cat === 'Ventilation passive' && id !== 'kitRadon') {
    const famille = id.startsWith('cheminee') ? ['chemineeDIY', 'chemineePro'] : ['puitsDIY', 'puitsPro', 'puitsHydro'];
    if (famille.some(k => s.possede[k]) || chantierEnCours(s)) return false;
  }
  const tps = a.temps + (occasion ? 1 : 0);
  if (!prendreTemps(s, tps)) return false;
  if (s.fin?.verrou) debloquer(s, 'coutOpportunite');
  if (a.chantier) {
    s.passif ||= nouvelEtatPassif(s.seed);
    s.passif.chantiers.push({ id, reste: a.chantier, risque: id === 'puitsDIY' });
    if (a.chantier > 0) msg(s, `🏗️ Chantier : ${a.chantier} jour${a.chantier > 1 ? 's' : ''} de temps libre entièrement pris.`, 'info');
  }
  s.possede[id] = true;
  s.prixPayes = s.prixPayes || {}; s.prixPayes[id] = prix;
  if (s.eco) s.eco.achats[id] = s.jour;
  payer(s, prix, 'equipement');
  msg(s, `🛒 ${a.nom}${occasion ? ' d\'occasion' : ''} : −${eur(prix)}${tps ? ` et ${fmtH(tps)}${occasion ? ' (annonce, rendez-vous)' : ' d\'installation'}` : ''}.`, 'achat');
  if (occasion) { debloquer(s, 'occasion'); if (ROI_ITEMS[id]?.revente) debloquer(s, 'residuel'); }
  if (id === 'potager') { s.sys.potagerDepuis = s.jour; if (s.eco) s.eco.jardinDepuis ??= s.jour; }
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
  surAchat(s, id, occasion, { msg: (t, ty) => msg(s, t, ty), debloquer: (x) => debloquer(s, x), payer, prendreTemps });
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

// ---------------------------------------------------------------- physique horaire (js/thermique.js)
export { pasHoraire, humiditeRelative } from './thermique.js';

// ---------------------------------------------------------------- journée : les étapes vivent dans js/journee/
export function jourSuivant(s) {
  if (s.fini || s.dilemme) return;
  appliquerScenario(s);
  appliquerIndices(s);
  instantaneMois(s);   // tableau de bord : dépenses du mois (sans effet sur le jeu)
  routines(s);
  const jm = s.meteo[s.jour];
  const chap = chapitreDuJour(s.jour);
  const hiver = chap.id === 'hiver', ete = chap.id === 'ete';
  const jour = { jour: s.jour, heures: [], kwhRad: { salon: 0, chambre: 0, cuisine: 0 }, eur: { salon: 0, chambre: 0, cuisine: 0 }, appointKwh: 0, elecKwh: 0, elecEur: 0, solaire: 0, climKwh: 0, tempo: jm.tempo };

  // --- moral, rechute et gestes ---
  const { rechute, faits, deprime, coutVolonte } = gestesDuJour(s, {});
  // --- contexte des systèmes (eau chaude, cuisine, électricité, jardin, budget) ---
  const vide = () => new Array(24).fill(0);
  const ctx = {
    jm, chap, faits, elecH: vide(), chaleur: { salon: vide(), chambre: vide(), cuisine: vide() },
    couts: { nourriture: 0, eau: 0, services: 0, plaisirs: 0, transport: 0, imprevus: 0 }, kwh: {},
    d: { sante: 0, hygiene: 0, bienetre: 0, confort: 0 }, tCuisine: s.pieces.cuisine.t,
    msg: (t, ty) => msg(s, t, ty), debloquer: (id) => debloquer(s, id),
  };
  ctx.outils = { payer, prendreTemps: () => true, msg: ctx.msg, debloquer: ctx.debloquer };
  systemesJour(s, ctx);
  transportJour(s, ctx);
  poeleJour(s, ctx);

  // --- lessive du jour ---
  const sechageInterieur = lessiveDuJour(s, { ctx, hiver });

  // --- météo et chauffage, heure par heure ---
  let { poeleKwh, sommeC, nC, froid, chaud, gazKwh, gazBase, climBase, humMax, sommeil, nS, attrJour, elecEur, elecKwh, chauffElecEur, chauffElecKwh, radBaseKwh, surplusH, jourElec, elecChauffage, ventilo, invites } =
    heuresDuJour(s, { ctx, jm, chap, hiver, ete, jour, faits, rechute, sechageInterieur });

  poeleConsommer(s, ctx, poeleKwh, elecChauffage ? PRIX.elecKwh : prixGaz(s) / RENDEMENT_CHAUDIERE);

  // --- surplus solaire : bouilloire → eau stockée (Newton), routeur → ballon ---
  const st = stockerSurplus(s, surplusH, jourElec, ctx, faits, chap);
  elecEur -= st.eurEvites; elecKwh -= st.kwhEvites;
  jour.elecH = jourElec; jour.stockage = st;
  s.solaire.perdu = (s.solaire.perdu || 0) + st.perdu;
  passifJour(s, ctx, chap);
  detecterCombos(s, { faits, chap, st, ctx });
  if (capitalInvesti(s) > 300) debloquer(s, 'opportunite');
  if (s.possede.solaire && ete) debloquer(s, 'saisonnalite');
  if (ventilo && ete) debloquer(s, 'airQuiBouge');
  if (s.rideaux === 'fermes') debloquer(s, 'lumiereJour');
  if (s.sys.pain === 'maison' && ++s.joursPain >= 7) debloquer(s, 'faireSoiMeme');
  if (Object.values(s.roi || {}).some(r => r.entretien > 5)) debloquer(s, 'entretienCout');
  if (Object.entries(s.roi || {}).some(([id, r]) => r.dernier >= (s.prixPayes?.[id] ?? ACHATS[id].prix))) debloquer(s, 'mesureReelle');

  // --- consommation payée, puis voisin ---
  const { aboJour, coutJour } = facturesDuJour(s, { ctx, jm, jour, gazKwh, chauffElecEur, chauffElecKwh, elecEur, elecKwh, elecChauffage, attrJour });
  voisinDuJour(s, { jm, chap, gazBase, radBaseKwh, climBase, aboJour });

  // --- vêtements, humidité, jauges, découvertes ---
  const confortJour = jaugesDuJour(s, { ctx, hiver, ete, faits, invites, deprime, coutVolonte, sommeC, nC, froid, chaud, humMax, sommeil, nS });
  decouvertesDuJour(s, { jm, hiver, ete, faits, jour, confortJour });

  // --- autosuffisance (v1.1) : cumul des parts maison / achetées ---
  autonomieSoir(s, { nourritureAchetee: ctx.couts.nourriture, litresReseau: ctx.litres || 0, litresEvites: ctx.litresEvites || 0, boisKwh: ctx.boisKwh || 0,
    gazUtile: gazKwh * RENDEMENT_CHAUDIERE + chauffElecKwh, appoint: jour.appointKwh || 0, solaireAuto: jour.solaire || 0, elecReseau: elecKwh,
    msg: (x, ty) => msg(s, x, ty), debloquer: (x) => debloquer(s, x) });
  // --- bilan ---
  jour.confort = confortJour; jour.rechute = rechute; jour.cout = coutJour; jour.gazKwh = gazKwh; jour.kwh = ctx.kwh; jour.gaspillage = ctx.gaspillage; jour.litres = ctx.litres;
  s.dernierJour = jour;
  s.historique.push({ jour: s.jour, cout: coutJour, confort: confortJour });
  if (s.historique.length > 140) s.historique.shift();
  s.sommeConfort += confortJour; s.nbJours++;
  s.tempsUtilise = 0;
  // banque et placements : le voisin dépense ce que coûte sa vie ; le calendrier avance (y compris les semaines entre chapitres)
  s.coutVoisinCumul = coutBaseVariable(s) - (s.base.banque || 0);
  if (s.fin) financeJour(s, actions(s));
  s.jour++;
  if (s.jour % 7 === 0) {
    s.factures.push({ semaine: s.jour / 7, montant: s.factureSemaine, parPiece: Object.fromEntries(ORDRE_PIECES.map(p => [p, s.pieces[p].eurSemaine])) });
    msg(s, `📄 Facture de la semaine ${s.jour / 7} (gaz, électricité, eau, abonnements) : ${eur(s.factureSemaine)}.`, 'facture');
    s.factureSemaine = 0;
    for (const p of ORDRE_PIECES) { s.pieces[p].kwhSemaine = 0; s.pieces[p].eurSemaine = 0; }
  }
  if (s.invites && s.jour >= s.invites.jusqua) s.invites = null;
  if (s.jour >= (s.joursTotal || JOURS)) { s.fini = true; return; }
  verifierEvenements(s);
}

// ---------------------------------------------------------------- événements
const jourEvt = (s, e) => { const an = anneeDuJour(s.jour); return Math.round((Date.UTC(2026 + an, 11, 1) - Date.UTC(2026, 11, 1)) / 86400000) + e.jourAn; };
const vu = (s, id) => s.evenementsVus.includes(id + '@' + anneeDuJour(s.jour)) || s.evenementsVus.includes(id);
export function evenementsAVenir(s) {
  return EVENEMENTS.filter(e => { const j = jourEvt(s, e); return j >= s.jour && s.jour >= j - e.annonce && !vu(s, e.id) && !(e.unique && anneeDuJour(s.jour) > 0); }).map(e => ({ ...e, jour: jourEvt(s, e) }));
}
function verifierEvenements(s) {
  const ctxC = { msg: (t, ty) => msg(s, t, ty), debloquer: (id) => debloquer(s, id), racheter: (id) => acheter(s, id), payer };
  const dc = debutJourCampagne(s, ctxC);
  if (dc === 'bilan') faireBilan(s);
  if (dc) { s.dilemme = dc; return; }
  const c = chapitreDuJour(s.jour), an = anneeDuJour(s.jour), cle = `chap-${c.saison}-${an}`;
  if (c.index === 0 && s.jour > 0 && c.saison !== 'hiver' && !s.evenementsVus.includes(cle)) {
    if (an === 0) { s.dilemme = cle; return; }
    s.evenementsVus.push(cle); msg(s, `🍂 ${c.nom} ${dateDuJour(s.jour).getUTCFullYear()} : ${TEXTES_CHAPITRE[c.saison].split('.')[0]}.`, 'annonce');
  }
  for (const e of EVENEMENTS) {
    if (e.unique && an > 0) continue;
    const j = jourEvt(s, e);
    if (e.annonce && s.jour === j - e.annonce) msg(s, `📅 Annonce : ${e.titre}, dans ${e.annonce} jours. ${e.texte}`, 'annonce');
    if (s.jour === j && !vu(s, e.id)) {
      if (e.id === 'panne' && s.machine.enPanne) { s.evenementsVus.push(e.id + '@' + an); continue; }
      s.dilemme = e.id;
    }
  }
}
const TEXTES_CHAPITRE = {
  printemps: 'Mars. Les jours rallongent, il fait 8 à 15 °C dehors : le chauffage peut ralentir, le soleil devient un allié et le jardin s\'éveille.',
  ete: 'Juin. Le danger n\'est plus le froid mais la chaleur : volets fermés le jour, fenêtres ouvertes la nuit, cuisson dehors… tout s\'inverse. Pense à ranger les pulls !',
  automne: 'Septembre. Les nuits fraîchissent, la saison de chauffe reprend mi-octobre : purge les radiateurs, ressors les pulls, récolte le potager et prépare l\'hiver.',
  hiver: 'Décembre. Le froid revient.',
};
export function titreDilemme(s) {
  if (s.dilemme?.startsWith('chap-')) { const id = s.dilemme.split('-')[1]; const c = CHAPITRES.find(x => x.saison === id); return { titre: `Saison : ${c.nom} (${c.debut})`, texte: TEXTES_CHAPITRE[id] }; }
  if (EST_CAMPAGNE(s.dilemme)) return titreCampagne(s, s.dilemme);
  return EVENEMENTS.find(x => x.id === s.dilemme) || { titre: '', texte: '' };
}
const refus = (s) => (s.sys.refusTentations >= 2 ? 'La règle des 48 h est devenue un réflexe : aucun effort.' : 'Un peu frustrant (−2 bien-être).');
const EST_CAMPAGNE = (id) => !!id && (id.startsWith('appareil-') || ['regul', 'assurance', 'renego', 'rentree', 'impots', 'canicule', 'bilan', 'vacances'].includes(id));
const OUTILS = { tempsLibre: (s) => tempsLibre(s) };
export function choixDilemme(s) {
  if (s.dilemme?.startsWith('chap-')) return [{ id: 'ok', texte: 'Continuer', effet: 'Ta maison, tes équipements, tes habitudes et ton argent te suivent.' }];
  if (EST_CAMPAGNE(s.dilemme)) return choixCampagne(s, s.dilemme, OUTILS);
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
  if (EST_CAMPAGNE(id)) {
    resoudreCampagne(s, id, choix, { payer: (s2, m, p) => payer(s2, m, p), msg: (t, ty) => msg(s, t, ty), debloquer: (x) => debloquer(s, x) });
    if (id === 'rentree') s.base.plaisirs = (s.base.plaisirs || 0) + 180;
    s.volonte = Math.max(0, Math.min(100, s.volonte));
    s.evenementsVus.push(id + '@' + s.jour); s.dilemme = null; return true;
  }
  if (id === 'invites') {
    s.invites = { mode: choix, jusqua: s.jour + 2 };
    if (choix === 'chauffer') s.volonte += 5;
    if (choix === 'preter') { s.volonte += 3; debloquer(s, 'lit'); debloquer(s, 'partager'); }
    if (choix === 'pull') s.volonte -= 10;
  }
  if (id === 'promo') { if (choix === 'acheter') acheterVetement(s, 'doudoune', 'eco', 12.5); else refuser(s); }
  if (id === 'livraison') {
    if (choix === 'commander') { payer(s, 17, 'plaisirs'); s.bienetre = Math.min(100, s.bienetre + 3); }
    else if (choix === 'restes') { s.bienetre = Math.min(100, s.bienetre + 1); debloquer(s, 'gaspillage'); debloquer(s, 'congeler'); }
    else refuser(s);
  }
  if (id === 'robot') { if (choix === 'acheter') { payer(s, 199, 'imprevus'); s.bienetre = Math.min(100, s.bienetre + 2); msg(s, '🤖 Robot cuiseur acheté (−199 €). Il prend la poussière…', 'alerte'); } else refuser(s); }
  if (id === 'promoPerissable') {
    if (choix === 'acheter') { payer(s, 12, 'nourriture'); s.promoPerissable = s.jour + 5; }
    if (choix === 'congeler') { payer(s, 6, 'nourriture'); debloquer(s, 'gaspillage'); }
    if (choix === 'passer') debloquer(s, 'prixKilo');
  }
  if (id === 'barbecue') {
    if (choix === 'maison') { payer(s, 5, 'plaisirs'); s.tempsUtilise += 1; debloquer(s, 'partager'); debloquer(s, 'faireSoiMeme'); s.bienetre = Math.min(100, s.bienetre + 6); }
    if (choix === 'achat') { payer(s, 15, 'plaisirs'); s.bienetre = Math.min(100, s.bienetre + 6); }
    if (choix === 'decliner') s.bienetre = Math.max(0, s.bienetre - 4);
  }
  if (id === 'hausse') { s.prixGazMult = 1.12; debloquer(s, 'inflation'); msg(s, '📈 Le gaz passe à ' + prixGaz(s).toFixed(4).replace('.', ',') + ' €/kWh.', 'alerte'); }
  if (id === 'panne') {
    s.machine.enPanne = true;
    if (choix === 'technicien' || choix === 'diy') reparerMachine(s, choix);
    else msg(s, '🧺 Machine en panne : les lessives se feront à la laverie.', 'info');
  }
  s.volonte = Math.max(0, Math.min(100, s.volonte));
  s.evenementsVus.push(id.startsWith('chap-') ? id : id + '@' + anneeDuJour(s.jour));
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
  // v0.6 : dépensé en équipements moins la valeur restante (prix × vie restante) de ce qui est encore possédé
  const residuel = Object.entries(ACHATS).filter(([k]) => s.possede[k]).reduce((t, [k, a]) => {
    const age = Math.max(1, s.jour - (s.eco?.achats?.[k] ?? 0)) / 365;
    // v1.3 : une installation fixe (poêle, ballon thermodynamique) ne garde que la valeur de l'appareil : la pose, le tubage et
    // le raccordement ne se revendent pas et restent au logement (part « pose » des devis : poêle ~45 %, CET ~30 %, Effy/Hellowatt 2026)
    return t + (s.prixPayes?.[k] ?? a.prix) * (1 - (a.pose || 0)) * Math.max(0, 1 - age / a.vie);
  }, 0);
  const equip = Math.max(0, s.depenses.equipement - residuel);
  const vet = Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye * Math.min(1, v.usure / 100) : 0), 0)
    + (s.depenses.vetements - Object.values(s.vetements).reduce((t, v) => t + (v.possede ? v.prixPaye : 0), 0));
  return { equip, vet };
}
const POSTES = ['gaz', 'elec', 'eau', 'produits', 'laverie', 'nourriture', 'services', 'plaisirs', 'imprevus', 'transport', 'banque', 'remplacements', 'sante', 'logement', 'revenus', 'bois'];
export function coutVariable(s) {
  const d = s.depenses;
  return POSTES.reduce((t, k) => t + (d[k] || 0), 0) + d.equipement + d.vetements - (d.reventes || 0);
}
export function coutBaseVariable(s) { const b = s.base; return b.gaz + b.elec + b.eau + b.produits + (b.nourriture || 0) + (b.services || 0) + (b.plaisirs || 0) + (b.transport || 0) + (b.banque || 0) + (b.remplacements || 0); }
export function moyennes(s) {
  const n = Math.max(1, s.nbJours), m = s.sommes;
  return { confort: m.confort / n, sante: m.sante / n, moral: m.volonte / n, hygiene: m.hygiene / n, bienetre: m.bienetre / n };
}

// 8 rechutes sur une campagne de 5 ans ; proportionnel à la durée (au moins 5)
export const seuilRechutes = (ans) => Math.max(5, Math.round(8 * ans / 5));
export function scoreFinal(s) {
  const d = s.depenses, b = s.base;
  const am = amortissement(s);
  const tresorerie = coutVariable(s);
  const cout = tresorerie - d.equipement - d.vetements + am.equip + am.vet;
  const base = coutBaseVariable(s);
  const fin = s.fin ? gainFinancier(s) : { gain: 0, voisin: 0, net: 0 };
  const economies = base - cout + fin.net;
  const pct = base > 0 ? economies / base * 100 : 0;
  const moy = moyennes(s);
  const habitudes = Object.values(s.gestes).filter(g => g.habitude).length;
  const elecPlayer = d.elec - (d.climEur || 0) - (d.appointEur || 0) - (d.eauChaudeEur || 0);
  const elecBase = b.elec - (b.clim || 0) - (b.eauChaude || 0);
  const domaines = [
    { nom: 'Chauffage (gaz + appoint + bois)', valeur: b.gaz - d.gaz - (d.appointEur || 0) - (d.bois || 0) },
    { nom: 'Rafraîchissement (clim)', valeur: (b.clim || 0) - (d.climEur || 0) },
    { nom: 'Eau chaude (ballon)', valeur: (b.eauChaude || 0) - (d.eauChaudeEur || 0) },
    { nom: 'Eau', valeur: b.eau - d.eau },
    { nom: 'Alimentation', valeur: (b.nourriture || 0) - d.nourriture },
    { nom: 'Autre électricité (veilles, éclairage, cuisson, linge, solaire)', valeur: elecBase - elecPlayer },
    { nom: 'Abonnements et services', valeur: (b.services || 0) - d.services },
    { nom: 'Plaisirs', valeur: (b.plaisirs || 0) - d.plaisirs },
    { nom: 'Transport (trajets, repas au travail, assurance)', valeur: (b.transport || 0) - (d.transport || 0) },
    { nom: 'Linge (produits, laverie)', valeur: b.produits - d.produits - d.laverie },
    { nom: 'Équipements (part amortie)', valeur: -am.equip },
    { nom: 'Vêtements (part usée)', valeur: -am.vet },
    { nom: 'Imprévus (rechutes, maladie, pannes, achats impulsifs)', valeur: -d.imprevus },
    { nom: 'Reventes', valeur: d.reventes || 0 },
    { nom: 'Banque (agios, commissions)', valeur: (b.banque || 0) - (d.banque || 0) },
    { nom: 'Remplacement des appareils (choix neuf, reconditionné ou réparation)', valeur: (b.remplacements || 0) - (d.remplacements || 0) },
    { nom: 'Santé (médecin, pharmacie, dentiste : reste à charge)', valeur: -(d.sante || 0) },
    { nom: 'Logement (dégâts de moisissure)', valeur: -(d.logement || 0) },
    { nom: 'Revenus perdus (jours de carence, arrêts, augmentations manquées)', valeur: -(d.revenus || 0) },
    { nom: 'Épargne et placements (net, vs voisin au Livret A)', valeur: fin.net },
  ];
  const reste = economies - domaines.reduce((a, x) => a + x.valeur, 0);
  if (Math.abs(reste) >= 0.5) domaines.push({ nom: 'Autres (bouillotte, arrondis)', valeur: reste });
  const invest = Object.entries(ACHATS).filter(([k]) => s.possede[k] && s.attribution[k] !== undefined)
    .map(([k, a]) => ({ nom: a.nom, prix: a.prix, gain: s.attribution[k], rentable: s.attribution[k] >= a.prix, amorti: s.attribution[k] >= a.prix / a.vie }));
  if (s.attribution.cuisson > 0) invest.push({ nom: 'Récupérer la chaleur de la cuisson (geste)', prix: 0, gain: s.attribution.cuisson, rentable: true });
  const candidats = domaines.filter(x => x.valeur > 0 && !x.nom.startsWith('Autres') && !x.nom.startsWith('Reventes')).map(x => ({ nom: x.nom, gain: x.valeur }));
  const meilleure = candidats.reduce((a, c) => (c.gain > a.gain ? c : a), { nom: '—', gain: 0 });
  // v1.1 (analyse GD, P2) : paliers resserrés en bas, un titre au-dessus de Maître
  // v1.3 (passe GD 2, A) : la bande 22-45 % est scindée en Économe (22-32 %) et Autonome (32-45 %)
  const TITRES = ['Dépensier', 'Malin', 'Optimiseur', 'Économe', 'Autonome', 'Maître de la sobriété', 'Légende de la sobriété'];
  const SEUILS = [8, 15, 22, 32, 45, 62];
  let rang = SEUILS.filter(x => pct >= x).length;
  const notes = [];
  const equilibre = moy.confort >= 70 && moy.sante >= 70 && moy.hygiene >= 60 && moy.bienetre >= 55 && moy.moral >= 40;
  if (rang >= 3 && !equilibre) { rang = 2; notes.push('Économe, Autonome et Maître exigent en moyenne : confort ≥ 70, santé ≥ 70, hygiène ≥ 60, bien-être ≥ 55, moral ≥ 40.'); }
  const ans = Math.max(1, s.nbJours / 365);
  if (rang === 6 && (s.principes.length < 40 || habitudes < 10)) { rang = 5; notes.push('La Légende demande 40 principes et 10 habitudes.'); }
  if (rang === 5 && (s.principes.length < 28 || habitudes < 8)) { rang = 4; notes.push('Maître demande 28 principes et 8 habitudes.'); }
  if (rang >= 5 && s.fin && (fin.net < 0 || s.fin.stats.joursHorsAutorisation > 10 * ans)) { rang = 4; notes.push('Maître demande aussi une épargne au moins aussi bien gérée que le Livret A du voisin, sans découvert hors autorisation répété.'); }
  if (rang >= 2 && moy.hygiene < 45) { rang = 1; notes.push('Économies payées par ton hygiène.'); }
  // v1.3 (passe GD 2, B) : garde-fou dès le rang 1, on ne devient pas « Malin » en sacrifiant son bien-être
  if (rang >= 1 && (moy.bienetre < 40 || s.rechutes >= seuilRechutes(ans))) { rang = 0; notes.push('Économies payées par ton bien-être ou tes rechutes : aucun titre de sobriété.'); }
  if (moy.sante < 50 || moy.confort < 55 || moy.hygiene < 30 || moy.bienetre < 25) { rang = 0; notes.push('Une sobriété qui abîme : santé, confort, hygiène ou bien-être effondrés.'); }
  return { cout, base, economies, pct, moy, confortMoy: moy.confort, sante: s.sante, habitudes, principes: s.principes.length, titre: TITRES[rang], rang, note: notes.join(' '),
    domaines, invest, meilleure, tresorerie, fin,
    patrimoine: s.fin ? s.argent + valeurLiquidation(s) : s.argent, patrimoineVoisin: s.fin ? ARGENT_DEPART + (s.eco?.revenus || 0) - (s.coutVoisinCumul || 0) - (s.base.banque || 0) - (s.fin.voisin.transferts || 0) + s.fin.voisin.livret.solde + s.fin.voisin.livret.courus : null, annees: (s.nbJours / 365), amort: am, capital: capitalInvesti(s), abonnements: d.abonnements };
}

// ---------------------------------------------------------------- oubli des gestes abandonnés (v0.8.1)
export function oublierGestes(s, actifs = gestesActifs(s)) {
  for (const [g, on] of Object.entries(actifs)) {
    const st = s.gestes[g]; if (!st) continue;
    if (on) { st.sansPratique = 0; continue; }
    if (g === 'jardiner' && s.possede.potager) continue;
    if (g === 'feuBois' && s.possede.poele) continue;      // le poêle s'éteint au printemps : pas un abandon   // le potager dort l'hiver : ce n'est pas un abandon
    if (!st.habitude && !st.pratique) { st.sansPratique = 0; continue; }
    st.sansPratique = (st.sansPratique || 0) + 1;
    if (st.habitude) {
      if (st.sansPratique >= HABITUDE_OUBLI.graceJours) {
        st.habitude = false; st.pratique = HABITUDE_OUBLI.retourPratique; st.sansPratique = 0;
        msg(s, `🕸️ « ${GESTES[g].nom} » : ${HABITUDE_OUBLI.graceJours} jours sans le faire, ce n'est plus une habitude. En le reprenant, ${JOURS_HABITUDE - HABITUDE_OUBLI.retourPratique} jours suffiront.`, 'info');
      }
    } else st.pratique = Math.max(0, st.pratique - 1);
  }
}

// ---------------------------------------------------------------- routines automatiques (v0.6)
// Une fois le principe compris, le joueur peut confier les gestes répétitifs au « pilote automatique » :
// lessive pleine à 30 °C, entretien des vêtements, garde-robe et gestes de saison, renouvellement des petits consommables.
export const ROUTINES = {
  lessive: { nom: 'Lessives pleines à 30 °C, séchage à l\'air (dehors l\'été)', principe: 'volume' },
  entretien: { nom: 'Aérer, laver à la main et repriser les vêtements', principe: 'reparer' },
  saisons: { nom: 'Garde-robe, volets, rideaux et bouillotte selon la saison', principe: 'inverse' },
  renouveler: { nom: 'Racheter les petits consommables usés (≤ 60 €)', principe: 'finDeVie' },
};
export const routineDispo = (s, k) => s.principes.includes(ROUTINES[k].principe);
function routines(s) {
  const A = s.auto; if (!A) return;
  const c = chapitreDuJour(s.jour), ete = c.saison === 'ete', hiver = c.saison === 'hiver';
  if (A.saisons && routineDispo(s, 'saisons') && (c.index === 0 || s.jour === 0 || A.saisonVue !== c.saison)) {
    A.saisonVue = c.saison;
    const chauds = ['souscouche', 'sweat', 'polaire', 'pilou', 'plaid', 'chaussettes'];
    for (const [id, v] of Object.entries(s.vetements)) if (v.possede) v.porte = ete ? id === 'tshirt' : hiver || c.saison === 'automne' && c.index > 45 ? (chauds.includes(id) || id === 'tshirt' && !s.vetements.souscouche.possede) : ['sweat', 'tshirt', 'chaussettes'].includes(id);
    if (!Object.values(s.vetements).some(v => v.possede && v.porte)) s.vetements.tshirt.porte = true;
    s.voletsJour = ete; s.ventNuit = ete; s.rideaux = hiver ? 'nuit' : 'ouverts'; s.utiliserBouillotte = hiver && !!s.possede.bouillotte;
    if (s.possede.ventilateur) s.ventilateur = ete;
    if (s.passif && (s.possede.chemineeDIY || s.possede.chemineePro)) s.passif.mode = ete ? 'purgeNuit' : hiver ? 'trombe' : s.passif.mode;
  }
  if (A.entretien && routineDispo(s, 'entretien')) {
    for (const [id, v] of Object.entries(s.vetements)) {
      if (!v.possede) continue;
      if (v.salete >= 45 && !VETEMENTS[id].peau && v.salete < 90 && !v.aere) aererVetement(s, id);
      if (v.usure >= 40 && s.possede.couture) repriser(s, id);
      if (VETEMENTS[id].peau && v.salete >= 75 && tempsLibre(s) > 1) laverMain(s, id);
    }
  }
  if (A.lessive && routineDispo(s, 'lessive') && !s.lessivePrevue) {
    if (s.machine.enPanne) reparerMachine(s, 'diy');
    if (linge(s).length && (remplissage(s) >= 0.75 || Object.values(s.vetements).some(v => v.possede && v.porte && v.salete >= 88)))
      planifierLessive(s, { temp: 30, sechage: !hiver && s.possede.corde ? 'dehors' : 'air', hc: s.sys.tarif !== 'base' });
  }
}

// ---------------------------------------------------------------- bilan annuel (v0.6)
export function faireBilan(s) {
  const r = scoreFinal(s), e = s.eco, prec = e.dernierBilan;
  const an = anneeDuJour(s.jour - 1);
  const dom = Object.fromEntries(r.domaines.map(d => [d.nom, d.valeur]));
  const parDomaine = r.domaines.map(d => ({ nom: d.nom, valeur: d.valeur - (prec?.cumul?.[d.nom] || 0) })).filter(d => Math.abs(d.valeur) >= 1);
  const n = s.nbJours - (prec?.nbJours || 0), sm = s.sommes, ps = prec?.sommes || { confort: 0, sante: 0, volonte: 0, hygiene: 0, bienetre: 0 };
  const moy = Object.fromEntries(['confort', 'sante', 'volonte', 'hygiene', 'bienetre'].map(k => [k, n ? (sm[k] - ps[k]) / n : 0]));
  const v = s.fin ? valeurs(s) : { livrets: 0, total: 0 };
  const rav = resteAVivre(s);
  const objectifs = [];
  const precaution = v.livrets + Math.max(0, s.argent);
  if (precaution < 3 * rav) objectifs.push(`Épargne de précaution : viser 3 mois de reste à vivre (${Math.round(3 * rav)} €) disponibles sur livret ; tu en as ${Math.round(precaution)} €.`);
  if (s.argent > 2 * rav + e.mensualite) objectifs.push(`${Math.round(s.argent - rav)} € dorment sur le compte courant à 0 % : livrets d'abord (Livret A ${(e.taux.livretA * 100).toFixed(1).replace('.', ',')} %${PROFILS_LEP(s) ? ', LEP' : ''}), puis PEA ou assurance vie pour l'argent dont tu n'auras pas besoin avant 5-8 ans.`);
  if (s.fin && !s.fin.pea && s.jour < (s.joursTotal || JOURS) - 365) objectifs.push('Ouvrir un PEA même avec peu : l\'horloge fiscale de 5 ans démarre à l\'ouverture.');
  if (moy.volonte < 50) objectifs.push('Moral moyen sous 50 : moins de nouveaux gestes à la fois, garde un petit budget plaisir.');
  if (moy.confort < 70 || moy.sante < 70) objectifs.push('Confort ou santé moyens sous 70 : remonte d\'un degré la pièce où tu vis, ou investis dans l\'isolation de toi-même (vêtements chauds, bouillotte).');
  const chauf = parDomaine.find(d => d.nom.startsWith('Chauffage'));
  if (!chauf || chauf.valeur < 100) objectifs.push('Chauffage : moins de 100 € gagnés cette année. Robinets thermostatiques, 1 °C de moins la nuit, rideaux fermés le soir.');
  if (objectifs.length < 2) objectifs.push('Garder le cap : tes habitudes travaillent pour toi chaque jour sans effort.');
  e.dernierBilan = { an, cumul: dom, sommes: { ...sm }, nbJours: s.nbJours, parDomaine, moy, economies: r.economies - (prec?.economiesCumul || 0), economiesCumul: r.economies,
    patrimoine: r.patrimoine, patrimoineVoisin: r.patrimoineVoisin, placements: v.total, livrets: v.livrets, salaire: e.salaire, inflation: e.inflationAn, objectifs, gainFin: r.fin.net - (prec?.finCumul || 0), finCumul: r.fin.net };
  e.bilans.push(e.dernierBilan);
  debloquer(s, 'bilanAnnuel');
}
const PROFILS_LEP = (s) => s.fin && s.fin.profil === 'modeste';

// Contexte d'actions pour les systèmes (eau, cuisine, budget…)
export function actions(s) {
  return { prendreTemps: (s2, h) => prendreTemps(s2, h), msg: (t, ty) => msg(s, t, ty), debloquer: (id) => debloquer(s, id) };
}
