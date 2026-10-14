# Cheminée solaire, puits canadien et leur combinaison : recherche et modèle de jeu

*Recherche du 14/10/2026 pour Économie Game. Les chiffres viennent des sources en bas de page. Les valeurs « jeu » sont des simplifications qui gardent les bons ordres de grandeur.*

## 1. Physique de l'humidité en termes simples
- L'air contient une quantité d'eau **absolue** (g/m³). L'air chaud peut en contenir beaucoup plus : environ 4,8 g/m³ à 0 °C, 9,4 à 10 °C, 17,3 à 20 °C et 30 à 30 °C.
- **L'humidité relative (HR)** est la quantité d'eau présente divisée par le maximum possible à cette température. Si on chauffe un air sans y ajouter d'eau, son HR baisse. Si on le refroidit, son HR monte.
- **Le point de rosée** est la température à laquelle l'air atteint 100 % d'HR. En dessous, l'eau condense sur les surfaces froides : vitres, ponts thermiques ou tube enterré.
- **En hiver, renouveler l'air assèche la maison.** Un air extérieur à 5 °C et 90 % d'HR contient environ 6 g/m³. L'air intérieur à 20 °C et 60 % en contient environ 10,4 g/m³. Chaque m³ échangé emporte donc environ 4 g d'eau. Une famille produit 6 à 12 kg de vapeur par jour (respiration, douches, cuisine, linge).
- **En été, l'air chaud et humide condense dans le tube froid.** Un air à 30 °C et 50 % d'HR contient environ 15 g/m³, avec un point de rosée vers 18,5 °C. Dans un tube à 15 °C, il condense et ressort à 15 °C, saturé, avec environ 12,8 g/m³. L'eau de condensation reste dans le tube : c'est un léger déshumidificateur gratuit. Une fois l'air réchauffé à 24 °C, son HR est d'environ 59 %.
- **Le piège :** si l'air sort du tube près de son point de rosée sans avoir condensé, ou si la maison est fraîche (inertie), l'HR intérieure peut dépasser 70 à 80 %. On sent alors de la moiteur et des moisissures peuvent apparaître. C'est le cas les jours lourds et orageux, avec un point de rosée supérieur à 20 °C. Il faut alors réduire le débit, sinon la maison se charge d'humidité. Une étude de terrain sur un système couplé mesure 50 à 70 % d'HR intérieure en été [C1].

## 2. Cheminée solaire
### Principe
Un conduit vertical a une face vitrée orientée au sud et un absorbeur sombre derrière. Le soleil chauffe l'air du conduit, qui devient plus léger et monte : c'est le **tirage thermique**, ou effet cheminée. L'air sort en haut et aspire l'air de la maison par le bas. L'air de remplacement entre par des entrées d'air, ou par un puits canadien.

### Ordres de grandeur mesurés
| Source | Dimensions | Résultat |
|---|---|---|
| Arce et al. 2009, cheminée pleine échelle en Espagne [S1] | Grande échelle | 50 à 374 m³/h dans la journée (moyenne de 177 m³/h sur 24 h). Hausse de température maximale de 7 °C à 604 W/m². Coefficient de décharge Cd = 0,52 |
| Mathur et al. 2006 [S2] | Cheminée de 1 m, lame d'air de 0,3 m | 55 à 150 m³/h entre 300 et 700 W/m², soit 5,6 renouvellements par heure (vol/h) dans une pièce de 27 m³ |
| Chen et al. 2003 [S3] | 1,5 m de haut | Une inclinaison d'environ 45° donne 45 % de débit en plus qu'une cheminée verticale |
| Étude de 2015 [S4] | Cheminées larges | Débit maximal pour un rapport lame d'air / hauteur proche de 0,5. Les formules classiques surestiment le débit |

**Paramètres de conception**
- **Hauteur :** 2 à 6 m. Le débit augmente comme la racine carrée de la hauteur multipliée par l'écart de température.
- **Lame d'air :** 0,1 à 0,3 m en habitat.
- **Absorbeur :** métal noir, ou masse (béton, brique) pour continuer à tirer le soir.
- **Vitrage :** simple ou double.
- **Ouvertures :** la section d'entrée doit être au moins égale à celle du conduit, avec un clapet en haut.

### Formule simplifiée
`Q (m³/s) = Cd · A · √(2 g H ΔT / T)`, avec Cd ≈ 0,5, A la section en m², H la hauteur en m, ΔT l'écart en K et T ≈ 300 K.
Exemple : A = 0,1 m², H = 3 m et ΔT = 7 K donnent environ 0,061 m³/s, soit **environ 220 m³/h**. C'est cohérent avec les mesures.

