// Transport (v0.4) : trajets domicile-travail, courses et loisirs ; vélo, VAE, transports en commun,
// covoiturage, voiture ; télétravail ; repas et boissons au travail ; entretien du vélo.
import { TRANSPORT as T } from './data.js';
import { makeRng } from './rng.js';

export function nouvelEtatTransport() {
  return {
    mode: 'voiture', modeCourses: 'voiture', modeLoisirs: 'voiture',
    teletravail: 2,              // jours de télétravail par semaine (0-3, accord d'entreprise)
    abonnementTC: false,         // sinon tickets à l'unité
    repas: 'achete', courses: 'quotidiennes',
    ecoconduite: false, pressionMois: 0, voitureVendue: false,
    km: { velo: 0, vae: 0, voiture: 0 },
    usure: { pneus: 0, chaine: 0, freins: 0 }, veloEnPanne: false,
    coutReelCalcule: false, kmAnnuel: 0,
  };
}

const estBureau = (s) => { const j = s.jour % 7; return j < 5 && j < 5 - s.transport.teletravail; };

// le mode est-il possible aujourd'hui ?
export function modePossible(s, m) {
  const t = s.transport;
  if (m === 'voiture') return !t.voitureVendue;
  if (m === 'velo') return s.possede.velo && !t.veloEnPanne;
  if (m === 'vae') return s.possede.vae;
  return true;
}
function modeEffectif(s, m, repli = 'commun') { return modePossible(s, m) ? m : repli; }

// temps de transport du jour (h)
export function tempsTransport(s) {
  const t = s.transport; if (!t) return 0;
  let h = 0;
  if (estBureau(s)) h += T.modes[modeEffectif(s, t.mode)].hAR * (t.usure.chaine > 80 && t.mode === 'velo' ? 1.1 : 1);
  const jc = t.courses === 'regroupees' ? [5] : [0, 2, 4, 5];
  if (jc.includes(s.jour % 7)) { const m = modeEffectif(s, t.modeCourses, 'marche'); h += m === 'voiture' ? 0.35 : m === 'marche' ? 0.6 : 0.4; }
  if ([3, 6].includes(s.jour % 7)) { const m = modeEffectif(s, t.modeLoisirs); h += T.modes[m].hAR * (T.kmLoisirs / (2 * T.kmTravail)) ; }
  if (estBureau(s) && t.repas === 'emporte') h += 0.15;
  return h;
}

// coût d'un trajet en € par km selon le mode (pour la comparaison et le jeu)
export function coutKm(s, m, reel = false) {
  const t = s.transport;
  if (m === 'voiture') {
    const carbu = T.conso / 100 * T.carburant * (t.ecoconduite ? 1 - T.ecoconduite : 1) * (1 + T.pressionPerteMois * Math.min(3, t.pressionMois));
    return reel ? Math.max(T.bareme, carbu + T.usureVoiture) : carbu + T.usureVoiture;
  }
  if (m === 'vae') return T.vaeKwh100 / 100 * 0.2001 + 0.03;
  if (m === 'velo') return 0.02;
  return 0;
}

