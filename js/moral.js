// Moral et santé sur la durée (v0.7). Le moral tend chaque jour vers une ligne de base qui dépend du bien-être,
// de la santé, du confort, de la lumière, de la vie sociale, de la nouveauté des plaisirs, des vacances et du stress.
// La santé a un coût : consultations, arrêts maladie, soins dentaires négligés, dégâts de moisissure.
// Un moral bas se paie aussi : achats compulsifs, rechutes plus chères, augmentation individuelle perdue.
// Sources des chiffres : voir docs/prix.md, section v0.7.
import { MORAL, SANTE_COUTS } from './data.js';
import { makeRng } from './rng.js';
import { dateDuJour } from './meteo.js';
import { valeurs } from './finance.js';
import { palierMoral, palierBE, EFFETS_PALIERS as EP } from './paliers.js';

export function nouvelEtatMoral() {
  return { adapt: 0, plaisirs: null, regime: null, regimeJours: 0, social: 0.5, vacances: null, panne: -999, picRisque: 0,
    dentaire: 0, moisi: 0, prochainEpisode: 0, episodes: 0, joursArret: 0, an: { n: 0, volonte: 0, hygiene: 0 }, facteurSalaire: 1, detail: {}, raisons: [] };
}

// durée du jour à Paris (h) selon le jour de l'année : 8 h 10 au solstice d'hiver, 16 h 10 en juin
export function dureeJour(doy) { return 12.15 - 4 * Math.cos(2 * Math.PI * (doy + 10) / 365); }
const NIVEAU_PLAISIR = { 0: 0, 10: 0.55, 20: 0.85, 35: 1 };

/** Met à jour le moral de la journée. ctx : { confortJour, coutVolonte, doy, payer, msg } */
export function moralJour(s, ctx) {
  const m = s.mor, M = MORAL, d = {};
  // adaptation hédonique : un plaisir répété perd de son effet, la nouveauté le recharge
  const p = s.sys.plaisirs;
  if (m.plaisirs !== null && m.plaisirs !== p) m.adapt *= M.nouveaute;
  m.plaisirs = p;
  m.adapt += (M.adaptMax - m.adapt) / M.adaptJours;
  d.plaisirs = p > 0 ? M.plaisir * NIVEAU_PLAISIR[p] * (1 - m.adapt) : -M.privation;
  // vie sociale : sorties, invitations, hygiène (la gêne isole)
  const socJour = Math.min(1, NIVEAU_PLAISIR[p] * 0.8 + (s.transport?.teletravail >= 3 ? 0 : 0.2)) * (s.hygiene < 40 ? 0.4 : 1);
  m.social += (socJour - m.social) / 30;
  d.social = M.social * (m.social - 0.5);
  // lumière : blues de l'hiver (jours courts), atténué par les rideaux ouverts
  const D = dureeJour(ctx.doy);
  d.lumiere = -M.blues * Math.max(0, (12 - D) / 4) * (s.rideaux === 'fermes' ? 1.4 : 1);
  // monotonie de l'assiette
  const reg = s.sys.regime;
  if (reg === m.regime) m.regimeJours++; else { m.regime = reg; m.regimeJours = 0; }
  d.monotonie = -Math.min(M.monotonieMax, Math.max(0, m.regimeJours - 21) / 10) * (M.monotonie[reg] ?? 0.3);
  // vacances : effet qui s'estompe sur deux mois
  d.vacances = m.vacances ? m.vacances.effet * Math.exp(-(s.jour - m.vacances.jour) / 45) : 0;
  // stress : argent, découvert, marchés, pannes
  const v = s.fin ? valeurs(s) : { livrets: 0, risque: 0 };
  const rav = s.eco ? s.eco.salaire - s.eco.loyer : 1500;
  const precaution = Math.max(0, s.argent) + v.livrets;
  let stress = 0;
  if (s.argent < 0) stress += M.stressDecouvert;
  stress += M.stressPrecaution * Math.max(0, 1 - precaution / rav);
  m.picRisque = Math.max(m.picRisque * 0.998, v.risque);
  if (m.picRisque > 500 && v.risque < 0.85 * m.picRisque) stress += M.stressMarche;
  if (s.jour - m.panne < 30) stress += M.stressPanne;
  if (s.malade) stress += M.stressMaladie;
  d.stress = -stress;
  // maîtrise : voir son budget tenu (ou filer) pèse sur le moral
  d.controle = M.controle * Math.max(-0.5, Math.min(1, (ctx.pctEco || 0) / 0.4));
  // palier de bien-être (v0.8.1) : sommeil et énergie tirent le moral
  d.sommeil = EP.baseBE[palierBE(s.bienetre).id] || 0;
  // ligne de base
  const base = M.base + M.kBienetre * (s.bienetre - 55) + M.kSante * (s.sante - 75) + M.kConfort * (ctx.confortJour - 75)
    + d.controle + d.sommeil + d.plaisirs + d.social + d.lumiere + d.monotonie + d.vacances + d.stress;
  m.base = base; m.detail = d;
  s.volonte = Math.max(0, Math.min(100, s.volonte + (base - s.volonte) / M.inertie - ctx.coutVolonte));
  // moral très bas : achats compulsifs
  const r = makeRng(s.seed * 131 + s.jour * 17 + 3);
  if (s.volonte < M.seuilCompulsif && r() < M.probaCompulsif * (M.seuilCompulsif - s.volonte) / M.seuilCompulsif) {
    const x = Math.round(15 + 45 * r()); ctx.payer(s, x, 'imprevus');
    ctx.msg(`🛍️ Coup de blues : achat compulsif en ligne (−${x} €).`, 'alerte');
  }
  // moral fragile (v0.8.1) : petites tentations d'achat
  if (palierMoral(s.volonte).id === 'fragile' && r() < EP.tentation.proba) {
    const x = Math.round(EP.tentation.min + (EP.tentation.max - EP.tentation.min) * r()); ctx.payer(s, x, 'imprevus');
    ctx.msg(`🛒 Moral fragile : petit achat pour se remonter (−${x} €).`, 'alerte');
  }
  const a = m.an; a.n++; a.volonte += s.volonte; a.hygiene += s.hygiene; a.bienetre = (a.bienetre || 0) + s.bienetre;
  m.raisons = Object.entries(d).filter(([, x]) => Math.abs(x) >= 1).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
}

