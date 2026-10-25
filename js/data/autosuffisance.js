// Données de jeu : Autosuffisance (v1.1) (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

// ---------------------------------------------------------------- v1.1 : autosuffisance
// Cultures du potager par planches de 2 m². kg/m² et prix au détail : docs/prix.md (App_Autosuffisance crops.ts, RNM FranceAgriMer 2026).
// semis = jours de l'année (0 = 1er janvier) de la fenêtre conseillée ; pousse = jours avant la 1re récolte ; recolte = durée de récolte ;
// garde = catégorie du garde-manger (frais : 7 j ; racines et courges : longue garde) ; gel = sensible au gel tardif.
export const CULTURES = {
  salade:    { nom: 'Salade', ico: '🥬', famille: 'composees', kgm2: 2,   prixKg: 4.0, semis: [60, 230],  pousse: 45,  recolte: 30, garde: 'frais', graines: 3 },
  tomate:    { nom: 'Tomate', ico: '🍅', famille: 'solanacees', kgm2: 6, prixKg: 3.0, semis: [100, 150], pousse: 75,  recolte: 60, garde: 'frais', graines: 8, gel: true, bocal: true },
  courgette: { nom: 'Courgette', ico: '🥒', famille: 'cucurbitacees', kgm2: 5, prixKg: 2.3, semis: [110, 160], pousse: 55, recolte: 70, garde: 'frais', graines: 4, gel: true, bocal: true },
  haricot:   { nom: 'Haricot vert', ico: '🫛', famille: 'legumineuses', kgm2: 1.2, prixKg: 6.0, semis: [120, 190], pousse: 60, recolte: 30, garde: 'frais', graines: 4, gel: true, bocal: true, lacto: true },
  pdt:       { nom: 'Pomme de terre', ico: '🥔', famille: 'solanacees', kgm2: 3, prixKg: 1.4, semis: [75, 125], pousse: 100, recolte: 10, garde: 'racines', graines: 6 },
  carotte:   { nom: 'Carotte', ico: '🥕', famille: 'apiacees', kgm2: 4, prixKg: 1.6, semis: [70, 180], pousse: 90, recolte: 20, garde: 'racines', graines: 3, lacto: true },
  courge:    { nom: 'Courge', ico: '🎃', famille: 'cucurbitacees', kgm2: 4, prixKg: 2.0, semis: [120, 160], pousse: 120, recolte: 15, garde: 'courges', graines: 4, gel: true },
  chou:      { nom: 'Chou', ico: '🥬', famille: 'brassicacees', kgm2: 3, prixKg: 1.5, semis: [120, 200], pousse: 110, recolte: 40, garde: 'frais', graines: 3, lacto: true },
  poireau:   { nom: 'Poireau', ico: '🧅', famille: 'alliacees', kgm2: 2.5, prixKg: 2.5, semis: [100, 190], pousse: 140, recolte: 90, garde: 'frais', graines: 3 },
  ail:       { nom: 'Ail', ico: '🧄', famille: 'alliacees', kgm2: 1.5, prixKg: 8.0, semis: [290, 345], pousse: 230, recolte: 10, garde: 'courges', graines: 10 },
};
// associations favorables entre planches voisines (+10 % chacune)
export const ASSOCIATIONS = [['carotte', 'poireau'], ['haricot', 'courge'], ['tomate', 'salade'], ['chou', 'salade'], ['ail', 'carotte']];
export const POTAGER = {
  m2Planche: 2, planchesBase: 4, planchesGrand: 4,
  // v1.4 (passe GD 3) : ×1,3 sur les moyennes de crops.ts, rendement d'un potager amateur bien conduit (compost, paillage, planches permanentes ;
  // les fiches Jardiniers de France et les relevés du Potager du Roi donnent 1,2 à 1,5 fois les moyennes nationales en culture intensive sur planches)
  rendement: 1.3,
  rotation: 0.8,           // même famille que l'an dernier au même endroit : −20 %
  association: 0.1,        // par voisin favorable
  horsFenetre: 0.5,        // semé hors fenêtre conseillée
  gelPerte: 0.6,           // gel tardif sur une culture sensible déjà levée : −60 %
  saintsGlace: 135,        // 15 mai : après, plus de gel
  arrosage: { printemps: 1.0, ete: 2.5, automne: 0.8 },    // l/m²/jour cultivé
  paillage: 0.6, oyas: 0.4, goutte: 0.5,                   // facteurs d'eau d'arrosage
  paillageJours: 120, paillagePrix: 5, paillageTemps: 1,
  stressEau: 0.6,          // jour d'arrosage interdit sans eau de pluie : la culture perd 60 % de la production du jour
};
// Garde-manger : durée de garde (jours) par catégorie ; silo et cave allongent les racines et les courges.
export const GARDE = {
  frais: 7, racines: 45, courges: 90, bocaux: 365, lacto: 180, oeufs: 21, cueillette: 5,
  silo: 3, cave: 1.4,      // multiplicateurs pour racines et courges
  partLegumes: 0.35,       // au plus 35 % des courses du jour remplacés par le garde-manger (fruits, légumes, œufs)
};
export const CONSERVES = {
  bocaux: { kgMax: 8, temps: 3, kwh: 0.5, capsule: 0.2, kgParBocal: 0.5, valeurKg: 5.0, moral: 3, risqueMarmite: 0.06, risqueSterilisateur: 0.01 },
  lacto:  { kgMax: 5, temps: 1, sel: 0.1, valeurKg: 6.0, santeJour: 0.06 },
};
export const ACHATS_SAISON = {
  pdt:     { nom: '25 kg de pommes de terre au producteur', kg: 25, prixKg: 0.9, valeurKg: 1.6, garde: 'racines', mois: [8, 9, 10] },
  tomates: { nom: '15 kg de tomates de plein champ (à transformer)', kg: 15, prixKg: 1.6, valeurKg: 3.0, garde: 'frais', mois: [7, 8], bocal: true },
  choux:   { nom: '10 kg de choux de saison', kg: 10, prixKg: 1.2, valeurKg: 1.8, garde: 'frais', mois: [9, 10, 11], lacto: true },
};
export const POULES = { n: 3, oeufsAn: 220, saison: { hiver: 0.35, printemps: 1.35, ete: 1.15, automne: 0.75 }, prixOeuf: 0.40,
  alimentKgJour: 0.13, alimentPrixKg: 0.92, epluchures: 0.3, renardRisque: 0.004, declaration: 0.25, bienetre: 0.4 };
