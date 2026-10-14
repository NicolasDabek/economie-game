# Économie Game ❄️ : l'hiver sobre

Jeu de gestion dans le navigateur où l'on **gagne en dépensant moins**. Prototype : passer un hiver de 8 semaines dans une petite maison mal isolée de 3 pièces (salon, chambre, cuisine) en dépensant bien moins que le voisin qui chauffe tout à 21 °C, sans perdre son confort ni sa santé.

## Concept
- **Un seul modèle physique** : chaque heure, chaque pièce perd `coefficient × (T intérieure − T extérieure)`, avec une masse thermique qui lisse les variations. Radiateur, cuisson, chaleur du corps, frigo et soleil par la fenêtre alimentent la même pièce. Les astuces émergent du modèle.
- **Température ressentie** = température de la pièce + isolation des vêtements − courants d'air (− saleté et usure des vêtements). La nuit : couette + bouillotte.
- **Jauges** : argent, confort, santé, volonté.
- **On n'optimise que ce qu'on mesure** : sans thermomètres, on ne voit que la facture globale de la semaine. Avec, on voit la température et le coût de chaque pièce, et la pièce la plus coûteuse.
- **Volonté et habitudes** : un nouveau geste (fermer les portes, les rideaux le soir, préparer la bouillotte, s'habiller chaudement) coûte de la volonté chaque jour. Après 10 jours, il devient une habitude gratuite. Volonté à zéro : rechute (livraison de repas, gestes oubliés).
- **Météo à 3 jours** : aléatoire faible et déterministe (graine), avec une vague de froid au milieu de l'hiver. Le soleil d'hiver chauffe gratuitement par les fenêtres.
- **Vêtements** : t-shirt, sweat, pantalon polaire, peignoir pilou, avec isolation, saleté et usure. La lessive coûte de l'eau, de l'électricité et du produit, et use les vêtements et la machine.
- **12 principes à découvrir** (« Chauffer les gens, pas les murs », « Zoner la maison », etc.).
- **Fin de partie** : économies nettes face au voisin « tout chauffé », confort moyen, santé, puis un titre : Dépensier, Malin, Optimiseur, Autonome ou Maître de la sobriété.

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
Le test simule 8 semaines avec une stratégie naïve, une stratégie maligne et une stratégie « glaciale » (tout couper). Il vérifie que la stratégie maligne économise nettement plus sans faire chuter la santé, et que tout couper n'est pas récompensé.

## Structure
- `js/data.js` : constantes et équilibrage
- `js/meteo.js` : météo et prévisions
- `js/state.js` : état d'une partie
- `js/simulation.js` : modèle thermique, jauges, habitudes, découvertes et score
- `js/ui.js` et `js/main.js` : interface
- `docs/conception.md` : document de conception

## Feuille de route
1. Instruments supplémentaires : wattmètre, caméra thermique, hygromètre (humidité ressentie), compteur d'eau.
2. Eau chaude = énergie : douche, vaisselle, marmite norvégienne.
3. Cuisson solaire (Fresnel), masse thermique chargée au soleil, combos.
4. Fausses économies et effet rebond, pannes et réparations.
5. Été (stratégies inversées), puis une année complète.
6. Scénarios (étudiant, famille, retraité), voisinage et partage, défis (« Hiver à 300 € »).
7. Sauvegarde locale, sons, illustrations.