### Comportement selon le moment
- **Ciel couvert :** débit de 30 à 50 % du débit au soleil.
- **Nuit :** la cheminée tire encore si l'absorbeur a de la masse. Une étude mesure environ 60 m³/h la nuit, entretenus par la chaleur restituée par la masse [C3].
- **Été :** on fait une **purge nocturne**. La cheminée évacue l'air chaud du haut de la maison et fait entrer l'air frais de la nuit ou du puits. Il faut un clapet de sortie ouvert vers l'extérieur.
- **Hiver :** on utilise le **mode Trombe ou capteur à air**. La sortie haute est fermée et l'air chauffé retourne dans la maison par une bouche haute. La nuit, on ferme les clapets bas, sinon la circulation s'inverse et la cheminée refroidit la maison.

### Coûts en France (2026, estimations)
- **Fait maison :** environ 300 à 1 200 €. Le prix couvre un polycarbonate alvéolaire ou un vitrage (30 à 60 €/m²), de la tôle peinte en noir, l'ossature, des clapets et une grille anti-insectes. Il faut compter 2 à 4 week-ends de travail.
- **Professionnel :** capteur solaire à air de façade, par exemple SolarVenti, Grammer ou TWINSOLAR en air chaud seul. Le prix va d'environ 1 000 à 3 000 € posé pour un petit modèle autonome avec ventilateur photovoltaïque, et de 3 000 à 8 000 € ou plus pour une cheminée solaire construite dans le bâti.
- Ces fourchettes ne viennent pas d'un barème officiel. Elles ont été reconstituées à partir de prix de matériel et sont à présenter comme une fourchette dans le jeu.

### Risques
- Surchauffe en été si la sortie est fermée.
- Inversion de la circulation la nuit ou par vent défavorable (contre-tirage).
- Condensation sur le vitrage en hiver.
- Nuisances : sifflement du vent, insectes et nids d'oiseaux (grille obligatoire), infiltrations d'eau.
- Entretien : nettoyer le vitrage une fois par an, vérifier les clapets et les joints.

## 3. Puits canadien (ou provençal)
### Principe
L'air neuf passe dans un tube enterré à 1,5 à 2 m de profondeur, là où la température du sol est stable. Il ressort préchauffé en hiver et rafraîchi en été.

### Température du sol
- Elle est d'environ **10 à 15 °C en moyenne** à 2 m [P2].
- Sa variation saisonnière est réduite et décalée. Une source donne environ 4 °C en hiver et 17 °C en été à 2 m [P5], avec un retard de 1 à 2 mois sur l'air extérieur.

### Dimensionnement
- **Diamètre :** 160 à 250 mm. Pour augmenter le débit, plusieurs petits tubes valent mieux qu'un seul gros [P3].
- **Longueur :** **au moins 30 m**. Au-delà de 50 m, le gain devient faible [P3].
- **Vitesse de l'air :** 1 à 2 m/s.
- **Temps de contact :** 15 à 20 s [P2].
- **Débit :** 0,5 à 0,7 vol/h en hiver, 1 à 2 vol/h en été [P3].

### Températures à la sortie
- Repère : environ **6 °C en hiver** et **13 °C en été** [P5].
- Une simulation de système couplé donne une sortie de 12,8 à 26,5 °C sur l'année, en climat chaud [C3].

### Énergie économisée
Calcul pour 100 m³/h et un préchauffage moyen de +6 K : 0,34 Wh/(m³·K) × 100 × 6 ≈ 200 W.
- Sur environ 200 jours de chauffe, en ne faisant passer l'air par le puits que quand c'est utile (by-pass), cela donne **environ 600 à 1 000 kWh par an**.
- Au gaz, à 0,1456 €/kWh avec un rendement de 0,9, l'économie est d'environ **100 à 160 € par an**.
- L'infoénergie 38 précise que ce gain est « très difficile à estimer » [P3].
- En été, le confort obtenu équivaut à une clim, avec environ 10 fois moins d'énergie [P3].

### Variantes
- **À air**, avec le tube parcouru directement par l'air.
- **Hydraulique (eau glycolée)** : un tube d'eau enterré alimente une batterie dans la gaine de ventilation. Il n'y a pas de condensation dans le sol ni de risque de radon. Le prix va d'environ 1 900 à 4 500 € [P1].

### Avec une VMC double flux
- L'échangeur de la VMC récupère déjà 80 à 90 % de la chaleur de l'air extrait, donc le gain du puits en hiver devient faible.
- Le puits évite surtout le givrage de l'échangeur.
- Il faut un **by-pass d'été** : un « kit été » ou un clapet qui contourne l'échangeur [P4].
- Pour choisir entre l'air du puits et l'air direct : on prend l'air du puits sous 14 °C et au-dessus de 20 °C, et l'air extérieur entre les deux [P4].

