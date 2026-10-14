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

## v0.4 : transport, rentabilité, stockage solaire, ventilation passive

### Transport
| Poste | Valeur | Source |
|---|---|---|
| Trajet domicile-travail | 9 km aller | distance médiane, INSEE |
| Courses / loisirs | 4 km A-R / 12 km A-R (2 sorties/sem.) | hypothèse |
| SP95-E10 | 2,17 €/L | moyenne nationale 12 oct. 2026, flux prix-carburants (data.economie.gouv.fr) |
| Gazole (repère) | ~2,36 €/L | même source |
| Consommation citadine | 6,5 L/100 km ; −10 % en écoconduite ; +2 %/mois sans contrôle de pression | ADEME (écoconduite 10-15 %) |
| Usure voiture | 0,06 €/km (pneus, vidange, freins) | hypothèse ; barème fiscal 2026 5 CV : 0,636 €/km tout compris |
| Assurance | 54 €/mois | moyenne 2026 (~650 €/an) |
| Parking | 3 €/jour de bureau | hypothèse centre-ville |
| Revente voiture | 3 800 € (citadine 12 ans) | cote argus ; capital libéré, non compté comme économie |
| Ticket / abonnement TC | 2,10 € / 75,90 €/mois | TCL Lyon, mai 2026 |
| Prise en charge employeur | 50 % de l'abonnement | art. L3261-2 Code du travail |
| Covoiturage | 2 €/trajet | BlaBlaCar Daily (souvent 0-2 € avec aides locales) |
| Repas acheté / boissons | 11,50 € / 2,20 € (gourde : 0,40 €) | prix moyens 2026 |
| Vélo de ville | 420 € neuf, 160 € d'occasion | |
| VAE | 1 790 € neuf, 900 € d'occasion ; 1 kWh/100 km | |
| Casque + éclairage + gilet / tenue de pluie / outils / gourde | 55 € / 45 € / 30 € / 22 € | |
| Pièces vélo | pneus 28 € (3 000 km), chaîne 18 € (2 500 km), freins 9 € (1 200 km) ; atelier 70 € | prix 2026 |
| Accident léger à vélo | 0,00012 par km (×0,4 avec équipement) | ordre de grandeur ONISR |

Le voisin de référence en v0.4 fait tout en voiture et va au bureau 3 jours par semaine. Il achète son repas et ses boissons au travail. Il fait ses courses 4 fois par semaine, avec +6 % d'achats d'impulsion.

### Rentabilité (projection sur 5 ans)
- Coût d'opportunité : Livret A à 1,70 % depuis le 1er août 2026 (arrêté du 28 juillet 2026).
- Inflation supposée : énergie +3 %/an, eau +3 %/an, carburant +2 %/an, alimentation +2 %/an.
- Jours par saison pour l'annualisation : hiver 151 (nov.-mars), printemps et automne 122, été 92.
- Pour chaque équipement, `ROI_ITEMS` (js/data.js) donne l'entretien en €/an, la perte d'efficacité, la part de revente et le poste d'inflation. Exemples : VAE 60 €/an et −4 %/an pour la batterie ; clim 10 €/an ; puits pro 60 €/an ; puits fait maison 30 €/an.

### Stockage solaire
| Objet | Prix | Remarque |
|---|---|---|
| Routeur solaire | 299 € (posé 250-500 €) | Ekosia SmartSun ; modèles artisanaux 139-159 € |
| Batterie 2 kWh | 1 190 € (~500-650 €/kWh), rendement 88 % | kit EcoFlow 2 090 € HT comme repère |
| Thermos 1 L | 20 € | τ ≈ 30 h |
| Bidon 10 L + caisse isolée + thermoplongeur 300 W | 40 € | τ ≈ 20 h |
| Eau chauffée à 90 °C ; τ sans isolant 2 h, torchon 3,5 h, housse 6 h | | refroidissement de Newton |

### Ventilation passive (docs/cheminee-solaire-puits-canadien.md) : chiffres réalistes (v0.5)
En v0.5, les chiffres ont été recalés sur des devis et des prix de matériaux réels. Le but n'est plus d'atteindre les retours visés par le document de conception. Le jeu affiche la fourchette de prix de chaque objet.

| Objet | Prix du jeu | Fourchette | Chantier | Entretien |
|---|---|---|---|---|
| Cheminée solaire faite maison | 450 € | 300-1 200 € | 3 jours | vitrage 1 h/an |
| Capteur solaire à air posé (pro) | 2 500 € | 1 000-3 000 € | 1 jour | 30 €/an |
| Puits canadien fait maison 45 m Ø160 | **2 900 €** | **2 000-3 800 €** (détail ci-dessous) | 5 jours, 15 % de pente ratée | filtres 2 × 15 €/an |
| Puits canadien pro | 5 800 € | **4 000-12 000 €** (monbatiment.fr 2026 : 5 000-12 000 € TTC posé) | 2 jours | filtres 30 €/an + inspection 150 €/5 ans |
| Puits hydraulique | 3 500 € | 1 900-4 500 € | 2 jours | 20 €/an |

