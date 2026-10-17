# Journal des versions

Toutes les versions ont été publiées sur la branche `master` et sur GitHub Pages.

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
