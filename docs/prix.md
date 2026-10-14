# Prix utilisés dans le jeu (France, octobre 2026)

Tous les prix sont dans `js/data.js`, avec un commentaire par valeur. Les prix de rayon sont des fourchettes relevées en 2026 dans les grandes enseignes (Leroy Merlin, Castorama, Decathlon, Ikea, Action, pharmacies). Le jeu retient une valeur moyenne.

## Énergie et eau
| Poste | Valeur | Source |
|---|---|---|
| Électricité, kWh | **0,2001 € TTC** | EDF Tarif Bleu, option Base 6 kVA, grille du 1er août 2026 (CRE) |
| Électricité, abonnement | **15,86 € TTC/mois** | Idem |
| Gaz, kWh (chauffage) | **0,1456 € TTC** | Prix repère de vente de gaz (CRE), octobre 2026, « logement chauffé au gaz » |
| Gaz, abonnement | **360,79 € TTC/an** | Idem |
| Hausse en cours de partie | +12 % sur le kWh de gaz | Événement fictif, inspiré des +6,3 % puis +8 % de l'automne 2026 |
| Eau (potable + assainissement) | **4,89 € TTC/m³** | Eaufrance / SISPEA, prix moyen national publié en 2026 |
| Rendement de la chaudière | 85 % | Chaudière gaz ancienne sans condensation (80-87 %) |

Les abonnements sont payés par le joueur comme par le voisin. Ils figurent sur les factures mais sont exclus du calcul des économies.

## Maison et appareils
| Poste | Valeur | Commentaire |
|---|---|---|
| Déperditions de la maison | ~105 W/K | Maison ancienne de 45 m², DPE F |
| Facture de gaz du voisin à 21 °C | ~360 € sur 8 semaines d'hiver (~420 € sur la partie) | ~2 500 kWh de gaz, cohérent avec ~8 000-9 000 kWh/an pour ce logement |
| Radiateurs | 2 000 / 1 000 / 1 000 W | ~100 W/m² |
| Consommation de fond | 170 W (~4 kWh/jour) | Frigo, box, veilles, éclairage |
| Lave-linge (cycle 7 kg) | 0,35 / 0,6 / 1,1 kWh à 30 / 40 / 60 °C, 45 l | Étiquette énergie classe A, ordres de grandeur ADEME |
| Sèche-linge à condensation | 2,5 kWh par cycle | Classe B |
| Dose de lessive | 0,22 € | Bidon de 2,5 l (~40 doses) à 8-12 € |
| Laverie | 5 € le lavage + 3 € le séchage | Laveries automatiques 2026 |
| Réparation du lave-linge (technicien) | 150 € | Déplacement, main d'œuvre et pièce : 120-200 € |
| Pièce détachée (réparation soi-même) | 30 € | Pompe de vidange ou courroie : 20-40 € |
| Panneau solaire plug-and-play 400 Wc | **449 €** | Kits à 350-600 € en 2026. Production en hiver de ~0,3-1 kWh/jour, ~450-550 kWh/an |
| Chauffage d'appoint, bain d'huile 1 500 W | 45 € | 35-60 € |

## Équipements
| Article | Prix dans le jeu | Fourchette réelle | Durée de vie (hivers) |
|---|---|---|---|
| Thermomètres de pièce ×3 | 12 € | 3-6 € pièce | 10 |
| Hygromètre | 9 € | 7-12 € | 10 |
| Wattmètre de prise | 15 € | 12-20 € | 10 |
| Joints de fenêtres (calfeutrage) | 22 € | 15-30 € | 3 |
| Boudins de porte ×2 | 24 € | 10-15 € pièce | 5 |
| Rideaux thermiques (3 fenêtres) | 95 € | 25-40 € le panneau | 10 |
| Robinets thermostatiques ×3 | 60 € | 15-25 € pièce | 15 |
| Clé de purge | 3 € | 2-4 € | 1 |
| Bouillotte 2 l | 8 € | 6-12 € | 3 |
| Housse de bouillotte tricotée | 8 € | 6-10 € | 5 |
| Kit de couture | 6 € | 5-8 € | 10 |

## Vêtements (premier prix / durable)
| Article | Premier prix | Durable | Isolation |
|---|---|---|---|
| Sous-couche manches longues | 9 € | 39 € (mérinos) | +1,0 °C |
| Chaussettes épaisses | 4 € | 15 € (laine) | +0,8 °C |
| Sweat | 13 € | 40 € | +1,5 °C |
| Pantalon polaire | 12 € | 30 € | +1,2 °C |
| Peignoir pilou | 22 € | 45 € | +2,5 °C |
| Doudoune d'intérieur | 25 € | 70 € (duvet) | +3,0 °C |
| Plaid portable | 12 € | 35 € (laine) | +2,5 °C, seulement assis au salon |

Un vêtement premier prix s'use environ 6 fois plus vite qu'un durable, ce qui donne tout son sens au **coût par usage**.

## Calcul des économies
- **Coût du joueur** : gaz, électricité, eau, produits, laverie et imprévus, plus la part amortie des investissements. Pour un équipement, c'est son prix divisé par sa durée de vie. Pour un vêtement, c'est la part usée.
- **Voisin « tout chauffé »** : 21 °C dans chaque pièce, radiateurs purgés, portes et rideaux ouverts, aération brève. Il lance une lessive tous les 3 jours, à 40 °C avec sèche-linge.