/** Rechute : la frénésie coûte plus qu'un repas livré. */
export function coutRechute(s) { const r = makeRng(s.seed * 7 + s.jour * 29); return Math.round(40 + 80 * r()); }

/** Coûts de santé et de logement de la journée. ctx : { payer, msg, salaireJour } */
export function santeJour(s, ctx) {
  const m = s.mor, C = SANTE_COUTS, r = makeRng(s.seed * 97 + s.jour * 13 + 1);
  // malnutrition : pâtes et riz pendant des semaines → carences
  if (s.sys.regime === 'austere' && m.regimeJours > 45) s.sante = Math.max(0, s.sante - C.carences);
  // épisode de maladie : consultation, médicaments, arrêt de travail avec jours de carence
  const seuilMal = palierBE(s.bienetre).min < 35 ? EP.seuilMaladieEpuise : C.seuilMaladie;   // épuisé : on tombe malade plus vite
  if (s.sante < seuilMal && s.jour >= m.prochainEpisode) {
    const jours = s.sante < 20 ? 7 : s.sante < 30 ? 5 : 3;
    const soins = C.resteConsultation + C.franchiseBoite * 3 + C.pharmacieNonRemb;
    const sj = ctx.salaireJour;
    const perte = Math.min(jours, C.carence) * sj + Math.max(0, jours - C.carence) * sj * (1 - C.ijNet);
    ctx.payer(s, soins, 'sante'); ctx.payer(s, perte, 'revenus');
    m.episodes++; m.joursArret += jours; m.prochainEpisode = s.jour + 25 + Math.round(20 * r());
    s.malade = true; s.volonte = Math.max(0, s.volonte - 8);
    ctx.msg(`🤒 Malade : médecin et pharmacie (−${Math.round(soins)} € après Sécu et mutuelle) et ${jours} jours d'arrêt, dont ${Math.min(jours, C.carence)} de carence non payés (−${Math.round(perte)} € de salaire).`, 'alerte');
  } else if (s.sante > 55) s.malade = false;
  // soins dentaires négligés : une hygiène basse finit en couronne
  if (s.hygiene < 50) m.dentaire++;
  if (m.dentaire >= C.joursDentaire) {
    m.dentaire = 0; ctx.payer(s, C.dentaire, 'sante'); s.volonte = Math.max(0, s.volonte - 10);
    ctx.msg(`🦷 Rage de dents : carie négligée, dévitalisation et couronne (−${C.dentaire} € de reste à charge).`, 'alerte');
  }
  // moisissures installées : traitement, peinture, retenue sur le dépôt de garantie
  if (s.moisissure >= 3) m.moisi++;
  if (m.moisi >= C.joursMoisi) {
    m.moisi = 0; ctx.payer(s, C.moisi, 'logement');
    ctx.msg(`🍄 Les moisissures ont gagné les murs : traitement fongicide, joints et peinture (−${C.moisi} €).`, 'alerte');
  }
}

