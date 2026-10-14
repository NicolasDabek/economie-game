# Économie Game ❄️🌱☀️🍂 : des années sobres

Jeu de gestion dans le navigateur où l'on **gagne en dépensant moins**. Depuis la v0.6, la partie est une **campagne de 3, 5 ou 10 ans** (5 par défaut). Chaque année a ses quatre saisons. On la vit dans une petite maison mal isolée de 3 pièces. Le but est de dépenser bien moins que le voisin qui vit sans réfléchir, sans sacrifier son confort, sa santé, son moral, son hygiène ni son bien-être.

## Concept
Une maison ancienne de 45 m², chauffée au gaz, avec un ballon d'eau chaude électrique de 200 L, en télétravail. La partie commence le 1er décembre 2026. On part avec 1 500 € sur le compte et 4 000 € sur le Livret A, et le salaire arrive chaque mois (loyer déduit). Les prix sont réalistes pour la France en 2026 (détail dans [docs/prix.md](docs/prix.md)).

- **Un seul modèle physique** : chaque heure, chaque pièce perd `coefficient × (T intérieure − T extérieure)`, avec une masse thermique qui lisse les variations. Les pertes se répartissent entre murs, fenêtres et fuites d'air. Radiateurs, appoint, cuisson, corps, appareils et soleil chauffent la même pièce. L'humidité suit le même principe : respiration, cuisine et linge qui sèche l'augmentent, l'aération la fait baisser.
- **Ressenti** = pièce + vêtements (selon saleté et usure) − courants d'air − humidité − mains froides sous 17 °C. Trop de couches gêne les mouvements, surtout en cuisine.
- **Jauges** : argent, confort, santé, moral (volonté), **hygiène**, **bien-être**, temps libre, capital investi.
  - L'hygiène dépend des douches, du linge propre, de la vaisselle et de la moisissure.
  - Le bien-être dépend des petits plaisirs, de la qualité des repas, du temps libre, du sommeil, de la lumière et de la vie sociale.
  - Un bien-être bas fait baisser le moral et la santé.
- **Onglets par domaine** : Maison (chauffage, gestes, été, ventilation passive), Eau chaude, Cuisine, Linge, Électricité, Transport, Jardin, Budget. La boutique affiche les articles du domaine choisi. Certains articles s'achètent d'occasion : moins cher, mais 1 h de recherche.
- **Eau chaude = énergie** :
  - Ballon 200 L à 45-65 °C, avec ses pertes en attente. La jaquette isolante les réduit.
  - Sous 55 °C, risque de légionelles pour la santé.
  - Chauffe en continu, en heures creuses, ou à midi avec le solaire.
  - Douche : durée, pommeau économe, mousseurs, couper l'eau au savonnage, récupérer l'eau froide du début, douche au seau, fréquence.
  - Vaisselle : eau courante, bassine, ou lave-vaisselle (quotidien, ou plein en mode éco et différé en HC).
- **Tarifs d'électricité** : Base, Heures creuses ou Tempo.
  - Le prix de l'électricité est calculé heure par heure.
  - La couleur Tempo du lendemain est annoncée la veille.
  - Changer d'option prend du temps et ne prend effet que 14 jours plus tard.
  - On peut décaler le ballon, la lessive et le lave-vaisselle.
- **Saisons** : l'été inverse les stratégies.
  - Volets fermés le jour, fenêtres grandes ouvertes la nuit.
  - Ventilateur à 45 W ou clim mobile à 1 000 W.
  - Canicule annoncée à l'avance.
  - La cuisson réchauffe la maison.
  - Le linge sèche dehors et le solaire est fort.
- **Cuisine et nourriture** :
  - Livraisons, courses classiques, cuisine maison, batch avec restes, ou « pâtes et riz » (pas cher, mais mauvais pour la santé et le bien-être).
  - Gaspillage, liste de courses, prix au kilo, piège du vrac, promo périssable.
  - Couvercle, bouilloire remplie juste ce qu'il faut, marmite norvégienne, autocuiseur, pain maison.
  - Frigo : réglage, dégivrage, ne pas y mettre de plats chauds.
