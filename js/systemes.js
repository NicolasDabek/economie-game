// Systèmes du quotidien : eau chaude, cuisine, électricité, jardin, budget.
// Chaque journée remplit un contexte : électricité heure par heure (W), chaleur dégagée dans les pièces,
// coûts par domaine et effets sur santé, hygiène, bien-être et moral.
import {
  ELEC, BALLON, DOUCHE, VAISSELLE, REGIMES, CUISINE, ABONNEMENTS, PLAISIRS, MEDIATHEQUE, GRENIER, PRIX, ACHATS,
  TARIFS, CHANGEMENT_TARIF, estHC, LESSIVE,
} from './data.js';
import { soleil } from './meteo.js';
import { makeRng } from './rng.js';

const KWH_L_K = 1.163 / 1000;          // kWh pour chauffer 1 litre de 1 K
const EAU_FIXE = 35;                   // l/jour : WC, lavabo, ménage (identique pour tous)

export function nouvelEtatSystemes() {
  return {
    ballon: { consigne: 65, mode: 'continu' },          // continu | hc | midi
    douche: { minutes: 10, frequence: 'quotidienne', seau: false },
    vaisselle: 'courante', vaisselleHC: false,
    regime: 'classique', pain: 'baguette', vrac: false, cuisineSolaire: false,
    frigo: { reglage: 2, givre: 0.1 },
    tarif: 'base', tarifFutur: null, tarifEffet: null,
    abonnements: Object.fromEntries(Object.keys(ABONNEMENTS).map(k => [k, { actif: true, renegocie: false }])),
    relevesFaits: false, mediatheque: false,
    plaisirs: 20,
    grenier: Object.fromEntries(Object.keys(GRENIER).map(k => [k, false])),
    potagerDepuis: null, pluie: 0,
    refusTentations: 0,
    legioAlerte: false,
  };
}

// ---------------------------------------------------------------- temps des routines quotidiennes
export function tempsRoutines(s) {
  const y = s.sys, R = REGIMES[y.regime];
  let t = R.temps * (s.possede.autocuiseur && y.regime !== 'livraison' ? 0.8 : 1);
  if (y.regime === 'batch' && !s.possede.boites) t += 0.4;
  if (y.pain === 'maison') t += 0.25;
  t += VAISSELLE[y.vaisselle].temps;
  if (y.cuisineSolaire && (s.possede.fresnel || s.possede.fourSolaire)) t += 0.15;
  return t;
}

// ---------------------------------------------------------------- prix de l'électricité à l'heure h
export function prixElec(s, h, couleur) {
  return TARIFS[s.sys.tarif].prix(h, couleur || 'bleu');
}
export function changerTarif(s, option, ctx) {
  if (option === s.sys.tarif || option === s.sys.tarifFutur || !TARIFS[option]) return false;
  if (!ctx.prendreTemps(s, CHANGEMENT_TARIF.temps)) return false;
  s.sys.tarifFutur = option; s.sys.tarifEffet = s.jour + CHANGEMENT_TARIF.delai;
  ctx.msg(`📝 Demande de passage en option ${TARIFS[option].nom} : effectif dans ${CHANGEMENT_TARIF.delai} jours (prochaine relève). Gratuit.`, 'info');
  return true;
}

// répartit une énergie (kWh) sur des heures, plafonnée par heure (W)
function repartir(elecH, kwh, heures, pMax) {
  let reste = kwh * 1000;
  for (const h of heures) { if (reste <= 0) break; const x = Math.min(pMax, reste); elecH[h] += x; reste -= x; }
  if (reste > 0) elecH[heures[0]] += reste;
}
const plage = (a, b) => { const r = []; for (let h = a; h !== b; h = (h + 1) % 24) r.push(h); return r; };

