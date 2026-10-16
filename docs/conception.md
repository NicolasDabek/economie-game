# Économie Game : document de conception (v0.1)

## 1. Analyse de la base existante

**Ce qui est déjà solide**
- Le pitch : gagner en dépensant moins, pas en dépensant plus. C'est rare et lisible.
- Les 4 compteurs (économies, confort, santé, capital investi) empêchent la solution absurde « vivre dans le noir ».
- La progression par principes transversaux (réduire, isoler, réparer, réutiliser, produire, stocker, optimiser) : c'est le vrai cœur intelligent du jeu.
- Le système vêtements (isolation, saleté, usure, lavage, usure de la machine) montre qu'un seul objet peut relier 5 domaines.
- Les idées « chaleur gratuite » (Fresnel, four solaire, marmite norvégienne, masse thermique) donnent des moments « eurêka ».

**Ce qui manque encore**
1. Un modèle de temps clair (jour, semaine, saison) et la météo, indispensable dès qu'on parle de solaire.
2. Un modèle physique unique et simple, pour que toutes les astuces s'expliquent par les mêmes règles au lieu d'être des bonus arbitraires.
3. Une ressource « temps / énergie personnelle » : aujourd'hui beaucoup d'astuces sont gratuites en argent, donc il n'y a pas d'arbitrage réel.
4. Les pièges et fausses économies (effet rebond, promos, produits pas chers mais jetables) : sans eux, le joueur ne fait qu'empiler des améliorations.
5. Les interactions entre systèmes (une cuisson réchauffe la pièce en hiver mais la surchauffe en été).
6. Une raison de rejouer : scénarios, profils de foyers, défis.
7. Un cadrage du prototype technique.

## 2. Mécaniques nouvelles proposées

### 2.1 « On n'optimise que ce qu'on mesure » : les instruments de mesure
Au départ, le joueur ne voit qu'une facture globale en fin de mois. Il débloque ou achète des instruments qui **révèlent de l'information** :
- Thermomètre par pièce, puis caméra thermique (montre les fuites de chaleur en couleur).
- Wattmètre de prise : révèle la consommation réelle d'un appareil et des veilles.
- Relevé du compteur d'eau : détecte une fuite invisible (le compteur tourne la nuit).
- Carnet de comptes : révèle les dépenses par catégorie et les abonnements oubliés.
- Hygromètre : explique pourquoi on a froid à 19 °C (humidité).
La connaissance devient une ressource : une économie n'est possible que si on a vu le problème.

