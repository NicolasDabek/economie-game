// =====================================================================
// Données de jeu : PRIX RÉALISTES (France, octobre 2026) et équilibrage.
// Chaque prix porte sa source ou sa base d'estimation. Détail : docs/prix.md
// =====================================================================

// ---------- Énergie et eau ----------
export const PRIX = {
  // Électricité, EDF Tarif Bleu option Base 6 kVA, grille du 1er août 2026 : 0,2001 € TTC/kWh
  elecKwh: 0.2001,
  // Abonnement électricité Tarif Bleu Base 6 kVA : 15,86 € TTC/mois
  aboElecMois: 15.86,
  // Gaz, prix repère CRE « logement chauffé au gaz », octobre 2026 : 0,1456 € TTC/kWh
  gazKwh: 0.1456,
  // Abonnement gaz chauffage (prix repère CRE) : 360,79 € TTC/an
  aboGazAn: 360.79,
  // Eau potable + assainissement, prix moyen SISPEA/Eaufrance : 4,89 € TTC/m³
  eauM3: 4.89,
  // Dose de lessive liquide : bidon 2,5 l (~40 doses) entre 8 et 12 € en grande surface
  doseLessive: 0.22,
  // Laverie automatique : lavage 7-8 kg 4-6 €, séchage ~1 € les 8-10 min
  laverieLavage: 5.0,
  laverieSechage: 3.0,
  // Réparation lave-linge par un technicien : déplacement + main d'œuvre + pièce, 120-200 €
  reparationTechnicien: 150,
  // Pièce détachée (pompe de vidange, courroie) en réparation soi-même : 20-40 €
  reparationPiece: 30,
};

// Chaudière gaz ancienne (non condensation) : rendement 80-87 % ; on prend 85 %
export const RENDEMENT_CHAUDIERE = 0.85;
// Radiateur mal purgé : haut froid, puissance réduite d'environ un tiers
export const FACTEUR_NON_PURGE = 0.7;
// Consommation de fond (frigo, box, veilles, éclairage) : ~4 kWh/jour pour un petit logement
export const CHARGE_FOND_W = 170;

// Lave-linge classe A, 7 kg : ~45 l par cycle ; énergie selon la température (étiquette énergie + mesures ADEME)
export const LESSIVE = {
  litres: 45,
  kwh: { 30: 0.35, 40: 0.6, 60: 1.1 },
  usureVet: { 30: 1, 40: 1.5, 60: 3 },     // % d'usure ajoutés aux vêtements lavés
  capacite: 4,                          // unités de linge d'une personne (≈ kg utiles, hors draps)
  temps: 0.3,                           // h : chargement + tri
  tempsEtendage: 0.25,                  // h : étendre le linge
  volonte: 5,
  usureMachine: 2.5,                    // % par cycle
  // Sèche-linge à condensation : 2,5 kWh par cycle de 7 kg (étiquette énergie classe B)
  secheLingeKwh: 2.5,
  usureSecheLinge: 2,                   // % d'usure en plus sur les vêtements
};

// ---------- Maison ----------
export const JOURS = 56;              // 8 semaines, début décembre
export const ARGENT_DEPART = 700;     // budget « énergie et équipement » de l'hiver
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