// ---------------------------------------------------------------- journée du joueur
const attr = (s, id, eur) => { if (s.possede[id] && eur) s.attribution[id] = (s.attribution[id] || 0) + eur; };
export function systemesJour(s, ctx) {
  const { jm, chap, faits } = ctx;
  const y = s.sys;
  const rng = makeRng(s.seed * 977 + s.jour * 13);
  const elecH = ctx.elecH, chaleur = ctx.chaleur;
  const hiver = chap.id === 'hiver', ete = chap.id === 'ete';
  const weekend = s.jour % 7 >= 5;

  // changement de tarif effectif
  if (y.tarifFutur && s.jour >= y.tarifEffet) {
    y.tarif = y.tarifFutur; y.tarifFutur = null;
    ctx.msg(`⚡ Ton contrat est maintenant en option ${TARIFS[y.tarif].nom}.`, 'info');
    if (y.tarif !== 'base') ctx.debloquer('decaler');
    ctx.debloquer('contrat');
  }

  if (y.ballon.mode === 'hc' && y.tarif === 'base') ctx.debloquer('faussePiste');
  // ---------- Électricité de fond ----------
  const veilles = s.possede.multiprise && faits.multiprise ? ELEC.veillesCoupees : ELEC.veilles;
  const lumW = s.possede.led ? ELEC.eclairageLED : ELEC.eclairageVieux;
  for (let h = 0; h < 24; h++) {
    elecH[h] += veilles + ELEC.box;
    if (!weekend && h >= 9 && h < 18) elecH[h] += ELEC.ordinateur;
    const [soir, matin] = chap.lumiere;
    if ((h >= Math.floor(soir) && h < 23) || (h >= 7 && h < matin)) elecH[h] += lumW;
    if (ete && faits.voletsJour && h >= 9 && h < 18) elecH[h] += lumW * 0.4; // maison sombre volets fermés
  }
  {
    const pe = TARIFS[y.tarif].prix(20, jm.tempo || 'bleu');
    const [soir, matin] = chap.lumiere;
    const hLum = (23 - Math.floor(soir)) + Math.max(0, matin - 7);
    attr(s, 'led', (ELEC.eclairageVieux - ELEC.eclairageLED) * hLum / 1000 * pe);
    if (faits.multiprise) attr(s, 'multiprise', (ELEC.veilles - ELEC.veillesCoupees) * 24 / 1000 * pe);
  }
  // frigo
  y.frigo.givre = Math.min(0.35, y.frigo.givre + 0.008);
  let frigo = ELEC.frigoKwh * (1 + y.frigo.givre) * (y.frigo.reglage <= 2 ? 1.2 : 1) * (ete ? 1.15 : 1) + (faits.frigo ? 0 : 0.08);
  repartir(elecH, 0, [0], 0);
  for (let h = 0; h < 24; h++) elecH[h] += frigo * 1000 / 24;
  ctx.kwh.frigo = frigo;

  // ---------- Cuisine ----------
  const R = REGIMES[y.regime];
  let kwhCuisson = R.kwh;
  const peC = TARIFS[y.tarif].prix(19, jm.tempo || 'bleu');
  if (faits.couvercle) kwhCuisson *= 0.8;
  if (s.possede.autocuiseur && y.regime !== 'livraison') { attr(s, 'autocuiseur', kwhCuisson * 0.35 * peC); kwhCuisson *= 0.65; }
  if (s.possede.marmite && ['maison', 'batch', 'austere'].includes(y.regime)) { attr(s, 'marmite', kwhCuisson * 0.2 * peC); kwhCuisson *= 0.8; }
  if (faits.bouilloire) kwhCuisson = Math.max(0.1, kwhCuisson - 0.1);
  if (y.pain === 'maison') kwhCuisson += y.regime === 'batch' ? 0.1 : CUISINE.painMaisonKwh;
  let solaireCuisine = 0;
  const clair = jm.nuage < 0.35;
  if (y.cuisineSolaire && clair && y.regime !== 'livraison') {
    let f = 0;
    if (s.possede.fourSolaire) f = Math.max(f, hiver ? 0.25 : 0.6);
    if (s.possede.fresnel) f = Math.max(f, hiver ? 0.45 : 0.6);
    solaireCuisine = kwhCuisson * f;
    attr(s, s.possede.fourSolaire ? 'fourSolaire' : 'fresnel', solaireCuisine * peC);
    kwhCuisson -= solaireCuisine;
    if (f > 0) ctx.debloquer('soleilCuit');
    if (s.possede.fresnel && !s.possede.fourSolaire && !s.possede.lunettes && rng() < 0.2) {
      ctx.d.sante -= 6; ctx.d.bienetre -= 3;
      ctx.msg('🔥 Éblouissement et petite brûlure avec la lentille de Fresnel ! Des lunettes de protection s\'imposent.', 'alerte');
      ctx.debloquer('danger');
    }
    if (hiver && s.possede.fresnel && s.possede.pierre) { for (let h = 18; h < 22; h++) chaleur.salon[h] += 300; attr(s, 'pierre', 1.2 / 0.85 * PRIX.gazKwh); }
  }
  ctx.kwh.cuisson = kwhCuisson; ctx.kwh.cuissonSolaire = solaireCuisine;
  elecH[12] += kwhCuisson * 400; elecH[19] += kwhCuisson * 600;
  const dehors = ete && solaireCuisine > 0;
  chaleur.cuisine[12] += kwhCuisson * 400 * 0.7; chaleur.cuisine[19] += kwhCuisson * 600 * 0.7 * (dehors ? 0.6 : 1);

  // coût de la nourriture
  let gaspi = CUISINE.gaspillageBase - (faits.liste ? 0.07 : 0) - (y.regime === 'batch' && s.possede.boites ? 0.05 : 0) - (s.possede.sechoir ? 0.02 : 0);
  if (y.regime === 'livraison') gaspi -= 0.1;
  if (s.promoPerissable && s.jour < s.promoPerissable) gaspi += 0.15;
  gaspi = Math.max(0.03, gaspi);
  let nourriture = R.cout * (1 + gaspi) / (1 + CUISINE.gaspillageBase);
  if (faits.prixKilo) nourriture *= 0.92;
  if (y.vrac) nourriture *= faits.prixKilo ? 0.96 : 1.08;
  nourriture += y.pain === 'maison' ? CUISINE.painMaison : CUISINE.painBaguette;
  if (s.possede.herbes) { nourriture -= 0.2; attr(s, 'herbes', 0.2); }
  if (y.regime === 'batch' && s.possede.boites) attr(s, 'boites', 0.05 * R.cout / (1 + CUISINE.gaspillageBase));
  attr(s, 'sechoir', 0.02 * R.cout / (1 + CUISINE.gaspillageBase));
  // potager
  let recolte = 0;
  if (s.possede.potager && y.potagerDepuis !== null && chap.id !== 'hiver' && s.jour - y.potagerDepuis >= 21 && faits.jardiner) {
    recolte = (ete ? 1.3 : 0.5) * (s.possede.composteur ? 1.3 : 1);
    ctx.debloquer('cycles');
    attr(s, 'potager', recolte / (s.possede.composteur ? 1.3 : 1));
    attr(s, 'composteur', recolte - recolte / (s.possede.composteur ? 1.3 : 1));
  }
  nourriture = Math.max(1, nourriture - recolte);
  ctx.couts.nourriture += nourriture;
  ctx.gaspillage = gaspi; ctx.recolte = recolte;
  ctx.d.sante += R.sante + (recolte > 0 ? 0.1 : 0);
  ctx.d.bienetre += R.bienetre + (faits.jardiner && s.possede.potager ? 0.6 : 0) + (y.pain === 'maison' ? 0.3 : 0);
  if (y.regime === 'batch' && !s.possede.boites) ctx.d.hygiene -= 0.3;

  // ---------- Eau chaude et eau froide ----------
  const tf = chap.tEauFroide;
  const doucheAuj = y.douche.frequence === 'quotidienne' || s.jour % 2 === 0;
  let lMix = 0, eauFroide = EAU_FIXE;
  if (doucheAuj) {
    if (y.douche.seau && s.possede.seau) lMix = DOUCHE.seau;
    else {
      const debit = s.possede.pommeau ? DOUCHE.debitEco : DOUCHE.debitVieux;
      lMix = debit * y.douche.minutes * (faits.couperEau ? 1 - DOUCHE.coupureSavon : 1);
      if (s.possede.pommeau) { const l = (DOUCHE.debitVieux - DOUCHE.debitEco) * y.douche.minutes * (faits.couperEau ? 1 - DOUCHE.coupureSavon : 1);
        attr(s, 'pommeau', l * KWH_L_K * (38 - chap.tEauFroide) * TARIFS[y.tarif].prix(y.ballon.mode === 'hc' ? 2 : 13, jm.tempo || 'bleu') + l / 1000 * PRIX.eauM3); }
      if (faits.recupEau && s.possede.seau) { eauFroide -= DOUCHE.recupFroide; attr(s, 'seau', 2 * DOUCHE.recupFroide / 1000 * PRIX.eauM3); }
      else eauFroide += DOUCHE.recupFroide;
    }
  }
  const V = VAISSELLE[y.vaisselle];
  const lvJour = y.vaisselle === 'lvQuotidien' || (y.vaisselle === 'lvPleinEco' && s.jour % 2 === 0);
  let lChaudVaisselle = (V.litresChauds || 0) * (y.vaisselle === 'courante' && s.possede.mousseurs ? 0.6 : 1);
  if (y.vaisselle === 'courante' && s.possede.mousseurs) { const l = V.litresChauds * 0.4; attr(s, 'mousseurs', l * KWH_L_K * (45 - chap.tEauFroide) * 0.2 + l / 1000 * PRIX.eauM3); }
  eauFroide += lvJour ? V.litresFroids : 0;
  const kwhECS = lMix * KWH_L_K * (38 - tf) + lChaudVaisselle * KWH_L_K * (45 - tf);
  const tAmb = ctx.tCuisine;
  const pertesW = BALLON.UA * (s.possede.jaquette ? 1 - BALLON.jaquette : 1) * Math.max(0, y.ballon.consigne - tAmb);
  const kwhPertes = pertesW * 24 / 1000;
  if (s.possede.jaquette) attr(s, 'jaquette', BALLON.UA * BALLON.jaquette * Math.max(0, y.ballon.consigne - tAmb) * 24 / 1000 * TARIFS[y.tarif].prix(y.ballon.mode === 'hc' ? 2 : 13, jm.tempo || 'bleu'));
  for (let h = 0; h < 24; h++) chaleur.cuisine[h] += pertesW;
  const kwhBallon = kwhECS + kwhPertes;
  const heuresBallon = y.ballon.mode === 'hc' ? plage(22, 6) : y.ballon.mode === 'midi' ? plage(11, 16) : [8, 9, 20, 21, 7, 10, 19, 22];
  repartir(elecH, kwhBallon, heuresBallon, BALLON.puissance);
  ctx.kwh.ballon = kwhBallon; ctx.kwh.ballonPertes = kwhPertes;
  // capacité du ballon si chauffe concentrée
  const stock = BALLON.litres * KWH_L_K * (y.ballon.consigne - tf);
  if (y.ballon.mode !== 'continu' && kwhECS > stock * 0.85) {
    ctx.d.hygiene -= 1; ctx.d.bienetre -= 1.5; ctx.d.confort -= 5;
    ctx.msg('🚿 Le ballon est vide avant la fin de la douche : douche froide !', 'alerte'); ctx.debloquer('dimensionner');
  }
  // légionelles
  if (y.ballon.consigne < BALLON.legionelles) {
    ctx.d.sante -= y.ballon.consigne < 50 ? 0.7 : 0.3;
    if (!y.legioAlerte) { y.legioAlerte = true; ctx.msg(`🦠 Ballon à ${y.ballon.consigne} °C : sous 55 °C, les légionelles peuvent proliférer.`, 'alerte'); ctx.debloquer('legionelles'); }
  } else if (y.ballon.consigne <= 60) ctx.debloquer('legionelles');
  if (kwhECS > 0 && (s.possede.pommeau || faits.couperEau)) ctx.debloquer('eauChaude');
  // lave-vaisselle
  if (lvJour) repartir(elecH, V.kwh, y.vaisselleHC ? [23, 0] : [21, 22], 2000);
  ctx.kwh.vaisselle = lvJour ? V.kwh : 0;
  // jardin : arrosage
  let arrosage = 0;
  if (s.possede.potager && chap.id !== 'hiver' && faits.jardiner) {
    arrosage = ete ? (jm.canicule ? 30 : 20) : 8;
    if (jm.nuage > 0.75 && s.possede.cuve) y.pluie = Math.min(300, y.pluie + 60);
    const dePluie = s.possede.cuve ? Math.min(y.pluie, arrosage) : 0;
    y.pluie -= dePluie; arrosage -= dePluie; attr(s, 'cuve', dePluie / 1000 * PRIX.eauM3);
    if (faits.recupEau && s.possede.seau) arrosage = Math.max(0, arrosage - DOUCHE.recupFroide);
  }
  const litresEau = lMix + lChaudVaisselle + eauFroide + arrosage;
  ctx.couts.eau += litresEau / 1000 * PRIX.eauM3;
  ctx.litres = litresEau;

  // hygiène corporelle et de la cuisine
  let dh = -2.5 * (jm.canicule ? 1.5 : 1);
  if (doucheAuj) dh += y.douche.seau ? 3.2 : Math.min(5, 1.2 + y.douche.minutes * 0.6);
  if (y.douche.seau) ctx.d.bienetre -= 1.2;
  if (y.douche.minutes >= 8 && !y.douche.seau) ctx.d.bienetre += 0.3;
  dh += y.vaisselle === 'bassine' ? 0.4 : 0.5;
  if (s.possede.composteur) dh += 0.2;
  ctx.d.hygiene += dh;
  if (doucheAuj && y.douche.minutes <= 5 && !y.douche.seau && s.vetements.souscouche?.possede) ctx.debloquer('hygiene');

  // ---------- Budget : abonnements, plaisirs ----------
  let services = 0, plaisirAbo = 0;
  for (const [k, a] of Object.entries(ABONNEMENTS)) {
    const st = y.abonnements[k];
    if (!st.actif) continue;
    services += (st.renegocie ? a.renegocie : a.mois) * 12 / 365;
    plaisirAbo += a.plaisir;
  }
  if (y.mediatheque) plaisirAbo += 0.5;
  ctx.couts.services += services;
  ctx.couts.plaisirs += y.plaisirs / 7;
  ctx.d.bienetre += plaisirAbo + PLAISIRS[y.plaisirs];
  if (y.plaisirs === 0) ctx.debloquer('plaisir');
}

