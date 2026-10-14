# Économie Game ❄️ : l'hiver sobre

Jeu de gestion dans le navigateur où l'on **gagne en dépensant moins**. Prototype : passer un hiver de 8 semaines dans une petite maison mal isolée de 3 pièces (salon, chambre, cuisine) en dépensant bien moins que le voisin qui chauffe tout à 21 °C, sans perdre son confort ni sa santé.

## Concept
Une maison ancienne de 45 m², chauffée au gaz, en télétravail, de décembre à fin janvier. Les prix sont réalistes pour la France en 2026 (détail dans [docs/prix.md](docs/prix.md)).

- **Un seul modèle physique** : chaque heure, chaque pièce perd `coefficient × (T intérieure − T extérieure)`, avec une masse thermique qui lisse les variations. Les pertes se répartissent entre murs, fenêtres et fuites d'air. Radiateurs, appoint, cuisson, corps, appareils et soleil chauffent la même pièce. L'humidité suit le même principe : respiration, cuisine et linge qui sèche l'augmentent, l'aération la fait baisser.
- **Ressenti** = pièce + vêtements (selon saleté et usure) − courants d'air − humidité − mains froides sous 17 °C. Trop de couches gêne les mouvements, surtout en cuisine.
- **Jauges** : argent, confort, santé, volonté, temps libre, capital investi.
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
Le test simule 8 semaines (graine 2026) avec cinq stratégies : ne rien toucher, naïf, glacial, malin et maître. Il vérifie que le malin économise sans perdre sa santé, que tout couper n'est pas récompensé, que le maître atteint au moins « Autonome » et que la sauvegarde se recharge correctement.

| Stratégie | Coût | Voisin | Économies | Confort | Santé | Titre |
|---|---|---|---|---|---|---|
| Ne rien toucher (20/18 °C, fenêtre entrouverte) | 451 € | 427 € | −24 € (−6 %) | 79 | 96 | Dépensier |
| Naïf (22/21 °C, sèche-linge, machines à moitié vides) | 674 € | 427 € | −247 € | 98 | 100 | Dépensier |
| Glacial (tout coupé) | 294 € | 427 € | +133 € | 0 | 0 | Dépensier (santé) |
| Malin | 290 € | 427 € | +138 € (32 %) | 92 | 99 | Optimiseur |
| Maître | 254 € | 427 € | +173 € (41 %) | 94 | 100 | Maître de la sobriété |

## Structure
- `js/data.js` : constantes et équilibrage
- `js/meteo.js` : météo et prévisions
- `js/state.js` : état d'une partie
- `js/simulation.js` : modèle thermique, jauges, habitudes, découvertes et score
- `js/ui.js` et `js/main.js` : interface
- `docs/conception.md` : document de conception

## Feuille de route
- ✅ v0.1 : prototype de l'hiver (modèle thermique, jauges, vêtements, lessive, thermomètre)
- ✅ v0.2 : prix réels 2026, chauffage au gaz avec robinets, purge et appoint, humidité et aération, volets, rideaux thermiques, boudins, solaire et sa rentabilité, vêtements premier prix ou durables, sous-couche, réparation, laverie, temps, capital investi, événements, sauvegarde, bilan par domaine
1. Eau chaude = énergie : douche, vaisselle, marmite norvégienne, chauffe-eau.
2. Cuisine : cuisson solaire (Fresnel), batch cooking, gestion du frigo, zéro gaspi.
3. Tarifs Heures creuses et Tempo (décaler la consommation, jours rouges).
4. Fausses économies et effet rebond, achats d'occasion.
5. Été (stratégies inversées) et année complète, avec un panneau solaire qui se rentabilise vraiment.
6. Scénarios (étudiant, famille, retraité), voisinage et partage, défis (« Hiver à 200 € »).
7. Sons, illustrations, version mobile.