// ---------- Vêtements ----------
// iso : °C ressentis ; poids : unités de linge ; enc : encombrement ;
// eco / durable : prix (relevés Decathlon, Kiabi, Action, Ikea, magasins de laine, 2026) et usure par jour porté.
export const VETEMENTS = {
  tshirt:     { nom: 'T-shirt', icone: '👕', iso: 0, poids: 0.3, enc: 0, sal: 30, peau: true,
                eco: { prix: 0, usure: 0.8 }, durable: null, depart: true },
  souscouche: { nom: 'Sous-couche manches longues', icone: '🩱', iso: 1.0, poids: 0.3, enc: 0, sal: 30, peau: true, protege: true,
                eco: { prix: 9, usure: 1.0 },  durable: { prix: 39, usure: 0.15, label: 'mérinos' } },
  chaussettes:{ nom: 'Chaussettes épaisses', icone: '🧦', iso: 0.8, poids: 0.2, enc: 0, sal: 35, peau: true,
                eco: { prix: 4, usure: 1.6 },  durable: { prix: 15, usure: 0.15, label: 'laine' } },
  sweat:      { nom: 'Sweat', icone: '🧥', iso: 1.5, poids: 0.8, enc: 0.5, sal: 12,
                eco: { prix: 13, usure: 0.9 }, durable: { prix: 40, usure: 0.15, label: 'molleton épais' } },
  polaire:    { nom: 'Pantalon polaire', icone: '👖', iso: 1.2, poids: 0.6, enc: 0.5, sal: 12,
                eco: { prix: 12, usure: 0.9 }, durable: { prix: 30, usure: 0.15, label: 'polaire épaisse' } },
  pilou:      { nom: 'Peignoir pilou', icone: '🥋', iso: 2.5, poids: 1.2, enc: 1.0, sal: 8,
                eco: { prix: 22, usure: 1.0 }, durable: { prix: 45, usure: 0.15, label: 'pilou épais' } },
  doudoune:   { nom: 'Doudoune d\'intérieur', icone: '🧣', iso: 3.0, poids: 1.0, enc: 1.5, sal: 5,
                eco: { prix: 25, usure: 1.1 }, durable: { prix: 70, usure: 0.15, label: 'duvet' } },
  plaid:      { nom: 'Plaid portable', icone: '🛋️', iso: 2.5, poids: 1.5, enc: 0, sal: 6, assis: true,
                eco: { prix: 12, usure: 0.6 }, durable: { prix: 35, usure: 0.15, label: 'laine' } },
};
export const SEUIL_ENCOMBREMENT = 2;   // au-delà, on bouge mal : pénalité de confort
export const KIT_COUTURE = 6;          // aiguilles, fil, boutons : 5-8 €
export const TEMPS_REPRISER = 1;
export const TEMPS_AERER_VET = 0.05;

// ---------- Équipements (prix de rayon 2026, Leroy Merlin / Castorama / Darty / pharmacie) ----------
// invest : compte dans le capital investi ; temps : heures d'installation ; vie : durée de vie en hivers (amortissement)
export const ACHATS = {
  thermometre:  { nom: 'Thermomètres de pièce (×3)', prix: 12, temps: 0.1, invest: true, vie: 10, cat: 'Instruments',
                  desc: 'Révèle la température et le coût de chaque pièce. (3 × 4 € en grande surface)' },
  hygrometre:   { nom: 'Hygromètre', prix: 9, temps: 0.1, invest: true, vie: 10, cat: 'Instruments',
                  desc: 'Révèle l\'humidité. Au-delà de 65 %, on a froid et les moisissures guettent. (7-12 €)' },
  wattmetre:    { nom: 'Wattmètre de prise', prix: 15, temps: 0.1, invest: true, vie: 10, cat: 'Instruments',
                  desc: 'Révèle la consommation électrique : appoint, lessive, production solaire. (12-20 €)' },
  calfeutrage:  { nom: 'Joints de fenêtres (calfeutrage)', prix: 22, temps: 1.5, invest: true, vie: 3, cat: 'Isolation',
                  desc: 'Mousse adhésive + mastic : −55 % d\'infiltrations, fin des courants d\'air aux fenêtres. (15-30 €)' },
  boudin:       { nom: 'Boudins de porte (×2)', prix: 24, temps: 0.2, invest: true, vie: 5, cat: 'Isolation',
                  desc: 'Bas de porte : −25 % d\'infiltrations restantes. (10-15 € pièce)' },
  rideauxTh:    { nom: 'Rideaux thermiques', prix: 95, temps: 1, invest: true, vie: 10, cat: 'Isolation',
                  desc: 'Doublure isolante : un rideau fermé bloque 50 % des pertes de la fenêtre au lieu de 25 %. (25-40 € le panneau)' },
  robinets:     { nom: 'Robinets thermostatiques (×3)', prix: 60, temps: 1.5, invest: true, vie: 15, cat: 'Chauffage',
                  desc: 'Une consigne par pièce au lieu d\'un seul thermostat dans le salon. (15-25 € pièce)' },
  purge:        { nom: 'Purger les radiateurs', prix: 3, temps: 1, invest: false, vie: 1, cat: 'Chauffage',
                  desc: 'Clé de purge à 3 € et une heure : l\'air bloqué part, les radiateurs retrouvent toute leur puissance.' },
  appoint:      { nom: 'Radiateur d\'appoint bain d\'huile 1500 W', prix: 45, temps: 0, invest: true, vie: 10, cat: 'Chauffage',
                  desc: 'Électrique (0,20 €/kWh) et mobile : chauffe seulement la pièce où tu es. (35-60 €)' },
  solaire:      { nom: 'Panneau solaire plug-and-play 400 Wc', prix: 449, temps: 2, invest: true, vie: 20, cat: 'Production',
                  desc: 'Sans batterie : seule l\'électricité consommée au moment où il produit est économisée. En hiver, ~0,5-1 kWh/jour. (350-600 €)' },
  bouillotte:   { nom: 'Bouillotte', prix: 8, temps: 0, invest: true, vie: 3, cat: 'Confort',
                  desc: 'Deux litres d\'eau chaude au lit (0,12 kWh). (6-12 € en pharmacie)' },
  housse:       { nom: 'Housse de bouillotte tricotée', prix: 8, temps: 0, invest: true, vie: 5, cat: 'Confort',
                  desc: 'Isoler pour prolonger : la bouillotte tient toute la nuit. (6-10 €)' },
  couture:      { nom: 'Kit de couture', prix: KIT_COUTURE, temps: 0, invest: true, vie: 10, cat: 'Confort',
                  desc: 'Permet de repriser les vêtements usés au lieu de les racheter.' },
};

