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
// Trois chapitres enchaînés : hiver (8 semaines), printemps (4 semaines), été (6 semaines)
export const CHAPITRES = [
  { id: 'hiver', nom: 'Hiver', jours: 56, debut: '1er décembre', tEauFroide: 10, lumiere: [17, 8] },
  { id: 'printemps', nom: 'Printemps', jours: 28, debut: '6 avril', tEauFroide: 13, lumiere: [20, 7] },
  { id: 'ete', nom: 'Été', jours: 42, debut: '1er juillet', tEauFroide: 18, lumiere: [21.5, 6] },
];
export const JOURS = CHAPITRES.reduce((a, c) => a + c.jours, 0);
export const ARGENT_DEPART = 3000;    // budget du foyer (une personne) pour les 18 semaines jouées, hors loyer
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
  // --- Eau chaude ---
  pommeau:      { nom: 'Pommeau de douche économe', prix: 18, temps: 0.2, invest: true, vie: 10, cat: 'Eau chaude',
                  desc: '7 l/min au lieu de 12, même sensation grâce à l\'air injecté. (12-25 €)' },
  mousseurs:    { nom: 'Mousseurs de robinet (×2)', prix: 8, temps: 0.1, invest: true, vie: 10, cat: 'Eau chaude',
                  desc: '−40 % de débit à l\'évier et au lavabo. (3-5 € pièce)' },
  jaquette:     { nom: 'Jaquette isolante pour ballon', prix: 29, temps: 0.5, invest: true, vie: 10, cat: 'Eau chaude',
                  desc: 'Isoler pour prolonger : −35 % de pertes du ballon. (20-40 €)' },
  seau:         { nom: 'Seau et broc', prix: 6, temps: 0, invest: true, vie: 10, cat: 'Eau chaude',
                  desc: 'Pour récupérer l\'eau froide du début de douche, ou se laver au seau.' },
  // --- Cuisine ---
  boites:       { nom: 'Boîtes de conservation en verre', prix: 25, temps: 0, invest: true, vie: 10, cat: 'Cuisine',
                  desc: 'Indispensables pour cuisiner en grande quantité et garder les restes. (20-35 € le lot)' },
  autocuiseur:  { nom: 'Autocuiseur 6 l', prix: 69, temps: 0, invest: true, vie: 15, cat: 'Cuisine', occasion: 30,
                  desc: 'La pression cuit 2 à 3 fois plus vite : −35 % d\'énergie, −20 % de temps. (55-90 € neuf)' },
  marmite:      { nom: 'Marmite norvégienne (fabrication maison)', prix: 12, temps: 1, invest: true, vie: 5, cat: 'Cuisine',
                  desc: 'Une caisse isolée : on porte à ébullition, la cuisson finit seule. −20 % d\'énergie.' },
  fresnel:      { nom: 'Lentille de Fresnel (A3)', prix: 39, temps: 0.5, invest: true, vie: 10, cat: 'Cuisine solaire',
                  desc: 'Concentre le soleil : cuit vite par beau temps. Dangereuse sans lunettes (brûlures, yeux). (25-60 €)' },
  lunettes:     { nom: 'Lunettes de protection teintées', prix: 12, temps: 0, invest: true, vie: 10, cat: 'Cuisine solaire',
                  desc: 'Obligatoires avec une lentille de Fresnel. (10-20 €)' },
  fourSolaire:  { nom: 'Four solaire (caisson)', prix: 129, temps: 0.5, invest: true, vie: 10, cat: 'Cuisine solaire', occasion: 60,
                  desc: 'Cuit lentement et sans danger par temps clair, surtout au printemps et en été. (90-200 €)' },
  sechoir:      { nom: 'Séchoir solaire (fabrication maison)', prix: 20, temps: 2, invest: true, vie: 5, cat: 'Cuisine solaire',
                  desc: 'Sèche fruits, légumes et herbes en trop : moins de gaspillage.' },
  pierre:       { nom: 'Pierres de masse thermique', prix: 15, temps: 0.3, invest: true, vie: 20, cat: 'Cuisine solaire',
                  desc: 'Chauffées à la Fresnel le midi en hiver, elles rendent leur chaleur au salon le soir.' },
  // --- Électricité ---
  multiprise:   { nom: 'Multiprise à interrupteur', prix: 12, temps: 0.2, invest: true, vie: 10, cat: 'Électricité',
                  desc: 'Coupe d\'un geste les veilles de la télé, de la console et des chargeurs. (8-15 €)' },
  led:          { nom: 'Ampoules LED (×6)', prix: 24, temps: 0.3, invest: true, vie: 15, cat: 'Électricité',
                  desc: '25 W au lieu de 150 W pour le même éclairage. (3-5 € pièce)' },
  // --- Été ---
  ventilateur:  { nom: 'Ventilateur sur pied', prix: 35, temps: 0, invest: true, vie: 8, cat: 'Été', occasion: 15,
                  desc: '45 W : −2,5 °C ressentis, mais ne refroidit pas l\'air. (25-50 €)' },
  clim:         { nom: 'Climatiseur mobile', prix: 349, temps: 0.5, invest: true, vie: 8, cat: 'Été', occasion: 170,
                  desc: '1 000 W électriques pour 2,6 kW de froid. Efficace mais gourmand. (250-450 €)' },
  moustiquaire: { nom: 'Moustiquaires de fenêtre', prix: 18, temps: 0.5, invest: true, vie: 5, cat: 'Été',
                  desc: 'Permet d\'ouvrir grand la nuit sans se faire dévorer. (10-25 €)' },
  corde:        { nom: 'Corde à linge et pinces', prix: 9, temps: 0.3, invest: true, vie: 10, cat: 'Été',
                  desc: 'Sécher dehors au printemps et en été : gratuit, rapide, sans humidité dans la maison.' },
  // --- Jardin ---
  herbes:       { nom: 'Herbes aromatiques en pot', prix: 9, temps: 0.2, invest: true, vie: 2, cat: 'Jardin',
                  desc: 'Basilic, persil, ciboulette sur le rebord : plus de bouquets à 1,50 €.' },
  composteur:   { nom: 'Composteur 300 l', prix: 25, temps: 1, invest: true, vie: 10, cat: 'Jardin',
                  desc: 'Souvent offert par la collectivité. Épluchures -> terreau : potager +30 %, poubelle moins odorante.' },
  potager:      { nom: 'Petit potager (graines, plants, terreau)', prix: 28, temps: 2, invest: true, vie: 1, cat: 'Jardin',
                  desc: 'Récoltes après 3 semaines au printemps et en été. 15 min d\'entretien par jour, bon pour le moral.' },
  cuve:         { nom: 'Récupérateur d\'eau de pluie 300 l', prix: 69, temps: 1, invest: true, vie: 15, cat: 'Jardin',
                  desc: 'Arroser avec l\'eau du ciel plutôt qu\'avec l\'eau du robinet à 4,89 €/m³. (50-90 €)' },
  couture:      { nom: 'Kit de couture', prix: KIT_COUTURE, temps: 0, invest: true, vie: 10, cat: 'Confort',
                  desc: 'Permet de repriser les vêtements usés au lieu de les racheter.' },
};

