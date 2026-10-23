// Données de jeu : Scénarios de départ (v1.3) (prix France 2026, sources en commentaire ; détail dans docs/prix.md)
import { BALLON } from './energie.js';
import { PIECES } from './maison.js';

// ---------- Scénarios de départ (v1.3, passe GD 2, P6) ----------
// Multiplicateurs appliqués au joueur ET au voisin (même logement, même foyer) : le voisin est recalculé pour chaque scénario.
// surface : déperditions, inertie, radiateurs et vitrages proportionnels à la surface (référence 45 m²) ;
// pertes : qualité de l'enveloppe (1 = DPE F) ; solaire : apports par les vitrages (double vitrage à faible émissivité, facteur solaire ~0,55 contre ~0,85 en simple vitrage ; appartement mono-orienté). chauffage : 'gaz' (chaudière, rendement 0,9) ou 'elec' (convecteurs, rendement 1, prix de l'heure).
// Sources : loyers hors Paris ~15 €/m² pour un studio, ~11 €/m² pour un T4 (Clameur, observatoires locaux des loyers 2025) ;
// abonnement Base 9 kVA ≈ 4 €/mois de plus que 6 kVA (TRVE, CRE 2025-2026), indispensable avec des convecteurs ;
// eau chaude d'un foyer de 4 ≈ 2,2 × une personne seule (ADEME : 40-50 l/j à 40 °C par adulte, moins par enfant), ballon 300 l conseillé ;
// alimentation × 2,1 (échelle d'équivalence Insee-OCDE : 1 + 0,5 + 0,3 + 0,3) ; allocations familiales 2 enfants ≈ 153 €/mois (CAF, avril 2026) ;
// maison rénovée (DPE C) : environ 40 % de déperditions en moins qu'un DPE F (ADEME, « La rénovation performante »).
export const SCENARIOS = {
  standard: { nom: 'Petite maison ancienne au gaz', icone: '🏠', court: 'Maison 45 m² · gaz',
    desc: '45 m², DPE F, chaudière gaz et ballon électrique. Tu vis seul(e), salaire médian, loyer 640 €.',
    surface: 1, pertes: 1, chauffage: 'gaz', eauChaude: 1, linge: 1, repas: 1, ballon: 200, salairePlus: 0, loyerPlus: 0, aboElecPlus: 0 },
  'appartement-elec': { nom: 'Appartement tout électrique', icone: '🏢', court: 'Appart. 30 m² · convecteurs',
    desc: '30 m² au 2e étage, convecteurs électriques (9 kVA) : chaque degré se paie au prix de l\'électricité, et l\'option Tempo devient un vrai pari. Loyer 450 €.',
    surface: 30 / 45, pertes: 0.85, solaire: 0.7, chauffage: 'elec', eauChaude: 1, linge: 1, repas: 1, ballon: 150, salairePlus: 0, loyerPlus: -190, aboElecPlus: 4 },
  'famille-4': { nom: 'Famille de 4', icone: '👨‍👩‍👧‍👦', court: 'Famille de 4 · 80 m²',
    desc: '80 m² au gaz, 2 adultes et 2 enfants : eau chaude × 2,2, deux fois plus de linge, courses × 2,1. Deux salaires (3 900 €) et les allocations familiales (153 €), loyer 880 €.',
    surface: 80 / 45, pertes: 0.9, chauffage: 'gaz', eauChaude: 2.2, linge: 2, repas: 2.1, ballon: 300, salairePlus: 1853, loyerPlus: 240, aboElecPlus: 0 },
  'maison-isolee-credit': { nom: 'Maison rénovée à crédit', icone: '🏡', court: 'Maison isolée · crédit',
    desc: '45 m² rénovés (DPE C, 40 % de déperditions en moins), mais une mensualité de crédit 350 € plus chère que le loyer : moins de gaz à économiser, moins de marge chaque mois.',
    surface: 1, pertes: 0.6, solaire: 0.6, chauffage: 'gaz', eauChaude: 1, linge: 1, repas: 1, ballon: 200, salairePlus: 0, loyerPlus: 350, aboElecPlus: 0 },
};
export const SCENARIO_DEFAUT = 'standard';
// équipements sans objet selon le scénario (des convecteurs ne se purgent pas)
export const horsScenario = (id) => SC.chauffage === 'elec' && id === 'purge';
const PIECES_REF = Object.fromEntries(Object.entries(PIECES).map(([k, p]) => [k, { ...p }]));
const BALLON_REF = BALLON.litres;
// scénario actif (comme INDICES : recopié avant chaque journée et au chargement)
export const SC = { ...SCENARIOS.standard, id: 'standard' };
export function appliquerScenario(s) {
  const id = SCENARIOS[s?.scenario] ? s.scenario : SCENARIO_DEFAUT, x = SCENARIOS[id];
  if (SC.id === id) return SC;
  Object.assign(SC, x, { id });
  for (const [k, p] of Object.entries(PIECES_REF)) Object.assign(PIECES[k], { U: p.U * x.surface * x.pertes, C: p.C * x.surface, pMax: p.pMax * x.surface, fenetre: p.fenetre * x.surface * (x.solaire ?? 1) });
  BALLON.litres = x.ballon || BALLON_REF;
  return SC;
}