export const BOIS = {
  kwhStere: 1700, rendement: 0.75, humideRendement: 0.55, puissance: 5000,
  prixSec: 95, prixVert: 70, sechage: 720, sechageAbri: 540,   // jours
  ramonage: 80, encrassementJour: 1, encrassementHumide: 3, feuRisque: 0.003, franchise: 1200, amende: 450,
  bienetre: 0.5, moral: 0.3,
};
export const CUEILLETTE = {
  temps: 2, bienetre: 3, moral: 1, intervalle: 14,
  // saison (mois 0-11), kg par sortie, prix au détail, risque de confusion par sortie sans connaissances
  especes: {
    ortie:     { nom: 'Orties', mois: [2, 3, 4], kg: 0.5, prixKg: 6, risque: 0 },
    ailOurs:   { nom: 'Ail des ours', mois: [2, 3], kg: 0.3, prixKg: 20, risque: 0.03, confusion: 'muguet ou colchique' },
    sureau:    { nom: 'Fleurs de sureau', mois: [5], kg: 0.3, prixKg: 15, risque: 0.01, confusion: 'cigüe' },
    mures:     { nom: 'Mûres', mois: [7, 8], kg: 1, prixKg: 8, risque: 0 },
    chataignes:{ nom: 'Châtaignes', mois: [9, 10], kg: 2, prixKg: 5, risque: 0 },
    champis:   { nom: 'Champignons', mois: [8, 9, 10], kg: 0.5, prixKg: 25, risque: 0.06, confusion: 'amanite ou clitocybe' },
  },
  guide: 0.33, pharmacie: 0.1, pharmacieTemps: 0.5,
  intox: { sante: 25, moral: 10, cout: 30 },
};
export const CET = { cop: 3, prix: 3000, ceeModeste: 514, ceeAutre: 294, ceeBase: 100, finBonif: 31, delaiPrime: 60, delaiDossier: 14 };
// v1.5 : pluie captée par la cuve = surface de toit × pluie du jour × coefficient de ruissellement.
// Pluie : normales Météo-France 1991-2020, Paris-Montsouris (634 mm/an ; DJF 151, MAM 160, JJA 169, SON 154 mm), répartie sur
// les jours couverts de la saison (poids = moyenne de max(0, nuage − 0,3) sur 5 graines × 10 ans). Une descente de gouttière
// draine ~20 m² de toit ; tuiles : coefficient 0,9 (Graie, guide de l'eau de pluie ; arrêté du 21 août 2008).
export const PLUIE = { mmJour: { hiver: 1.68, printemps: 1.74, ete: 1.83, automne: 1.69 }, poids: { hiver: 0.312, printemps: 0.170, ete: 0.057, automne: 0.200 },
  seuilNuage: 0.3, toitM2: 20, ruissellement: 0.9, cuveL: 300 };
export const TOILETTES = { litresJour: 30, sciureJour: 0.33 * 0.02, hygieneDebut: 0.3 };
export const SECHERESSE = { proba: 0.6, debut: 195, duree: [20, 40], annonce: 3 };
export const AUTOSUFFISANCE = { titres: [[0, 'Citadin'], [10, 'Jardinier du dimanche'], [25, 'Semi-autonome'], [40, 'Autosuffisant']] };

