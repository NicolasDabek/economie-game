// Données de jeu : Maison : pièces, isolation, calendrier de campagne (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

// ---------- Maison ----------
// v0.6 : campagne de plusieurs années, quatre saisons par an (calendrier réel à partir du 1er décembre 2026).
// L'automne utilise le modèle de mi-saison du printemps (id « printemps ») avec sa propre météo et son nom.
export const CHAPITRES = [
  { id: 'hiver', saison: 'hiver', nom: 'Hiver', mois: [11, 0, 1], debut: '1er décembre', tEauFroide: 10, lumiere: [17, 8] },
  { id: 'printemps', saison: 'printemps', nom: 'Printemps', mois: [2, 3, 4], debut: '1er mars', tEauFroide: 13, lumiere: [20, 7] },
  { id: 'ete', saison: 'ete', nom: 'Été', mois: [5, 6, 7], debut: '1er juin', tEauFroide: 18, lumiere: [21.5, 6] },
  { id: 'printemps', saison: 'automne', nom: 'Automne', mois: [8, 9, 10], debut: '1er septembre', tEauFroide: 15, lumiere: [19, 7.5] },
];
export const CAMPAGNE = { anneesDefaut: 5, options: [3, 5, 10], debut: Date.UTC(2026, 11, 1) };
export const joursCampagne = (annees = CAMPAGNE.anneesDefaut) => Math.round((Date.UTC(2026 + annees, 11, 1) - CAMPAGNE.debut) / 86400000);
export const JOURS = joursCampagne(CAMPAGNE.anneesDefaut);   // 1 826 jours pour 5 ans
export const ARGENT_DEPART = 1500;    // trésorerie de départ sur le compte courant (≈ 1 mois de « reste à vivre ») ; ensuite le salaire tombe chaque mois
// Maison ancienne de 45 m² (DPE F) : déperditions ~105 W/K au total.
// Avec 21 °C partout, la facture de chauffage de décembre-janvier atteint ~400 € de gaz,
// cohérent avec une consommation annuelle de ~8 000-9 000 kWh pour ce type de logement.
// pMax = puissance des radiateurs (≈ 100 W/m²)
export const PIECES = {
  salon:   { nom: 'Salon',   U: 48, C: 1100, fenetre: 3.0, pMax: 2000 },
  chambre: { nom: 'Chambre', U: 31, C: 750,  fenetre: 1.5, pMax: 1000 },
  cuisine: { nom: 'Cuisine', U: 26, C: 650,  fenetre: 1.0, pMax: 1000 },
};
export const ORDRE_PIECES = ['salon', 'chambre', 'cuisine'];

export const PART_FENETRE = 0.3;        // part des pertes par les fenêtres
export const PART_INFILTRATION = 0.25;  // part des pertes par les fuites d'air
export const ISOLATION = {
  rideauSimple: 0.25,     // rideau fin : −25 % des pertes de la fenêtre
  rideauThermique: 0.5,   // rideau thermique doublé : −50 %
  volets: 0.4,            // volets fermés la nuit : −40 % (en plus)
  calfeutrage: 0.55,      // joints de fenêtres : −55 % des infiltrations
  boudin: 0.25,           // boudins de porte : −25 % des infiltrations
};
export const ECHANGE_PORTE = { ouvertes: 35, fermees: 4 }; // W/K entre pièces
export const P_APPOINT = 1500;  // bain d'huile 1500 W (puissance typique 1000-2000 W)
export const PANNEAU_WC = 400;  // kit plug-and-play 400 Wc

// Emploi du temps (télétravail) : pièce occupée et activité
export function pieceOccupee(h) {
  if (h >= 23 || h < 7) return 'chambre';
  if (h === 7) return 'chambre';
  if (h === 12 || h === 19) return 'cuisine';
  return 'salon';
}
export const estJour = (h) => h >= 7 && h < 23;

