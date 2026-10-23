// Données de jeu : Énergie et eau : prix, tarifs EDF, électricité domestique, eau chaude (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

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