// ---------- Volonté, temps et habitudes ----------
export const TEMPS_JOUR = 3;        // heures libres par jour de semaine
export const TEMPS_WEEKEND = 6;     // heures libres le week-end
export const JOURS_HABITUDE = 10;
export const GESTES = {
  rideaux:   { nom: 'Fermer rideaux et volets le soir', cout: 3, temps: 0.05 },
  portes:    { nom: 'Fermer les portes',                cout: 3, temps: 0 },
  bouillotte:{ nom: 'Préparer la bouillotte',           cout: 3, temps: 0.15 },
  couches:   { nom: 'S\'habiller chaudement',           cout: 3, temps: 0 },
  aerer:     { nom: 'Aérer 5 minutes, matin et soir',   cout: 2, temps: 0.1 },
  cuisson:   { nom: 'Récupérer la chaleur de la cuisson', cout: 2, temps: 0 },
};

// ---------- Principes (dont cartes transversales) ----------
export const PRINCIPES = {
  mesure:     { titre: 'On n\'optimise que ce qu\'on mesure', texte: 'Les instruments révèlent où part l\'argent. Sans mesure, on ne voit que la facture totale.' },
  ecart:      { titre: 'La perte suit l\'écart de température', texte: 'Perte = coefficient × (T intérieure − T extérieure). Chaque degré en moins réduit la facture d\'environ 7 %.' },
  gens:       { titre: 'Chauffer les gens, pas les murs', texte: 'Une couche de vêtement vaut 1 à 3 °C ressentis, gratuitement, jour après jour.' },
  zones:      { titre: 'Zoner la maison', texte: 'Portes fermées et une consigne par pièce : on ne chauffe que là où l\'on vit.' },
  rideau:     { titre: 'La fenêtre, point faible de la nuit', texte: 'Rideaux et volets fermés la nuit, ouverts au soleil.' },
  soleil:     { titre: 'Le soleil est gratuit', texte: 'Par temps clair, une fenêtre au sud chauffe comme un radiateur.' },
  calfeutrer: { titre: 'Boucher avant de chauffer', texte: 'Un courant d\'air fait perdre de la chaleur et fait sentir 1 °C de moins.' },
  lit:        { titre: 'Chauffer le lit, pas la chambre', texte: 'Une bouillotte (0,12 kWh) remplace des heures de radiateur la nuit.' },
  habitude:   { titre: 'Une habitude ne coûte plus rien', texte: 'Répété assez longtemps, un geste devient automatique : plus de volonté, moins de temps.' },
  sale:       { titre: 'Un vêtement sale isole mal', texte: 'Les fibres tassées et grasses retiennent moins l\'air.' },
  masse:      { titre: 'La masse thermique lisse', texte: 'Murs et meubles stockent la chaleur : la pièce ne refroidit pas d\'un coup.' },
  humidite:   { titre: 'L\'humidité refroidit', texte: 'Un air trop humide donne froid et fait moisir. Respirer, cuisiner et sécher le linge humidifient.' },
  aeration:   { titre: 'Aérer vite, pas longtemps', texte: '5 minutes en grand renouvellent l\'air sans refroidir les murs ; une fenêtre entrouverte toute la journée vide la maison de sa chaleur.' },
  local:      { titre: 'Chauffer local', texte: 'Un appoint qui suit la personne remplace le chauffage de toute la maison.' },
  purge:      { titre: 'Entretenir pour mieux chauffer', texte: 'Un radiateur purgé chauffe à pleine puissance : la maison se réchauffe vite.' },
  rentabilite:{ titre: 'Un investissement doit se rentabiliser', texte: 'Compare le prix au gain par jour : combien de jours, de mois ou d\'années pour rentrer dans ses frais ?' },
  coutUsage:  { titre: 'Coût par usage', texte: 'Le prix divisé par le nombre de jours portés : le durable est souvent moins cher à l\'usage.' },
  aererVet:   { titre: 'Aérer plutôt que laver', texte: 'Un pull qui n\'est pas sale a seulement besoin d\'air : pas d\'eau, pas d\'énergie, pas d\'usure.' },
  temps:      { titre: 'Le temps est une ressource', texte: 'Chaque économie prend du temps. Ce qui en reste devient du repos et de la volonté.' },
  // Cartes transversales (servent dans plusieurs domaines)
  volume:     { titre: 'Réduire le volume', texte: 'Machine pleine, basse température, sous-couche lavable : on lave moins de choses, moins souvent. Vaut aussi pour l\'eau, les courses, les déchets.', transversal: true },
  prolonger:  { titre: 'Isoler pour prolonger', texte: 'Housse de bouillotte, rideau thermique, marmite norvégienne : ralentir la perte, c\'est garder plus longtemps.', transversal: true },
  reparer:    { titre: 'Réparer avant de remplacer', texte: 'Une couture, une pièce de lave-linge : vêtements, électroménager, vélo, chaussures.', transversal: true },
  decaler:    { titre: 'Décaler la consommation', texte: 'Lancer la machine quand le soleil produit ou aux heures creuses : même usage, facture plus basse.', transversal: true },
};

// ---------- Événements et dilemmes annoncés ----------
export const EVENEMENTS = [
  { jour: 8,  annonce: 3, id: 'invites',  titre: 'Des invités pour le week-end', texte: 'Ta sœur et son conjoint arrivent samedi pour deux jours. Ils sont frileux.' },
  { jour: 17, annonce: 0, id: 'promo',    titre: 'Tentation : promo flash', texte: 'Doudoune d\'intérieur premier prix à −50 % (12,50 €) en vitrine, aujourd\'hui seulement.' },
  { jour: 28, annonce: 7, id: 'hausse',   titre: 'Hausse du prix du gaz', texte: 'Le prix repère du gaz augmente de 12 % (+0,0175 €/kWh) jusqu\'à la fin de l\'hiver.' },
  { jour: 38, annonce: 0, id: 'panne',    titre: 'Panne du lave-linge', texte: 'La machine fait un bruit de ferraille puis s\'arrête : la pompe de vidange a lâché.' },
];
