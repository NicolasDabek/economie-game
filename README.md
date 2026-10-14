# Économie Game ❄️🌱☀️ : une année sobre

Jeu de gestion dans le navigateur où l'on **gagne en dépensant moins**. On vit 18 semaines enchaînées (hiver 8 semaines, printemps 4, été 6) dans une petite maison mal isolée de 3 pièces. Le but est de dépenser bien moins que le voisin qui vit sans réfléchir, sans sacrifier son confort, sa santé, son moral, son hygiène ni son bien-être.

## Concept
Une maison ancienne de 45 m², chauffée au gaz, avec un ballon d'eau chaude électrique de 200 L, en télétravail. La partie va de décembre à mi-août, en trois chapitres. Le budget est de 3 000 € hors loyer. Les prix sont réalistes pour la France en 2026 (détail dans [docs/prix.md](docs/prix.md)).

- **Un seul modèle physique** : chaque heure, chaque pièce perd `coefficient × (T intérieure − T extérieure)`, avec une masse thermique qui lisse les variations. Les pertes se répartissent entre murs, fenêtres et fuites d'air. Radiateurs, appoint, cuisson, corps, appareils et soleil chauffent la même pièce. L'humidité suit le même principe : respiration, cuisine et linge qui sèche l'augmentent, l'aération la fait baisser.
- **Ressenti** = pièce + vêtements (selon saleté et usure) − courants d'air − humidité − mains froides sous 17 °C. Trop de couches gêne les mouvements, surtout en cuisine.
- **Jauges** : argent, confort, santé, moral (volonté), **hygiène**, **bien-être**, temps libre, capital investi.
  - L'hygiène dépend des douches, du linge propre, de la vaisselle et de la moisissure.
  - Le bien-être dépend des petits plaisirs, de la qualité des repas, du temps libre, du sommeil, de la lumière et de la vie sociale.
  - Un bien-être bas fait baisser le moral et la santé.
- **Onglets par domaine** : Maison (chauffage, gestes, été), Eau chaude, Cuisine, Linge, Électricité, Jardin, Budget. La boutique affiche les articles du domaine choisi. Certains articles s'achètent d'occasion : moins cher, mais 1 h de recherche.
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
- **Garde-robe** : t-shirt, sous-couche lavable (protège les couches du dessus), chaussettes épaisses, sweat, pantalon polaire, peignoir pilou, doudoune d'intérieur, plaid. Chaque article existe en premier prix ou en durable, avec son coût par usage. On peut l'aérer au lieu de le laver, laver les sous-couches à la main ou repriser un vêtement usé.
- **Linge** : machine à 30, 40 ou 60 °C, taux de remplissage, étendoir (gratuit mais humidifie la maison) ou sèche-linge, lessive à midi pour profiter du solaire. Le lave-linge s'use. En cas de panne : technicien, réparation soi-même ou laverie.
- **Panneau solaire plug-and-play** : production horaire et autoconsommation sans batterie. Le jeu montre qu'il n'est pas rentabilisé en un hiver et estime son retour sur investissement.
- **Temps** : 3 h libres en semaine, 6 h le week-end. Gestes, lessives, installations et réparations en consomment. Le temps qui reste redonne de la volonté.
- **Habitudes** : un geste coûte de la volonté pendant 10 jours, puis devient automatique. Volonté à zéro : rechute.
- **Événements annoncés et dilemmes** : invités frileux, promo tentante, hausse du prix du gaz, panne de la machine.
- **23 principes**, dont 4 cartes transversales : réduire le volume, isoler pour prolonger, réparer avant de remplacer, décaler la consommation.
- **Fin de partie** : économies nettes face au voisin « tout chauffé », économies par domaine, investissements rentabilisés ou non, meilleure découverte, puis un titre : Dépensier, Malin, Optimiseur, Autonome ou Maître de la sobriété.
- **Sauvegarde** automatique chaque jour dans le navigateur, plus des boutons Sauvegarder, Charger et Nouvelle partie.

## Lancer le jeu
Aucune dépendance et aucune compilation : HTML, CSS et JavaScript (modules ES) uniquement.

