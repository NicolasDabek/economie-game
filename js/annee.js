// Campagne pluriannuelle (v0.6) : salaire, inflation et prix qui évoluent, révisions du Livret A, mensualisation de l'énergie,
// événements de l'année (régularisation, assurance, rentrée, impôts, renégociation), vieillissement des équipements et appareils,
// bilan annuel avec objectifs. Les fonctions qui touchent au jeu reçoivent un contexte (msg, debloquer) pour éviter les imports circulaires.
import { PRIX, BANQUE, INDICES, ECONOMIE, PROFILS, APPAREILS, ACHATS, VACANCES, MEDIATHEQUE, SCENARIOS } from './data.js';
import { revisionSalaire } from './moral.js';
import { makeRng } from './rng.js';
import { dateDuJour, anneeDuJour } from './meteo.js';

const PRIX0 = { elecKwh: PRIX.elecKwh, gazKwh: PRIX.gazKwh, eauM3: PRIX.eauM3, aboGazAn: PRIX.aboGazAn, aboElecMois: PRIX.aboElecMois };
const TAUX0 = { livretA: BANQUE.livretA.taux, ldds: BANQUE.ldds.taux, lep: BANQUE.lep.taux };
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const r3 = (x) => Math.round(x * 1000) / 1000;

/** Trajectoires annuelles déterministes : index k = année civile 2027 + k (appliquées au 1er janvier). */
export function trajectoires(seed, annees) {
  const E = ECONOMIE, r = makeRng(seed * 7717 + 3);
  let inf = E.inflation.depart, estr = E.estr.depart;
  const out = [];
  for (let k = 0; k <= annees; k++) {
    inf = E.inflation.moy + E.inflation.rho * (inf - E.inflation.moy) + E.inflation.ecart * gauss(r);
    inf = Math.max(-0.005, Math.min(0.07, inf));
    estr = Math.max(0, E.estr.moy + E.estr.rho * (estr - E.estr.moy) + E.estr.ecart * gauss(r));
    out.push({
      inflation: inf, estr,
      gaz: Math.max(-0.3, inf + E.gaz * gauss(r)), elec: Math.max(-0.15, inf + E.elec * gauss(r)), alim: inf + E.alim * gauss(r),
      eau: E.eau, carburant: inf + E.carburant * gauss(r), services: E.services,
      salaire: Math.max(0, inf + E.salaire.prime + E.salaire.ecart * gauss(r)), loyer: Math.max(0, Math.min(E.loyerPlafond, inf)),
    });
  }
  return out;
}

export function nouvelleEconomie(seed, annees, profil = 'median', scenario = 'standard') {
  const P = PROFILS[profil], r = makeRng(seed * 911 + 5), X = SCENARIOS[scenario] || SCENARIOS.standard;
  const appareils = {};
  for (const [id, A] of Object.entries(APPAREILS)) {
    const vie = A.vie * (0.75 + 0.5 * r());
    const panne = Math.round(Math.max(40 + r() * 300, (vie - A.age) * 365));
    appareils[id] = { panne, panneVoisin: panne, remplacements: 0, reparations: 0 };
  }
  return {
    annees, traj: trajectoires(seed, annees), idx: { elec: 1, gaz: 1, eau: 1, alim: 1, carburant: 1, services: 1, general: 1 }, remise: 1, inflationAn: ECONOMIE.inflation.depart,
    salaire: P.salaire + X.salairePlus, loyer: P.loyer + X.loyerPlus, revenus: 0, mensualite: 170, energieDu: 0, energiePaye: 0, energieAn: [],
    taux: { ...TAUX0 }, achats: {}, finVie: {}, appareils, bilans: [], objectifs: [], dernierBilan: null, regul: null, impots: null,
  };
}

/** Recopie les indices de la partie dans les constantes partagées (prix de l'énergie, de l'eau, taux des livrets). */
export function appliquerIndices(s) {
  const e = s.eco; if (!e) return;
  Object.assign(INDICES, e.idx);
  PRIX.elecKwh = PRIX0.elecKwh * e.idx.elec; PRIX.gazKwh = PRIX0.gazKwh * e.idx.gaz; PRIX.eauM3 = PRIX0.eauM3 * e.idx.eau;
  PRIX.aboGazAn = PRIX0.aboGazAn * e.idx.gaz; PRIX.aboElecMois = PRIX0.aboElecMois * e.idx.elec;
  BANQUE.livretA.taux = e.taux.livretA; BANQUE.ldds.taux = e.taux.ldds; BANQUE.lep.taux = e.taux.lep;
}
export function reinitialiserIndices() { Object.assign(INDICES, { elec: 1, gaz: 1, eau: 1, alim: 1, carburant: 1, services: 1, general: 1 }); Object.assign(PRIX, PRIX0); BANQUE.livretA.taux = TAUX0.livretA; BANQUE.ldds.taux = TAUX0.ldds; BANQUE.lep.taux = TAUX0.lep; }