export function transportJour(s, ctx) {
  const t = s.transport, jm = ctx.jm;
  const rng = makeRng(s.seed * 389 + s.jour * 17);
  const jsem = s.jour % 7;
  const pluie = jm.nuage > 0.8, froid = jm.tMoy < 2, canicule = !!jm.canicule;
  let cout = 0, parking = 0;
  const trajets = [];   // [mode, km]
  const bureau = estBureau(s);
  if (bureau) trajets.push([modeEffectif(s, t.mode), 2 * T.kmTravail, 'travail']);
  const jc = t.courses === 'regroupees' ? [5] : [0, 2, 4, 5];
  if (jc.includes(jsem)) trajets.push([modeEffectif(s, t.modeCourses, 'marche'), T.kmCourses, 'courses']);
  if ([3, 6].includes(jsem)) trajets.push([modeEffectif(s, t.modeLoisirs), T.kmLoisirs, 'loisirs']);
  // pression des pneus : se dégrade chaque mois sans vérification
  if (s.jour % 30 === 29) t.pressionMois++;
  for (const [m, km, motif] of trajets) {
    const M = T.modes[m];
    if (m === 'voiture') { cout += km * coutKm(s, 'voiture'); t.km.voiture += km; if (motif === 'travail') parking += T.parkingJour; }
    if (m === 'commun' && !t.abonnementTC) cout += 2 * T.ticket;
    if (m === 'covoiturage') cout += motif === 'travail' ? 2 * T.covoiturage : 2 * T.ticket;
    if (m === 'velo' || m === 'vae') {
      t.km[m] += km; cout += km * coutKm(s, m);
      if (m === 'velo') for (const p of Object.keys(T.pieces)) t.usure[p] += km / T.pieces[p].km * 100;
      // économie mesurée : même trajet en voiture (contrefactuel)
      s.attribution[m] = (s.attribution[m] || 0) + km * (coutKm(s, 'voiture') - coutKm(s, m)) + (motif === 'travail' ? T.parkingJour : 0);
      // risque
      if (rng() < km * T.accidentKm * (s.possede.kitSecu ? 0.4 : 1) * (pluie ? 2 : 1)) {
        ctx.d.sante -= 12; ctx.d.bienetre -= 4; ctx.couts.imprevus += 40;
        ctx.msg(`🚑 Chute à ${M.nom.toLowerCase()} ${pluie ? 'sous la pluie' : ''} : contusions, pharmacie et réparation (−40 €).${s.possede.kitSecu ? '' : ' Un casque et un bon éclairage réduisent fortement le risque.'}`, 'alerte');
        ctx.debloquer('securite');
      }
    }
    // effets physiques et météo
    const part = motif === 'travail' ? 1 : 0.5;
    ctx.d.sante += M.sante * part; ctx.d.bienetre += M.bienetre * part;
    if (M.effort > 0) {
      if (pluie) { const k = s.possede.tenuePluie ? 0.35 : 1; ctx.d.confort -= 6 * k * part; ctx.d.bienetre -= 1.2 * k * part; ctx.d.hygiene -= 0.5 * k; if (!s.possede.tenuePluie && motif === 'travail') ctx.debloquer('equipement'); }
      if (froid) ctx.d.bienetre -= 0.4 * part;
      if (canicule) { ctx.d.sante -= 0.6 * M.effort * part; ctx.d.hygiene -= 0.8 * M.effort; }
      if (motif === 'travail' && M.effort >= 1) ctx.d.hygiene -= 0.3;   // transpiration
      if (m !== 'marche') ctx.debloquer('exercice');
    }
    if (m === 'commun' || m === 'covoiturage') ctx.debloquer('mutualiser');
  }
  if (t.mode === 'voiture' && t.ecoconduite) ctx.debloquer('ecoconduite');
  if (bureau) {
    cout += t.repas === 'achete' ? T.repasAchete : 0;
    if (t.repas === 'achete') ctx.d.bienetre += 0.3; else ctx.debloquer('gamelle');
    const bo = s.possede.gourde ? T.boissonsGourde : T.boissons;
    cout += bo;
    if (s.possede.gourde) s.attribution.gourde = (s.attribution.gourde || 0) + T.boissons - T.boissonsGourde;
    ctx.d.bienetre += 0.25;      // collègues
  } else if (jsem < 5) {
    if (t.teletravail >= 3) ctx.d.bienetre -= 0.35;   // isolement
    ctx.debloquer('teletravail');
  }
  // abonnements
  let fixe = 0;
  if (t.abonnementTC) ctx.debloquer(t.mode === 'commun' ? 'remboursement' : 'abonnementInutile');
  if (t.abonnementTC) fixe += T.abonnementTC * (1 - T.remboursementEmployeur) * 12 / 365;
  if (!t.voitureVendue) fixe += T.assuranceMois * 12 / 365;
  if (t.voitureVendue) ctx.debloquer('possession');
  // courses quotidiennes : achats d'impulsion
  if (t.courses === 'quotidiennes') ctx.couts.nourriture *= 1.06; else ctx.debloquer('regrouper');
  // entretien du vélo
  if (s.possede.velo && !t.veloEnPanne) for (const [p, u] of Object.entries(t.usure)) if (u >= 100) {
    t.veloEnPanne = p;
    ctx.msg(`🔧 Vélo immobilisé : ${p === 'pneus' ? 'pneu crevé et usé' : p === 'chaine' ? 'chaîne usée qui saute' : 'freins usés'}. Répare-le dans l'onglet Transport.`, 'alerte');
  }
  ctx.couts.transport += cout + parking + fixe;
  return { cout: cout + parking + fixe };
}