// ---------- Volonté, temps et habitudes ----------
export const TEMPS_JOUR = 4;        // heures disponibles par jour de semaine (repas, ménage et loisirs compris)
export const TEMPS_WEEKEND = 7;     // heures disponibles le week-end
export const JOURS_HABITUDE = 10;
export const GESTES = {
  rideaux:   { nom: 'Fermer rideaux et volets le soir', cout: 3, temps: 0.05 },
  portes:    { nom: 'Fermer les portes',                cout: 3, temps: 0 },
  bouillotte:{ nom: 'Préparer la bouillotte',           cout: 3, temps: 0.15 },
  couches:   { nom: 'S\'habiller chaudement',           cout: 3, temps: 0 },
  aerer:     { nom: 'Aérer 5 minutes, matin et soir',   cout: 2, temps: 0.1 },
  cuisson:   { nom: 'Récupérer la chaleur de la cuisson', cout: 2, temps: 0 },
  couperEau: { nom: 'Couper l\'eau pendant le savonnage', cout: 2, temps: 0 },
  recupEau:  { nom: 'Récupérer l\'eau froide de la douche', cout: 2, temps: 0.02 },
  couvercle: { nom: 'Cuire avec couvercle', cout: 1, temps: 0 },
  bouilloire:{ nom: 'Chauffer la quantité exacte d\'eau', cout: 1, temps: 0 },
  frigo:     { nom: 'Ne rien mettre de chaud au frigo', cout: 1, temps: 0 },
  multiprise:{ nom: 'Éteindre la multiprise', cout: 2, temps: 0 },
  liste:     { nom: 'Liste de courses et menu des restes', cout: 2, temps: 0.1 },
  prixKilo:  { nom: 'Comparer les prix au kilo', cout: 2, temps: 0.05 },
  voletsJour:{ nom: 'Fermer les volets le jour (été)', cout: 2, temps: 0.03 },
  ventNuit:  { nom: 'Ouvrir grand la nuit (été)', cout: 2, temps: 0.03 },
  jardiner:  { nom: 'Jardiner un quart d\'heure', cout: 0, temps: 0.25 },
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
  eauChaude:  { titre: 'L\'eau chaude, c\'est de l\'énergie', texte: 'Chaque litre chauffé de 10 à 38 °C coûte 0,03 kWh. Une douche de 10 min au vieux pommeau, c\'est 4 kWh.' },
  legionelles:{ titre: 'Pas sous 55 °C', texte: 'Baisser le ballon réduit ses pertes, mais en dessous de 55 °C les légionelles prolifèrent. Le bon réglage : 55 °C.' },
  tempo:      { titre: 'Effacer les jours rouges', texte: 'Un kWh en heure pleine de jour rouge coûte 0,73 €, presque 4 fois le prix normal : ce jour-là, on décale tout.' },
  veilles:    { titre: 'La consommation fantôme', texte: 'Les veilles tournent 24 h sur 24 : 45 W, c\'est près de 400 kWh par an pour rien.' },
  lumiere:    { titre: 'La bonne ampoule', texte: 'Une LED éclaire autant qu\'un halogène pour six fois moins d\'électricité.' },
  frigo:      { titre: 'Un frigo bien traité', texte: '4 °C suffisent ; le givre isole l\'évaporateur et un plat chaud le fait tourner pour rien.' },
  gaspillage: { titre: 'Le moins cher est ce qu\'on ne jette pas', texte: 'Près d\'un cinquième des courses finit à la poubelle. Liste, restes et grandes quantités réduisent la facture plus que les promos.' },
  prixKilo:   { titre: 'Le prix au kilo ne ment pas', texte: 'Le grand format, la promo ou le vrac ne sont des économies que si le prix au kilo est plus bas… et qu\'on ne jette rien.' },
  vrac:       { titre: 'Le vrac n\'est pas toujours moins cher', texte: 'Sans comparer le prix au kilo, le rayon vrac peut coûter plus cher que le paquet.' },
  pression:   { titre: 'Cuire plus vite, cuire moins', texte: 'Couvercle, autocuiseur, marmite norvégienne : la même cuisson pour bien moins d\'énergie.' },
  soleilCuit: { titre: 'Le soleil cuit', texte: 'Par temps clair, four solaire ou lentille de Fresnel remplacent les plaques. Mais pas de soleil, pas de repas solaire : il faut un plan B.' },
  danger:     { titre: 'Concentrer le soleil, c\'est dangereux', texte: 'Une lentille de Fresnel brûle la peau et les yeux en une seconde : lunettes obligatoires.' },
  inverse:    { titre: 'L\'été, tout s\'inverse', texte: 'Volets fermés le jour, fenêtres ouvertes la nuit, cuisson dehors : ce qui gardait la chaleur l\'hiver doit maintenant la repousser.' },
  fraicheur:  { titre: 'Stocker la fraîcheur de la nuit', texte: 'La masse de la maison se refroidit la nuit fenêtres ouvertes et garde le frais le jour, volets fermés.' },
  clim:       { titre: 'La clim, dernier recours', texte: 'Ventilateur, volets et nuits ouvertes d\'abord : la clim coûte 20 fois plus qu\'un ventilateur.' },
  oublis:     { titre: 'Les petites fuites mensuelles', texte: 'Un relevé bancaire révèle les abonnements oubliés : quelques euros par mois, des centaines par an.' },
  regle48:    { titre: 'La règle des 48 heures', texte: 'Attendre deux jours avant un achat non prévu : l\'envie passe souvent toute seule.' },
  revendre:   { titre: 'Ce qui dort peut se vendre', texte: 'Un objet inutilisé est de l\'argent immobilisé.' },
  occasion:   { titre: 'L\'occasion d\'abord', texte: 'Un appareil d\'occasion coûte souvent moitié prix pour le même service.' },
  plaisir:    { titre: 'La sobriété doit rester heureuse', texte: 'Supprimer tous les plaisirs fait craquer. Un petit budget plaisir protège toutes les autres économies.' },
  cycles:     { titre: 'Boucler les cycles', texte: 'Épluchures en compost, compost au potager, pluie au potager, légumes en cuisine : rien ne se perd.' },
  hygiene:    { titre: 'Propre sans gaspiller', texte: 'Douche courte, sous-couche lavée à la main, bassine : l\'hygiène ne demande pas de gaspiller.' },
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
  { jour: 45, annonce: 0, id: 'livraison', titre: 'Tentation : livraison offerte', texte: 'Notification : « Frais de livraison offerts ce soir sur ton burger préféré ! » (17 €)' },
  { jour: 66, annonce: 0, id: 'robot',    titre: 'Tentation : robot cuiseur en promo', texte: 'Un robot cuiseur « qui fait tout » passe de 299 € à 199 € pendant 24 h.' },
  { jour: 74, annonce: 0, id: 'promoPerissable', titre: 'Promo : 3 barquettes de viande pour le prix de 2', texte: 'Date limite dans 2 jours. 12 € les trois au lieu de 18 €.' },
  { jour: 98, annonce: 3, id: 'canicule', titre: 'Vigilance canicule', texte: 'Jusqu\'à 36 °C l\'après-midi pendant une semaine, nuits à 22 °C.' },
  { jour: 109, annonce: 2, id: 'barbecue', titre: 'Barbecue entre voisins', texte: 'Les voisins organisent un barbecue samedi soir. Chacun apporte quelque chose.' },
];