// ---------------------------------------------------------------- le voisin « sans réfléchir »
// Base, ballon 65 °C, douche de 10 min au vieux pommeau, vaisselle à l'eau courante, courses classiques,
// tous ses abonnements, 20 €/semaine de plaisirs.
export function voisinJour(s, jm, chap) {
  const tf = chap.tEauFroide;
  const kwhECS = 12 * 10 * KWH_L_K * (38 - tf) + 30 * KWH_L_K * (45 - tf);
  const kwhBallon = kwhECS + BALLON.UA * (65 - 19) * 24 / 1000;
  const [soir, matin] = chap.lumiere;
  const hLum = (23 - Math.floor(soir)) + Math.max(0, matin - 7);
  const kwhElec = (ELEC.veilles + ELEC.box) * 24 / 1000 + ELEC.eclairageVieux * hLum / 1000
    + (s.jour % 7 < 5 ? ELEC.ordinateur * 9 / 1000 : 0) + ELEC.frigoKwh * 1.2 * (chap.id === 'ete' ? 1.15 : 1)
    + REGIMES.classique.kwh + kwhBallon;
  const litres = 120 + 30 + EAU_FIXE + 4;
  let services = 0;
  for (const a of Object.values(ABONNEMENTS)) services += a.mois * 12 / 365;
  return {
    eauChaude: kwhBallon * PRIX.elecKwh, elec: kwhElec * PRIX.elecKwh, eau: litres / 1000 * PRIX.eauM3,
    nourriture: REGIMES.classique.cout + CUISINE.painBaguette, services, plaisirs: 20 / 7,
    kwhBallon, kwhElecHorsBallon: kwhElec - kwhBallon,
  };
}

