// État initial de la partie + sauvegarde
import { nouvelEtatPassif } from './passif.js';
import { nouvelEtatMoral } from './moral.js';
import { ARGENT_DEPART, ORDRE_PIECES, VETEMENTS, GESTES, ACHATS, CAMPAGNE, joursCampagne } from './data.js';
import { nouvelleEconomie, debutJourCampagne, appliquerIndices } from './annee.js';
import { genererMeteo } from './meteo.js';
import { nouvelEtatSystemes } from './systemes.js';
import { nouvelEtatTransport } from './transport.js';
import { nouvelEtatFinance } from './finance.js';
// ancien calendrier (v0.5 : 3 chapitres de 56, 28 et 42 jours) -> jour calendaire depuis le 1er décembre 2026
const calV5 = (j) => (j < 56 ? j : j < 84 ? 126 + (j - 56) : 212 + (j - 84));

export function nouvellePartie(seed = 2026, annees = CAMPAGNE.anneesDefaut) {
  const pieces = {};
  for (const p of ORDRE_PIECES) pieces[p] = { t: 19, hum: 50, consigneJour: 20, consigneNuit: 18, kwhSemaine: 0, eurSemaine: 0 };
  const vetements = {};
  for (const [id, v] of Object.entries(VETEMENTS)) vetements[id] = { possede: !!v.depart, qualite: 'eco', porte: !!v.depart, salete: 0, usure: 0, joursPortes: 0, reprises: 0, aere: false, prixPaye: 0 };
  const gestes = {};
  for (const id of Object.keys(GESTES)) gestes[id] = { pratique: 0, habitude: false };
  const s = {
    version: 7, seed, jour: 0, mor: nouvelEtatMoral(), fini: false, annees, joursTotal: joursCampagne(annees), passif: nouvelEtatPassif(seed), fin: nouvelEtatFinance('median'), coutVoisinCumul: 0,
    eco: nouvelleEconomie(seed, annees), auto: { lessive: false, entretien: false, saisons: false, renouveler: false },
    meteo: genererMeteo(seed, annees),
    argent: ARGENT_DEPART,
    confort: 70, sante: 90, volonte: 70, hygiene: 75, bienetre: 60,
    sommes: { confort: 0, sante: 0, volonte: 0, hygiene: 0, bienetre: 0 },
    sys: nouvelEtatSystemes(),
    transport: nouvelEtatTransport(), roi: {}, palier: 0, capitalLibere: 0, combos: {}, battSoc: 0, l30: 0, joursPain: 0,
    voletsJour: false, ventNuit: false, ventilateur: false, climActive: false, climConsigne: 26, prixPayes: {},
    tempsUtilise: 0,
    pieces,
    central: { consigneJour: 20, consigneNuit: 18 },   // thermostat unique (avant robinets)
    appoint: { actif: false, consigne: 19 },
    portes: 'ouvertes', rideaux: 'ouverts', aeration: 'entrouverte',
    recupCuisson: false, utiliserBouillotte: false,
    possede: Object.fromEntries(Object.keys(ACHATS).map(k => [k, false])),
    vetements, gestes,
    machine: { usure: 55, enPanne: false },
    lessivePrevue: null,
    prixGazMult: 1,
    invites: null,
    depenses: { gaz: 0, elec: 0, eau: 0, produits: 0, laverie: 0, equipement: 0, vetements: 0, imprevus: 0, abonnements: 0, linge: 0, nourriture: 0, services: 0, plaisirs: 0, reventes: 0, transport: 0, banque: 0, remplacements: 0 },
    attribution: { calfeutrage: 0, boudin: 0, rideauxTh: 0, volets: 0, purge: 0, solaire: 0, cuisson: 0 },
    solaire: { prod: 0, auto: 0 },
    lessives: 0, sommeRemplissage: 0, aerationsVet: 0, reprises: 0,
    moisissure: 0,
    factureSemaine: 0, factures: [],
    dernierJour: null,  // détail horaire du dernier jour
    historique: [],     // résumés quotidiens
    principes: [], messages: [],
    sommeConfort: 0, nbJours: 0, rechutes: 0,
    dilemme: null, evenementsVus: [],
    base: { pieces: Object.fromEntries(ORDRE_PIECES.map(p => [p, { t: 19, hum: 50 }])), gaz: 0, elec: 0, eau: 0, produits: 0, abonnements: 0, nourriture: 0, services: 0, plaisirs: 0, transport: 0, banque: 0, remplacements: 0, clim: 0, eauChaude: 0, linge: 0,
      chaleur: chaleurVoisin() },
  };
  // 1er décembre 2026 : premier salaire et première mensualité d'énergie
  appliquerIndices(s);
  debutJourCampagne(s, { msg: () => {}, debloquer: () => {} });
  return s;
}