// =====================================================================
// v0.3 : TARIFS, EAU CHAUDE, CUISINE, ÉLECTRICITÉ, ÉTÉ, JARDIN, BUDGET
// =====================================================================

// ---------- Options tarifaires EDF Tarif Bleu 6 kVA (grille du 1er août 2026, € TTC) ----------
export const TARIFS = {
  base:  { nom: 'Base', aboMois: 15.86, prix: () => 0.2001 },
  hphc:  { nom: 'Heures creuses', aboMois: 15.86, prix: (h) => (estHC(h) ? 0.1589 : 0.2142) },  // HP 0,2142 / HC 0,1589
  tempo: { nom: 'Tempo', aboMois: 15.80, prix: (h, couleur) => TEMPO[couleur][estHC(h) ? 0 : 1] },
};
// Tempo : [HC, HP] par couleur (bleu 0,1356/0,1654 ; blanc 0,1536/0,1921 ; rouge 0,1615/0,7295)
export const TEMPO = { bleu: [0.1356, 0.1654], blanc: [0.1536, 0.1921], rouge: [0.1615, 0.7295] };
export const estHC = (h) => h >= 22 || h < 6;   // plage HC la plus courante : 22 h-6 h
export const CHANGEMENT_TARIF = { delai: 14, temps: 0.3 }; // gratuit chez EDF, effet à la prochaine relève (~2 semaines)

