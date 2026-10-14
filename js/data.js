// Données de jeu (équilibrage centralisé)
export const PRIX_KWH = 0.25;      // €/kWh
export const PRIX_EAU_L = 0.004;   // €/litre
export const JOURS = 56;           // 8 semaines d'hiver
export const ARGENT_DEPART = 900;

export const PIECES = {
  salon:   { nom: 'Salon',   U: 62, C: 1200, fenetre: 3.0, pMax: 1800 },
  chambre: { nom: 'Chambre', U: 40, C: 800,  fenetre: 1.5, pMax: 1200 },
  cuisine: { nom: 'Cuisine', U: 34, C: 700,  fenetre: 1.0, pMax: 1000 },
};
export const ORDRE_PIECES = ['salon', 'chambre', 'cuisine'];

// Part des pertes passant par les fenêtres / par les fuites d'air
export const PART_FENETRE = 0.3;
export const GAIN_RIDEAU = 0.45;      // réduction des pertes fenêtre rideau fermé
export const GAIN_CALFEUTRAGE = 0.25; // réduction des pertes totales
export const ECHANGE_PORTE = { ouvertes: 35, fermees: 4 }; // W/K entre pièces

// Emploi du temps : pièce occupée selon l'heure
export function pieceOccupee(h) {
  if (h >= 23 || h < 7) return 'chambre';
  if (h === 7) return 'chambre';
  if (h === 12 || h === 19) return 'cuisine';
  return 'salon';
}
export const estJour = (h) => h >= 7 && h < 23;

export const VETEMENTS = {
  tshirt:  { nom: 'T-shirt',          iso: 0.0, prix: 0,  salParJour: 30, icone: '👕' },
  sweat:   { nom: 'Sweat',            iso: 2.0, prix: 22, salParJour: 10, icone: '🧥' },
  polaire: { nom: 'Pantalon polaire', iso: 1.5, prix: 16, salParJour: 12, icone: '👖' },
  pilou:   { nom: 'Peignoir pilou',   iso: 2.5, prix: 32, salParJour: 8,  icone: '🥋' },
};
export const USURE_JOUR = 0.6;   // % par jour porté
export const USURE_LAVAGE = 4;   // % par lavage

export const LESSIVE = { kwh: 0.9, litres: 50, produit: 0.25, volonte: 6, usureMachine: 1.2 };
export const REPARATION_MACHINE = 90;

export const ACHATS = {
  calfeutrage: { nom: 'Kit de calfeutrage', prix: 45, desc: 'Joints de fenêtres et boudins de porte : −25 % de pertes, plus de courants d\'air.' },
  bouillotte:  { nom: 'Bouillotte',         prix: 9,  desc: 'Un litre d\'eau chaude au lit (0,1 kWh). Réchauffe le début de nuit.' },
  housse:      { nom: 'Housse de bouillotte', prix: 7, desc: 'Ralentit la diffusion : la bouillotte tient toute la nuit.' },
  thermometre: { nom: 'Thermomètres de pièce', prix: 12, desc: 'Instrument : révèle la température et le coût de chaque pièce.' },
};

// Gestes qui demandent de la volonté tant qu'ils ne sont pas des habitudes
export const GESTES = {
  rideaux:   { nom: 'Fermer les rideaux le soir', cout: 3 },
  portes:    { nom: 'Fermer les portes',          cout: 3 },
  bouillotte:{ nom: 'Préparer la bouillotte',     cout: 4 },
  couches:   { nom: 'S\'habiller chaudement',     cout: 3 },
};
export const JOURS_HABITUDE = 10;

export const PRINCIPES = {
  mesure:     { titre: 'On n\'optimise que ce qu\'on mesure', texte: 'Les thermomètres révèlent où part l\'argent. Sans mesure, on ne voit que la facture totale.' },
  ecart:      { titre: 'La perte suit l\'écart de température', texte: 'Perte = coefficient × (T intérieure − T extérieure). Chaque degré en moins réduit la facture d\'environ 7 %.' },
  gens:       { titre: 'Chauffer les gens, pas les murs', texte: 'Une couche de vêtement vaut 2 °C ressentis, gratuitement, jour après jour.' },
  zones:      { titre: 'Zoner la maison', texte: 'Portes fermées, chaque pièce garde sa chaleur : on ne chauffe que là où l\'on vit.' },
  rideau:     { titre: 'Le rideau, isolant de nuit', texte: 'La fenêtre est le point faible. Rideau fermé la nuit, ouvert au soleil.' },
  soleil:     { titre: 'Le soleil est gratuit', texte: 'Par temps clair, une fenêtre au sud chauffe comme un radiateur. Ouvre grand les rideaux le jour.' },
  calfeutrer: { titre: 'Boucher avant de chauffer', texte: 'Un courant d\'air fait perdre de la chaleur et fait sentir 1 °C de moins. On isole d\'abord.' },
  lit:        { titre: 'Chauffer le lit, pas la chambre', texte: 'Une bouillotte (0,1 kWh) remplace des heures de radiateur la nuit.' },
  stockage:   { titre: 'Ralentir la chaleur, c\'est la stocker', texte: 'La housse étale la chaleur de la bouillotte sur toute la nuit.' },
  habitude:   { titre: 'Une habitude ne coûte plus rien', texte: 'Répété assez longtemps, un geste devient automatique : il ne consomme plus de volonté.' },
  sale:       { titre: 'Un vêtement sale isole mal', texte: 'Les fibres tassées et grasses retiennent moins l\'air : moins chaud, moins sain.' },
  masse:      { titre: 'La masse thermique lisse', texte: 'Murs et meubles stockent la chaleur : une pièce ne refroidit pas d\'un coup quand on coupe le chauffage.' },
};