export const resteAVivre = (s) => s.eco.salaire - s.eco.loyer;
const pct = (x, d = 1) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(d).replace('.', ',')} %`;
const eur0 = (x) => `${Math.round(x).toLocaleString('fr-FR')} €`;

// vie d'un équipement acheté (jours) : durée de vie ± 20 %, déterministe
export function vieEquipement(s, id, jour) { const r = makeRng(s.seed * 53 + jour * 7 + id.length * 131); return Math.round(ACHATS[id].vie * 365 * (0.8 + 0.4 * r())); }

/**
 * Événements de calendrier du jour s.jour, avant la simulation de la journée.
 * ctx : { msg, debloquer, payer } ; retourne un identifiant de dilemme éventuel.
 */
export function debutJourCampagne(s, ctx) {
  const e = s.eco; if (!e) return null;
  const x = dateDuJour(s.jour), j = x.getUTCDate(), m = x.getUTCMonth(), an = anneeDuJour(s.jour);
  let dilemme = null;
  // 1er janvier : nouvelle année civile, nouveaux prix, augmentation de salaire, révision du loyer
  if (m === 0 && j === 1) {
    const t = e.traj[Math.min(e.traj.length - 1, x.getUTCFullYear() - 2027)];
    for (const k of ['gaz', 'alim', 'eau', 'carburant', 'services']) e.idx[k] *= 1 + t[k];
    e.idx.general *= 1 + t.inflation; e.inflationAn = t.inflation; e.estr = t.estr;
    e.salaire *= 1 + t.salaire; e.loyer *= 1 + t.loyer;
    if (s.mor) revisionSalaire(s, ctx);
    ctx.msg(`🎆 ${x.getUTCFullYear()} : inflation ${pct(t.inflation)} · gaz ${pct(t.gaz)} · alimentation ${pct(t.alim)} · carburant ${pct(t.carburant)} · ton salaire ${pct(t.salaire)} (${eur0(e.salaire)} net) · loyer ${pct(t.loyer)} (IRL). Reste à vivre : ${eur0(resteAVivre(s))}/mois.`, 'alerte');
    ctx.debloquer('inflation');
    if (t.salaire < t.inflation) ctx.debloquer('inflationReelle');
    defiAnnuel(s, ctx, x.getUTCFullYear());
    // la carte de médiathèque est annuelle : renouvelée au 1er janvier
    if (s.sys?.mediatheque) { s.argent -= MEDIATHEQUE; s.depenses.services += MEDIATHEQUE; ctx.msg(`📚 Carte de médiathèque renouvelée : ${eur0(MEDIATHEQUE)}.`, 'info'); }
  }
  // 1er février et 1er août : tarif réglementé de l'électricité et Livret A (formule : moyenne inflation / €STR, au 0,1 pt, plancher 0,5 %)
  if ((m === 1 || m === 7) && j === 1 && s.jour > 0) {
    const t = e.traj[Math.min(e.traj.length - 1, Math.max(0, x.getUTCFullYear() - 2027))];
    e.idx.elec *= Math.sqrt(1 + t.elec);
    const la = Math.max(0.005, r3((e.inflationAn + (e.estr ?? ECONOMIE.estr.depart)) / 2));
    const avant = e.taux.livretA;
    e.taux.livretA = e.taux.ldds = la; e.taux.lep = r3(la + 0.005);
    ctx.msg(`🏦 ${m === 1 ? '1er février' : '1er août'} : électricité ${pct(Math.sqrt(1 + t.elec) - 1)} (TRVE). Livret A ${(avant * 100).toFixed(1).replace('.', ',')} % → ${(la * 100).toFixed(1).replace('.', ',')} % (LDDS idem, LEP ${(e.taux.lep * 100).toFixed(1).replace('.', ',')} %).`, 'info');
  }
  // 1er du mois : salaire (moins le loyer) et mensualité d'énergie
  if (j === 1) {
    const rav = resteAVivre(s);
    s.argent += rav; e.revenus += rav;
    // salaire du joueur en retrait de celui du voisin s'il a manqué des augmentations (v0.7)
    const manque = s.mor ? e.salaire * (1 - s.mor.facteurSalaire) : 0;
    if (manque > 0.5) ctx.payer?.(s, manque, 'revenus');
    s.argent -= e.mensualite; e.energiePaye += e.mensualite;
  }
  // 15 juin : régularisation de l'énergie (relevé annuel)
  if (m === 5 && j === 15) {
    const diff = e.energieDu - e.energiePaye, nouvelle = Math.max(60, Math.round(e.energieDu / 12 * 1.03));
    s.argent -= diff;
    e.regul = { du: e.energieDu, paye: e.energiePaye, diff, ancienne: e.mensualite, nouvelle };
    e.energieAn.push(e.energieDu); e.mensualite = nouvelle; e.energieDu = 0; e.energiePaye = 0;
    dilemme = 'regul'; ctx.debloquer('mensualisation');
  }
  // 10 janvier : renouvellement de l'assurance habitation ; 1er septembre : rentrée ; 15 septembre : avis d'impôt ; 1er novembre : box et mobile
  if (m === 0 && j === 10 && s.jour > 30) dilemme ||= 'assurance';
  if (m === 8 && j === 1) dilemme ||= 'rentree';
  if (m === 8 && j === 15) { e.impots = { an: x.getUTCFullYear() - 1, revenus: e.salaire * 12, placements: s.fin?.impots || 0 }; dilemme ||= 'impots'; }
  if (m === 10 && j === 1) dilemme ||= 'renego';
  // 1er juillet : vacances d'été (le voisin part en séjour classique)
  if (m === 6 && j === 1) { s.base.plaisirs = (s.base.plaisirs || 0) + VACANCES.sejour.cout; dilemme ||= 'vacances'; }
  // bilan annuel le 1er décembre
  if (m === 11 && j === 1 && s.jour > 0) dilemme = 'bilan';
  // vieillissement des équipements achetés
  for (const [id, d] of Object.entries(e.achats)) {
    if (!s.possede[id] || s.jour - d < vieEquipement(s, id, d)) continue;
    s.possede[id] = false; delete e.achats[id]; e.finVie[id] = (e.finVie[id] || 0) + 1;
    if (id === 'potager') s.sys.potagerDepuis = null;
    ctx.msg(`⌛ ${ACHATS[id].nom} arrive en fin de vie (${ACHATS[id].vie} ans en moyenne). À racheter si tu veux continuer à en profiter.`, 'alerte');
    ctx.debloquer('finDeVie');
    if (s.auto?.renouveler && ACHATS[id].prix <= 60 && s.argent > ACHATS[id].prix + 300) ctx.racheter?.(id);
  }
  // pannes des appareils de la maison (communs au voisin)
  for (const [id, a] of Object.entries(e.appareils)) {
    if (s.jour === a.panne && !dilemme) { dilemme = 'appareil-' + id; if (s.mor) s.mor.panne = s.jour; }
    // le voisin remplace toujours à neuf, à sa propre échéance
    if (s.jour === a.panneVoisin) { s.base.remplacements = (s.base.remplacements || 0) + APPAREILS[id].prix; a.panneVoisin += Math.round(APPAREILS[id].vie * 365); }
  }
  // une canicule s'annonce (J−2)
  if (!dilemme && s.meteo[s.jour + 2]?.canicule && !s.meteo[s.jour + 1]?.canicule && !s.meteo[s.jour]?.canicule) dilemme = 'canicule';
  return dilemme;
}

// v0.9 : à partir de la 2e année, un défi par an sur un poste, hausse des prix comprise.
// v1.3 (passe GD 2, C) : plus de victoire gratuite. Il faut faire 2 % de mieux que l'an dernier (corrigé des prix)
// ET avoir agi sur ce poste : un geste lié devenu habitude, ou un équipement lié en service (acheté avant ou pendant l'année).
export const DEFIS = [
  { poste: 'gaz', nom: 'Un hiver plus sobre', texte: 'dépenser 2 % de moins en chauffage que l\'an dernier (hausse des prix comprise), avec au moins une habitude ou un équipement de chauffage ou d\'isolation' },
  // v1.5 (passe GD 4) : nourriture et transport se mesurent face au voisin de l'année (−3 %), plus face à soi-même :
  // un foyer déjà sobre ne pouvait plus gagner 2 % sur lui-même (ratios 1,016 à 1,021 pour tous sauf le maître)
  { poste: 'nourriture', mode: 'voisin', effort: 0.97, nom: 'Le panier malin', texte: 'dépenser au moins 3 % de moins que le voisin en nourriture cette année, avec au moins une habitude ou un équipement de cuisine ou de jardin' },
  // v1.4 (passe GD 3) : jamais réussi, même par le maître ; seuil assoupli à +5 % sur l'an dernier.
  // v1.5 (passe GD 4) : mesuré lui aussi face au voisin. Face à soi-même (effort 1,00 demandé), le ratio de TOUS les profils tombait
  // entre 0,97 et 1,02 selon la graine (« ne rien toucher » 0,989 à 1,017) : un tirage au sort, perdu par le maître sur la graine 1789.
  // Face au voisin : maître 0,37, autosuffisant 0,55, malin 0,67, ne rien toucher 0,90 → seuil à 60 % (au moins 40 % de moins).
  { poste: 'elec', mode: 'voisin', effort: 0.60, nom: 'La chasse aux watts', texte: 'dépenser au moins 40 % de moins que le voisin en électricité cette année, avec au moins une habitude ou un équipement électrique' },
  { poste: 'transport', mode: 'voisin', effort: 0.97, nom: 'Bouger autrement', texte: 'dépenser au moins 3 % de moins que le voisin en transport cette année, avec une habitude, un équipement ou un mode de transport sans voiture' },
];
export const DEFI_EFFORT = 0.98;
// leviers liés à chaque poste : gestes (habitude) et catégories d'équipements
export const LEVIERS_DEFI = {
  gaz: { gestes: ['rideaux', 'portes', 'bouillotte', 'couches', 'cuisson', 'feuBois'], cats: ['Isolation', 'Chauffage', 'Confort', 'Ventilation passive'] },
  nourriture: { gestes: ['liste', 'prixKilo', 'levain', 'gamelle', 'jardiner', 'poules'], cats: ['Cuisine', 'Cuisine solaire', 'Jardin'] },
  elec: { gestes: ['multiprise', 'frigo', 'couvercle', 'bouilloire', 'couperEau', 'voletsJour', 'ventNuit'], cats: ['Électricité', 'Production', 'Eau chaude'] },
  transport: { gestes: ['ecoconduite', 'gamelle'], cats: ['Transport'] },
};
/** Le joueur a-t-il agi sur ce poste ? Renvoie la première action trouvée (texte) ou null. */
export function actionDefi(s, poste) {
  const L = LEVIERS_DEFI[poste]; if (!L) return 'poste libre';
  const g = L.gestes.find(id => s.gestes?.[id]?.habitude);
  if (g) return 'habitude';
  const a = Object.keys(ACHATS).find(id => s.possede?.[id] && L.cats.includes(ACHATS[id].cat) && id !== 'thermometre' && id !== 'hygrometre');
  if (a) return 'équipement';
  if (poste === 'transport' && s.transport && (s.transport.mode !== 'voiture' || s.transport.teletravail > 2)) return 'mode';
  return null;
}
function defiAnnuel(s, ctx, an) {
  const e = s.eco, D = s.depenses;
  if (e.defi) {   // bilan du défi précédent
    const f = e.defi;
    // v1.4 (passe GD 3) : la cible suit l'évolution de la facture du voisin, dans le même logement (météo et prix corrigés : le défi ne dépend plus de la graine)
    if (f.mode === 'voisin') f.cible = Math.round(((s.base[f.poste] || 0) - f.debutVoisin) * f.effort);
    else if (f.voisinDernier > 0) { const vN = (s.base[f.poste] || 0) - f.debutVoisin; f.cible = Math.round(f.dernier * vN / f.voisinDernier * (f.effort ?? DEFI_EFFORT)); }
    // v1.5 (passe GD 4) : un défi gagné en s'abîmant ne compte pas (mêmes seuils que le titre « Une sobriété qui abîme », moyennes de l'année)
    // v1.5.3 (passe GD 5) : le moral compte aussi (moyenne de l'année < 35 : la sobriété tient à la force du poignet, pas à des habitudes)
    const n = Math.max(1, s.nbJours - (f.nbJours ?? s.nbJours)), sm = s.sommes, ps = f.sommes || sm;
    const m = (k) => (sm[k] - (ps[k] || 0)) / n, abime = !!f.sommes && (m('sante') < 50 || m('confort') < 55 || m('hygiene') < 30 || m('bienetre') < 25 || m('volonte') < 35);
    const chiffre = (D[f.poste] - f.debut) <= f.cible, action = actionDefi(s, f.poste), fait = chiffre && !!action && !abime;
    (e.defisReussis ??= []).push({ an: f.an, poste: f.poste, fait, chiffre, action: !!action, abime, moral: f.sommes ? Math.round(m('volonte')) : null, ratio: Math.round((D[f.poste] - f.debut) / f.cible * 1000) / 1000, vsVoisin: Math.round((D[f.poste] - f.debut) / Math.max(1, (s.base[f.poste] || 0) - f.debutVoisin) * 1000) / 1000 });
    if (fait) { s.volonte = Math.min(100, s.volonte + 8); ctx.msg(`🏅 Défi ${f.an} réussi : « ${f.nom} ». Moral +8.`, 'alerte'); }
    else if (chiffre && action) ctx.msg(`🎯 Défi ${f.an} manqué : « ${f.nom} ». Le chiffre y est, mais pas à n'importe quel prix : santé, confort, hygiène, bien-être ou moral se sont effondrés cette année.`, 'info');
    else if (chiffre) ctx.msg(`🎯 Défi ${f.an} manqué : « ${f.nom} ». La dépense a baissé toute seule (météo, prix), mais aucune habitude ni aucun équipement lié : un défi se gagne en agissant.`, 'info');
    else ctx.msg(`🎯 Défi ${f.an} manqué de ${eur0(D[f.poste] - f.debut - f.cible)} : « ${f.nom} ».`, 'info');
    e.defi = null;
  }
  const prec = e.depJan, idxPrec = e.idxJan; e.depJan = { ...D }; e.idxJan = { ...e.idx }; const basePrec = e.baseJan; e.baseJan = { ...s.base };
  if (!prec) return;    // première année : apprentissage
  const d = DEFIS[(an - 2027) % DEFIS.length], dernier = D[d.poste] - (prec[d.poste] || 0);
  if (dernier < 50) return;
  // cible : 2 % sous l'an dernier corrigé de la hausse des prix (v1.1 : −5 % était hors d'atteinte ; v1.3 : « ne rien toucher » ne doit pas gagner)
  const k = { gaz: s.scenario && SCENARIOS[s.scenario]?.chauffage === 'elec' ? 'elec' : 'gaz', nourriture: 'alim', elec: 'elec', transport: 'carburant' }[d.poste];
  const hausse = idxPrec && e.idx[k] ? e.idx[k] / idxPrec[k] : 1;
  e.defi = { ...d, an, jour: s.jour, debut: D[d.poste], debutVoisin: s.base[d.poste] || 0, dernier, voisinDernier: basePrec ? (s.base[d.poste] || 0) - (basePrec[d.poste] || 0) : 0, cible: Math.round(dernier * hausse * (d.effort ?? DEFI_EFFORT)), nbJours: s.nbJours, sommes: { ...s.sommes } };
  if (d.mode === 'voisin') e.defi.cible = Math.round(e.defi.voisinDernier * hausse * d.effort);
  ctx.msg(`🎯 Défi ${an} : « ${d.nom} » — ${d.texte} (${d.mode === 'voisin' ? 'environ' : 'moins de'} ${eur0(e.defi.cible)} sur l'année). Récompense : moral +8. ${d.mode === 'voisin' ? `La cible exacte sera la dépense du voisin cette année, moins ${Math.round((1 - d.effort) * 100)} %.` : 'La cible sera ajustée en fin d\'année selon la météo, comme la facture du voisin.'}`, 'alerte');
}

