// Données de jeu : Vie quotidienne : temps, habitudes, événements, alimentation, été, abonnements, grenier (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

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
  feuBois:   { nom: 'Rentrer le bois et allumer le poêle', cout: 2, temps: 0.25 },
  poules:    { nom: 'S\'occuper des poules', cout: 1, temps: 0.33 },
  toilettesSeches: { nom: 'Utiliser les toilettes sèches', cout: 5, temps: 0.05 },
  levain:    { nom: 'Nourrir le levain', cout: 2, temps: 0.1 },
  ecoconduite:{ nom: 'Écoconduite (anticiper, 2e vitesse tôt)', cout: 2, temps: 0 },
  gamelle:   { nom: 'Préparer sa gamelle la veille', cout: 2, temps: 0 },
};

// ---------- Principes : voir principes.js ----------
export { PRINCIPES, DOMAINES_PRINCIPES } from '../principes.js';

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
export const PLAISIRS = { 0: -1.95, 10: 0.4, 20: 1.0, 35: 1.4 };
export const PLAISIRS_MORAL = { 0: -0.3, 10: 0.15, 20: 0.2, 35: 0.22 };  // moral/jour : un petit plaisir régulier recharge la volonté  // €/semaine -> bien-être/jour (rendements décroissants)

// ---------- Grenier : objets à revendre (prix d'occasion constatés) ----------
export const GRENIER = {
  velo:    { nom: 'Vélo d\'appartement', prix: 60, temps: 1 },
  console: { nom: 'Console de jeux inutilisée', prix: 110, temps: 1, bienetre: -3 },
  livres:  { nom: 'Carton de livres', prix: 25, temps: 0.5 },
  robot:   { nom: 'Robot pâtissier jamais sorti du carton', prix: 90, temps: 1 },
};