### Hygiène et sécurité
- **Pente de 1 à 3 %**, en général 2 %, vers un regard avec siphon ou pompe de relevage. L'eau ne doit jamais stagner [P6][P7].
- **Radon :** les joints doivent être étanches (norme NF EN 1277). En zone à risque, on met le circuit en surpression ou on choisit la variante hydraulique [P7][P8].
- **Entretien :** grillage et filtre à l'entrée, filtres changés 1 à 2 fois par an [P3], inspection et nettoyage tous les 5 ans [P6].
- **Microbes :** on n'a pas trouvé de légionelle, et les contrôles de bactéries pathogènes ont été négatifs [P6]. Une thèse note un risque microbien faible (moisissures allergisantes) si les condensats stagnent [P9].

### Coûts et rentabilité
- **Posé par un professionnel :** **4 000 à 10 000 €**, environ 5 800 € en moyenne [P1][P2]. En neuf, la tranchée coûte moins cher.
- **Tube seul :** environ 20 à 35 €/m [P1].
- **Borne de prise d'air :** 500 à 2 900 € [P1].
- **Fait maison :** environ 1 500 à 3 000 €, avec 45 m de tube alimentaire antibactérien (900 à 1 500 €), une mini-pelle louée environ 250 €/jour pendant 2 à 3 jours, un regard et une borne simple. Il faut compter environ 4 à 6 jours de travail. C'est faisable surtout pendant une construction ou si un terrassement est déjà prévu.
- **Retour sur investissement en chauffage seul :** environ 30 à 60 ans pour une pose pro, 10 à 20 ans en fait maison. Il devient intéressant si le puits **remplace une clim**, avec environ 150 à 300 € d'électricité évités et 2 000 à 4 000 € d'achat évités.

## 4. La combinaison : cheminée solaire et puits canadien, sans ventilateur
Le système fonctionne ainsi : le tube enterré fait entrer l'air, la maison le reçoit, puis la cheminée solaire le rejette. La cheminée sert de « ventilateur gratuit ».

**Mesures publiées**
| Étude | Résultats |
|---|---|
| Univ. Nebraska, 2007-09, 43 jours en été [C1] | Débit naturel de **0 à 500 m³/h**, avec un pic à midi. Intérieur à **21-24 °C** et **50-70 % d'HR** |
| Long et al. 2022 [C2] | **56 à 292 m³/h en été**, **91 à 389 m³/h en hiver**, en continu, même par temps couvert. Efficacité thermique de 0,61 en été et 0,86 en hiver |
| Wei et al., simulation [C3] | Environ 260 m³/h le jour et 50 m³/h la nuit en été. Température intérieure de **−4,4 °C en été et +6,4 °C en hiver**. Le diamètre et la longueur du tube comptent plus que la hauteur de la cheminée |
| Mi-saison, 2022 [C4] | Avec le puits : 209 m³/h le jour et 139 m³/h la nuit, pour un intérieur de 19,7 à 22,7 °C. Sans le puits, fenêtre ouverte : 286 m³/h le jour et 87 m³/h la nuit |

**Saisons**
- **En été**, la cheminée tire l'air chaud vers le haut et dehors, et l'air du tube à environ 15-18 °C entre en bas. C'est une clim douce, qui fonctionne mieux à l'ombre et avec des volets fermés.
- **La nuit en été**, la masse de la cheminée continue de tirer.
- **En hiver**, l'air passe d'abord par le tube, où il est préchauffé, puis la cheminée fonctionne en mode Trombe : elle chauffe et réinjecte l'air, ou bien elle est fermée.
- **La nuit en hiver**, le sol, plus chaud que l'air extérieur, fait lui-même un léger tirage [C2].

**Humidité**
- En hiver, le renouvellement d'air assèche la maison.
- En été, le système déshumidifie les jours secs, et peut **humidifier** les jours lourds, avec un point de rosée supérieur à 20 °C.

