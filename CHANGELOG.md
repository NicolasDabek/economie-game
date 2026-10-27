# Journal des versions

Toutes les versions ont été publiées sur la branche `master` et sur GitHub Pages.

## [1.5.4] — 27 octobre 2026

Cinquième passe UI/UX (mesures : `test/captures-v154.cjs`, bureau 1280×800 et mobile 390×844, ajouté à `npm run test:navigateur`).

- **Bilan du jour 1** : au lieu de « Titre si la partie finissait : Dépensier » et de jauges moyennes à 0 % en rouge, un état vide « Bilan disponible à partir de demain » explique ce qui manque. Le bilan complet revient dès le jour 2.
- **Petits textes des cartes du bilan** (`.stats small`) : 10,83 → 12 px (.75rem).
- **Onglets au clavier** (motif WAI-ARIA) : un seul arrêt Tab par liste d'onglets (tabindex itinérant : vue principale, sections, sous-onglets), ← / → passent à l'onglet voisin et l'activent, Début / Fin au premier / dernier ; le focus suit l'onglet actif même quand la liste est redessinée.
- **Sous-onglets sur mobile** : ils passent à la ligne au lieu d'être coupés (« Aide » était tronqué) et sont un peu plus compacts ; à 390×844, les 4 sous-onglets du Bilan tiennent sur une ligne de 52 px (366 / 366 px), aucun n'est coupé dans les 5 sections.
- **Bas de page sous « Jour suivant » / ⏩** : la réserve sous le contenu (156 px sur mobile) dépasse la hauteur réelle des commandes du temps et de la barre de navigation (132 px) ; vérifié en bas de chaque section et de chaque sous-onglet, sur mobile et sur bureau : aucun texte dessous.

## [1.5.3] — 27 octobre 2026

Cinquième passe de game design.

