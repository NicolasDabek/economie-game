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
  volonte: 1.5,   // v0.7 : corvée modeste (étendre, plier) ; le moral tend vers sa ligne de base, un coût répété pèse ~15× sur l'équilibre
  usureMachine: 2.5,                    // % par cycle
  // Sèche-linge à condensation : 2,5 kWh par cycle de 7 kg (étiquette énergie classe B)
  secheLingeKwh: 2.5,
  usureSecheLinge: 2,                   // % d'usure en plus sur les vêtements
};

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
  pilou:      { nom: 'Peignoir polaire', icone: '🥋', iso: 2.5, poids: 1.2, enc: 1.0, sal: 8,
                eco: { prix: 22, usure: 1.0 }, durable: { prix: 45, usure: 0.15, label: 'polaire épaisse' } },
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
  routeur:      { nom: 'Routeur solaire pour le ballon', prix: 299, temps: 2, invest: true, vie: 12, cat: 'Production',
                  desc: 'Envoie le surplus du panneau dans le ballon au lieu de le perdre. (SmartSun Ekosia 299 € ; artisanaux 139-159 € ; posé 250-500 €)' },
  batterie:     { nom: 'Batterie domestique 2 kWh (plug-and-play)', prix: 1190, temps: 1, invest: true, vie: 10, cat: 'Production',
                  desc: 'Stocke le surplus pour le soir. ~500-650 €/kWh en 2026 (station type EcoFlow Delta 2 Max seule ~1 000-1 300 €). À comparer au ballon.' },
  thermos:      { nom: 'Thermos 1 L', prix: 20, temps: 0, invest: true, vie: 8, cat: 'Production',
                  desc: 'Garde l\'eau chaude ~24 h : thé, bouillotte du soir, pâtes. (15-25 €)' },
  caisse:       { nom: 'Bidon 10 L + caisse isolée + thermoplongeur 300 W', prix: 40, temps: 1.5, invest: true, vie: 8, cat: 'Production',
                  desc: 'Bidon alimentaire dans une caisse garnie de laine ou de polystyrène : une batterie thermique de ~0,8 kWh. (bidon 10 €, isolant 15 €, thermoplongeur 300 W 15 € : chauffe lentement au rythme du panneau)' },
  bouillotte:   { nom: 'Bouillotte', prix: 8, temps: 0, invest: true, vie: 3, cat: 'Confort',
                  desc: 'Deux litres d\'eau chaude au lit (0,12 kWh). (6-12 € en pharmacie)' },
  housse:       { nom: 'Housse de bouillotte tricotée', prix: 8, temps: 0, invest: true, vie: 5, cat: 'Confort',
                  desc: 'Isoler pour prolonger : la bouillotte tient toute la nuit. (6-10 €)' },
  // --- Transport (v0.4) ---
  velo:         { nom: 'Vélo de ville', prix: 420, temps: 0.3, invest: true, vie: 10, cat: 'Transport', occasion: 160,
                  desc: 'Vélo urbain neuf (Decathlon/Btwin 350-500 €) ; d\'occasion 120-200 € sur Leboncoin ou en bourse aux vélos.' },
  vae:          { nom: 'Vélo électrique', prix: 1790, temps: 0.3, invest: true, vie: 8, cat: 'Transport', occasion: 900,
                  desc: 'VAE urbain neuf 1 500-2 200 € ; d\'occasion 700-1 100 € (batterie à vérifier : 500 € à remplacer après ~5 ans).' },
  kitSecu:      { nom: 'Casque + éclairage + gilet', prix: 55, temps: 0, invest: true, vie: 5, cat: 'Transport',
                  desc: 'Casque 25-40 €, éclairage USB 15-25 €, gilet 5 € : divise le risque d\'accident grave.' },
  tenuePluie:   { nom: 'Tenue de pluie (veste + surpantalon)', prix: 45, temps: 0, invest: true, vie: 5, cat: 'Transport',
                  desc: 'Pédaler sous la pluie sans arriver trempé. (35-60 €)' },
  outilsVelo:   { nom: 'Outils vélo (pompe, démonte-pneus, clés)', prix: 30, temps: 0, invest: true, vie: 10, cat: 'Transport',
                  desc: 'Pour entretenir soi-même : pneus, chaîne, freins. (25-40 €)' },
  gourde:       { nom: 'Gourde + mug isotherme', prix: 22, temps: 0, invest: true, vie: 5, cat: 'Transport',
                  desc: 'Eau et café de la maison au lieu de bouteilles et cafés achetés. (15-30 €)' },
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
  // --- Ventilation passive (docs/cheminee-solaire-puits-canadien.md §5 ; prix = estimations reconstituées, fourchettes affichées) ---
  chemineeDIY:  { nom: 'Cheminée solaire faite maison', prix: 450, temps: 0, chantier: 3, invest: true, vie: 20, cat: 'Ventilation passive', fourchette: [300, 1200],  // polycarbonate 30-60 €/m², tôle noire, ossature, clapets, grille (doc §2)
                  desc: 'Une colonne vitrée noire au soleil : l\'air chauffé monte et aspire l\'air de la maison sans ventilateur. Clapet été (purge) / hiver (mode Trombe). 3 jours de chantier.' },
  chemineePro:  { nom: 'Capteur solaire à air posé (pro)', prix: 2500, temps: 0, chantier: 1, invest: true, vie: 25, cat: 'Ventilation passive', fourchette: [1000, 3000],  // SolarVenti / Grammer / TWINSOLAR posé (doc §2)
                  desc: 'Débit 1,2 fois plus fort, clapets automatiques (pas de contre-tirage). 1 jour de pose.' },
  puitsDIY:     { nom: 'Puits canadien fait maison (45 m, Ø160)', prix: 2900, temps: 0, chantier: 5, invest: true, vie: 40, cat: 'Ventilation passive', fourchette: [2000, 3800],  // détail PUITS_DIY ci-dessous (gaine PEHD alimentaire, regard, borne, mini-pelle 2 j)
                  desc: 'Tube enterré à 2 m : l\'air entre à la température du sol. 5 jours de chantier, risque de pente ratée (15 %) : condensats qui stagnent.' },
  puitsPro:     { nom: 'Puits canadien posé (pro)', prix: 5800, temps: 0, chantier: 2, invest: true, vie: 50, cat: 'Ventilation passive', fourchette: [4000, 12000],  // moyenne ~5 800 € [P1][P2] ; 5 000-12 000 € TTC tout compris (monbatiment.fr 2026)
                  desc: 'Pente garantie vers un regard à siphon. Filtres 2×/an, inspection tous les 5 ans. 2 jours de chantier.' },
  puitsHydro:   { nom: 'Puits hydraulique (eau glycolée)', prix: 3500, temps: 0, chantier: 2, invest: true, vie: 30, cat: 'Ventilation passive', fourchette: [1900, 4500],  // [P1]
                  desc: 'Une boucle d\'eau enterrée alimente une batterie dans la gaine : ni radon ni condensation dans le sol, efficacité 0,8 fois celle du puits à air.' },
  kitRadon:     { nom: 'Kit étanchéité radon (joints NF EN 1277)', prix: 300, temps: 2, invest: true, vie: 30, cat: 'Ventilation passive',  // estimation, pas de barème (doc §5)
                  desc: 'Indispensable pour un puits à air en zone radon, sinon la santé baisse.' },
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
// Oubli (v0.8.1) : un geste abandonné s'efface. En apprentissage, −1 jour de progrès par jour sans pratique ;
// une habitude acquise résiste ~30 jours (vacances, saison) puis redevient « en cours » : on la retrouve plus vite
// qu'on ne l'a apprise (Lally et al. 2009 : rater un jour ne casse pas l'automatisme, l'abandon prolongé si).
export const HABITUDE_OUBLI = { graceJours: 30, retourPratique: 7 };
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
  ecoconduite:{ nom: 'Écoconduite (anticiper, 2e vitesse tôt)', cout: 2, temps: 0 },
  gamelle:   { nom: 'Préparer sa gamelle la veille', cout: 2, temps: 0 },
};