```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```
Les modules ES ne se chargent pas toujours en `file://` : un petit serveur statique est recommandé. Le jeu est aussi publié sur GitHub Pages.
Astuce : `?graine=1234` dans l'URL change la météo.

## Tests
```bash
node test/sim-test.mjs
```
Le test simule les 126 jours avec six stratégies, sur trois graines (2026, 7 et 1789) : ne rien toucher, naïf, glacial, austère extrême, malin et maître.

Il vérifie que :
- le naïf, ne rien toucher et le glacial perdent ;
- l'austère extrême est plafonné ;
- le maître bat l'austère et obtient au moins « Autonome » ;
- le malin bat ne rien toucher ;
- la sauvegarde se recharge ;
- une ancienne sauvegarde (v0.2) est effacée proprement.

`test/navigateur.cjs` (playwright-core et Chromium) joue une partie complète dans le navigateur, sans aucune erreur JavaScript.

Résultats pour la graine 2026 (les autres graines donnent des écarts de moins de 2 %) :

| Stratégie | Coût | Voisin | Économies | Confort | Santé | Moral | Hygiène | Bien-être | Titre |
|---|---|---|---|---|---|---|---|---|---|
| Ne rien toucher | 2 923 € | 2 887 € | −37 € (−1 %) | 72 | 87 | 83 | 97 | 69 | Dépensier |
| Naïf (22 °C, livraisons, clim, sèche-linge) | 4 415 € | 2 887 € | −1 529 € | 83 | 89 | 84 | 99 | 82 | Dépensier |
| Glacial (chauffage coupé) | 2 899 € | 2 887 € | −12 € | 27 | 1 | 17 | 99 | 59 | Dépensier (santé) |
| Austère extrême (seau, pâtes, zéro plaisir, linge rare) | 1 338 € | 2 887 € | +1 549 € (54 %) | 46 | 1 | 14 | 15 | 2 | Dépensier (hygiène, bien-être, santé) |
| Malin | 2 301 € | 2 887 € | +585 € (20 %) | 90 | 99 | 64 | 96 | 68 | Optimiseur |
| Maître | 1 448 € | 2 887 € | +1 438 € (50 %) | 90 | 90 | 30 | 99 | 72 | Maître de la sobriété |

L'austère extrême dépense le moins, mais il s'effondre sur la santé, l'hygiène et le bien-être, avec 16 rechutes. Le titre, lui, tient compte de toutes les jauges.

## Structure
- `js/data.js` : constantes et équilibrage
- `js/meteo.js` : météo et prévisions
- `js/state.js` : état d'une partie
- `js/simulation.js` : modèle thermique, jauges, habitudes, découvertes et score
- `js/systemes.js` : eau chaude, tarifs, cuisine, électricité, jardin, abonnements, plaisirs (v0.3)
- `js/onglets.js` : onglets par domaine
- `js/ui.js` et `js/main.js` : interface
- `docs/conception.md` : document de conception

## Feuille de route
- ✅ v0.1 : prototype de l'hiver (modèle thermique, jauges, vêtements, lessive, thermomètre)
- ✅ v0.2 : prix réels 2026, chauffage au gaz avec robinets, purge et appoint, humidité et aération, volets, rideaux thermiques, boudins, solaire et sa rentabilité, vêtements premier prix ou durables, sous-couche, réparation, laverie, temps, capital investi, événements, sauvegarde, bilan par domaine
- ✅ v0.3 : eau chaude, tarifs Base, HC et Tempo, chapitres hiver → printemps → été, cuisine et cuisine solaire, veilles, jardin, abonnements et tentations, jauges hygiène et bien-être, onglets par domaine
1. Transport : vélo, covoiturage, entretien, coût réel de la voiture. Ce domaine n'a pas été intégré en v0.3 : il ne se rattache pas proprement au modèle de la maison.
2. Automne et année complète, avec un panneau solaire qui se rentabilise vraiment.
3. Effet rebond, et plus de fausses économies.
4. Scénarios (étudiant, famille, retraité), voisinage et partage, défis (« Hiver à 200 € »).
5. Sons, illustrations, version mobile.