## 5. Modèle proposé pour le jeu
### Objets à acheter
| Objet | Prix | Temps de pose | Entretien | Effet |
|---|---|---|---|---|
| Cheminée solaire faite maison | 450 € | 3 jours de temps libre | Nettoyage du vitrage chaque année : 1 h et 0 € | Q selon la formule ci-dessous, avec un clapet été/hiver |
| Cheminée solaire pro | 2 500 € | 1 jour | 30 € par an | Débit 1,2 fois plus élevé, clapets automatiques |
| Puits canadien fait maison (45 m, Ø160) | 2 200 € | 5 jours | Filtre 2 fois par an à 15 € | Risque de pente ratée de 15 % : condensats stagnants et moisissures |
| Puits canadien pro | 5 800 € | 2 jours | Filtre 2 fois par an à 15 €, inspection tous les 5 ans à 150 € | Pente garantie |
| Puits hydraulique | 3 500 € | 2 jours | 20 € par an | Ni radon ni condensation dans le sol, efficacité de 0,8 fois celle du puits à air |
| Kit étanchéité radon | 300 € | — | — | Obligatoire dans un scénario en zone radon, sinon pénalité de santé |

### Formules (pas horaire)
- **Température du sol :** `T_sol(jour) = 12 + 5·cos(2π(jour − 220)/365)`. Le pic arrive vers août et le creux vers février, avec un retard sur l'air extérieur.
- **Tirage de la cheminée :** `ΔT_ch = k_sol · irradiance/600 · 7` (k = 1 au soleil, 0,35 par temps couvert), plus `ΔT_masse` la nuit (2 K décroissant avec une demi-vie de 4 h). Le débit vaut `Q_ch = 0,5 · A · √(2·9,81·H·ΔT_ch/300) · 3600` (m³/h), avec A = 0,1 et H = 3 par défaut.
- **Débit limité par le tube :** `Q = min(Q_ch, Q_tube_max)`, avec Q_tube_max = 250 m³/h pour Ø160 et 400 m³/h pour Ø200.
- **Température à la sortie du tube :** `T_out = T_sol + (T_ext − T_sol)·exp(−L/L0)`, avec `L0 = 12 m · (Q/150)^0,8` : à plus fort débit, le contact dure moins longtemps.
- **Puissance apportée :** `P (W) = 0,34 · Q · (T_out − T_int)`. Elle est positive quand elle chauffe et négative quand elle rafraîchit. Elle s'ajoute au bilan de la pièce.
- **Humidité :** suivre l'humidité absolue `w` (g/m³) de chaque pièce.
  - L'air sort du tube avec `w_out = min(w_ext, w_sat(T_out))`.
  - L'eau condensée par heure vaut `(w_ext − w_out)·Q`. Elle ajoute de la saleté au tube : si le regard n'est pas entretenu, la jauge « hygiène de l'air » baisse.
  - Dans la pièce, `w` tend vers `w_air_entrant` avec une constante de temps `V/Q`, plus la production des occupants (environ 400 g/h pour une famille).
  - On calcule `HR = w / w_sat(T_int)`, avec `w_sat(T) ≈ 4,85·exp(0,0645·T)`.
  - Si l'HR dépasse 70 % pendant plus de 48 h, des moisissures apparaissent et la santé et le confort baissent.
  - Si l'HR est sous 30 %, l'air est trop sec et le confort baisse légèrement.
- **Contre-tirage :** la nuit en hiver, si le clapet bas est laissé ouvert, `Q` s'inverse et la pièce perd `0,34·Q·(T_int − T_ext)`. C'est une erreur pédagogique.

### Rentabilité (à brancher sur le système de ROI existant)
- On mesure les kWh de chauffage économisés, plus les kWh de clim ou de ventilateur évités en été.
- On ajoute dans le jeu l'achat d'une clim évité (environ 1 500 à 3 000 €).
- Valeurs attendues :
  - Puits pro seul en chauffage : **plus de 35 ans**.
  - Puits fait maison associé à une cheminée qui remplace une clim : **environ 8 à 12 ans**.
  - Cheminée faite maison seule (purge d'été et mode Trombe l'hiver) : **environ 4 à 8 ans**.