### 2.2 Volonté et habitudes
Nouvelle jauge : **Volonté** (ou charge mentale). Un nouveau geste (couper l'eau sous la douche, éteindre la multiprise) coûte de la volonté chaque jour. Après N répétitions il devient une **habitude** : coût en volonté nul, effet automatique. On peut tenir un nombre limité d'habitudes en cours d'apprentissage. Cela crée une vraie question d'ordre : quelles habitudes installer en premier ?
Si la volonté tombe à zéro : rechute, achat impulsif, livraison de repas.

### 2.3 Modèle physique unique et simple
- Chaleur : `perte = coefficient_isolation × (T_intérieure − T_extérieure)` par pièce, avec une masse thermique qui lisse les variations.
- Toute source de chaleur (radiateur, cuisson, corps, frigo, soleil par la fenêtre) alimente la même pièce.
- Température ressentie = température pièce + isolation des vêtements + bonus activité − humidité − courant d'air.
- Eau chaude = énergie : chaque litre chaud a un coût en kWh, ce qui relie douche, lessive et vaisselle à l'électricité.
Avantage : les astuces émergent du modèle au lieu d'être codées une par une.

### 2.4 Météo et prévisions (aléatoire faible, information visible)
Prévisions à 3 jours affichées. Le soleil devient une ressource à planifier : jour ensoleillé, on cuit à la Fresnel, on lave et on sèche dehors, on charge la masse thermique. Jour gris, on bascule sur la marmite norvégienne et les restes. L'aléatoire existe, mais le joueur le voit venir : la réussite reste une affaire de stratégie.

### 2.5 Saisons qui inversent les stratégies
L'hiver récompense isoler et garder la chaleur. L'été inverse tout : volets fermés le jour, ventilation nocturne, la cuisson intérieure devient un problème, la Fresnel et le séchage solaire deviennent rois. Une même astuce peut être bonne ou mauvaise selon la saison.

### 2.6 Synergies et combos
Les cartes principes se combinent pour un bonus :
- Fresnel + masse thermique : chauffer des pierres le midi pour cuire ou chauffer le soir.
- Marmite norvégienne + housse de bouillotte : le même savoir-faire « isoler pour prolonger ».
- Cuisson du soir + porte de cuisine ouverte en hiver : chaleur récupérée.
- Eau de cuisson refroidie + jardin + compost : boucle fermée.
- Lessive groupée + jour ensoleillé + panneau solaire : lavage quasi gratuit.
Afficher un écran « boucles fermées » montrant les déchets d'un système devenus ressource d'un autre.

### 2.7 Pièges et fausses économies
- **Effet rebond** : après l'isolation, le joueur est tenté de chauffer plus fort. Le jeu le montre.
- **Promo** : « 3 pour 2 » sur un produit périssable, rentable seulement si consommé à temps.
- **Pas cher mais jetable** : bottes à 20 € qui durent 1 hiver contre 80 € qui durent 6 ans (coût par usage affiché après découverte).
- **Abonnement piège** : essai gratuit qui se renouvelle, résiliation qui demande du temps.
- **Crédit / paiement en 4 fois** : le gros investissement devient tentant mais coûte des intérêts.
- **Sur-optimisation** : faire 20 km pour économiser 2 € sur un produit.

### 2.8 Pannes, entretien et réparation
Chaque objet a usure, entretien et une probabilité de panne qui augmente avec l'usure (visible). Entretenir coûte peu et régulièrement ; réparer coûte du temps et des compétences ; remplacer coûte cher. Les compétences (couture, plomberie, électricité, mécanique vélo, cuisine) se gagnent en pratiquant et réduisent le temps et le risque d'échec.

### 2.9 Voisinage et économie du partage
Un quartier avec quelques voisins : prêt d'outils (perceuse partagée), troc de légumes, repair café, achat groupé en vrac, covoiturage. Coût : temps et réputation. Une réputation élevée débloque des échanges. Cela ajoute la dimension sociale sans dépense.

### 2.10 Imprévus et dilemmes
Événements peu nombreux et annoncés autant que possible : hausse du prix de l'énergie, canicule, vague de froid, invités pour le week-end, machine à laver en panne, anniversaire (cadeau fait main ou acheté ?), pression sociale (« tout le monde a le nouveau téléphone »). Chaque événement est un dilemme, pas une punition.

## 3. Nouvelles idées d'économies par domaine (en plus de la liste existante)

**Chauffage et confort thermique**
- Tente ou baldaquin de lit (une petite pièce dans la pièce).
- Briques ou pierres chauffées sur le poêle, enveloppées dans un linge.
- Film de survival / réflecteur derrière les radiateurs.
- Tapis épais sur sol froid ; chaussons isolants.
- Animal de compagnie ou dormir à deux : chaleur corporelle (avec coût de nourriture pour l'animal).
- Activité physique courte pour se réchauffer au lieu d'allumer le chauffage.
- Boisson chaude en thermos préparée une seule fois pour la journée.
- Programmation du chauffage : chauffer avant le réveil seulement.

**Électricité**
- Frigo placé loin du four et dans une pièce froide ; en hiver, garde-manger extérieur.
- Congélateur plein (les bouteilles d'eau gelées font masse froide).
- Option tarifaire heures creuses : décaler les usages (à comparer avec le solaire).
- Lampe frontale ou lampe solaire de jardin rentrée le soir.
- Vélo générateur pour recharger un téléphone (gain minime mais santé positive : bon exemple de choix « fun mais non rentable »).

**Cuisine et nourriture**
- Cuisson à l'autocuiseur (temps et énergie divisés).
- Four utilisé plein : plusieurs plats en une fois, puis chaleur résiduelle.
- Couper l'électricité de la plaque quelques minutes avant la fin (inertie).
- Planification des menus de la semaine à partir des invendus et des restes.
- Glanage, cueillette sauvage (orties, mûres, champignons avec risque si mal identifiés).
- Applications anti-gaspillage et paniers d'invendus.
- Faire son yaourt, son pain, ses pâtes, ses germes.
- Élevage de poules : œufs plus déchets de cuisine valorisés (investissement, temps, risque).

**Eau**
- Bouteille dans le réservoir des WC pour réduire la chasse.
- Toilettes sèches (énorme économie, coût de confort et d'habitude).
- Douche à récupération : un seau sous la douche pour la chasse d'eau.
- Lave-mains sur le réservoir des WC.

**Vêtements et lessive**
- Lessive maison (cendre, savon de Marseille) : moins chère mais efficacité variable.
- Porter une sous-couche lavable sous le pull isolant : on lave la sous-couche, pas le pull (excellent pour ton système de saleté).
- Laver à la main les petites pièces.
- Friperie, vêtements de seconde main, échanges entre voisins.

**Transport**
- Remorque de vélo pour les grosses courses.
- Écoconduite : vitesse, pression des pneus, poids embarqué.
- Télétravail certains jours si possible.
- Vendre la deuxième voiture : grosse économie mais perte de flexibilité.

**Logement et fixes**
- Comparer et renégocier assurance, énergie, internet, banque une fois par an (événement annuel).
- Colocation ou sous-location d'une pièce (revenu mais perte d'intimité).
- Déménager plus petit ou plus près du travail : décision de fin de partie à fort impact.

**Loisirs et achats**
- Bibliothèque, médiathèque, ludothèque au lieu d'acheter.
- Règle des 48 h avant tout achat non essentiel (mécanique anti-impulsion).
- Revendre ce qui ne sert plus.
- Fabriquer ses cadeaux.

**Santé**
- Prévention (dentiste, vue) contre réparation tardive coûteuse.
- Sommeil : fatigue élevée augmente les achats impulsifs et les livraisons.

**Énergie gratuite et low-tech avancée**
- Poêle de masse (rocket stove) : très peu de bois pour beaucoup de chaleur.
- Mur Trombe : mur sombre derrière une vitre qui chauffe la pièce.
- Capteur solaire à air en canettes recyclées.
- Frigo du désert (pot-in-pot) en été pour garder les légumes.
- Cave ou silo à légumes enterré.
- Éolienne de toit (piège pédagogique : souvent peu rentable en ville).

## 4. Score et fin de partie
- **Économies nettes** : économies cumulées moins investissements non rentabilisés.
- **Confort moyen** et **santé finale** comme multiplicateurs (pénalité forte sous un seuil).
- **Résilience** : part des besoins couverts sans facture (solaire, jardin, eau de pluie, réparations).
- **Habitudes acquises** et **principes maîtrisés**.
- Option : empreinte carbone évitée en bonus.
- Titres : Dépensier, Malin, Optimiseur, Autonome, Maître de la sobriété, plus des titres spéciaux (« Le Bricoleur », « Le Chef Solaire », « Zéro Gaspi »).

## 5. Structure et rejouabilité
- **Scénarios** : étudiant en studio mal isolé, famille en maison ancienne, retraité à la campagne avec jardin, télétravailleur en appartement en ville. Mêmes règles, stratégies différentes.
- **Chapitres** par domaine (chauffage d'abord en tutoriel), puis mode libre où tout se combine sur une année.
- **Défis** : « Hiver à 300 € », « Un mois sans courses », « Zéro sèche-linge ».

## 6. Prototype recommandé (inchangé dans l'esprit, précisé)
- Jeu navigateur, une maison de 3 pièces, cycle jour/nuit, une saison (hiver, 8 semaines).
- Modèle thermique simple par pièce, prévisions météo à 3 jours.
- Jauges : argent, confort, santé, volonté.
- Environ 12 actions : thermostat par pièce, fermer porte, rideau, calfeutrage, bouillotte, housse de bouillotte, 4 vêtements, lessive, thermomètre (instrument).
- Une découverte instrument (thermomètre) qui révèle la pièce la plus coûteuse.
- Score final avec titre.
- Toutes les dépendances vendorisées dans le repo, aucun CDN.

## 7. Où vit chaque idée d'autosuffisance (v1.1)

Pas de nouvel onglet : chaque idée est rangée là où le joueur la cherche déjà, et réutilise les mécanismes existants (rentabilité mesurée, habitudes, combos, principes, alertes du tableau de bord).

| Idée | Où | Mécanisme réutilisé |
|---|---|---|
| 1. Potager par planches, rotation, associations | Jardin (remplace le « petit potager » générique ; l'agrandissement ajoute 4 planches) | geste `jardiner`, ROI du potager, principe `rotation` |
| 2. Calendrier semis/récoltes/cueillette | Jardin + alertes du tableau de bord | fenêtres de semis, vraie météo (gel tardif), principe `calendrier` |
| 3. Garde-manger (kg, péremption, argent immobilisé) | Cuisine | gaspillage, principe `stockImmobilise` |
| 4. Bocaux stérilisés | Cuisine › garde-manger | facture d'électricité, risque botulisme, principes `conserver`, `douteJeter` |
| 5. Lactofermentation | Cuisine › garde-manger | santé, principe `lacto`, combo `chouLacto` |
| 6. Poêle à bois, bois sec, ramonage | Maison (au-dessus de l'été et de la ventilation passive) | chaleur injectée dans le salon (le gaz baisse seul), poste « bois » du domaine Chauffage, habitude `feuBois` |
| 7. Poules et boucle épluchures → compost | Jardin | habitude `poules`, dilemme des vacances, combo `boucleFlux` (principe `cycles`) |
| 8. Cueillette sauvage | Jardin | action de temps libre, guide et pharmacie, principe `cueillette` |
| 9. Taux d'autosuffisance et titres | Tableau de bord (carte) + bilan de fin | séparé du rang d'économies |
| 10. Paillage, oyas, goutte-à-goutte, arrêté sécheresse | Jardin › eau du jardin | cuve de pluie, facture d'eau, principe `solCouvert` |
| 11. Pain au levain | Cuisine (3e option de pain) | habitude `levain`, combo `levainChaleur` |
| 12. Lombricomposteur, bokashi | Jardin › compost (fusionné avec le composteur : le meilleur des deux compte, le bokashi ajoute 5 %) | facteur compost, ROI |
| 13. Toilettes sèches | Eau chaude (boutique « Eau ») | habitude `toilettesSeches`, hygiène ressentie au début |
| 14. Cave et silo à racines | Jardin + durée de garde du garde-manger | combo `siloCave` avec la cave du puits canadien |
| 15. Ballon thermodynamique, CEE, MaPrimeRénov' | Eau chaude | COP sur le ballon, prime versée après 60 jours, principe `aidesAvant` |

Le conseiller n'a pas appris ces systèmes : ils restent un terrain où le joueur attentif fait mieux que le débutant guidé.