- **Cuisine solaire** :
  - Lentille de Fresnel : risque de brûlure sans lunettes.
  - Four solaire, séchoir solaire, pierre accumulatrice de chaleur.
  - Tout dépend de la météo.
- **Électricité** : veilles révélées par le wattmètre, multiprise à interrupteur, LED.
- **Jardin** : herbes aromatiques, potager (première récolte après 3 semaines), composteur, cuve de récupération d'eau de pluie.
- **Budget et tentations** :
  - Le carnet de comptes révèle les abonnements oubliés. On peut les résilier, et renégocier le forfait mobile.
  - Médiathèque.
  - Budget de petits plaisirs, avec des rendements décroissants : zéro plaisir fait mal.
  - Revendre ce qui dort au grenier.
  - Règle des 48 h face aux tentations : livraison, robot cuiseur, promo.
- **Instruments** : thermomètres (température et coût de chaque pièce), hygromètre (humidité), wattmètre (électricité, appoint, solaire). Sans eux, on ne voit que la facture de la semaine.
- **Chauffage** : un seul thermostat au départ, puis des robinets thermostatiques pour une consigne par pièce. Purge des radiateurs, appoint électrique qui suit la personne, arrêt (hors-gel).
- **Isolation** : rideaux et volets la nuit, rideaux thermiques, joints de fenêtres, boudins de porte, portes fermées.
- **Gestes** : aérer 5 minutes plutôt que laisser la fenêtre entrouverte, récupérer la chaleur de la cuisson, bouillotte avec ou sans housse, s'habiller chaudement.
- **Garde-robe** : t-shirt, sous-couche lavable (protège les couches du dessus), chaussettes épaisses, sweat, pantalon polaire, peignoir polaire, doudoune d'intérieur, plaid. Chaque article existe en premier prix ou en durable, avec son coût par usage. On peut l'aérer au lieu de le laver, laver les sous-couches à la main ou repriser un vêtement usé.
- **Linge** : machine à 30, 40 ou 60 °C, taux de remplissage, étendoir (gratuit mais humidifie la maison) ou sèche-linge, lessive à midi pour profiter du solaire. Le lave-linge s'use. En cas de panne : technicien, réparation soi-même ou laverie.
- **Panneau solaire plug-and-play** : production horaire et autoconsommation sans batterie. Le jeu montre qu'il n'est pas rentabilisé en un hiver et estime son retour sur investissement.
- **Temps** : 3 h libres en semaine, 6 h le week-end. Gestes, lessives, installations et réparations en consomment. Le temps qui reste redonne de la volonté.
- **Habitudes** : un geste coûte de la volonté pendant 10 jours, puis devient automatique. Volonté à zéro : rechute.
- **Événements annoncés et dilemmes** : invités frileux, promo tentante, hausse du prix du gaz, panne de la machine.
- **Transport (v0.4)** : trajets travail (9 km), courses (4 km) et loisirs (12 km). Modes : marche, vélo neuf ou d'occasion (pneus, chaîne et freins à entretenir soi-même ou en atelier), VAE d'occasion, transports en commun (ticket ou abonnement remboursé à 50 % par l'employeur), covoiturage, voiture (carburant, usure, assurance, parking, écoconduite, pression des pneus, vente). Télétravail, courses regroupées, gamelle et gourde contre repas et boissons achetés, calcul du coût réel d'un trajet. Météo, fatigue, santé, sécurité et temps entrent en jeu.
- **Rentabilité mesurée (v0.4)** : chaque équipement mesure son gain réel face au contrefactuel. Tableau triable avec mini-courbe, retour atteint ou projeté, entretien, dégradation, durée de vie, revente, neuf contre occasion, coût d'opportunité (Livret A 1,7 %), saisons, projection sur 5 ans avec inflation. Estimation avant achat dans la boutique, avec une fourchette. Classement en fin de partie.
- **Stockage solaire et combos (v0.4)** : surplus du panneau → bouilloire → eau gardée au chaud (refroidissement de Newton selon l'isolation : rien, torchon, housse, thermos, caisse isolée) pour la bouillotte, le thé ou la vaisselle ; routeur solaire vers le ballon ; comparaison avec une batterie domestique. Le graphe sur 24 h montre production, consommation et surplus perdu. 16 combos (dont un anti-combo) détectés automatiquement, avec notification et liste.
- **Ventilation passive (v0.4)** : cheminée solaire (faite maison ou pro) et puits canadien (fait maison, pro ou hydraulique), d'après [docs/cheminee-solaire-puits-canadien.md](docs/cheminee-solaire-puits-canadien.md).
  - Température du sol `12 + 5·cos(2π(j − 220)/365)`, tirage `Q = 0,5·A·√(2gHΔT/300)`, sortie du tube `T_sol + (T_ext − T_sol)·e^(−L/L0)`, chaleur `0,34·Q·ΔT`, humidité pièce par pièce avec condensation dans le tube.
  - Chantiers de 1 à 5 jours de temps libre, by-pass automatique, clapet de nuit (le laisser ouvert provoque un contre-tirage), zone radon (kit étanchéité), pente ratée en fait maison (15 %), regard et filtres, moisissures si l'humidité dépasse 70 % pendant 48 h.
  - Combos « Clim de la Terre », « Respiration d'hiver », « Purge nocturne », « Séchoir à tirage », « Cave naturelle », et l'anti-combo « Serre humide ».
  - Les prix incertains sont affichés avec leur fourchette réelle.
- **Banque (v0.5)** : choix d'un profil de revenus (LEP réservé aux RFR ≤ 23 028 €). Livret A et LDDS à 1,7 %, LEP à 2,5 %, avec leurs plafonds et des intérêts par quinzaines capitalisés le 31 décembre. PEL à 2 % (PFU 30 %, clôture avant 2 ans au taux du CEL). Assurance vie en ligne ou en banque : fonds euros et UC, frais, prélèvements sociaux annuels. Virement automatique depuis les livrets ; sinon découvert (16 %, 20 % au-delà de l'autorisation, 8 € de commission par jour plafonnés à 80 €/mois). Le jeu suit un calendrier réel (1er décembre 2026 → 11 août 2027), semaines entre chapitres comprises.
- **Équipement ou placement ? (v0.5)** : la boutique affiche le rendement annuel de chaque équipement (économie annuelle ÷ prix) à côté du Livret A. L'onglet Banque compare équipements et placements : rendement brut, net d'impôt, réel (inflation 3 %), liquidité et risque. Le principe « coût d'opportunité » débloque un conseiller « Meilleur usage de 100 € ». Un euro placé ne peut plus acheter d'équipement. Un euro bloqué (PEL, SCPI, actions en baisse) ne paie pas une panne : il faut vendre, éventuellement à perte, ou passer à découvert.
- **Investissement (v0.5)** :
  - ETF monde et ETF CAC 40 en PEA ou en compte-titres, avec courtage et fiscalité 2026 (PFU 31,4 %) ; obligations ; SCPI (10 % de frais, délai de jouissance, retrait en 60 jours, loyers imposés TMI + 17,2 %).
  - Marché stochastique déterministe par graine : ~7 %/an, volatilité ~15 %, régimes agités et krachs.
  - Tableau risque, liquidité, frais et impôts. Les baisses stressent (moral) ; épargne de précaution = petit bonus de sérénité.
  - « Avance rapide » 10/20/30 ans : 300 scénarios, fourchettes 10/50/90 %, en euros courants et constants.
  - Les gains nets des placements (valeur de revente après frais et impôts, moins les gains du voisin resté au Livret A) entrent dans le score.
- **99 principes** dans une encyclopédie filtrable par domaine (quoi, pourquoi, comment, piège, transfert). Les principes verrouillés montrent « ??? » et un indice.
- **Fin de partie** : économies nettes face au voisin « tout chauffé », économies par domaine, investissements rentabilisés ou non, meilleure découverte, puis un titre : Dépensier, Malin, Optimiseur, Autonome ou Maître de la sobriété.
- **Sauvegarde** automatique chaque jour dans le navigateur, plus des boutons Sauvegarder, Charger et Nouvelle partie.

## Campagne de plusieurs années (v0.6)
- **Calendrier réel** : du 1er décembre 2026 au 1er décembre 2029, 2031 ou 2036. Chaque année a un hiver, un printemps, un été et un automne, avec une météo propre à chaque année (normales Météo-France, vagues de froid, canicules).
- **Commandes du temps** :
  - Jour (animé heure par heure) et Semaine.
  - **Mois** et **Jusqu'au prochain événement** : avance rapide sans animation. Elle s'arrête sur un choix, une alerte, une découverte ou un changement de saison.
- **Routines automatiques** : chaque routine se débloque avec un principe (lessive pleine à 30 °C, entretien des vêtements, garde-robe et volets selon la saison, rachat des consommables). Le joueur peut l'activer.
- **Économie qui bouge** :
  - salaire revalorisé chaque 1er janvier, loyer indexé sur l'IRL ;
  - inflation, gaz, électricité et alimentation selon des trajectoires tirées par graine ;
  - Livret A révisé le 1er février et le 1er août selon la formule officielle ;
  - énergie mensualisée, régularisée le 15 juin.
- **Rendez-vous annuels** :
  - 10 janvier : assurance habitation.
  - 15 juin : régularisation.
  - 1er septembre : rentrée.
  - 15 septembre : impôts.
  - 1er novembre : renégociation box et mobile.
  - 1er décembre : **bilan annuel** (économies par domaine, patrimoine, jauges moyennes, objectifs pour l'année suivante).
- **Usure** :
  - frigo, lave-linge, ballon et chaudière tombent en panne ; on choisit neuf, reconditionné ou réparation ;
  - vêtements et équipements arrivent en fin de vie ;
  - la rentabilité de long terme se mesure vraiment dans la partie.
- **Placements dans la durée** : cap des 4 ans du PEL, seuil fiscal des 5 ans du PEA, 8 ans de l'assurance vie, jouissance des SCPI, cycles de marché.
- **Ce qui mûrit** : rendement du potager (+12 %/an pendant 3 ans), compost, habitudes.
- **Sauvegardes** : une sauvegarde v0.5 continue en campagne de 5 ans, au même jour du calendrier.

### Résultats simulés sur 5 ans, v0.7 (graines 2026 / 7 / 1789)

| Stratégie | Économies vs voisin | Moral moyen | Santé moyenne | Titre |
|---|---|---|---|---|
| Ne rien toucher | −1 120 / −442 / +2 186 € | 64 / 62 / 62 | 98 / 97 / 98 | Dépensier |
| Naïf (tout à fond) | −35 626 / −35 452 / −34 935 € | 68 / 68 / 67 | 100 | Dépensier |
| Glacial | −17 622 / −16 181 / −11 096 € | 15 / 14 / 15 | 18 | Dépensier |
| Austère extrême | +8 385 / +10 460 / +16 401 € | 1 | 0 | Dépensier |
| Malin | +25 139 / +26 752 / +31 990 € | 60 / 62 / 62 | 88 / 89 / 89 | Autonome |
| Maître | +46 111 / +47 660 / +53 894 € | 63 / 64 / 64 | 89 / 91 / 91 | Maître de la sobriété |

Sur la graine 2026, l'austère extrême cumule 52 épisodes de maladie et 360 jours d'arrêt. Cela lui coûte 30 058 € de revenus perdus, 2 134 € de soins et 8 705 € d'imprévus. Il finit à 18 % des économies du maître.

Le voisin dépense environ 67 000 à 74 000 € en 5 ans, hors loyer.

Arbitrage équipement / placement sur 5 ans, en économies vs voisin :

| Stratégie | Graine 2026 | Graine 7 | Graine 1789 |
|---|---|---|---|
| Équipements rentables puis placement | 5 530 € | 6 163 € | 9 523 € |
| Tout placer | 900 € | 3 727 € | 1 764 € |
| Tout acheter | 4 271 € | 4 806 € | 7 910 € |
| Ne jamais investir | −192 € | 560 € | 3 270 € |

Une campagne de 5 ans se simule en environ 0,5 s, une de 10 ans en environ 0,8 s.

### Durée de jeu
- Jour par jour, avec l'animation, une année demande environ 365 clics : c'est trop long.
- En avançant au mois ou jusqu'au prochain événement, une année demande environ 35 arrêts (choix, alertes, saisons, bilan). Cela fait environ 20 à 40 minutes par an une fois les routines activées, soit 2 à 3 h pour 5 ans.
- La première année reste plus détaillée (pauses à chaque saison).

## Interface (v0.8)
- **Écran d'accueil** : durée de campagne, pitch, « Commencer le tutoriel » ou « Jouer directement ».
- **Mise en page** : barre du haut (date, saison, année, argent, jauges colorées avec flèche de tendance et infobulle), maison au centre, panneau latéral contextuel, commandes du temps en bas.
- **Maison interactive** : pièces cliquables (souris ou clavier) avec température et humidité ; un clic ouvre le réglage du chauffage.
- **6 sections** (Maison, Vie quotidienne, Achats, Argent, Savoir, Bilan) avec sous-onglets ; le contenu verrouillé reste caché et un badge « nouveau » signale ce qui se débloque.
- **Accompagnement** : tutoriel en 12 étapes (passable, rejouable via « ? »), 3 objectifs avec barres de progression, un conseiller qui donne un conseil à la fois, glossaire de 24 termes avec recherche, encyclopédie repliable.
- **Retour immédiat** : notifications après chaque action (effet en €/jour et sur les jauges), aperçu avant les achats importants et lors des réglages du thermostat (≈ 7 % de chauffage par °C, ADEME).
- **Système visuel** : variables CSS, échelle d'espacement, icônes SVG maison (`js/icones.js`, aucun CDN), thème clair ou sombre, micro-animations désactivées si « réduire les animations ».
- **Accessibilité** : navigation au clavier, focus visible, libellés aria, contraste ; touche « j » = jour suivant, Échap ferme les fenêtres.
- **Mobile** : mise en page en une colonne, sections collantes, commandes du temps toujours accessibles.

## Lancer le jeu
Aucune dépendance et aucune compilation : HTML, CSS et JavaScript (modules ES) uniquement.

```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```
Les modules ES ne se chargent pas toujours en `file://` : un petit serveur statique est recommandé. Le jeu est aussi publié sur GitHub Pages.
Astuce : `?graine=1234` dans l'URL change la météo.

## Tests
```bash
node test/sim-test.mjs       # 6 stratégies × 3 graines sur 5 ans, migrations de sauvegarde v3/v4/v5/v6 → v7, cibles de moral et de santé
node test/finance-test.mjs   # banque, marchés, projection, 4 stratégies d'arbitrage sur 5 ans, révision du Livret A, PEA 5 ans, temps de calcul 5 et 10 ans
CHROME=/usr/bin/google-chrome node test/navigateur.cjs   # navigateur sans écran : campagne de 3 ans en avance rapide, bilans, migrations (playwright-core)
CHROME=/usr/bin/google-chrome node test/captures.cjs after   # captures d'écran avant/après (bureau 1280×800, mobile 390×844) dans /workspace/ux-shots/
node test/passif-test.mjs    # cheminée solaire et puits canadien : rentabilité, pièges, combos
node outils/estimations.mjs  # régénère js/estimations.js (estimations avant achat)
```
`test/sim-test.mjs` simule 5 ans (1 826 jours) avec six stratégies, sur trois graines (2026, 7 et 1789). Il vérifie que :
- le naïf, ne rien toucher et le glacial perdent ; le maître économise strictement plus que l'austère extrême (qui reste ≤ 70 % du maître) et le glacial moins que le malin ;
- le maître a une santé moyenne ≥ 85 et le titre « Maître de la sobriété » ;
- les moraux moyens tombent dans leurs cibles : ne rien toucher 55-65, naïf 65-75, malin 60-70, maître 55-65, austère < 25, glacial < 30 ;
- au moins 3 combos sont trouvés et que les principes sont au moins 75 ;
- les sauvegardes v3, v4, v5 et v6 sont migrées (la banque démarre au jour de la sauvegarde, sans rattrapage), et qu'une sauvegarde plus ancienne est effacée proprement.

`test/finance-test.mjs` vérifie :
- le calendrier et les quinzaines (dépôt le 1er = 2 quinzaines en décembre, le 2 = 1 quinzaine ; retrait le 14 = quinzaine perdue) ;
- l'éligibilité au LEP, le verrouillage du profil et les plafonds ;
- la clôture du PEL avant 2 ans (taux du CEL, PFU 30 %) ;
- la SCPI : −10 % à la revente immédiate, délai de jouissance, loyers nets, retrait différé de 60 jours ;
- les agios et commissions du découvert, et le virement automatique ;
- le calage du marché et la projection.

Il joue aussi trois stratégies sur trois graines. « Équipements rentables d'abord, puis placement » doit battre « tout placer tout de suite » et « tout acheter, ne jamais placer » :

| Graine 2026 | Économies (score) | Placements vs Livret A | Banque (agios) | Patrimoine final | Moral moyen |
|---|---|---|---|---|---|
| Équipements à fort rendement, 2 500 € de précaution, reste en fonds euros | **+352 €** | −4 € | 0 € | 1 609 € | 74 |
| Tout placer dans un ETF au jour 1 | −1 435 € | −289 € | −1 131 € | 991 € | 34 |
| Tout acheter, ne jamais placer | −1 032 € | −44 € | −976 € | −4 708 € | 71 |

Tout placer laisse le compte courant à découvert pendant des mois (agios, commissions, stress) et expose aux baisses. Tout acheter engloutit l'épargne dans des équipements à faible rendement (puits, capteur pro, batterie : 0 à 12 %/an) et finit lourdement à découvert.

`test/passif-test.mjs` vérifie, sur trois graines, la rentabilité de la ventilation passive et que le gain attribué correspond au gaz réellement économisé. Il vérifie aussi le contre-tirage, la « serre humide », le radon, la pente ratée et le chantier.

`test/navigateur.cjs` (playwright-core et Chromium) joue une partie complète dans le navigateur, sans aucune erreur JavaScript. Il passe par le transport, le tri du tableau de rentabilité, les filtres de l'encyclopédie, le stockage solaire, un chantier de cheminée et un puits. Il passe aussi par la banque et l'investissement (profil, LEP, assurance vie, PEA, projection) et teste les migrations de sauvegardes v3 et v4.

Résultats pour la graine 2026 (les graines 7 et 1789 donnent moins de 1 point d'écart en économies) :

| Stratégie | Coût | Voisin | Économies | Confort | Santé | Moral | Hygiène | Bien-être | Titre |
|---|---|---|---|---|---|---|---|---|---|
| Ne rien toucher | 4 469 € | 4 425 € | −45 € (−1 %) | 72 | 87 | 79 | 97 | 68 | Dépensier |
| Naïf | 6 739 € | 4 425 € | −2 326 € (−53 %) | 83 | 89 | 82 | 99 | 82 | Dépensier |
| Glacial | 4 195 € | 4 425 € | +230 € (5 %) | 27 | 1 | 3 | 99 | 55 | Dépensier |
| Austère extrême | 1 480 € | 4 425 € | +2 946 € (67 %) | 47 | 1 | 3 | 15 | 2 | Dépensier |
| Malin | 3 051 € | 4 425 € | +1 375 € (31 %) | 90 | 99 | 61 | 96 | 67 | Optimiseur |
| Maître | 1 903 € | 4 425 € | +2 523 € (57 %) | 90 | 95 | 58 | 98 | 74 | Maître de la sobriété |

Sur les trois graines, le moral moyen du maître va de 55 à 61. Le voisin roule en voiture et achète son repas au travail : le transport pèse maintenant dans les deux budgets.

Ventilation passive (test/passif-test.mjs, chiffres réalistes v0.5 ; méthode et sources dans docs/prix.md) :

| Installation | Gain/an | Retour | Fourchette |
|---|---|---|---|
| Cheminée solaire faite maison (Trombe l'hiver) | 74-87 € | 5,2-6,0 ans | 3,4-16 ans selon le prix (300-1 200 €) |
| Puits pro seul | ~57 € moins 60 € d'entretien | jamais | |
| Puits fait maison (2 900 €) + cheminée, clim mobile évitée (84 €/an) | 215-228 € | 16,9-18,1 ans | ~7 à ~27 ans |
| Même chose sans clim à éviter | 131-144 € | 23-26 ans | |

Le salon est 2,1 °C plus frais l'après-midi d'été avec le puits et la cheminée. La clim évitée n'est comptée que s'il y a eu une canicule et que le joueur n'a pas de clim.

## Structure
- `js/data.js` : constantes et équilibrage
- `js/meteo.js` : météo et prévisions
- `js/state.js` : état d'une partie
- `js/simulation.js` : modèle thermique, jauges, habitudes, découvertes et score
- `js/systemes.js` : eau chaude, tarifs, cuisine, électricité, jardin, abonnements, plaisirs (v0.3)
- `js/transport.js` : trajets, modes, voiture, vélo (v0.4)
- `js/roi.js` et `js/estimations.js` : rentabilité mesurée, projections, estimations avant achat (v0.4)
- `js/combos.js` : stockage du surplus solaire et détection des combos (v0.4)
- `js/passif.js` : cheminée solaire et puits canadien (v0.4)
- `js/finance.js` : banque, placements, marchés, projection (v0.5)
- `js/ui-finance.js` : onglets Banque et Investissement (v0.5)
- `js/principes.js` : encyclopédie des 99 principes
- `js/onglets.js` : onglets par domaine
- `js/guide.js` : sections, tutoriel, objectifs, conseiller, glossaire, aperçus (v0.8)
- `js/icones.js` : icônes SVG intégrées (v0.8)
- `js/ui.js` et `js/main.js` : interface
- `docs/conception.md` : document de conception

## Feuille de route
- ✅ v0.1 : prototype de l'hiver (modèle thermique, jauges, vêtements, lessive, thermomètre)
- ✅ v0.2 : prix réels 2026, chauffage au gaz avec robinets, purge et appoint, humidité et aération, volets, rideaux thermiques, boudins, solaire et sa rentabilité, vêtements premier prix ou durables, sous-couche, réparation, laverie, temps, capital investi, événements, sauvegarde, bilan par domaine
- ✅ v0.3 : eau chaude, tarifs Base, HC et Tempo, chapitres hiver → printemps → été, cuisine et cuisine solaire, veilles, jardin, abonnements et tentations, jauges hygiène et bien-être, onglets par domaine
- ✅ v0.4 : moral rééquilibré (seuil 40), transport, rentabilité mesurée, stockage solaire et combos, ventilation passive (cheminée solaire et puits canadien), encyclopédie de 88 principes
- ✅ v0.5 : ventilation passive aux prix réels, banque (livrets, LEP, PEL, assurance vie, découvert), investissement (PEA, CTO, obligations, SCPI, marché stochastique, projection 10/20/30 ans), arbitrage équipement / placement, 99 principes
- ✅ v0.7 : moral sur la durée (adaptation hédonique, blues de l'hiver, monotonie, stress financier, vacances, maîtrise du budget), santé qui coûte (consultations, arrêts avec jours de carence, dentiste, moisissures, augmentations manquées), « peignoir polaire »
- ✅ v0.6 : campagne de 3, 5 ou 10 ans, quatre saisons par an, avance rapide et routines, salaire, inflation et prix qui évoluent, Livret A révisé par formule, pannes et remplacement des appareils, bilan annuel, 104 principes
- ✅ v0.8 : refonte de l'interface (sections, maison interactive, tutoriel, objectifs, conseiller, glossaire, aperçus, thème sombre, accessibilité, mobile)
1. Rendre l'automne plus spécifique.
2. Effet rebond, et plus de fausses économies.
3. Scénarios (étudiant, famille, retraité), voisinage et partage, défis (« Hiver à 200 € »).
4. Sons et illustrations.