### Nouveaux principes
1. **Le tirage thermique.** L'air chaud monte : une colonne d'air plus chaude crée une aspiration, et le débit croît avec √(hauteur × écart de température). *Pourquoi ça marche :* 3 m de hauteur et 7 °C d'écart donnent environ 200 m³/h sans ventilateur. Un extracteur de 30 W qui tourne 2 000 h par an coûte environ 12 €. *Le piège :* la nuit, si le haut est plus froid, le sens s'inverse. *Domaines :* ventilation, séchage du linge, four solaire.
2. **L'inertie du sol.** À 2 m de profondeur, il fait environ 12 °C toute l'année. Le sol est un énorme réservoir gratuit, chaud en hiver et frais en été. *Le piège :* il est déphasé et s'épuise si on aspire trop fort et trop longtemps : il faut le laisser se régénérer la nuit. *Domaines :* cave à légumes, frigo du désert, stockage.
3. **Le temps de contact.** Un échange thermique demande du temps : environ 15 à 20 s dans le tube. Doubler le débit ne double pas les gains. *Le piège :* mieux vaut 2 petits tubes qu'un gros. *Domaines :* bouilloire, échangeur, cuisson à la marmite norvégienne.
4. **Le point de rosée.** On refroidit un air humide, il dépose son eau. *Pourquoi ça marche :* c'est pour ça que l'aération de 5 minutes en hiver assèche la maison. *Le piège :* les jours lourds, le puits et les pièces fraîches font monter l'humidité relative et apparaître les moisissures. *Domaines :* buée, séchage du linge, salle de bain.
5. **Le by-pass intelligent.** On utilise une source seulement quand elle est meilleure que l'air extérieur : le puits sous 14 °C et au-dessus de 20 °C, l'air direct entre les deux. *Domaines :* tarifs Tempo, volets, solaire.
6. **Le clapet qui coupe.** Un système passif doit pouvoir se fermer, sinon il travaille contre vous : contre-tirage, surchauffe. *Domaines :* rideaux, volets, trappes de cheminée.
7. **L'étanchéité invisible.** Ce qui entre par un tube doit être propre : radon, racines, eau. Un joint mal fait peut coûter plus en santé que le système ne rapporte. *Domaines :* calfeutrage, plomberie.

### Combos
- **« Clim de la Terre »** (cheminée et puits, en été) : rafraîchissement de −3 à −5 °C sans électricité. Bonus de bien-être pendant la canicule.
- **« Respiration d'hiver »** (puits, cheminée en mode Trombe et clapets fermés la nuit) : air neuf préchauffé à environ 18 °C. L'humidité baisse et le chauffage diminue d'environ 10 à 15 %.
- **« Purge nocturne »** (cheminée à masse, volets fermés le jour, fenêtres basses ouvertes la nuit) : −2 à −3 °C le lendemain.
- **« Séchoir à tirage »** (le linge dans le flux de la cheminée) : séchage 2 fois plus rapide, sans sèche-linge.
- **« Cave naturelle »** (sortie du puits dans le cellier) : les légumes se conservent plus longtemps, ce qui réduit le gaspillage.
- **Anti-combo « Serre humide »** : puits utilisé les jours où le point de rosée dépasse 20 °C, sans réduire le débit. HR à 80 % et moisissures.

## Sources
- [S1] Arce et al., Renewable Energy 34 (2009). https://www.sciencedirect.com/science/article/abs/pii/S0960148109001931
- [S2] Mathur et al., Solar chimney room ventilation. https://www.academia.edu/5807751/Experimental_investigations_on_solar_chimney_for_room_ventilation
- [S3] Chen et al., Building & Environment (2003). https://www.sciencedirect.com/science/article/abs/pii/S036013230300057X
- [S4] Étude de 2015 sur les cheminées à grand rapport lame d'air / hauteur. https://www.sciencedirect.com/science/article/abs/pii/S036013231500075X
- [C1] Univ. Nebraska, earth tube et cheminée solaire. https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1088&context=archengfacpub
- [C2] Long et al., Renewable Energy 193 (2022). https://ideas.repec.org/a/eee/renene/v193y2022icp1001-1018.html
- [C3] Wei et al., UCL. https://discovery.ucl.ac.uk/id/eprint/10151203/1/Wei_Revised%20Manuscript%20%28clean%20version%29.pdf
- [C4] Énergie (2022), mi-saison. https://www.sciencedirect.com/science/article/abs/pii/S0360544222007216
- [P1] Prix-pose, 2026. https://www.prix-pose.com/puits-canadien
- [P2] Les-energies-renouvelables.eu. https://www.les-energies-renouvelables.eu/conseils/puits-canadien/realiser-son-projet-de-puits-canadien/quelques-conseils-pour-implanter-un-puits-canadien/
- [P3] Infoénergie 38. https://docs.infoenergie38.org/puits_canadien.pdf
- [P4] Fiabitat. https://www.fiabitat.com/dimensionner-un-puits-canadien/
- [P5] AEU, puits provençal. https://aeu.fr/fr/web_puiprov/puiprov.html
- [P6] Eole, principes du puits. https://eole-fr.com/wp-content/uploads/2022/09/principes-puits.pdf
- [P7] CETIAT, guide pratique des puits canadiens et provençaux. https://www.cetiat.fr/
- [P8] CRIIRAD, radon. https://www.criirad.org/batiments-basse-consommation-renovation-energetique-attention-au-radon/
- [P9] Thèse sur les puits canadiens et la qualité de l'air (microbiologie).