function chaleurVoisin() {
  const z = () => new Array(24).fill(0);
  const c = { salon: z(), chambre: z(), cuisine: z() };
  for (let h = 0; h < 24; h++) c.cuisine[h] += 1.5 * 46;     // pertes du ballon à 65 °C
  c.cuisine[12] += 280; c.cuisine[19] += 420;                   // cuisson
  return c;
}
const CLE = 'economie-game-sauvegarde';
export function sauvegarder(s, stockage = globalThis.localStorage) {
  const { meteo, ...reste } = s;
  stockage.setItem(CLE, JSON.stringify(reste));
}
export function charger(stockage = globalThis.localStorage) {
  const txt = stockage.getItem(CLE);
  if (!txt) return null;
  const s = JSON.parse(txt);
  if (s.version === 3) migrerV3(s);
  if (s.version === 4) migrerV4(s);
  if (s.version === 5) migrerV5(s);
  if (s.version === 6) migrerV6(s);
  if (s.version !== 7) { stockage.removeItem?.(CLE); return 'ancienne'; }
  s.meteo = genererMeteo(s.seed, s.annees);
  appliquerIndices(s);
  return s;
}
export function aUneSauvegarde(stockage = globalThis.localStorage) {
  const t = stockage.getItem(CLE);
  if (!t) return false;
  try { const v = JSON.parse(t).version; return v >= 3 && v <= 7; } catch { return false; }
}

// v0.3 -> v0.4 : on garde la partie, on ajoute le transport (compté à partir d'aujourd'hui pour toi et le voisin)
export function migrerV3(s) {
  s.transport = nouvelEtatTransport(); s.roi = {}; s.palier = 0; s.capitalLibere = 0; s.combos = {}; s.battSoc = 0; s.l30 = 0; s.joursPain = 0;
  s.passif = nouvelEtatPassif(s.seed);
  s.depenses.transport = 0; s.base.transport = 0;
  for (const g of ['ecoconduite', 'gamelle']) s.gestes[g] ||= { pratique: 0, habitude: false };
  for (const k of ['velo', 'vae', 'kitSecu', 'tenuePluie', 'outilsVelo', 'gourde', 'routeur', 'batterie', 'thermos', 'caisse', 'chemineeDIY', 'chemineePro', 'puitsDIY', 'puitsPro', 'puitsHydro', 'kitRadon']) s.possede[k] ??= false;
  s.version = 4; s.migre = 3;
}

// v0.4 -> v0.5 : la banque démarre aujourd'hui (profil médian, épargne de départ sur le Livret A, calendrier aligné)
export function migrerV4(s) {
  s.fin = nouvelEtatFinance('median');
  s.depenses.banque = 0; s.base.banque = 0; s.coutVoisinCumul = 0;
  s.fin.cal = calV5(s.jour) - 1;
  s.version = 5; s.migre ??= 4;
}

// v0.5 -> v0.6 : la partie de 18 semaines devient le début d'une campagne de 5 ans (on la poursuit, même terminée)
export function migrerV5(s) {
  const nouveau = calV5(Math.min(s.jour, 126));
  s.jour = s.jour >= 126 ? 254 : nouveau;
  s.annees = CAMPAGNE.anneesDefaut; s.joursTotal = joursCampagne(s.annees); s.fini = false;
  s.eco = nouvelleEconomie(s.seed, s.annees, s.fin?.profil || 'median');
  s.auto = { lessive: false, entretien: false, saisons: false, renouveler: false };
  s.depenses.remplacements = 0; s.base.remplacements = 0;
  s.eco.revenus = Math.max(0, (s.coutVoisinCumul || 0) - 1500);   // le passé est supposé financé : le voisin repart avec ~1 mois de trésorerie
  s.evenementsVus = (s.evenementsVus || []).map(id => (id.startsWith('chap-') || id.includes('@') ? id : id + '@0'));
  if (s.fin) { s.fin.cal = s.jour - 1; s.fin.voisin.transferts = -(s.fin.voisin.retire || 0); }
  for (const k of Object.keys(s.possede)) if (s.possede[k]) s.eco.achats[k] = 0;
  s.version = 6; s.migre ??= 5;
}

// v0.6 -> v0.7 : moral sur la durée et coûts de santé, à partir d'aujourd'hui (pas de rattrapage du passé)
export function migrerV6(s) {
  s.mor = nouvelEtatMoral();
  s.version = 7; s.migre ??= 6;
}
