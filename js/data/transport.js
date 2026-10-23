// Données de jeu : Transport (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

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