## v0.3 : électricité, eau chaude, cuisine, été, budget
Chaque valeur est commentée avec sa source dans `js/data.js`.

### Options tarifaires (EDF Tarif Bleu 6 kVA, grille du 1er août 2026, TTC)
| Option | Abonnement | Prix du kWh |
|---|---|---|
| Base | 15,86 €/mois | 0,2001 € |
| Heures creuses (22 h-6 h) | 15,86 €/mois | HP 0,2142 € · HC 0,1589 € |
| Tempo | 15,80 €/mois | Bleu HC 0,1356 / HP 0,1654 · Blanc HC 0,1536 / HP 0,1921 · Rouge HC 0,1615 / HP 0,7295 |

Changer d'option est gratuit, mais l'effet arrive à la relève suivante : le jeu compte 14 jours et 20 minutes de démarches. Le jeu limite les jours rouges Tempo à 10, uniquement en semaine en hiver ; le réel en compte 22 par an.

### Électricité domestique
| Poste | Valeur |
|---|---|
| Veilles (box TV, chargeurs, micro-ondes…) | 45 W en continu, 12 W avec une multiprise coupée |
| Éclairage du soir | 150 W en halogènes et ampoules anciennes, 25 W en LED |
| Frigo-congélateur ancien | 0,85 kWh/jour. Plus avec le givre, un réglage trop froid ou l'été |
| Ordinateur (télétravail) | 60 W |

### Eau chaude
| Poste | Valeur |
|---|---|
| Ballon électrique | 200 L, 2 400 W, pertes ~1,6 kWh/jour à 65 °C (UA 1,5 W/K) |
| Jaquette isolante | −35 % de pertes |
| Seuil légionelles | 55 °C |
| Pommeau ancien / économe | 12 / 7 l/min |
| Couper l'eau au savonnage | −30 % |
| Douche au seau | 12 L à 38 °C |
| Eau froide récupérée en début de douche | 4 L |
| Eau froide en hiver / printemps / été | 10 / 13 / 18 °C |
| Vaisselle à l'eau courante / à la bassine | 30 / 8 L chauds |
| Lave-vaisselle normal / plein en éco | 1,3 kWh et 14 L / 0,45 kWh et 5 L par jour |

### Nourriture (une personne, grande surface 2026)
| Régime | €/jour | Cuisson kWh/jour | Temps |
|---|---|---|---|
| Livraisons et plats préparés | 15,50 | 0,3 | 6 min |
| Courses classiques | 8,50 | 1,0 | 30 min |
| Cuisine maison | 6,00 | 1,5 | 1 h |
| Batch et restes | 4,90 | 1,0 | 30 min |
| Pâtes et riz | 2,40 | 0,8 | 18 min |

- Gaspillage de base : 18 % (ADEME : ~20 % des aliments achetés finissent jetés).
- Pain : baguette 1,10 €/jour, ou pain maison 0,35 € et 0,5 kWh.

### Équipements v0.3 (prix neuf, prix d'occasion et durée de vie)
| Article | Neuf | Occasion | Durée de vie (ans) |
|---|---|---|---|
| Pommeau économe | 18 € | | 10 |
| Mousseurs ×2 | 8 € | | 10 |
| Jaquette de ballon | 29 € | | 10 |
| Seau et broc | 6 € | | 10 |
| Boîtes en verre | 25 € | | 10 |
| Autocuiseur 6 L | 69 € | 30 € | 15 |
| Marmite norvégienne (maison) | 12 € | | 5 |
| Lentille de Fresnel A3 | 39 € | | 10 |
| Lunettes teintées | 12 € | | 10 |
| Four solaire | 129 € | 60 € | 10 |
| Séchoir solaire (maison) | 20 € | | 5 |
| Pierres de masse thermique | 15 € | | 20 |
| Multiprise à interrupteur | 12 € | | 10 |
| LED ×6 | 24 € | | 15 |
| Ventilateur sur pied (45 W) | 35 € | 15 € | 8 |
| Climatiseur mobile (1 000 W électriques) | 349 € | 170 € | 8 |
| Moustiquaires | 18 € | | 5 |
| Corde à linge | 9 € | | 10 |
| Herbes aromatiques | 9 € | | 2 |
| Composteur 300 L | 25 € | | 10 |
| Potager | 28 € | | 1 |
| Récupérateur d'eau de pluie 300 L | 69 € | | 15 |

### Budget
| Poste | Prix |
|---|---|
| Streaming vidéo | 13,49 €/mois |
| Musique en ligne | 11,99 €/mois |
| Salle de sport | 29,99 €/mois |
| Stockage en ligne (caché) | 2,99 €/mois |
| Assurance mobile (cachée) | 9,99 €/mois |
| Appli de méditation (cachée) | 7,99 €/mois |
| Forfait mobile | 24,99 €/mois, 9,99 € renégocié |
| Médiathèque | 20 €/an |

- Reventes au grenier : vélo d'appartement 60 €, console 110 €, livres 25 €, robot pâtissier 90 €.
- Budget plaisirs (0, 10, 20 ou 35 €/semaine) : bien-être de −1,6, +0,4, +1,0 ou +1,4 par jour.

### Voisin de référence en v0.3
- Chauffage à 21 °C. En été, clim à 25 °C.
- Ballon à 65 °C, douche de 10 minutes avec un vieux pommeau, vaisselle à l'eau courante.
- Courses classiques, 20 €/semaine de plaisirs, tous ses abonnements.
- Lessive à 40 °C avec sèche-linge, tous les 3 jours.