- **Silo et cave rentabilisés** : chaque kilo de racines ou de courges mangé au-delà de sa garde de base est crédité au silo (jusqu'à 3 fois la garde) puis à la cave du puits climatique, à sa valeur au kilo. Autosuffisant sur 5 ans : silo 197,6 / 198,7 / 167,0 € (graines 2026 / 7 / 1789) ; il n'a pas de puits, donc rien pour la cave.
- **Plus d'objet à 0 €** : la multiprise active « éteindre chaque soir » dès l'achat, la bouillotte active « bouillotte du soir » en saison de chauffe (avec un message). Bouillotte et housse sont désormais mesurées : déperdition de la chambre (31 W/K) × degrés baissés sous les 21 °C du voisin la nuit, au prix du kWh de chauffage. Maître sur 5 ans : bouillotte 34 €, housse 33 €, multiprise 312 €. Test : à 3 ans, aucun objet acheté par le malin ou l'autosuffisant n'est à 0 €, hors liste explicite de confort pur (ventilateur, clim, moustiquaire, kit sécurité, tenue de pluie, lunettes, appoint, corde).
- **Défis et moral** : un défi gagné avec un moral moyen de l'année < 35 ne compte pas (en plus de santé < 50, confort < 55, hygiène < 30, bien-être < 25). Réussites sur les 3 graines : maître 3, autosuffisant 3, malin 2, débutant guidé 2, premiers pas 2, moral négligé 0 (avant : 1, l'année de l'électricité, avec un moral de 31 à 33), bien-être négligé 0, austère extrême 0, ne rien toucher 0. Le seuil 30 proposé laissait passer ce défi ; 35 reste loin du malin (56-57) et du maître (61-66).
- **Ventilateur** : « Achat de confort : ~20 €/an d'électricité » dans la boutique, la rentabilité et le classement, en gris au lieu du rouge. S'il y a une clim, chaque heure de canicule où elle reste éteinte grâce au ventilateur lui est créditée (clim 1 000 W du voisin à 25 °C moins 45 W) : sur un an, 19,9 € de coût sans clim, 13,0 € avec.
- **Résultats sur 5 ans** : malin 33,3 / 36,8 / 39,8 %, maître 61,5 / 66,7 / 68,5 %, autosuffisant 35,4 / 38,6 / 41,6 % ; face au malin, l'autosuffisant perd 371 à 457 € à 3 ans et gagne 6 210 à 7 469 € à 10 ans. Aucun prix modifié.

## [1.5.2] — 27 octobre 2026

- **Menu ⋯ sur mobile** : « Sauvegarder » et « Charger la sauvegarde » réapparaissent (une ancienne règle CSS, du temps où c'étaient des icônes du bandeau, les masquait sous 600 px). Libellés visibles, 240×44 px à 390×844.
- **Tests** : `captures-v151.cjs` vérifie, sur bureau et sur mobile, que les deux items sont visibles et ≥ 44 px, que « Sauvegarder » écrit la partie dans le navigateur et que « Charger » la restaure (retour au jour sauvegardé).

## [1.5.1] — 25 octobre 2026

Quatrième passe UI/UX (mesures : `test/captures-v151.cjs`, bureau 1280×800 et mobile 390×844).

- **Accueil sur bureau** : « Commencer le tutoriel » et « Jouer directement » passent juste après le choix du point de départ et de la durée, dans un pied de fenêtre collé en bas ; à 1280×800 ils finissent à 697 px au lieu de 999 px (mobile inchangé : 542 px).
- **Commandes du temps sur bureau** : la page défile désormais dans la zone de jeu et « Jour suivant », Semaine, Mois et Prochain événement forment une barre en bas, hors du contenu : plus aucun texte dessous, en haut, au milieu ou en bas du défilement (avant : « Coût caché de la sobriété », « santé, revenus perdus, imprévus »… étaient recouverts).
- **Recommencer** quitte le bandeau : c'est le dernier item du menu ⋯, séparé par un trait, en rouge, avec la mention « irréversible, demande confirmation » ; la confirmation est conservée.
- **Bandeau mobile compact** : 210 → 117 px à 390×844. Les 3 jauges clés et un bouton « +5 » tiennent sur une ligne ; le palier du moral devient une icône ; les 5 autres jauges s'ouvrent en panneau sous le bandeau, sans pousser la page.
- **Curseurs du thermostat** : colonne du libellé de largeur fixe, les deux curseurs ont la même largeur (164 / 212 → 160 / 160 px sur mobile, 367 / 435 → 363 / 363 px sur bureau).
- **Tests** : `captures-v151.cjs` (ajouté à `npm run test:navigateur`) mesure les 5 points.

## [1.5.0] — 25 octobre 2026

Quatrième passe de game design.

- **Pilier eau de l'autosuffisance** : les litres évités comptent comme autonomes (toilettes sèches, eau froide de la douche récupérée, mousseurs, seau et oyas au jardin) : eau = (pluie + évités) / (pluie + évités + réseau). Le récupérateur se remplit maintenant avec la pluie réelle (normales Météo-France Paris-Montsouris 1991-2020, 634 mm/an, 20 m² de toit, ruissellement 0,9) au lieu d'un apport de 60 l les jours très nuageux, qui ne tombait presque jamais au printemps et en été. Profil autosuffisant à 10 ans : eau 35 à 37 %, global 33 % (au lieu de 1 % et 18 %).
- **Profil autosuffisant** (tests) : panneau solaire plug-and-play, toilettes sèches, oyas et goutte-à-goutte, lombricomposteur, silo, séchoir solaire, cueillette guidée et choucroute d'automne dès la 1re année. Face au malin : −333 à −386 € à 3 ans, +6 338 à +7 500 € à 10 ans. Assertions : global ≥ 25 %, eau ≥ 10 % et écart ≥ +5 000 € à 10 ans, écart < 0 à 3 ans, sur les 3 graines.
- **Durées de vie** : poêle à bois 20 → 22 ans (15-20 ans, jusqu'à 30 ans bien entretenu), poulailler 6 → 8 ans (5-10 ans pour un poulailler en bois entretenu).
- **Défis annuels** : nourriture et transport demandent de dépenser au moins 3 % de moins que le voisin de l'année (et plus 2 % de moins que soi-même l'an dernier, ce qui punissait le joueur déjà sobre). Électricité : face au voisin aussi, au moins 40 % de moins (à effort 1,00 face à soi-même, tous les profils tombaient entre 0,97 et 1,02 selon la graine). Un défi gagné en s'abîmant (moyennes de l'année : santé < 50, confort < 55, hygiène < 30 ou bien-être < 25) ne compte pas. Le tableau de bord suit la cible du voisin à date. Réussites : maître 3, malin 2, austère extrême 0, ne rien toucher 0.
- **Prix** : récupérateur d'eau 300 L 69 → 44 € (Castorama, 43,90 €) ; four solaire caisson 129 € → cuiseur solaire pliable 100 € (Solar Brother SunGood, 99,95 €). Œufs inchangés à 0,40 € : +20 % ne correspond qu'au bio de magasin spécialisé (RNM, 15/10/2026).
- **Rentabilité mesurée** :
  - robinets thermostatiques : n'avaient aucun calcul d'économie (« 0 € mesuré ») ; ils sont crédités de la chaleur évitée dans les pièces réglées plus bas que le salon (maître : +530 € nets sur 5 ans) ;
  - lactofermentation : pas un bug de calcul, le profil ne fermentait jamais (les haricots partent en bocaux, pas de choux au potager) ; les profils achètent 10 kg de choux en octobre (maître : +82 € nets sur 5 ans).
- **Tests** : `reco-test` vérifie qu'aucun équipement à moins de 60 € ne fait perdre plus de 20 € nets sur 5 ans au maître (hors objets au gain non monétaire, signalés comme tels : sécurité, tenue de pluie, bouillotte, ventilateur). `SEUL=roi-maitre node test/sim-test.mjs` affiche ce tableau.
- Sauvegarde inchangée (v10) : les nouveaux champs (`evites`, données du défi) sont facultatifs.

## [1.4.0] — 23 octobre 2026

Troisième passe de game design.

- **Potager** : rendement ×1,3 (potager familial soigné : 1,2 à 1,5 fois les moyennes nationales, Jardiniers de France, Potager du Roi).
- **Défis annuels recalibrés** : le défi électricité (jamais réussi, même par le maître) demande désormais de rester à moins de 5 % au-dessus de l'an dernier, au lieu de 2 % en dessous. La cible est corrigée en fin d'année selon la météo, comme la facture du voisin. Réussites : malin 1 sur 3, maître 3 sur 3, ne rien toucher 0 (vérifié par `sim-test`).
- **Maison rénovée à crédit** : fenêtres neuves, donc plus de joints de fenêtres à poser. Le premier conseil y devient « Purger les radiateurs ».
- Les clés optionnelles d'un scénario (`solaire`, `fenetresNeuves`) sont remises à zéro quand on change de scénario.
- **Tests** : nouveau profil « premiers pas » (thermostat 19/17, gamelle, liste de courses) qui doit obtenir au moins Malin ; taux de réussite des défis par profil ; le conseil n°1 doit différer dans au moins 2 des 4 scénarios.
- Sauvegarde inchangée (v10) : les nouveaux champs du défi sont facultatifs.

## [1.3.2] — 23 octobre 2026

Refactorisation sans changement de comportement.

- `pasHoraire` et la physique des pièces passent dans `js/thermique.js`. `jourSuivant` enchaîne des étapes nommées, rangées dans `js/journee/` :
  - `gestes` : moral, rechute et habitudes ;
  - `lessive` ;
  - `heures` : météo et chauffage heure par heure, électricité, solaire, ressenti ;
  - `factures` : consommation payée ;
  - `voisin` ;
  - `jauges` : vêtements, humidité, confort, hygiène, bien-être, santé, moral ;
  - `decouvertes`.
- `js/data.js` (825 lignes) est découpé en 11 modules par catégorie dans `js/data/`. `data.js` les réexporte, donc aucun import ne change.
- Résultats identiques au bit près : les empreintes SHA-256 de l'état final des 10 profils sur 5 ans (graines 2026, 7 et 1789) sont les mêmes avant et après, et la sortie complète de `sim-test` (blocs 3 ans, 10 ans et scénarios compris) aussi. `EMPREINTE=fichier node test/sim-test.mjs` écrit ces empreintes.
- Les sauvegardes v3 à v10 se chargent toujours (tests de migration).

## [1.3.1] — 23 octobre 2026

Troisième passe UI/UX (mobile 390×844).

- **Accueil mobile** : « Commencer le tutoriel » et « Jouer directement » sont visibles sans défiler (bas des boutons à 542 px au lieu de 1 434). Les scénarios passent sur 2 colonnes avec leur résumé court, l'illustration est masquée et les 3 points d'explication passent sous les boutons.
- **Alertes et « Jour suivant »** : vérifié, la place réservée en v1.2.1 suffit ; en bas de page, la dernière carte s'arrête à 688 px et les commandes commencent à 712 px. Rien n'est changé.
- **Commandes du temps** : elles restent flottantes, mais leur hauteur réelle (⏩ ouvert ou fermé, retour à la ligne) est mesurée et réservée sous le contenu.
- **⏩** : il a maintenant un `title` en plus de son `aria-label`.
- **« Ignorer »** : c'est un vrai bouton bordé de 44 px minimum au lieu d'un lien souligné.
- Tests : nouveau `test/captures-v131.cjs`, ajouté à `npm run test:navigateur`.

## [1.3.0] — 17 octobre 2026

Seconde passe de game design (`economie-gd-passe2.md`).

- **Titre « Économe »** : la bande Autonome (22-45 %) est coupée en deux. Seuils 8 / 15 / 22 / 32 / 45 / 62 % pour Dépensier, Malin, Optimiseur, **Économe**, Autonome, Maître et Légende. Le débutant guidé devient Économe ; le malin reste Autonome.
- **Garde-fou du bien-être dès le rang 1** : un bien-être moyen sous 40, ou au moins 8 rechutes sur 5 ans (au prorata de la durée), donne Dépensier. Négliger son bien-être ne rapporte plus le titre « Malin ». Une hygiène sous 45 plafonne toujours à Malin.
- **Défis sans victoire gratuite** : il faut dépenser 2 % de moins que l'an dernier (prix corrigés) et avoir agi sur le poste : une habitude ou un équipement lié (chauffage et isolation, cuisine et jardin, électricité, transport sans voiture). Sinon le défi est manqué, avec un message qui le dit. « Ne rien toucher » ne gagne plus aucun défi sur les 3 graines.
- **3 scénarios de départ**, choisis sur l'écran d'accueil. Le voisin vit dans le même logement et il est recalculé :
  - 🏢 **Appartement tout électrique** : 30 m², convecteurs payés au prix de l'heure (Tempo compris), abonnement 9 kVA, loyer 450 €.
  - 👨‍👩‍👧‍👦 **Famille de 4** : 80 m² au gaz, eau chaude × 2,2, deux fois plus de linge, courses × 2,1 (échelle Insee-OCDE), ballon de 300 l. Deux salaires (3 900 €), 153 € d'allocations familiales, loyer 880 €.
  - 🏡 **Maison rénovée à crédit** : 40 % de déperditions en moins, double vitrage peu émissif, mensualité supérieure de 350 € au loyer.
  - Le scénario du foyer est rappelé dans le menu ⋯.
- **Poêle à bois réglé comme dans la réalité** : il chauffe le salon jusqu'à la consigne de la pièce, au lieu de pousser 5 kW chaque soir. Avant, le salon montait à 33-37 °C, la santé et le moral s'effondraient.
- **Valeur résiduelle des installations fixes** : pour le poêle et le ballon thermodynamique, la pose ne se revend pas (45 % et 30 % du prix). Seule la valeur de l'appareil reste au bilan.
- **Profil de test « autosuffisant »** : c'est le malin, avec en plus le jardin, les poules et un poêle (qui tourne en journée) achetés la première année, sans toucher à l'épargne de précaution. Face au malin, il perd 1 589 à 1 711 € sur 3 ans et gagne 1 552 à 2 208 € sur 10 ans.
- Le profil de test « naïf » est renommé « tout à fond » : la référence reste « ne rien toucher ».
- **Sauvegarde v10**, avec migration depuis la v9 : une partie en cours continue dans la maison au gaz.
- **Tests** :
  - « ne rien toucher » reste à ± 5 % du voisin dans chaque scénario et sur 3 graines ;
  - bien-être négligé = Dépensier ;
  - nouveau `test/captures-v130.cjs` (écran d'accueil mobile, partie en appartement, reprise, migration v9).

## [1.2.1] — 17 octobre 2026

Seconde passe de design (accessibilité et mobile).

- **Bas de page dégagé** : le contenu reçoit une marge basse égale à « Jour suivant » + barre d'onglets (+ zone sûre iOS) ; la carte Alertes n'est plus masquée par le bouton ni par ⏩.
- **Date courte sur mobile** : « Mar. 1 déc. · Hiver · 7 h » sur une seule ligne ; l'année (« Année 1 sur 5 · jour 1 ») passe dans le menu.
- **Menu ⋯ libellé** : Annuler, Sauvegarder, Charger, Thème, Réglages et Tutoriel sont regroupés dans un menu avec libellés visibles ; « Recommencer » reste à part, en rouge (action destructive) avec confirmation « irréversible ».
- **Lien « Aller au jeu »** : 44 px de haut minimum.
- **Contraste du bandeau** : dégradé de jour assombri (#1e40af → #2552c4) ; le texte blanc passe de 2,7:1 à ≥ 5,7:1 (WCAG AA ≥ 4,5:1).
- **Premier jour** : le grand « 0,00 € » est remplacé par « 🌱 Ton premier écart apparaîtra demain. » et une consigne.
- Tests : nouveau `test/captures-v121.cjs` (mobile 390×844), navigateur et playtest adaptés au menu.

## [1.2.0] — 16 octobre 2026

Refonte de l'interface d'après les maquettes (`design-economie-game`).

- **Navigation en 5 sections** : Accueil, Maison, Achats, Argent, Bilan. Sur mobile et tablette, elles forment une barre en bas de l'écran. « Vie quotidienne » rejoint Maison (cuisine, jardin, transport) et Argent (budget). « Savoir » rejoint Bilan (encyclopédie, combos, glossaire, journal, aide). Raccourcis clavier 1 à 5.
- **« Jour suivant » flottant**. Sur mobile, Semaine, Mois et Prochain événement se déplient avec ⏩.
- **3 jauges clés** : argent, moral et santé. Les 5 autres se replient, avec un signal quand l'une d'elles est en alerte.
- **Accueil** : le tableau de bord ouvre sur « Économisé vs voisin » (avec le solde estimé du mois et l'épargne de précaution) et une seule action conseillée. Les autres conseils sont repliés.
- **Chauffage** : curseurs larges sur toute la ligne. L'encadré d'impact donne des valeurs réelles : coût récent du chauffage par jour et par mois, puis l'effet en €/mois de chaque degré, calculé sur ton chauffage réel. Les réglages avancés (portes, cuisson, bouillotte, couches) sont repliés.
- **Accessibilité** : toutes les commandes font au moins 44 px et aucun texte n'est sous 12 px.
- Les écrans d'autosuffisance (Jardin, Garde-manger, Poêle, Eau) s'intègrent dans la section Maison.

## [1.1.1] — 16 octobre 2026

Corrections rapides de l'analyse de game design (`economie-gd-analyse.md`).

- **P4** Paliers d'économies : +3 de moral tous les 250 € jusqu'à 2 000 €, puis +1 tous les 1 000 €. Le moral moyen du maître revient dans [55, 65].
- **P2** Titres : Malin dès 8 %, Optimiseur dès 15 %, Autonome dès 22 % (le débutant guidé l'atteint), Maître dès 45 %, et nouveau titre **Légende de la sobriété** dès 62 % (40 principes, 10 habitudes, épargne bien gérée).
- **P3** Tableau de bord : ligne « Coût caché de la sobriété » (santé, revenus perdus, imprévus, moisissures) à côté de l'économie.
- **P5** Défis annuels : la cible est la dépense de l'an dernier corrigée de l'inflation, sans les −5 % qui la rendaient hors d'atteinte.
- Non traités (chantiers plus lourds) : P1 (calage du naïf sur le voisin), P6 (scénarios de départ).

## [1.1.0] — 16 octobre 2026

L'autosuffisance : 15 idées rangées dans les onglets existants (voir `docs/conception.md` §7), chiffres sourcés dans `docs/prix.md`.

### Ajouté
- **Jardin** : le petit potager devient 4 planches de 2 m² (8 avec l'agrandissement) avec un plan conseillé ; 10 cultures, fenêtres de semis, rotation des familles (−20 %), bons voisins (+10 %), gel tardif tiré de la vraie météo, semis précoce optionnel.
- **Eau du jardin** : arrosage au m² cultivé, paillage (feuilles mortes gratuites à l'automne), oyas, goutte-à-goutte sur la cuve, arrêtés sécheresse annoncés.
- **Compost fusionné** : composteur, lombricomposteur et bokashi agissent sur un seul facteur.
- **Poules** : œufs saisonniers, aliment réduit par les épluchures, renard sans grillage, déclaration en mairie (influenza aviaire), vacances chez le voisin.
- **Cueillette sauvage** : six espèces de saison, risque de confusion réduit par un guide et la pharmacie.
- **Cuisine › Garde-manger** : stock en kg avec péremption (le premier qui périme part d'abord), argent immobilisé, bocaux stérilisés (risque de botulisme, « dans le doute on jette »), lactofermentation, achats de saison, silo à racines (et cave du puits canadien).
- **Pain au levain** (habitude), avec combo de chaleur du four en hiver.
- **Maison › Poêle à bois** : chaleur réelle dans le salon, bois sec ou vert à faire sécher, encrassement, ramonage obligatoire et assurance, feu de cheminée. Nouveau poste « bois » dans le domaine Chauffage.
- **Eau chaude** : ballon thermodynamique (COP 3), prime CEE bonifiée jusqu'au 31/12/2026 à demander avant le devis, piège de l'artisan non RGE, fin de MaPrimeRénov' pour ce geste ; toilettes sèches.
- **Tableau de bord** : carte « Autosuffisance » (alimentation, eau, chaleur, électricité, titre) séparée du score d'économies ; alertes de semis, de péremption, de sécheresse, de bois humide, de ramonage et de prime.
- 13 principes, 6 combos, 4 habitudes, 15 équipements.
- Test `autonomie-test`.

### Équilibre
- Le conseiller ne connaît pas ces systèmes : le débutant guidé reste sous le malin, le maître les exploite.
- Moral moyen du maître toléré jusqu'à 68 (poules, cueillette et levain font du bien).

### Sauvegarde
- Version 9. Une partie v1.0 est migrée : un potager déjà acheté reçoit le plan conseillé.

## [1.0.0] — 15 octobre 2026

Première version stable. Elle se concentre sur la fiabilité, la cohérence des chiffres et la prise en main.

### Ajouté
- **Page Savoir › Aide** : « Comment jouer » en cinq étapes, les jauges, le conseiller, les raccourcis clavier, un bouton pour relancer le tutoriel, et un « À propos » avec les crédits, la version et les sources des prix.
- Icône du jeu fournie avec le dépôt (SVG, PNG 32 px, icône Apple 180 px, manifeste), balises meta de description et de partage.
- Le numéro de version est affiché sur l'accueil et dans l'Aide (`js/version.js`).
- Nouveaux tests :
  - `sauvegarde-test` : migrations depuis toutes les versions de sauvegarde (3 → 8), sauvegardes abîmées et champs manquants ;
  - `coherence-test` : factures = consommations × tarifs, somme des domaines = total, tableau de bord = bilan, aucun NaN ou Infinity, dates continues, 24 prix comparés à `docs/prix.md` ;
  - `audit.cjs` : parcours complets au bureau, sur mobile (390 px), en thème sombre et au clavier seul, plus le démarrage avec une sauvegarde abîmée.

### Corrigé
- Les simulations « à blanc » du conseiller laissaient des prix futurs (inflation) dans les prix affichés. Les prix du jour sont désormais restaurés après chaque évaluation.
- **Lavage à la main** : l'eau et l'électricité n'apparaissaient pas dans les factures, et le savon était compté en électricité. Chaque coût est maintenant facturé dans le bon poste.
- **Carte de médiathèque** : elle était annoncée « /an » mais n'était jamais renouvelée. Elle se renouvelle désormais chaque 1er janvier, et sa logique n'existe plus qu'en un seul endroit.
- Une sauvegarde illisible ne bloque plus le jeu : elle est mise de côté et l'accueil s'affiche. Les champs manquants sont complétés et les préférences d'affichage sont validées.
- Textes des jauges, des paliers et du tutoriel alignés sur les mécanismes réels ; le vocabulaire est unifié (« coût en moral »).
- Code mort et imports inutilisés retirés.

### Sauvegarde
- La version de sauvegarde passe à 8. La migration est automatique depuis les versions 3 à 7. Les sauvegardes antérieures à la v0.3 ne sont plus lisibles et sont effacées.

## [0.9.2] — 14 octobre 2026
- Le conseiller est volontairement limité. Il ne connaît que les principes découverts, domaine par domaine. Il voit à 10 jours et donne des fourchettes. Il propose 3 conseils par semaine, hors corvées.
- Le joueur débutant qui suit les conseils reste en dessous d'un joueur malin (environ 23 à 30 % d'économies).
- Test du bouton « Ignorer » et du quota.

## [0.9.1] — 14 octobre 2026
- Arbitre des recommandations :
  - chaque conseil est évalué par simulation ;
  - les conflits sont arbitrés par levier ;
  - les jauges sont protégées ;
  - un délai de 21 jours (hystérésis) évite les allers-retours ;
  - un bouton « Ignorer » est ajouté.
- Test anti-oscillation sur 2 ans.

## [0.9] — 14 octobre 2026
- Conseils actionnables et filtrés.
- Parcours du débutant guidé testé.
- Défis annuels et courbes.
- Bouton « Annuler ».
- Réglages et raccourcis clavier.
- Avance rapide plus fluide.

## [0.8.1] — 14 octobre 2026
- Tableau de bord.
- Paliers de moral et de bien-être.
- Réabonnement.
- Les habitudes reflètent l'état courant.
- Jauges et ciel corrigés.

## [0.8] — 14 octobre 2026
- Refonte UX :
  - sections et maison interactive ;
  - tutoriel, objectifs, conseiller et glossaire ;
  - aperçus avant achat ;
  - thème sombre ;
  - accessibilité et mobile.

## [0.7] — 14 octobre 2026
- Moral sur la durée : adaptation hédonique, blues de l'hiver, monotonie, stress, vacances, maîtrise du budget.
- La santé a un coût : consultations, arrêts avec jour de carence, dentiste, moisissures, augmentations perdues.
- « Peignoir polaire ».
- Migration de sauvegarde v6 → v7.

## [0.6] — 14 octobre 2026
- Campagne de 3, 5 ou 10 ans, avec quatre saisons par an.
- Avance rapide (au mois ou jusqu'au prochain événement) et routines automatiques.
- Salaire, inflation et prix qui suivent des trajectoires.
- Livret A révisé par sa formule officielle.
- Mensualisation et régularisation des factures.
- Pannes d'appareils et bilan annuel.
- Migration de sauvegarde v5 → v6.

## [0.5] — 14 octobre 2026
- Ventilation passive aux prix réels.
- Onglets Banque et Investissement.
- Arbitrage entre équipement et placement.
- 99 principes.

## [0.4] — 14 octobre 2026
- Moral rééquilibré.
- Transport.
- Rentabilité mesurée.
- Stockage solaire et combos.
- Cheminée solaire et puits canadien.
- 88 principes, tests et documentation.

## [0.3] — 14 octobre 2026
- Eau chaude.
- Tarifs heures creuses et Tempo.
- Printemps et été.
- Cuisine, électricité, jardin et budget.
- Jauges d'hygiène et de bien-être.
- Onglets.

## [0.2] — 14 octobre 2026
- Prix réels 2026 et chauffage au gaz.
- Humidité.
- Garde-robe durable et linge.
- Solaire.
- Gestion du temps et événements.
- Sauvegarde et bilan par domaine.

## [0.1] — 14 octobre 2026
- Prototype jouable : un hiver de 8 semaines, avec un modèle thermique, des jauges, des habitudes, des vêtements, la lessive et un thermomètre.