Détail du puits fait maison (`PUITS_DIY` dans js/data.js) :

| Poste | Bas | Haut | Source |
|---|---|---|---|
| Gaine PEHD alimentaire Ø160-200, 45 m | 675 € | 900 € | 15-20 €/m (négoces 2026) |
| Regard étanche de condensats + siphon ou pompe | 210 € | 880 € | regard simple ~150 € ; Helios 740 € + 142 € |
| Borne de prise d'air inox + filtre G3 | 150 € | 500 € | Fiabishop, Helios |
| Extracteur ~15 W + gaines intérieures | 80 € | 150 € | |
| Mini-pelle 1-2 t, 2 jours + livraison | 790 € | 940 € | 295-329 € HT/jour (loueurs 2026) |
| Sable 0/4 (~6 t) et joints IP68 | 150 € | 300 € | |
| **Total** | **~2 050 €** | **~3 670 €** | recoupé avec le kit Fiabishop 2 × 35 m + regard : 2 010-2 480 € hors terrassement |

Hypothèses du modèle thermique :
- volumes réels de la maison : salon 50 m³, chambre 35 m³, cuisine 27 m³, soit 112 m³ ;
- renouvellement hygiénique remplacé : 55 m³/h (~0,5 vol/h) ;
- extracteur ~15 W pour 55 m³/h (Fiabitat : ~30 W pour 150 m²) ;
- capteur fait maison : 3 m², rendement 0,5 en mode Trombe ;
- annualisation des objets de chauffage sur 151 jours de chauffe en hiver et 62 au printemps (et non sur toute la saison) ;
- le gain hivernal du puits reste bien en dessous du plafond de Fiabitat (≤ 1 500 kWh/an pour 150 m²).

**Clim évitée, méthode réaliste.** On compte une **clim mobile**, pas un split à 1 500 €. Le coût annuel évité est l'amortissement plus l'électricité :
- prix 250-800 € (central 349 €) ÷ 8 ans de vie ;
- plus 120-400 kWh par été (central 200 kWh ; calculateurenligne.fr donne 396 kWh pour 90 jours × 4 h) × 0,2001 €/kWh ;
- soit **84 €/an** (fourchette 55-180 €/an).

Ce montant n'est compté que si trois conditions sont réunies : la partie a connu au moins un jour de canicule, le combo « clim de la Terre » est trouvé (le salon est vraiment rafraîchi, ~2 °C l'après-midi), et le joueur ne possède pas déjà de clim. Sans canicule, personne n'aurait acheté de clim, donc rien n'est évité.

**Retours finaux (`test/passif-test.mjs`, graines 2026 / 7 / 1789) :**

| Configuration | Gain mesuré | Retour (prix du jeu) | Fourchette (prix et clim mini-maxi) |
|---|---|---|---|
| Cheminée solaire faite maison seule | 74-87 €/an | **5,2-6,0 ans** | 3,4-16 ans (300-1 200 €) |
| Puits canadien pro seul | ~57 €/an, moins 60 €/an d'entretien | **jamais** | jamais (même à 4 000 €) |
| Puits fait maison + cheminée, clim mobile évitée | 215-228 €/an (dont 84 € de clim) | **16,9-18,1 ans** | ~7 ans (2 300 €, clim chère) à ~27 ans (5 000 €, clim bon marché) |
| Puits fait maison + cheminée, sans clim à éviter | 131-144 €/an | 23-26 ans | |

Ces retours sont plus longs que ceux du document de conception (cible 8-12 ans pour le combo, avant recalage). La raison est le recalage : vrais coûts du fait-maison (mini-pelle, regard), clim mobile plutôt que split, et seulement 62 jours de chauffe au printemps. Le puits canadien reste surtout un objet de confort d'été. Ce n'est pas un placement.

## v0.5 : banque et investissement (taux d'octobre 2026)

### Épargne réglementée
| Produit | Taux | Plafond | Fiscalité | Source |
|---|---|---|---|---|
| Livret A | 1,70 % | 22 950 € | exonéré | arrêté du 28 juillet 2026 (JO 29/07/2026), valable du 1er août 2026 au 31 janvier 2027 ; maintien supposé ensuite |
| LDDS | 1,70 % | 12 000 € | exonéré | idem |
| LEP | 2,50 % | 10 000 € | exonéré | idem ; éligibilité RFR ≤ 23 028 € pour 1 part (service-public.gouv.fr, 2026) |
| PEL ouvert en 2026 | 2,00 % brut | 61 200 € | PFU 30 % dès la 1re année (12,8 + 17,2 : le PEL échappe à la hausse de CSG) | Banque de France ; ouverture 225 €, 540 €/an minimum ; clôture avant 2 ans → taux du CEL 1,25 % |