// ---------- Électricité domestique ----------
export const ELEC = {
  veilles: 45,          // W : box TV, chargeurs, console, micro-ondes… (ADEME : 50-100 W de veilles par foyer)
  veillesCoupees: 12,   // W restants avec multiprise à interrupteur (box internet laissée allumée)
  box: 10,              // W
  ordinateur: 60,       // W pendant le télétravail (9 h-18 h en semaine)
  eclairageVieux: 150,  // W : halogènes et ampoules anciennes allumés le soir
  eclairageLED: 25,     // W : mêmes pièces en LED
  frigoKwh: 0.85,       // kWh/jour : réfrigérateur-congélateur ancien (~310 kWh/an)
};

// ---------- Eau chaude sanitaire (ballon électrique 200 l, 2 400 W) ----------
export const BALLON = {
  litres: 200, puissance: 2400,
  UA: 1.5,              // W/K : pertes ~1,6 kWh/jour à 65 °C (ballon ancien, mesures ADEME 1,5-2 kWh/j)
  jaquette: 0.35,       // jaquette isolante : −35 % de pertes
  legionelles: 55,      // sous 55 °C en continu, risque de légionelles
};
export const DOUCHE = {
  debitVieux: 12, debitEco: 7,        // l/min : pommeau ancien / pommeau économe (classe A)
  coupureSavon: 0.3,                  // −30 % en coupant l'eau au savonnage
  seau: 12,                           // l à 38 °C pour une douche au seau
  recupFroide: 4,                     // l d'eau froide récupérés en attendant l'eau chaude
};
export const VAISSELLE = {
  courante:     { nom: 'À l\'eau courante', litresChauds: 30, kwh: 0, temps: 0.3 },
  bassine:      { nom: 'À la bassine', litresChauds: 8, kwh: 0, temps: 0.25 },
  lvQuotidien:  { nom: 'Lave-vaisselle chaque jour (normal)', litresFroids: 14, kwh: 1.3, temps: 0.1 },
  lvPleinEco:   { nom: 'Lave-vaisselle plein, éco (1 jour sur 2)', litresFroids: 5, kwh: 0.45, temps: 0.08 },
};

