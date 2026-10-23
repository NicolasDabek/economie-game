// Données de jeu : Banque et placements (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

// ---------- Banque et placements (v0.5) — taux et règles en vigueur en octobre 2026 ----------
export const PROFILS = {
  // RFR d'une personne seule (1 part). LEP : RFR ≤ 23 028 € en métropole (service-public.gouv.fr, plafonds 2026).
  // Salaire net mensuel après prélèvement à la source : SMIC net ~1 440 € (2026) ; salaire net médian du privé ~2 190 € (Insee, 2024, revalorisé) ;
  // loyer d'un T2 de 45 m² hors Paris ~11-16 €/m² (Clameur / observatoires locaux 2025). Le « reste à vivre » finance tout le jeu.
  modeste: { nom: 'Revenus modestes', rfr: 18000, tmi: 0.11, epargne: 1500, salaire: 1650, loyer: 520, desc: 'SMIC + un peu : éligible au LEP.' },
  median:  { nom: 'Revenus médians', rfr: 26000, tmi: 0.11, epargne: 4000, salaire: 2200, loyer: 640, desc: 'Salaire médian : trop pour le LEP.' },
  aise:    { nom: 'Revenus confortables', rfr: 48000, tmi: 0.30, epargne: 12000, salaire: 3900, loyer: 900, desc: 'Cadre : tranche à 30 %.' },
};
// Trajectoires économiques annuelles (v0.6), tirées par graine autour de valeurs réalistes :
// inflation : AR(1) autour de 2 % (cible BCE), écart-type 0,8 pt ; 1re année 3,0 % (Insee, sept. 2026).
// gaz : inflation ± 10 %/an (prix repère CRE très volatil : +100 % en 2022, −20 % en 2024) ; électricité (TRVE, révisée en février et août) : inflation ± 5 % ;
// alimentation : inflation ± 1,5 pt ; eau : +3 %/an (SISPEA) ; carburant : inflation ± 8 % ; abonnements : +3 %/an si on ne renégocie pas.
// salaires : inflation + 0,5 pt ± 0,6 (Dares, SMPT) ; loyers : IRL ≈ inflation, plafonné à 3,5 % (comme en 2022-2024).
// €STR : AR(1) autour de 2 % ; Livret A = moyenne (inflation semestrielle, €STR) arrondie au 0,1 pt, plancher 0,5 % (règle Banque de France, révisions 1er février et 1er août) ;
// LEP = Livret A + 0,5 pt (règle 2025), LDDS = Livret A.
export const ECONOMIE = {
  inflation: { moy: 0.02, ecart: 0.008, rho: 0.6, depart: 0.03 },
  estr: { moy: 0.02, ecart: 0.006, rho: 0.7, depart: 0.0193 },
  gaz: 0.10, elec: 0.05, alim: 0.015, eau: 0.03, carburant: 0.08, services: 0.03,
  salaire: { prime: 0.005, ecart: 0.006 }, loyerPlafond: 0.035,
};
// Appareils de la maison (communs au joueur et au voisin : même logement). Âge de départ, durée de vie, prix de remplacement posé.
// Sources : ADEME « durée de vie des équipements » (frigo 10-15 ans, lave-linge 8-12, ballon 10-15, chaudière 15-25) ;
// chaudière gaz à condensation posée 3 000-5 000 € (Effy, QuelleEnergie 2026) ; ballon 200 L posé 700-1 200 € ; frigo 400-700 € ; lave-linge 350-600 €.
export const APPAREILS = {
  frigo:    { nom: 'Réfrigérateur', age: 8, vie: 12, prix: 520, occasion: 260, reparation: 120, desc: 'Compresseur fatigué.' },
  laveLinge:{ nom: 'Lave-linge', age: 6, vie: 10, prix: 450, occasion: 220, reparation: 150, desc: 'Roulements et pompe à bout.' },
  ballon:   { nom: 'Ballon d\'eau chaude', age: 10, vie: 15, prix: 950, occasion: null, reparation: 180, desc: 'Résistance entartrée ou cuve percée.' },
  chaudiere:{ nom: 'Chaudière gaz', age: 16, vie: 20, prix: 3900, occasion: null, reparation: 450, desc: 'Échangeur fuyard : le chauffagiste déconseille de réparer encore.' },
};
export const BANQUE = {
  // Arrêté du 28 juillet 2026 (JO 29/07/2026) : taux du 1er août 2026 au 31 janvier 2027. Au-delà : hypothèse de maintien.
  livretA: { nom: 'Livret A', taux: 0.017, plafond: 22950, exonere: true },
  ldds:    { nom: 'LDDS', taux: 0.017, plafond: 12000, exonere: true },
  lep:     { nom: 'LEP', taux: 0.025, plafond: 10000, exonere: true, plafondRfr: 23028 },   // 2,5 % maintenu au 1er août 2026 (coup de pouce)
  pel:     { nom: 'PEL', taux: 0.02, tauxCel: 0.0125, plafond: 61200, ouverture: 225, versementAn: 540, pfu: 0.30 }, // PEL ouverts en 2026 : 2 % brut ; PFU 30 % (12,8 + 17,2 : le PEL échappe à la hausse de CSG)
  // Assurance vie : fonds euros 2,63 % en 2025 (ACPR, net de frais de gestion, avant prélèvements sociaux)
  av: {
    enLigne: { nom: 'Contrat en ligne', entree: 0, gestionUC: 0.005, fondsEuros: 0.026 },
    banque:  { nom: 'Contrat de banque de réseau', entree: 0.025, gestionUC: 0.0085, fondsEuros: 0.022 },
    psFondsEuros: 0.172,          // prélèvements sociaux sur les intérêts du fonds euros, prélevés chaque année (assurance vie : reste à 17,2 %)
    irAvant8: 0.128, abattement8: 4600, irApres8: 0.075,   // rachat : PFU avant 8 ans ; après 8 ans abattement 4 600 € (personne seule) puis 7,5 %
  },
  pfu: 0.314,                     // 12,8 % IR + 18,6 % PS : LFSS 2026 (CSG 9,2 → 10,6 %) sur dividendes, plus-values, intérêts
  psPea: 0.186,                   // PEA après 5 ans : seulement les prélèvements sociaux
  psFoncier: 0.172,               // revenus fonciers : restent à 17,2 %
  microFoncier: 0.30,             // abattement forfaitaire du micro-foncier
  decouvert: { autorise: 500, taeg: 0.16, horsAutorisation: 0.20, commission: 8, commissionMois: 80 }, // découvert autorisé ~7-16 % ; commission d'intervention plafonnée 8 €/op, 80 €/mois (art. R312-4-1 CMF)
  precautionMois: 1,              // épargne de précaution conseillée : au moins 1 à 3 mois de dépenses sur un livret
};
export const MARCHES = {
  // Modèle stochastique déterministe par graine : 2 régimes de volatilité (calme / tendu), sauts de krach rares.
  // Calage : MSCI World en euros ~7 %/an nominal, volatilité ~15 %, krachs de −20 à −35 % quelques fois par décennie.
  // Vérifié sur 2 000 années simulées (outil : test/finance-test.mjs) : moyenne arithmétique 7,8 %, géométrique 6,6 %,
  // volatilité 15,7 %, pire année −36 %, baisse maximale médiane en cours d'année −12 % (historique MSCI World : ~−14 %).
  monde: { nom: 'ETF MSCI World', mu: 0.077, sigma: [0.11, 0.25], ter: 0.002, pea: true },
  cac:   { nom: 'ETF CAC 40 (dividendes réinvestis)', mu: 0.075, sigma: [0.13, 0.29], ter: 0.0025, pea: true, correl: 0.85 },
  oblig: { nom: 'Fonds obligataire États zone euro', mu: 0.04, sigma: [0.05, 0.08], ter: 0.003, correl: 0.1 },  // OAT 10 ans 4,8 % (TEC 10, 9 oct. 2026) ; mix euro ~4 %
  regime: { pTendu: 0.005, pCalme: 0.03 },   // probabilités journalières de bascule : ~15 % du temps en régime tendu
  krach: { p: 0.0012, taille: [-0.05, -0.09] },
  scpi: { distribution: 0.0491, frais: 0.10, jouissanceMois: 4, retraitJours: 60, revalo: 0.0, revaloSigma: 0.04, chocP: 0.12, choc: -0.10 }, // ASPIM 2025 : 4,91 % ; frais 8-12 % ; jouissance 3-6 mois
  courtage: { pea: 0.005, ctoPct: 0.002, ctoMin: 1.99 },   // PEA : 0,5 % max en ligne (décret 2020-95) ; CTO : courtier en ligne ~0,1-0,5 %, min ~2 €
  peaPlafond: 150000,
  inflation: 0.030,               // Insee : +3,0 % sur un an en septembre 2026 (provisoire)
  inflationLongTerme: 0.02,       // hypothèse pour les projections (cible BCE)
};