/** Facture d'énergie du jour : comptée en dépense comme avant, mais payée par mensualités (trésorerie). */
export function mensualiser(s, montant) { if (!s.eco) return; s.argent += montant; s.eco.energieDu += montant; }

// ---------------------------------------------------------------- dilemmes de calendrier
export function choixCampagne(s, id, outils) {
  const e = s.eco, A = id.startsWith('appareil-') ? APPAREILS[id.slice(9)] : null;
  if (A) {
    const a = e.appareils[id.slice(9)];
    return [
      { id: 'neuf', texte: `Remplacer à neuf (${eur0(A.prix)} posé)`, effet: `Neuf pour ~${A.vie} ans. Le voisin, dans le même logement, remplace toujours à neuf.` },
      ...(A.occasion ? [{ id: 'occasion', texte: `Reconditionné (${eur0(A.occasion)})`, effet: `Garanti 1 an, durée de vie ~${Math.round(A.vie / 2)} ans.` }] : []),
      ...(a.reparations < 1 ? [{ id: 'reparer', texte: `Faire réparer (${eur0(A.reparation)})`, effet: 'Souvent 2 à 4 ans de répit… parfois moins.' }] : []),
    ];
  }
  switch (id) {
    case 'regul': return [{ id: 'ok', texte: 'Compris', effet: e.regul.diff >= 0 ? 'Le complément est prélevé aujourd\'hui.' : 'Le trop-perçu t\'est remboursé.' }];
    case 'assurance': return [
      { id: 'comparer', texte: 'Comparer et changer d\'assureur (1 h, résiliation à tout moment après 1 an, loi Hamon)', effet: '−7 % sur tes abonnements et assurances (le voisin garde ses tarifs).', possible: outils.tempsLibre(s) >= 1 },
      { id: 'laisser', texte: 'Laisser la reconduction tacite', effet: 'Tes tarifs suivent ceux du voisin : +3 %/an.' },
    ];
    case 'renego': return [
      { id: 'negocier', texte: 'Appeler le service résiliation de la box et du mobile (30 min)', effet: '−5 % sur tes abonnements (offres de fidélisation).', possible: outils.tempsLibre(s) >= 0.5 },
      { id: 'ignorer', texte: 'Laisser courir', effet: 'Rien ne change.' },
    ];
    case 'rentree': return [
      { id: 'neuf', texte: 'Fournitures, chaussures et inscription au sport à neuf (180 €)', effet: '+6 bien-être.' },
      { id: 'occasion', texte: 'Occasion, vide-greniers et club associatif (70 €, 2 h)', effet: '+5 bien-être, il faut 2 h de temps libre.', possible: outils.tempsLibre(s) >= 2 },
      { id: 'rien', texte: 'Faire l\'impasse cette année', effet: '−5 bien-être, −3 moral.' },
    ];
    case 'impots': return [{ id: 'ok', texte: 'Compris', effet: 'Le prélèvement à la source est déjà déduit de ton salaire.' }];
    case 'canicule': return [{ id: 'ok', texte: 'Compris', effet: 'Volets, nuits ouvertes, ventilateur, cuisson dehors… ou clim.' }];
    case 'vacances': return Object.entries(VACANCES).map(([k, v]) => ({ id: k, texte: `${v.nom} (${eur0(v.cout)})`, effet: `Moral +${v.effet}, qui s'estompe sur deux mois.`, possible: s.argent + (s.fin ? 0 : 0) >= v.cout || v.cout === 0 }));
    case 'bilan': return [{ id: 'ok', texte: 'Fixer ces objectifs et continuer', effet: 'Ta maison, tes habitudes et ton argent te suivent.' }];
    default: return [];
  }
}
export function titreCampagne(s, id) {
  const e = s.eco, A = id.startsWith('appareil-') ? APPAREILS[id.slice(9)] : null;
  if (A) return { titre: `Panne : ${A.nom.toLowerCase()}`, texte: `${A.desc} L'appareil avait ${Math.round(A.age + s.jour / 365)} ans environ. C'est le moment où l'épargne de précaution sert : un placement bloqué ou en baisse ne paie pas un chauffagiste.` };
  switch (id) {
    case 'regul': { const r = e.regul; return { titre: 'Régularisation annuelle de l\'énergie', texte: `Sur 12 mois tu as consommé pour ${eur0(r.du)} de gaz et d'électricité (abonnements compris) et payé ${eur0(r.paye)} de mensualités. ${r.diff >= 0 ? `Complément à payer : ${eur0(r.diff)}.` : `Trop-perçu remboursé : ${eur0(-r.diff)}.`} Nouvelle mensualité : ${eur0(r.nouvelle)}/mois (au lieu de ${eur0(r.ancienne)}).` }; }
    case 'assurance': return { titre: 'Renouvellement de l\'assurance habitation', texte: 'L\'avis d\'échéance annonce +4 %. Depuis la loi Hamon, tu peux résilier à tout moment après un an et comparer.' };
    case 'renego': return { titre: 'Saison des renégociations', texte: 'Les nouvelles offres box et mobile tombent : les anciens clients paient souvent 20 à 40 % de plus que les nouveaux.' };
    case 'rentree': return { titre: 'La rentrée', texte: 'Chaussures usées, sac à remplacer, cotisation du club de sport : septembre coûte cher.' };
    case 'impots': { const i = e.impots; return { titre: `Avis d'impôt sur les revenus ${i.an}`, texte: `Salaire net annuel ~${eur0(i.revenus)} : l'impôt est prélevé à la source chaque mois. Impôts et prélèvements sociaux payés sur tes placements depuis le début : ${eur0(i.placements)}.` }; }
    case 'vacances': return { titre: 'Les vacances d\'été', texte: 'Juillet arrive. Le voisin part deux semaines en location. Le repos et la nouveauté rechargent le moral pour la rentrée ; le stress d\'un budget à découvert, lui, le mine.' };
    case 'canicule': return { titre: 'Vigilance canicule', texte: 'Météo-France annonce une vague de chaleur dans deux jours : jusqu\'à 36 °C l\'après-midi, nuits à 22 °C.' };
    case 'bilan': { const a = e.dernierBilan?.an ?? 0; return { titre: `Bilan de l'année ${a + 1} (déc. ${2026 + a} – nov. ${2027 + a})`, texte: '' }; }
    default: return { titre: id, texte: '' };
  }
}
export function resoudreCampagne(s, id, choix, outils) {
  const e = s.eco;
  if (id.startsWith('appareil-')) {
    const k = id.slice(9), A = APPAREILS[k], a = e.appareils[k], r = makeRng(s.seed * 17 + s.jour);
    const prix = choix === 'neuf' ? A.prix : choix === 'occasion' ? A.occasion : A.reparation;
    outils.payer(s, prix, 'remplacements');
    if (choix === 'reparer') { a.reparations++; a.panne = s.jour + Math.round(365 * (1 + 3 * r())); }
    else { a.remplacements++; a.reparations = 0; a.panne = s.jour + Math.round(365 * (choix === 'occasion' ? A.vie / 2 : A.vie) * (0.75 + 0.5 * r())); }
    if (k === 'laveLinge') { s.machine.usure = choix === 'reparer' ? 40 : 0; s.machine.enPanne = false; }
    outils.msg(`🔧 ${A.nom} : ${choix === 'neuf' ? 'remplacé à neuf' : choix === 'occasion' ? 'remplacé par un reconditionné' : 'réparé'} (−${eur0(prix)}).`, 'achat');
    outils.debloquer('precaution');
    return;
  }
  if (id === 'assurance' && choix === 'comparer') { e.remise = Math.max(0.75, e.remise * 0.93); s.tempsUtilise += 1; outils.debloquer('renegocier'); }
  if (id === 'renego' && choix === 'negocier') { e.remise = Math.max(0.75, e.remise * 0.95); s.tempsUtilise += 0.5; outils.debloquer('renegocier'); }
  if (id === 'rentree') {
    if (choix === 'neuf') { outils.payer(s, 180, 'plaisirs'); s.bienetre = Math.min(100, s.bienetre + 6); }
    if (choix === 'occasion') { outils.payer(s, 70, 'plaisirs'); s.tempsUtilise += 2; s.bienetre = Math.min(100, s.bienetre + 5); outils.debloquer('occasion'); }
    if (choix === 'rien') { s.bienetre = Math.max(0, s.bienetre - 5); s.volonte -= 3; }
  }
  if (id === 'vacances') { const v = VACANCES[choix]; if (choix !== 'rester' && s.autonomie) { s.autonomie.absentJusqua = s.jour + 14; if (s.possede?.poules) outils.msg('🐔 Pendant les vacances, le voisin nourrit les poules et garde les œufs.', 'info'); } if (v.cout) outils.payer(s, v.cout, 'plaisirs'); if (s.mor) s.mor.vacances = { jour: s.jour, effet: v.effet }; if (choix === 'rester') s.mor && (s.mor.adapt *= 0.8); outils.msg(`🏖️ ${v.nom}${v.cout ? ` (−${eur0(v.cout)})` : ''}.`, 'info'); return; }
  if (id === 'bilan') { e.objectifs = e.dernierBilan?.objectifs || []; }
}