// ---------------------------------------------------------------- actions ponctuelles
export function faireReleves(s, ctx) {
  if (s.sys.relevesFaits) return false;
  if (!ctx.prendreTemps(s, 1.5)) return false;
  s.sys.relevesFaits = true;
  const caches = Object.entries(ABONNEMENTS).filter(([, a]) => a.cache).map(([, a]) => `${a.nom} (${a.mois.toFixed(2).replace('.', ',')} €/mois)`);
  ctx.msg(`📒 Carnet de comptes : en épluchant tes relevés, tu découvres ${caches.join(', ')}.`, 'decouverte');
  ctx.debloquer('oublis'); ctx.debloquer('mesure');
  if (s.sys.vrac && !s.gestes.prixKilo.habitude) { ctx.msg('📒 Et le vrac t\'a coûté 8 % plus cher que les paquets…', 'decouverte'); ctx.debloquer('vrac'); }
  return true;
}
export function resilier(s, id, ctx) {
  const st = s.sys.abonnements[id];
  if (!st?.actif || (ABONNEMENTS[id].cache && !s.sys.relevesFaits)) return false;
  if (!ctx.prendreTemps(s, 0.3)) return false;
  st.actif = false;
  ctx.msg(`✂️ Abonnement résilié : ${ABONNEMENTS[id].nom}.`, 'info');
  return true;
}
export function renegocier(s, ctx) {
  const st = s.sys.abonnements.forfait;
  if (!st.actif || st.renegocie) return false;
  if (!ctx.prendreTemps(s, 0.5)) return false;
  st.renegocie = true;
  ctx.msg(`📱 Forfait renégocié : ${ABONNEMENTS.forfait.renegocie.toFixed(2).replace('.', ',')} €/mois au lieu de ${ABONNEMENTS.forfait.mois.toFixed(2).replace('.', ',')} €.`, 'info');
  return true;
}
export function revendre(s, id, ctx) {
  const g = GRENIER[id];
  if (s.sys.grenier[id] || !ctx.prendreTemps(s, g.temps)) return false;
  s.sys.grenier[id] = true; s.argent += g.prix; s.depenses.reventes = (s.depenses.reventes || 0) + g.prix;
  if (g.bienetre) s.bienetre = Math.max(0, s.bienetre + g.bienetre);
  ctx.msg(`💰 Vendu en ligne : ${g.nom} (+${g.prix} €).`, 'achat');
  ctx.debloquer('revendre');
  return true;
}
export function degivrer(s, ctx) {
  if (s.sys.frigo.givre < 0.1 || !ctx.prendreTemps(s, 1)) return false;
  s.sys.frigo.givre = 0; s.hygiene = Math.min(100, s.hygiene + 2);
  ctx.msg('🧊 Frigo dégivré et nettoyé.', 'info'); ctx.debloquer('frigo');
  return true;
}
export function prendreMediatheque(s, ctx) {
  if (s.sys.mediatheque || s.argent < MEDIATHEQUE) return false;
  s.sys.mediatheque = true; s.argent -= MEDIATHEQUE; s.depenses.services += MEDIATHEQUE;
  ctx.msg(`📚 Carte de médiathèque : ${MEDIATHEQUE} €/an pour des livres, films et jeux à volonté.`, 'achat');
  return true;
}
