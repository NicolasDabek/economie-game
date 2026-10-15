// Paliers de moral et de bien-être (v0.8.1) : chaque jauge a des seuils visibles avec des effets concrets.
// Ordres de grandeur : un salarié épanoui négocie mieux et apprend plus vite (Gallup « State of the Global Workplace » 2024) ;
// la déprime fait sauter les routines et augmente les arrêts ; un épuisement professionnel coûte en moyenne
// plusieurs semaines d'arrêt (Assurance maladie, rapport « Charges et produits » 2024 : ~11 % des arrêts longs pour troubles psychologiques).
// Psychologue : dispositif « Mon soutien psy » 50 €/séance remboursée à 60 % par la Sécu, le reste par la mutuelle (reste ~0-20 €).
export const PALIERS_MORAL = [
  { id: 'crise', min: 0, nom: 'Crise', ico: '🆘', effet: 'Arrêt forcé pour épuisement, consultations : coûteux.', conseil: 'Vacances, plaisirs, sorties : remonte d\'urgence au-dessus de 10.' },
  { id: 'deprime', min: 10, nom: 'Déprime', ico: '🌧️', effet: 'Gestes sautés, aucune nouvelle habitude, santé qui baisse, achats compulsifs.', conseil: 'Remets un petit budget plaisir et sors : la déprime coûte plus qu\'elle n\'économise.' },
  { id: 'fragile', min: 25, nom: 'Fragile', ico: '🌥️', effet: 'Nouveaux gestes plus durs (+15 % de coût en moral), tentations d\'achat.', conseil: 'Un geste à la fois, et garde 10-20 €/semaine de plaisirs.' },
  { id: 'neutre', min: 40, nom: 'Stable', ico: '⛅', effet: 'Aucun effet particulier.', conseil: 'Au-dessus de 60 : habitudes plus faciles et meilleure négociation salariale.' },
  { id: 'epanoui', min: 60, nom: 'Épanoui', ico: '☀️', effet: 'Gestes −20 % de coût en moral, augmentation mieux négociée (+0,5 %/an).', conseil: 'Garde le cap : plaisirs variés, vie sociale, lumière.' },
];
export const PALIERS_BE = [
  { id: 'burnout', min: 0, nom: 'Épuisement', ico: '🔥', effet: 'Burn-out : arrêt de 2 semaines (carence, salaire réduit).', conseil: 'Du temps libre, du sommeil, des plaisirs : c\'est urgent.' },
  { id: 'epuise', min: 20, nom: 'À bout', ico: '😫', effet: 'Mauvais sommeil : santé −0,3/j, moral qui baisse, plus de maladies, productivité en baisse.', conseil: 'Libère du temps, dors au frais mais pas au froid, reprends un plaisir.' },
  { id: 'fatigue', min: 35, nom: 'Fatigué', ico: '🥱', effet: 'Sommeil moyen : santé −0,1/j, moral un peu plus bas.', conseil: 'Un peu plus de temps libre ou de plaisirs suffit.' },
  { id: 'correct', min: 50, nom: 'Correct', ico: '🙂', effet: 'Aucun effet particulier.', conseil: 'Au-dessus de 70 : sommeil réparateur, santé et moral en hausse.' },
  { id: 'forme', min: 70, nom: 'En forme', ico: '😄', effet: 'Sommeil réparateur : santé +0,15/j, moral +2, temps libre plus ressourçant.', conseil: 'Continue : temps libre, lumière, petits plaisirs.' },
];
const trouver = (P, v) => [...P].reverse().find(p => v >= p.min) || P[0];
export const palierMoral = (v) => trouver(PALIERS_MORAL, v);
export const palierBE = (v) => trouver(PALIERS_BE, v);
export const EFFETS_PALIERS = {
  coutVolonte: { epanoui: 0.8, neutre: 1, fragile: 1.15, deprime: 1, crise: 1 },
  tentation: { proba: 0.08, min: 10, max: 35 },             // moral fragile : petits achats d'impulsion
  sauteGeste: 0.3,                                         // déprime : chaque geste non acquis sauté 3 jours sur 10
  santeDeprime: 0.2,
  crise: { joursArret: 7, soins: 45, remonte: 30, delai: 90 },
  bonusAugm: 0.005, seuilAugmBonus: 60,
  santeBE: { forme: 0.15, correct: 0, fatigue: -0.1, epuise: -0.3, burnout: -0.3 },
  baseBE: { forme: 2, correct: 0, fatigue: -2, epuise: -5, burnout: -8 },
  libreBE: { forme: 1.2 },                                 // le temps libre ressource 20 % de plus
  seuilMaladieEpuise: 50,
  burnout: { joursArret: 14, soins: 40, remonte: 40, delai: 120 },
  seuilBEAugm: 35,
};