function arret(s, ctx, jours, soins) {
  const C = SANTE_COUTS, sj = ctx.salaireJour;
  const perte = Math.min(jours, C.carence) * sj + Math.max(0, jours - C.carence) * sj * (1 - C.ijNet);
  ctx.payer(s, soins, 'sante'); ctx.payer(s, perte, 'revenus');
  s.mor.episodes++; s.mor.joursArret += jours;
  return perte;
}
/** Paliers extrêmes (v0.8.1) : crise de moral et burn-out imposent un arrêt coûteux. */
export function paliersJour(s, ctx) {
  const m = s.mor;
  if (palierMoral(s.volonte).id === 'crise' && s.jour - (m.criseJour ?? -999) >= EP.crise.delai) {
    m.criseJour = s.jour; m.crises = (m.crises || 0) + 1;
    const p = arret(s, ctx, EP.crise.joursArret, EP.crise.soins);
    s.volonte = Math.max(s.volonte, EP.crise.remonte);
    ctx.msg(`🆘 Moral en crise : médecin, psychologue et ${EP.crise.joursArret} jours d'arrêt (−${Math.round(EP.crise.soins + p)} € dont salaire perdu). Il fallait remonter avant.`, 'alerte');
  }
  if (palierBE(s.bienetre).id === 'burnout' && s.jour - (m.burnoutJour ?? -999) >= EP.burnout.delai) {
    m.burnoutJour = s.jour; m.burnouts = (m.burnouts || 0) + 1;
    const p = arret(s, ctx, EP.burnout.joursArret, EP.burnout.soins);
    s.bienetre = Math.max(s.bienetre, EP.burnout.remonte); s.volonte = Math.max(0, s.volonte - 5);
    ctx.msg(`🔥 Épuisement : burn-out, ${EP.burnout.joursArret} jours d'arrêt (−${Math.round(EP.burnout.soins + p)} € dont salaire perdu).`, 'alerte');
  }
}

/** 1er janvier : l'augmentation individuelle dépend de l'année écoulée (moral et présentation). */
export function revisionSalaire(s, ctx) {
  const a = s.mor.an; if (a.n < 200) { s.mor.an = { n: 0, volonte: 0, hygiene: 0 }; return; }
  const mv = a.volonte / a.n, hy = a.hygiene / a.n, be = (a.bienetre ?? 55 * a.n) / a.n, C = SANTE_COUTS;
  let perte = 0, raison = '';
  if (mv < C.seuilMoralAugm || hy < C.seuilHygieneAugm || be < EP.seuilBEAugm) { perte = C.augmIndividuelle; raison = `moral moyen ${Math.round(mv)}, hygiène ${Math.round(hy)}, bien-être ${Math.round(be)} : productivité en baisse, pas d'augmentation individuelle`; }
  if (mv < 20 && hy < 30) { perte += C.primePerdue; raison += ' ; remarques sur la tenue, prime annuelle supprimée'; }
  if (perte > 0) {
    s.mor.facteurSalaire *= 1 - perte;
    ctx.msg(`📉 Entretien annuel : ${raison} (−${(perte * 100).toFixed(1).replace('.', ',')} % de salaire par rapport au voisin).`, 'alerte');
  }
  else if (mv >= EP.seuilAugmBonus) {
    s.mor.facteurSalaire *= 1 + EP.bonusAugm;
    ctx.msg(`📈 Entretien annuel : moral moyen ${Math.round(mv)}, tu as négocié une augmentation un peu meilleure (+${(EP.bonusAugm * 100).toFixed(1).replace('.', ',')} % de salaire).`, 'habitude');
  }
  s.mor.an = { n: 0, volonte: 0, hygiene: 0 };
}
export const anneeVacances = (s) => dateDuJour(s.jour).getUTCFullYear();
