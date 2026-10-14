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
| Facture de gaz du voisin à 21 °C | ~360 € sur 8 semaines | ~2 500 kWh de gaz, cohérent avec ~8 000-9 000 kWh/an pour ce logement |
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
