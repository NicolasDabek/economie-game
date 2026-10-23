// Données de jeu : Moral et santé sur la durée (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

// ---------- Moral et santé sur la durée (v0.7) ----------
// Le moral tend vers une ligne de base (inertie ~2 semaines). Repères :
// - adaptation hédonique : un plaisir répété perd l'essentiel de son effet en quelques mois, la nouveauté le recharge (Brickman 1978, Lyubomirsky 2011) ;
// - blues de l'hiver : 5 à 10 % des adultes en France connaissent une dépression saisonnière, bien plus un simple coup de mou (Inserm, HAS) ;
// - le stress financier (découvert, pas d'épargne de précaution) pèse sur le moral (Banque de France, baromètre de l'éducation financière 2024).
export const MORAL = {
  base: 31.2, kBienetre: 0.5, kSante: 0.25, kConfort: 1.0, inertie: 15,   // calibré pour 5 ans : ne rien toucher ~62, naïf ~67, malin ~61, maître ~63
  plaisir: 11, privation: 6, adaptMax: 0.7, adaptJours: 60, nouveaute: 0.4,
  social: 10, blues: 6,
  monotonie: { austere: 1, batch: 0.8, livraison: 0.2, classique: 0.3, maison: 0.15 }, monotonieMax: 8,
  controle: 11, stressDecouvert: 10, stressPrecaution: 5, stressMarche: 4, stressPanne: 5, stressMaladie: 6,
  seuilCompulsif: 25, probaCompulsif: 0.1,
};
// Coûts de la santé et de la négligence (2026) :
// - consultation de généraliste 30 € (depuis le 22/12/2024), Sécu 70 % moins 2 € de participation forfaitaire, la mutuelle responsable paie le ticket modérateur :
//   reste à charge 2 € ; franchise médicale 1 € par boîte (doublée en 2024) ; pharmacie non remboursée (paracétamol, sirop, mouchoirs) ~12 €.
// - arrêt maladie (salarié du privé) : 3 jours de carence non indemnisés, puis indemnités journalières à 50 % du salaire brut journalier
//   (≈ 60 % du net après CSG/CRDS) ; le complément employeur ne démarre qu'après 7 jours (art. L1226-1 et D1226-3 du Code du travail, ameli.fr).
// - carie négligée : dévitalisation + couronne hors panier 100 % Santé, reste à charge moyen ~250 € avec mutuelle (DREES, ameli).
// - moisissures installées : fongicide, joints, peinture d'une pièce ~450 € (ou retenue sur le dépôt de garantie).
// - augmentation individuelle : ~1,5 pt par an en plus de l'augmentation générale (enquêtes Deloitte, LHH 2025-2026) ; prime annuelle ~3 % du salaire.
export const SANTE_COUTS = {
  seuilMaladie: 40, resteConsultation: 2, franchiseBoite: 1, pharmacieNonRemb: 12, carence: 3, ijNet: 0.6, carences: 0.3,
  joursDentaire: 300, dentaire: 250, joursMoisi: 90, moisi: 450,
  seuilMoralAugm: 40, seuilHygieneAugm: 45, augmIndividuelle: 0.015, primePerdue: 0.03,
};
// Vacances d'été (choix chaque 1er juillet). Budget moyen des vacances d'été des Français ~1 900 € par foyer (baromètre Ipsos-Europ Assistance 2025) :
// ici pour une personne seule, deux semaines. Le voisin part en séjour classique.
export const VACANCES = {
  rester:  { nom: 'Rester chez soi (congés au calme, balades, médiathèque)', cout: 0, effet: 5 },
  econome: { nom: 'Une semaine chez des amis ou en camping, en train (Ouigo, réservé tôt)', cout: 350, effet: 11 },
  sejour:  { nom: 'Deux semaines en location et train (séjour classique)', cout: 1100, effet: 14 },
};

// lavage d'un vêtement à la main : 8 l d'eau tiède (≈0,25 kWh pour la chauffer), 9 min, 3 centimes de savon
export const LAVAGE_MAIN = { litres: 8, kwh: 0.25, temps: 0.15, volonte: 1, savon: 0.03 };