// ---------- Alimentation (une personne, prix 2026 en grande surface) ----------
// cout : €/jour de nourriture ; kwh : cuisson/jour ; temps : h/jour ; sante, hygiene (cuisine), bienetre : effets/jour
export const REGIMES = {
  livraison: { nom: 'Livraisons et plats préparés', cout: 15.5, kwh: 0.3, temps: 0.1, sante: -0.4, bienetre: 1.0, hygiene: 0 },
  classique: { nom: 'Courses classiques, un peu de cuisine', cout: 8.5, kwh: 1.0, temps: 0.5, sante: 0, bienetre: 0.4, hygiene: 0 },
  maison:    { nom: 'Cuisine maison au jour le jour', cout: 6.0, kwh: 1.5, temps: 1.0, sante: 0.3, bienetre: 0.6, hygiene: -0.5 },
  batch:     { nom: 'Grandes quantités + restes', cout: 4.9, kwh: 1.0, temps: 0.5, sante: 0.3, bienetre: 0.5, hygiene: -0.3 },
  austere:   { nom: 'Pâtes et riz uniquement', cout: 2.4, kwh: 0.8, temps: 0.3, sante: -0.5, bienetre: -2.0, hygiene: 0 },
};
export const CUISINE = {
  gaspillageBase: 0.18,     // part des courses jetée (ADEME : ~20 % des aliments achetés finissent jetés)
  livraisonPlaisir: 16,     // € : une livraison « plaisir » (rechute)
  painBaguette: 1.1,        // €/jour : une baguette (prix moyen 2026 ~1,05-1,20 €)
  painMaison: 0.35,         // €/jour : farine, levure, sel (~500 g de pain)
  painMaisonKwh: 0.5,       // four 45 min, partagé si four plein
};

// ---------- Été ----------
export const ETE = {
  ventilateur: 45,    // W
  climElec: 1000,     // W électriques, clim mobile (EER ~2,6)
  climFroid: 2600,    // W de froid
  ventNocturne: 70,   // W/K quand on ouvre grand la nuit
  voletsJour: 0.85,   // part du soleil bloquée volets fermés le jour
};

// ---------- Abonnements (prix publics 2026) ----------
export const ABONNEMENTS = {
  streaming: { nom: 'Streaming vidéo', mois: 13.49, plaisir: 0.5, cache: false },   // offre standard sans pub
  musique:   { nom: 'Musique en ligne', mois: 11.99, plaisir: 0.4, cache: false },
  sport:     { nom: 'Salle de sport (jamais utilisée)', mois: 29.99, plaisir: 0, cache: false },
  cloud:     { nom: 'Stockage en ligne oublié', mois: 2.99, plaisir: 0, cache: true },
  assurance: { nom: 'Assurance mobile oubliée', mois: 9.99, plaisir: 0, cache: true },
  appli:     { nom: 'Appli de méditation (essai gratuit devenu payant)', mois: 7.99, plaisir: 0, cache: true },
  forfait:   { nom: 'Forfait mobile 100 Go', mois: 24.99, plaisir: 0, cache: false, renegocie: 9.99 },
};
export const MEDIATHEQUE = 20;   // €/an : abonnement à la médiathèque municipale (souvent gratuit)
export const PLAISIRS = { 0: -1.6, 10: 0.4, 20: 1.0, 35: 1.4 };  // €/semaine -> bien-être/jour (rendements décroissants)

// ---------- Grenier : objets à revendre (prix d'occasion constatés) ----------
export const GRENIER = {
  velo:    { nom: 'Vélo d\'appartement', prix: 60, temps: 1 },
  console: { nom: 'Console de jeux inutilisée', prix: 110, temps: 1, bienetre: -3 },
  livres:  { nom: 'Carton de livres', prix: 25, temps: 0.5 },
  robot:   { nom: 'Robot pâtissier jamais sorti du carton', prix: 90, temps: 1 },
};