Règles simulées :
- intérêts par **quinzaines** (dépôt compté à partir du 1er ou du 16 suivant, retrait décompté depuis le début de la quinzaine en cours) ;
- capitalisation le 31 décembre ;
- retrait du PEL = clôture.

Le jeu suit un calendrier réel : 1er décembre 2026 → 26 janvier 2027, puis 6 avril → 3 mai, puis 1er juillet → 11 août 2027. Les semaines entre deux chapitres comptent aussi (intérêts, loyers de SCPI, marchés).

### Profils (choisis avant le premier placement)
| Profil | RFR (1 part) | TMI | Épargne de départ (sur le Livret A) | LEP |
|---|---|---|---|---|
| Revenus modestes | 18 000 € | 11 % | 1 500 € | oui |
| Revenus médians (défaut) | 26 000 € | 11 % | 4 000 € | non |
| Revenus confortables | 48 000 € | 30 % | 12 000 € | non |

### Assurance vie
- Fonds euros : **2,63 %** de rendement moyen en 2025 (ACPR). Le jeu retient 2,6 % pour un contrat en ligne, 2,2 % pour un contrat de banque de réseau.
- Prélèvements sociaux de 17,2 % chaque 31 décembre (l'assurance vie reste à 17,2 % malgré la LFSS 2026).
- Frais d'entrée : 0 % en ligne, 2,5 % en banque. Frais sur les UC : 0,5 %/an en ligne, 0,85 %/an en banque.
- Rachat : avant 8 ans, 12,8 % d'IR sur la part de gains ; après 8 ans, abattement de 4 600 € puis 7,5 % (projections).

### Marchés et comptes-titres
- **Fiscalité 2026 (LFSS 2026)** : la CSG sur les revenus du capital passe de 9,2 % à 10,6 %. Les prélèvements sociaux passent donc à 18,6 % et le **PFU à 31,4 %** (dividendes, plus-values, intérêts). L'assurance vie, les revenus fonciers, les livrets et le PEL n'en sont pas affectés.
- **PEA** : après 5 ans, seulement 18,6 % de prélèvements sociaux. Avant 5 ans, tout retrait clôture le plan. Plafond de versements 150 000 €. Courtage plafonné à 0,5 % en ligne (décret 2020-95).
- **Compte-titres** : PFU 31,4 %. Courtage ~0,2 %, minimum 1,99 € (courtiers en ligne 2026).
- **ETF MSCI World** : frais 0,2 %/an. Modèle en deux régimes de volatilité (11 % au calme, 25 % en période agitée) avec de rares sauts de krach. Calage vérifié sur 2 000 années simulées :
  - moyenne arithmétique 7,8 %/an, géométrique 6,6 % ;
  - volatilité 15,7 % ;
  - pire année −36 % ;
  - baisse maximale médiane en cours d'année −12 % (historique : ~−14 %).
- **ETF CAC 40** (dividendes réinvestis) : volatilité un peu plus forte, corrélation 0,85 avec le monde.
- **Obligations** : ~4 %/an, volatilité ~5 %. Référence : OAT 10 ans ~4,8 % (TEC 10 de la Banque de France, 9 octobre 2026).
- **SCPI** :
  - taux de distribution **4,91 %** (ASPIM, moyenne 2025) ;
  - frais de souscription ~10 % (8-12 %), inclus dans le prix de part : revente au prix de retrait −10 % ;
  - délai de jouissance 4 mois (3-6) ;
  - retrait exécuté en ~60 jours, non garanti ;
  - loyers imposés en micro-foncier : abattement de 30 %, puis TMI + 17,2 % ;
  - aléa de revalorisation, dont un choc de −10 % environ une année sur huit (baisses de 2023-2024).
- **Inflation** : 3,0 % sur un an en septembre 2026 (Insee, provisoire) pour le rendement réel affiché. Hypothèse de 2 % pour les projections longues.
- **Découvert** :
  - autorisé jusqu'à 500 € à 16 % ;
  - au-delà, 20 % ;
  - commission d'intervention de 8 € par jour d'incident, plafonnée à 80 €/mois (art. R312-4-1 CMF).

### Comment les placements entrent dans le score
- Score financier = valeur de liquidation du jour (frais de sortie, impôts, règles PEL/SCPI/PEA appliqués) + revenus versés en cash (loyers SCPI) − apports nets. On retranche ce qu'a gagné le voisin, qui garde la même épargne sur son Livret A et y pioche quand son compte passe à découvert.
- Ce montant est ajouté aux économies (ligne « Épargne et placements »). Les agios ont leur propre ligne, « Banque ».
- Les titres restent conditionnés aux jauges de bien-être. L'écran final affiche aussi le patrimoine total, comparé à celui du voisin.

