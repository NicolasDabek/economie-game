// Données de jeu : Rentabilité, stockage du surplus solaire, combos, solaire passif (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

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
  potagerGrand: { entretien: 20, degr: 0, revente: 0, poste: 'alim', note: 'graines et plants des 4 planches' },
  lombri: { entretien: 0, degr: 0, revente: 0.3, poste: 'alim' },
  bokashi: { entretien: 12, degr: 0, revente: 0, poste: 'alim', note: 'son activé' },
  oyas: { entretien: 0, degr: 0, revente: 0, poste: 'eau' },
  goutte: { entretien: 3, degr: 0.05, revente: 0, poste: 'eau' },
  silo: { entretien: 0, degr: 0, revente: 0, poste: 'alim' },
  poules: { entretien: 0, degr: 0, revente: 0.2, poste: 'alim', note: 'aliment compté chaque jour dans le gain' },
  sterilisateur: { entretien: 4, degr: 0, revente: 0.3, poste: 'alim', note: 'capsules neuves' },
  potLacto: { entretien: 0, degr: 0, revente: 0.3, poste: 'alim' },
  poele: { saisonChauffe: true, entretien: 0, degr: 0, revente: 0.2, poste: 'energie', note: 'bois et ramonage déduits du gain' },
  cet: { entretien: 0, degr: 0.01, revente: 0, poste: 'energie' },
  toilettesSeches: { entretien: 0, degr: 0, revente: 0, poste: 'eau', note: 'sciure déduite du gain' },
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
  boucleFlux:       { nom: 'Épluchures → poules → fientes → compost → potager', principe: 'cycles', texte: 'Les déchets de cuisine nourrissent les poules, leurs fientes enrichissent le compost, le compost nourrit les planches.' },
  feuillesPaillage: { nom: 'Feuilles mortes → paillage gratuit', principe: 'solCouvert', texte: 'Les feuilles de l\'automne couvrent le sol tout l\'hiver : zéro euro, moins d\'arrosage au printemps.' },
  chouLacto:        { nom: 'Choux du potager → lactofermentation', principe: 'lacto', texte: 'Le surplus de choux devient une conserve vivante, sans énergie, bonne pour la santé.' },
  siloCave:         { nom: 'Silo à racines dans la cave du puits canadien', principe: 'inertieSol', texte: 'La fraîcheur du sol garde pommes de terre et courges des mois : moins de pertes, moins d\'achats d\'hiver.' },
  levainChaleur:    { nom: 'Pain au levain → four → chaleur de la cuisine', principe: 'combo', texte: 'Le four chauffe le pain puis la pièce : en hiver, sa chaleur n\'est pas perdue.' },
  cetSolaire:       { nom: 'Panneau → ballon thermodynamique à midi', principe: 'cop', texte: 'Le soleil alimente la pompe à chaleur : 1 kWh solaire donne 3 kWh d\'eau chaude.' },
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