// ---------- Principes : voir principes.js ----------
export { PRINCIPES, DOMAINES_PRINCIPES } from './principes.js';

// v0.6 : jourAn = jour de l'année de campagne (0 = 1er décembre) ; les événements reviennent chaque année sauf « unique ».
// La hausse du gaz est désormais portée par les trajectoires de prix ; la canicule est annoncée quand la météo en prévoit une.
export const EVENEMENTS = [
  { jourAn: 8,   annonce: 3, id: 'invites',  titre: 'Des invités pour le week-end', texte: 'Ta sœur et son conjoint arrivent samedi pour deux jours. Ils sont frileux.' },
  { jourAn: 17,  annonce: 0, id: 'promo',    titre: 'Tentation : promo flash', texte: 'Doudoune d\'intérieur premier prix à −50 % (12,50 €) en vitrine, aujourd\'hui seulement.' },
  { jourAn: 38,  annonce: 0, id: 'panne',    unique: true, titre: 'Panne du lave-linge', texte: 'La machine fait un bruit de ferraille puis s\'arrête : la pompe de vidange a lâché.' },
  { jourAn: 45,  annonce: 0, id: 'livraison', titre: 'Tentation : livraison offerte', texte: 'Notification : « Frais de livraison offerts ce soir sur ton burger préféré ! » (17 €)' },
  { jourAn: 136, annonce: 0, id: 'robot',    titre: 'Tentation : robot cuiseur en promo', texte: 'Un robot cuiseur « qui fait tout » passe de 299 € à 199 € pendant 24 h.' },
  { jourAn: 144, annonce: 0, id: 'promoPerissable', titre: 'Promo : 3 barquettes de viande pour le prix de 2', texte: 'Date limite dans 2 jours. 12 € les trois au lieu de 18 €.' },
  { jourAn: 237, annonce: 2, id: 'barbecue', titre: 'Barbecue entre voisins', texte: 'Les voisins organisent un barbecue samedi soir. Chacun apporte quelque chose.' },
];