// voisin : voiture pour tout, 3 jours de bureau, repas et boissons achetés, courses 4 fois/semaine
export function voisinTransport(s) {
  const j = s.jour % 7;
  const kmVoit = T.conso / 100 * T.carburant + T.usureVoiture;
  let c = T.assuranceMois * 12 / 365;
  if (j < 3) c += 2 * T.kmTravail * kmVoit + T.parkingJour + T.repasAchete + T.boissons;
  if ([0, 2, 4, 5].includes(j)) c += T.kmCourses * kmVoit;
  if ([3, 6].includes(j)) c += T.kmLoisirs * kmVoit;
  return c;
}

// ---------- actions ----------
export function reparerVelo(s, mode, ctx) {
  const t = s.transport;
  const p = t.veloEnPanne || Object.entries(t.usure).sort((a, b) => b[1] - a[1])[0][0];
  if (mode === 'atelier') {
    if (s.argent < T.veloEntretienAtelier || !ctx.prendreTemps(s, 0.5)) return false;
    s.argent -= T.veloEntretienAtelier; s.depenses.transport += T.veloEntretienAtelier;
    for (const k of Object.keys(t.usure)) t.usure[k] = 0;
    ctx.msg(`🔧 Révision complète en atelier : −${T.veloEntretienAtelier} €.`, 'info');
  } else {
    if (!s.possede.outilsVelo) return false;
    const prix = T.pieces[p].prix;
    if (s.argent < prix || !ctx.prendreTemps(s, 0.75)) return false;
    s.argent -= prix; s.depenses.transport += prix; t.usure[p] = 0;
    s.attribution.outilsVelo = (s.attribution.outilsVelo || 0) + T.veloEntretienAtelier - prix;
    ctx.msg(`🔧 ${p === 'pneus' ? 'Pneus changés' : p === 'chaine' ? 'Chaîne remplacée' : 'Plaquettes de frein changées'} toi-même : −${prix} € de pièces, 45 min.`, 'info');
    ctx.debloquer('reparer'); ctx.debloquer('entretienPreventif');
  }
  t.veloEnPanne = false;
  return true;
}
export function verifierPression(s, ctx) {
  if (!ctx.prendreTemps(s, 0.15)) return false;
  s.transport.pressionMois = 0;
  ctx.msg('🛞 Pression des pneus vérifiée à la station : −2 à −6 % de carburant par rapport à des pneus sous-gonflés.', 'info');
  ctx.debloquer('entretienPreventif');
  return true;
}
export function vendreVoiture(s, ctx) {
  const t = s.transport;
  if (t.voitureVendue || !ctx.prendreTemps(s, 3)) return false;
  t.voitureVendue = true; s.argent += T.valeurVoiture; s.capitalLibere = (s.capitalLibere || 0) + T.valeurVoiture;
  for (const k of ['mode', 'modeCourses', 'modeLoisirs']) if (t[k] === 'voiture') t[k] = k === 'modeCourses' ? 'marche' : 'commun';
  ctx.msg(`🚗 Voiture vendue ${T.valeurVoiture} € : plus d'assurance (${T.assuranceMois} €/mois) ni d'entretien. Cet argent est un capital récupéré, pas une économie.`, 'decouverte');
  ctx.debloquer('possession');
  return true;
}
export function calculerCoutReel(s, ctx) {
  const t = s.transport;
  if (t.coutReelCalcule || !ctx.prendreTemps(s, 0.3)) return false;
  t.coutReelCalcule = true;
  const k = 2 * T.kmTravail;
  const v = k * coutKm(s, 'voiture') + T.parkingJour, vr = k * T.bareme + T.parkingJour;
  const tc = T.abonnementTC * (1 - T.remboursementEmployeur) / 13;
  ctx.msg(`🧮 Coût réel d'un aller-retour au travail (${k} km) : voiture ${v.toFixed(2).replace('.', ',')} € en carburant, usure et parking, mais ${vr.toFixed(2).replace('.', ',')} € avec l'assurance et la dépréciation (barème fiscal) · transports ${(2 * T.ticket).toFixed(2).replace('.', ',')} € au ticket ou ~${tc.toFixed(2).replace('.', ',')} € avec l'abonnement remboursé à moitié · covoiturage ${(2 * T.covoiturage).toFixed(2).replace('.', ',')} € · vélo ~${(k * 0.02).toFixed(2).replace('.', ',')} €.`, 'decouverte');
  ctx.debloquer('coutReel');
  return true;
}