// =====================================================================
// v0.3 : TARIFS, EAU CHAUDE, CUISINE, ÉLECTRICITÉ, ÉTÉ, JARDIN, BUDGET
// =====================================================================

// ---------- Options tarifaires EDF Tarif Bleu 6 kVA (grille du 1er août 2026, € TTC) ----------
// Indices de prix de la campagne (v0.6) : multiplicateurs appliqués chaque jour par js/annee.js (1 = octobre 2026)
export const INDICES = { elec: 1, gaz: 1, eau: 1, alim: 1, carburant: 1, services: 1, general: 1 };
export const TARIFS = {
  base:  { nom: 'Base', aboMois: 15.86, prix: () => 0.2001 * INDICES.elec },
  hphc:  { nom: 'Heures creuses', aboMois: 15.86, prix: (h) => (estHC(h) ? 0.1589 : 0.2142) * INDICES.elec },  // HP 0,2142 / HC 0,1589
  tempo: { nom: 'Tempo', aboMois: 15.80, prix: (h, couleur) => TEMPO[couleur][estHC(h) ? 0 : 1] * INDICES.elec },
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
// Se réabonner (v0.8.1) : tarif catalogue du moment (pas de promo de bienvenue ni d'essai gratuit pour un ancien client),
// frais d'adhésion et engagement quand ils existent. Effet immédiat, premier mois facturé au prorata comme les autres.
// Salles low-cost : frais d'inscription 30-60 € et engagement 12 mois (Basic-Fit, Fitness Park, 2026) ;
// forfait mobile : carte SIM 10 € chez la plupart des opérateurs, la remise de fidélisation est perdue ;
// assurance mobile : engagement 12 mois (contrats affinitaires, résiliables ensuite à tout moment, loi Hamon).
export const REABONNEMENT = {
  streaming: { frais: 0, engagementMois: 0, note: 'sans engagement, pas de nouvel essai gratuit' },
  musique:   { frais: 0, engagementMois: 0, note: 'sans engagement, l\'offre d\'essai ne s\'applique plus' },
  sport:     { frais: 49, engagementMois: 12, note: 'frais d\'inscription 49 €, engagement 12 mois' },
  cloud:     { frais: 0, engagementMois: 0, note: 'sans engagement' },
  assurance: { frais: 0, engagementMois: 12, note: 'engagement 12 mois' },
  appli:     { frais: 0, engagementMois: 0, note: 'essai gratuit déjà utilisé : payant dès aujourd\'hui' },
  forfait:   { frais: 10, engagementMois: 0, note: 'carte SIM 10 €, prix catalogue (la remise négociée est perdue)' },
};
export const MEDIATHEQUE = 20;   // €/an : abonnement à la médiathèque municipale (souvent gratuit)
export const PLAISIRS = { 0: -1.6, 10: 0.4, 20: 1.0, 35: 1.4 };
export const PLAISIRS_MORAL = { 0: -0.3, 10: 0.15, 20: 0.2, 35: 0.22 };  // moral/jour : un petit plaisir régulier recharge la volonté  // €/semaine -> bien-être/jour (rendements décroissants)

// ---------- Grenier : objets à revendre (prix d'occasion constatés) ----------
export const GRENIER = {
  velo:    { nom: 'Vélo d\'appartement', prix: 60, temps: 1 },
  console: { nom: 'Console de jeux inutilisée', prix: 110, temps: 1, bienetre: -3 },
  livres:  { nom: 'Carton de livres', prix: 25, temps: 0.5 },
  robot:   { nom: 'Robot pâtissier jamais sorti du carton', prix: 90, temps: 1 },
};

// ---------- Transport (v0.4, prix France octobre 2026) ----------
export const TRANSPORT = {
  kmTravail: 9,            // km aller (distance domicile-travail médiane ~9-10 km, INSEE)
  joursBureauMax: 5,
  kmCourses: 4,            // km aller-retour vers le supermarché
  kmLoisirs: 12,           // km aller-retour par sortie (2 sorties/semaine)
  carburant: 2.17,         // €/L SP95-E10, moyenne nationale 12 oct. 2026 (flux officiel prix-carburants, data.economie.gouv.fr)
  conso: 6.5,              // L/100 km en ville, citadine essence
  ecoconduite: 0.10,       // −10 % de carburant (ADEME : 10-15 %)
  pressionPerteMois: 0.02, // +2 % de conso par mois sans vérifier la pression (sous-gonflage ~0,3 bar)
  usureVoiture: 0.06,      // €/km : pneus, vidange, freins (hors dépréciation)
  bareme: 0.636,           // €/km : barème kilométrique fiscal 2026, 5 CV, ≤ 5 000 km (dépréciation incluse)
  assuranceMois: 54,       // € : assurance auto tous risques moyenne 2026 (~650 €/an)
  parkingJour: 3,          // € : stationnement en centre-ville les jours de bureau
  valeurVoiture: 3800,     // € : revente d'une citadine de 12 ans (argus)
  ticket: 2.10,            // € : TCL Lyon 1 voyage, mai 2026
  abonnementTC: 75.90,     // €/mois : TCL zones 1-2, mai 2026
  remboursementEmployeur: 0.5, // prise en charge obligatoire de 50 % de l'abonnement (art. L3261-2 Code du travail)
  covoiturage: 2.0,        // €/trajet passager (BlaBlaCar Daily, souvent 0-2 € grâce aux aides locales)
  repasAchete: 11.5,       // € : formule sandwich/menu le midi (titre-restaurant moyen ~11 € en 2026)
  boissons: 2.2,           // € : café 1,50 + bouteille d'eau 0,70 par jour de bureau
  boissonsGourde: 0.4,     // € : café de la maison
  veloEntretienAtelier: 70,// € : révision en atelier
  pieces: { pneus: { prix: 28, km: 3000 }, chaine: { prix: 18, km: 2500 }, freins: { prix: 9, km: 1200 } }, // pièces vélo 2026
  vaeKwh100: 1.0,          // kWh/100 km
  modes: {
    voiture:     { nom: 'Voiture',               hAR: 0.6, effort: 0,    sante: 0,    bienetre: -0.2 },
    commun:      { nom: 'Transports en commun',  hAR: 1.0, effort: 0,    sante: 0.05, bienetre: 0 },
    covoiturage: { nom: 'Covoiturage',           hAR: 0.8, effort: 0,    sante: 0,    bienetre: 0.2 },
    velo:        { nom: 'Vélo',                  hAR: 1.0, effort: 1,    sante: 0.45, bienetre: 0.4 },
    vae:         { nom: 'Vélo électrique',       hAR: 0.7, effort: 0.4,  sante: 0.25, bienetre: 0.4 },
    marche:      { nom: 'Marche',                hAR: 3.6, effort: 1,    sante: 0.5,  bienetre: 0.2 },
  },
  accidentKm: 0.00012,     // probabilité d'accident léger par km à vélo (ordre de grandeur ONISR, ×0,4 avec équipement)
};

// ---------- Rentabilité des investissements (v0.4) ----------
export const FINANCE = {
  livretA: 0.017,          // 1,70 % depuis le 1er août 2026 (arrêté du 28 juillet 2026) : coût d'opportunité
  inflationEnergie: 0.03,  // +3 %/an : hypothèse (moyenne 2015-2025 des prix de l'énergie domestique, Insee ~+4 %)
  inflationEau: 0.03,      // +3 %/an : hausse moyenne du prix de l'eau (SISPEA)
  inflationCarburant: 0.02,// +2 %/an : hypothèse
  inflationAlim: 0.02,     // +2 %/an : hypothèse (après le pic 2022-2023)
  annees: 5,               // horizon de projection
  joursSaison: { hiver: 151, printemps: 122, ete: 92 },
  joursChauffe: { hiver: 151, printemps: 62, ete: 0 }, // gains de chauffage : saison de chauffe 15 oct.-15 mai (≈ 213 j), pas toute la mi-saison // hiver = nov.-mars ; printemps = avril-juin + sept.-oct. ; été = juil.-août
};
// entretien (€/an), consommables, perte d'efficacité (%/an), part de revente (du prix payé, par an d'âge décroît), poste d'inflation
export const ROI_ITEMS = {
  calfeutrage: { saisonChauffe: true, entretien: 0, degr: 0.15, revente: 0, poste: 'energie' },
  boudin: { saisonChauffe: true, entretien: 0, degr: 0.05, revente: 0, poste: 'energie' },
  rideauxTh: { saisonChauffe: true, entretien: 0, degr: 0.02, revente: 0.3, poste: 'energie' },
  robinets: { saisonChauffe: true, indirect: 'permet de zoner : le gain dépend de tes consignes', entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  purge: { saisonChauffe: true, entretien: 0, degr: 0.5, revente: 0, poste: 'energie', note: 'à refaire chaque automne' },
  appoint: { indirect: 'permet de chauffer local', entretien: 0, degr: 0, revente: 0.3, poste: 'energie' },
  solaire: { entretien: 0, degr: 0.005, revente: 0.4, poste: 'energie', note: 'production ~3× plus forte en été qu\'en hiver' },
  bouillotte: { indirect: 'permet de baisser la chambre la nuit', entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  housse: { indirect: 'prolonge la bouillotte', entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  pommeau: { entretien: 2, degr: 0.05, revente: 0, poste: 'energie', note: 'détartrage (vinaigre)' },
  mousseurs: { entretien: 1, degr: 0.05, revente: 0, poste: 'energie', note: 'détartrage' },
  jaquette: { entretien: 0, degr: 0.02, revente: 0, poste: 'energie' },
  seau: { entretien: 0, degr: 0, revente: 0, poste: 'eau' },
  boites: { entretien: 0, degr: 0, revente: 0.2, poste: 'alim' },
  autocuiseur: { entretien: 12, degr: 0, revente: 0.4, poste: 'energie', note: 'joint à changer chaque année (~12 €)' },
  marmite: { entretien: 0, degr: 0.05, revente: 0, poste: 'energie' },
  fresnel: { entretien: 0, degr: 0.03, revente: 0.3, poste: 'energie' },
  lunettes: { indirect: 'protège les yeux : gain en santé', entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  fourSolaire: { entretien: 5, degr: 0.03, revente: 0.4, poste: 'energie', note: 'vitre et réflecteurs à nettoyer' },
  sechoir: { entretien: 0, degr: 0.05, revente: 0, poste: 'alim' },
  pierre: { entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  multiprise: { entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  led: { entretien: 0, degr: 0.01, revente: 0, poste: 'energie' },
  ventilateur: { entretien: 0, degr: 0, revente: 0.3, poste: 'energie', note: 'son « gain » est du confort : il coûte son électricité' },
  clim: { entretien: 10, degr: 0.02, revente: 0.35, poste: 'energie', note: 'filtre et nettoyage ; son « gain » est du confort' },
  moustiquaire: { indirect: 'gain en sommeil', entretien: 0, degr: 0.1, revente: 0, poste: 'energie' },
  corde: { indirect: 'évite l\'humidité et le sèche-linge', entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  herbes: { entretien: 3, degr: 0, revente: 0, poste: 'alim', note: 'terreau, rempotage' },
  composteur: { entretien: 0, degr: 0, revente: 0.4, poste: 'alim' },
  potager: { entretien: 28, degr: 0, revente: 0, poste: 'alim', note: 'graines et plants à racheter chaque année' },
  cuve: { entretien: 0, degr: 0, revente: 0.4, poste: 'eau' },
  velo: { entretien: 0, degr: 0, revente: 0.55, poste: 'carburant', note: 'pièces comptées à l\'usure (pneus, chaîne, freins)' },
  vae: { entretien: 60, degr: 0.04, revente: 0.5, poste: 'carburant', note: 'batterie −4 %/an d\'autonomie, ~500 € à remplacer vers 5 ans' },
  kitSecu: { indirect: 'réduit le risque d\'accident', entretien: 0, degr: 0, revente: 0, poste: 'carburant' },
  tenuePluie: { indirect: 'gain en confort sous la pluie', entretien: 0, degr: 0.1, revente: 0, poste: 'carburant' },
  outilsVelo: { entretien: 0, degr: 0, revente: 0.3, poste: 'carburant' },
  gourde: { entretien: 0, degr: 0, revente: 0, poste: 'alim' },
  routeur: { entretien: 0, degr: 0, revente: 0.3, poste: 'energie', note: 'valorise le surplus du panneau dans le ballon' },
  batterie: { entretien: 0, degr: 0.03, revente: 0.3, poste: 'energie', note: 'perd ~3 %/an de capacité ; rendement 88 %' },
  thermos: { entretien: 0, degr: 0, revente: 0, poste: 'energie' },
  caisse: { entretien: 0, degr: 0.03, revente: 0, poste: 'energie' },
  chemineeDIY: { saisonChauffe: true, entretien: 0, degr: 0.01, revente: 0, poste: 'energie', note: 'nettoyage du vitrage 1 h/an ; gagne l\'hiver (Trombe) et l\'été (purge de nuit)' },
  chemineePro: { saisonChauffe: true, entretien: 30, degr: 0.005, revente: 0, poste: 'energie', note: 'contrat d\'entretien ~30 €/an' },
  puitsDIY: { saisonChauffe: true, entretien: 30, degr: 0, revente: 0, poste: 'energie', climEvitee: true, note: 'filtres 2×/an à 15 € ; rentable surtout s\'il remplace une clim' },
  puitsPro: { saisonChauffe: true, entretien: 60, degr: 0, revente: 0, poste: 'energie', climEvitee: true, note: 'filtres 30 €/an + inspection 150 € tous les 5 ans' },
  puitsHydro: { saisonChauffe: true, entretien: 20, degr: 0, revente: 0, poste: 'energie', climEvitee: true, note: 'contrôle du glycol ~20 €/an' },
  kitRadon: { entretien: 0, degr: 0, revente: 0, poste: 'energie', indirect: 'santé : évite d\'aspirer du radon par le tube' },
};

// ---------- Stocker le surplus solaire en chaleur (v0.4) ----------
// Refroidissement de Newton : T(t) = T_amb + (T0 − T_amb)·exp(−t/τ). τ = constante de temps du contenant (h).
export const STOCKAGE = {
  tChauffe: 90,                 // °C atteints à la bouilloire
  contenants: {
    aucun:   { nom: 'Casserole à l\'air libre', tau: 2,  litres: 2 },
    torchon: { nom: 'Bouillotte dans un torchon', tau: 3.5, litres: 2 },
    housse:  { nom: 'Bouillotte avec housse tricotée', tau: 6, litres: 2, requiert: 'housse' },
    thermos: { nom: 'Thermos 1 L', tau: 30, litres: 1, requiert: 'thermos' },
    caisse:  { nom: 'Bidon 10 L en caisse isolée', tau: 20, litres: 10, requiert: 'caisse' },
  },
  usages: { the: 0.12, bouillotte: 0.12, vaisselle: 0.3 },   // kWh/jour utiles au maximum : thé et cuisson, bouillotte, bassine de vaisselle
  batterieRendement: 0.88,      // rendement aller-retour d'une batterie LFP
  batterieUtile: 2.0,           // kWh
};
// ---------- Combos : techniques qui s'enchaînent ----------
export const COMBOS = {
  soleilBouillotte: { nom: 'Soleil → eau chaude → bouillotte isolée', principe: 'stockageChaleur', texte: 'Le surplus de midi chauffe l\'eau, la housse la garde jusqu\'au coucher : un lit chaud gratuit.' },
  ballonBatterie:   { nom: 'Panneau → routeur → ballon isolé', principe: 'routeur', texte: 'Le ballon devient une batterie thermique de 10 kWh : la jaquette garde la chaleur de midi jusqu\'au lendemain matin.' },
  fresnelPierre:    { nom: 'Lentille de Fresnel → pierres → soirée', principe: 'masse', texte: 'La chaleur concentrée à midi est rendue par les pierres pendant la soirée.' },
  cuissonChaleur:   { nom: 'Cuisson → chaleur de la pièce (hiver)', principe: 'combo', texte: 'Four ouvert après usage, casseroles couvertes : la chaleur de cuisson chauffe la cuisine au lieu de partir par la hotte.' },
  eauJardinCompost: { nom: 'Eau froide de douche → jardin → compost → récolte', principe: 'cycles', texte: 'L\'eau perdue arrose, les épluchures nourrissent la terre, la terre nourrit la cuisine.' },
  batchGamelle:     { nom: 'Batch cooking → boîtes → gamelle au travail', principe: 'gamelle', texte: 'Cuisiner une fois pour trois repas, dont le midi au bureau : 9 € économisés par jour de bureau.' },
  veloSport:        { nom: 'Vélo au travail → salle de sport résiliée', principe: 'exercice', texte: 'Le trajet devient l\'activité physique : 30 € par mois en moins, et la santé en plus.' },
  heuresCreuses:    { nom: 'Option HC → ballon + lessive en heures creuses', principe: 'decaler', texte: 'Tout ce qui peut attendre la nuit passe à 0,1589 € au lieu de 0,2142 €.' },
  nuitsFraiches:    { nom: 'Volets fermés le jour → nuits grandes ouvertes', principe: 'fraicheur', texte: 'La maison stocke la fraîcheur de la nuit et la garde le jour.' },
  lessiveSoleil:    { nom: 'Panneau → lessive à midi → séchage dehors', principe: 'airLibre', texte: 'Le soleil lave et sèche : électricité autoconsommée et sèche-linge inutile.' },
  climTerre:        { nom: 'Puits canadien → maison → cheminée solaire (été)', principe: 'inertieSol', texte: 'La cheminée tire, le sol rafraîchit : une clim douce sans électricité.' },
  respirationHiver: { nom: 'Puits + mode Trombe + clapets fermés la nuit', principe: 'bypass', texte: 'Air neuf préchauffé par le sol puis par le soleil, sans pertes la nuit.' },
  purgeNocturne:    { nom: 'Cheminée à masse + volets le jour + fenêtres basses la nuit', principe: 'tirage', texte: 'La masse chauffée le jour continue de tirer la nuit et vide la chaleur.' },
  sechoirTirage:    { nom: 'Linge dans le flux de la cheminée', principe: 'tirage', texte: 'Le courant d\'air emporte l\'humidité : séchage 2 fois plus rapide, sans sèche-linge.' },
  caveNaturelle:    { nom: 'Sortie du puits dans le cellier', principe: 'inertieSol', texte: 'Un cellier à 12-16 °C toute l\'année : les légumes se gardent plus longtemps.' },
  serreHumide:      { nom: '⚠️ Anti-combo « serre humide »', principe: 'pointRosee', anti: true, texte: 'Puits à plein débit un jour lourd : l\'air saturé entre dans des pièces fraîches, l\'humidité dépasse 80 %.' },
};

// Ventilation passive : constantes du modèle (docs/cheminee-solaire-puits-canadien.md §5)
export const PASSIF = {
  solMoy: 12, solAmp: 5, solPic: 220,    // T_sol(j) = 12 + 5·cos(2π(j − 220)/365) à 2 m [P2][P5]
  dTmax: 7, dTmasse: 2, demiVieMasse: 4, // ΔT cheminée = k·irr/600·7 ; masse 2 K, demi-vie 4 h
  A: 0.1, H: 3, facteurPro: 1.2,         // Q = 0,5·A·√(2gHΔT/300)·3600 m³/h
  gainTrombe: 5, rendementCapteur: 0.5, surfaceCapteur: 3,   // capteur DIY ~3 m² (polycarbonate), rendement 0,5                        // capteur à air : l'air recirculé gagne ~2× le ΔT de tirage (calage : cheminée seule rentable en 4-8 ans)
  facteurContre: 0.35,                    // contre-tirage nocturne, clapet bas ouvert
  qTubeMax: 250, L: 45, L0: 12,           // Ø160 : 250 m³/h ; L0 = 12·(Q/150)^0,8
  efficaciteHydro: 0.8,
  debitVentilo: 55, ventiloW: 15,         // puits seul : petit extracteur ~15 W pour 55 m³/h (Fiabitat : 30 W pour une maison de 150 m²)
  bypassBas: 14, bypassHaut: 20,          // by-pass : puits sous 14 °C et au-dessus de 20 °C [P4]
  Qhyg: 55,                               // renouvellement hygiénique remplacé : ~0,5 vol/h pour 112 m³ (règles de l'art puits climatiques 2015)
  part: { salon: 0.5, chambre: 0.3, cuisine: 0.2 }, volume: { salon: 50, chambre: 35, cuisine: 27 },   // 45 m² × 2,5 m ≈ 112 m³,
  hrExt: { hiver: 0.85, printemps: 0.72, ete: 0.62 }, wLourd: 18.7,  // jour lourd : rosée ~21 °C
  risquePente: 0.15, reprisePente: 900, reprisePenteFourchette: [600, 1200],  // reprise de pente : estimation
  seuilStagnant: 2, seuilRegard: 6, radonSante: 0.6,
  // clim évitée : seulement si l'été a vraiment demandé du froid (canicule) et qu'aucune clim n'a été achetée.
  // On compte une clim MOBILE (la seule plausible pour 45 m² en location) amortie sur sa vie + son électricité, pas un prix d'achat d'un coup.
  climEvitee: { prix: [250, 349, 800], vie: 8, kwhAn: [120, 200, 400] },  // prix mobile 250-800 € (QuelleEnergie, Effy 2026) ; 120-400 kWh/été (calculateurenligne.fr : 396 kWh pour 90 j × 4 h)
  noms: { chemineeDIY: 'la cheminée solaire', chemineePro: 'le capteur solaire à air', puitsDIY: 'le puits canadien', puitsPro: 'le puits canadien', puitsHydro: 'le puits hydraulique' },
};

// Puits canadien fait maison : décomposition du prix (sources : fiabishop.com kit 2×35 m + regard 2 010-2 480 € ; monbatiment.fr ; czn-machinery.com location 2026)
export const PUITS_DIY = [
  ['Gaine PEHD alimentaire annelée/lisse Ø160-200, 45 m', 675, 900],      // 15-20 €/m
  ['Regard étanche de condensats + tampon + siphon/pompe', 210, 880],       // regard simple ~150 € ; Helios 740 + 142 €
  ['Borne de prise d\'air inox + filtre G3', 150, 500],
  ['Extracteur basse consommation ~15 W + gaines intérieures', 80, 150],
  ['Mini-pelle 1-2 t, 2 jours (295-329 € HT/j) + livraison', 790, 940],
  ['Sable 0/4 (lit + enrobage, ~6 t) et joints IP68', 150, 300],
];

// ---------- Banque et placements (v0.5) — taux et règles en vigueur en octobre 2026 ----------
export const CALENDRIER = { debut: '2026-12-01', chapitres: { hiver: '2026-12-01', printemps: '2027-04-06', ete: '2027-07-01' } };
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

// ---------- Moral et santé sur la durée (v0.7) ----------
// Le moral tend vers une ligne de base (inertie ~2 semaines). Repères :
// - adaptation hédonique : un plaisir répété perd l'essentiel de son effet en quelques mois, la nouveauté le recharge (Brickman 1978, Lyubomirsky 2011) ;
// - blues de l'hiver : 5 à 10 % des adultes en France connaissent une dépression saisonnière, bien plus un simple coup de mou (Inserm, HAS) ;
// - le stress financier (découvert, pas d'épargne de précaution) pèse sur le moral (Banque de France, baromètre de l'éducation financière 2024).
export const MORAL = {
  base: 31.2, kBienetre: 0.5, kSante: 0.25, kConfort: 1.0, inertie: 15,   // calibré pour 5 ans : ne rien toucher ~62, naïf ~67, malin ~61, maître ~63
  plaisir: 11, privation: 6, adaptMax: 0.7, adaptJours: 60, nouveaute: 0.4,
  social: 10, blues: 6,
  monotonie: { austere: 1, batch: 0.8, livraison: 0.2, classique: 0.3, maison: 0.15 }, monotonieMax: 8,
  controle: 11, stressDecouvert: 10, stressPrecaution: 5, stressMarche: 4, stressPanne: 5, stressMaladie: 6,
  seuilCompulsif: 25, probaCompulsif: 0.1,
};
// Coûts de la santé et de la négligence (2026) :
// - consultation de généraliste 30 € (depuis le 22/12/2024), Sécu 70 % moins 2 € de participation forfaitaire, la mutuelle responsable paie le ticket modérateur :
//   reste à charge 2 € ; franchise médicale 1 € par boîte (doublée en 2024) ; pharmacie non remboursée (paracétamol, sirop, mouchoirs) ~12 €.
// - arrêt maladie (salarié du privé) : 3 jours de carence non indemnisés, puis indemnités journalières à 50 % du salaire brut journalier
//   (≈ 60 % du net après CSG/CRDS) ; le complément employeur ne démarre qu'après 7 jours (art. L1226-1 et D1226-3 du Code du travail, ameli.fr).
// - carie négligée : dévitalisation + couronne hors panier 100 % Santé, reste à charge moyen ~250 € avec mutuelle (DREES, ameli).
// - moisissures installées : fongicide, joints, peinture d'une pièce ~450 € (ou retenue sur le dépôt de garantie).
// - augmentation individuelle : ~1,5 pt par an en plus de l'augmentation générale (enquêtes Deloitte, LHH 2025-2026) ; prime annuelle ~3 % du salaire.
export const SANTE_COUTS = {
  seuilMaladie: 40, resteConsultation: 2, franchiseBoite: 1, pharmacieNonRemb: 12, carence: 3, ijNet: 0.6, carences: 0.3,
  joursDentaire: 300, dentaire: 250, joursMoisi: 90, moisi: 450,
  seuilMoralAugm: 40, seuilHygieneAugm: 45, augmIndividuelle: 0.015, primePerdue: 0.03,
};
// Vacances d'été (choix chaque 1er juillet). Budget moyen des vacances d'été des Français ~1 900 € par foyer (baromètre Ipsos-Europ Assistance 2025) :
// ici pour une personne seule, deux semaines. Le voisin part en séjour classique.
export const VACANCES = {
  rester:  { nom: 'Rester chez soi (congés au calme, balades, médiathèque)', cout: 0, effet: 5 },
  econome: { nom: 'Une semaine chez des amis ou en camping, en train (Ouigo, réservé tôt)', cout: 350, effet: 11 },
  sejour:  { nom: 'Deux semaines en location et train (séjour classique)', cout: 1100, effet: 14 },
};
