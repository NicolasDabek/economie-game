import { appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Test headless v0.3 : 6 stratégies sur les 126 jours (hiver → printemps → été), plusieurs graines
import { nouvellePartie, sauvegarder, charger } from '../js/state.js';
import { reparerVelo, verifierPression, vendreVoiture, calculerCoutReel } from '../js/transport.js';
import { tableauROI } from '../js/roi.js';
import { recommandations, suivreConseil, CORVEES } from '../js/tableau.js';
import { PRINCIPES, ACHATS, SCENARIOS } from '../js/data.js';
import { chapitreDuJour } from '../js/meteo.js';
import { deposer, retirer } from '../js/finance.js';
import { changerTarif, faireReleves, resilier, renegocier, revendre, degivrer, prendreMediatheque } from '../js/systemes.js';
let GRAINE = 2026, ANNEES = 5, SCEN = 'standard';
let HOOK = null;
import { actionAutonomie, kgBocaux, kgLacto, tauxAutosuffisance, etatAutonomie, lotSec } from '../js/autonomie.js';
import { prendreTemps, payer, tempsLibre, actions, jourSuivant, scoreFinal, acheter, acheterVetement, planifierLessive, resoudreDilemme, choixDilemme, aererVetement, repriser, reparerMachine, laverMain, linge, remplissage } from '../js/simulation.js';

function jouer(s, chaqueJour, dilemmes = {}) {
  while (!s.fini) {
    if (s.dilemme) {
      const voulu = dilemmes[s.dilemme];
      const opts = choixDilemme(s).filter(o => o.possible !== false);
      resoudreDilemme(s, opts.find(o => o.id === voulu) ? voulu : dilemmes.premier ? opts[0].id : opts.at(-1).id);
    }
    chaqueJour(s); if (HOOK) HOOK(s);
    jourSuivant(s);
  }
  return s;
}
const toutes = (s, j, n) => { for (const p of ['salon', 'chambre', 'cuisine']) { s.pieces[p].consigneJour = j; s.pieces[p].consigneNuit = n; } };

function naive() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  s.central = { consigneJour: 22, consigneNuit: 21 };
  return jouer(s, (s) => { if (s.jour % 3 === 2) planifierLessive(s, { temp: 40, sechage: 'machine' }); },
    { invites: 'chauffer', promo: 'acheter', panne: 'technicien' });
}
function defaut() { // ne touche à rien : thermostat 20/18, fenêtre entrouverte, lessive 40 °C hebdo
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  return jouer(s, (s) => { if (s.jour % 7 === 6) planifierLessive(s, { temp: 40, sechage: 'air' }); });
}
function glacial() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  s.central = { consigneJour: 8, consigneNuit: 8 };
  return jouer(s, (s) => { if (s.jour % 4 === 3) planifierLessive(s, { temp: 30, sechage: 'air' }); }, { panne: 'laverie', vacances: 'rester' });
}
// Malin : équipements bon marché, consignes basses, quelques couches, sans optimiser à fond
function maligne() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  return jouer(s, (s) => {
    if (s.jour === 0) { acheter(s, 'thermometre'); acheter(s, 'purge'); acheterVetement(s, 'sweat'); acheterVetement(s, 'polaire'); acheterVetement(s, 'chaussettes'); s.aeration = 'breve'; }
    if (s.jour === 1) { acheter(s, 'calfeutrage'); acheter(s, 'bouillotte'); acheter(s, 'housse'); s.utiliserBouillotte = true; }
    if (s.jour === 5) { acheter(s, 'robinets'); toutes(s, 16, 14); s.pieces.salon.consigneJour = 18; s.pieces.salon.consigneNuit = 15; s.pieces.chambre.consigneNuit = 15; }
    if (s.jour === 10) s.rideaux = 'nuit';
    if (s.jour % 7 === 6) planifierLessive(s, { temp: 30, sechage: 'air' });
    if (s.jour < 5) s.central = { consigneJour: 19, consigneNuit: 15 };
  }, { invites: 'preter', promo: 'attendre', panne: 'laverie', vacances: 'econome' });
}
// Maître : tout l'arsenal, introduit progressivement pour ménager la volonté
export function maitre() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  return jouer(s, (s) => {
    const j = s.jour;
    if (j === 0) { acheter(s, 'thermometre'); acheter(s, 'hygrometre'); acheter(s, 'purge'); acheterVetement(s, 'souscouche', 'durable'); s.vetements.tshirt.porte = false; acheterVetement(s, 'sweat', 'durable'); acheterVetement(s, 'chaussettes', 'durable'); s.aeration = 'breve'; s.central = { consigneJour: 19, consigneNuit: 15 }; }
    if (j === 1) { acheter(s, 'calfeutrage'); acheter(s, 'boudin'); acheter(s, 'bouillotte'); acheter(s, 'housse'); acheterVetement(s, 'polaire', 'durable'); }
    if (j === 9) s.utiliserBouillotte = true;
    if (j === 2) { acheter(s, 'robinets'); toutes(s, 12, 11); s.pieces.salon.consigneJour = 16; s.pieces.salon.consigneNuit = 12; s.pieces.chambre.consigneNuit = 14; }
    if (j === 13) s.recupCuisson = true;
    if (j === 5) { acheterVetement(s, 'plaid', 'durable'); acheter(s, 'couture');  }
    if (j === 18) s.rideaux = 'nuit';
    if (j === 22) s.portes = 'fermees';
    if (j === 14) acheterVetement(s, 'pilou', 'durable');
    for (const id of ['sweat', 'polaire', 'pilou', 'plaid']) if (s.vetements[id].salete >= 45) aererVetement(s, id);
    for (const id of Object.keys(s.vetements)) if (s.vetements[id].usure >= 40) repriser(s, id);
    for (const id of ['souscouche', 'chaussettes']) if (s.vetements[id].salete >= 75) laverMain(s, id);
    if (s.machine.enPanne) reparerMachine(s, 'diy');
    if (linge(s).length && (remplissage(s) >= 0.75 || Object.values(s.vetements).some(v => v.possede && v.porte && v.salete >= 88))) planifierLessive(s, { temp: 30, sechage: 'air' });
  }, { invites: 'preter', promo: 'attendre', panne: 'diy', vacances: 'econome' });
}
// --- saisons (v0.6 : chaque année) : alléger les vêtements, stratégies d'été, retour du froid, vêtements usés rachetés
const deb = (s, sa, idx = 0) => { const c = chapitreDuJour(s.jour); return c.saison === sa && c.index === idx; };
const CHAUDS = ['souscouche', 'sweat', 'polaire', 'pilou', 'plaid', 'chaussettes'];
function saisons(s, malin, qualite = 'eco') {
  if (deb(s, 'printemps')) { for (const id of ['pilou', 'plaid', 'polaire', 'souscouche']) if (s.vetements[id]) s.vetements[id].porte = false; s.vetements.tshirt.porte = true; s.rideaux = 'ouverts'; s.utiliserBouillotte = false; }
  if (deb(s, 'ete')) { for (const id of Object.keys(s.vetements)) s.vetements[id].porte = id === 'tshirt'; s.portes = 'ouvertes'; if (malin) { s.voletsJour = true; s.ventNuit = true; s.aeration = 'breve'; } }
  if (deb(s, 'automne')) { s.voletsJour = false; s.ventNuit = false; s.ventilateur = false; s.climActive = false; if (s.vetements.sweat.possede) s.vetements.sweat.porte = true; }
  if (malin && deb(s, 'automne', 45)) { for (const id of CHAUDS) { if (!s.vetements[id].possede && s.jour > 300) acheterVetement(s, id, qualite); if (s.vetements[id].possede) s.vetements[id].porte = true; } s.vetements.tshirt.porte = !s.vetements.souscouche.possede; s.rideaux = 'nuit'; s.utiliserBouillotte = !!s.possede.bouillotte; s.portes = 'fermees'; }
  if (!malin && deb(s, 'automne', 45)) for (const id of CHAUDS) if (s.vetements[id].possede) s.vetements[id].porte = true;
}
const rafraichirVet = (s) => { if (s.vetements.tshirt.salete >= 80 && chapitreDuJour(s.jour).saison === 'ete') laverMain(s, 'tshirt'); };

function ajoute(nom, f) { STRATS.push([nom, f]); }
const STRATS = [];
ajoute('ne rien toucher', defaut);
// « tout à fond » (ex-« naïf », passe GD 2 §4.6) : confort maximal, ce n'est PAS la référence (la référence est « ne rien toucher »)
ajoute('tout à fond', () => {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  s.central = { consigneJour: 22, consigneNuit: 21 };
  s.sys.douche.minutes = 15; s.sys.regime = 'livraison'; s.sys.plaisirs = 35; s.transport.teletravail = 0;
  return jouer(s, (s) => {
    saisons(s, false);
    if (deb(s, 'ete')) { acheter(s, 'clim'); s.climActive = true; s.climConsigne = 23; }
    if (s.jour % 3 === 2) planifierLessive(s, { temp: 40, sechage: 'machine' });
  }, { invites: 'chauffer', promo: 'acheter', panne: 'technicien', livraison: 'accepter', robot: 'acheter', promoPerissable: 'acheter', canicule: 'clim', barbecue: 'aller' });
});
ajoute('glacial', () => {
  const s = glacial(); return s;
});
// Austère extrême : tout couper, douche au seau, pâtes, zéro plaisir, rien ne se lave
ajoute('austère extrême', () => {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  const c = actions(s);
  s.central = { consigneJour: 14, consigneNuit: 12 };
  Object.assign(s.sys, { regime: 'austere', plaisirs: 0, vaisselle: 'bassine' });
  s.sys.douche.seau = true; s.sys.ballon.consigne = 45; s.aeration = 'jamais';
  Object.assign(s.transport, { mode: 'commun', modeCourses: 'marche', modeLoisirs: 'marche', repas: 'emporte', courses: 'regroupees', teletravail: 3 });
  return jouer(s, (s) => {
    if (s.jour === 0) { acheter(s, 'seau'); for (const id of ['streaming', 'musique', 'sport']) resilier(s, id, c); }
    if (s.jour === 1) { faireReleves(s, c); for (const id of ['cloud', 'assurance', 'appli']) resilier(s, id, c); renegocier(s, c); }
    saisons(s, true);
    if (s.jour % 14 === 13) planifierLessive(s, { temp: 30, sechage: 'air' });
  }, { invites: 'refuser', promo: 'attendre', panne: 'laverie', livraison: 'refuser', robot: 'refuser', promoPerissable: 'refuser', canicule: 'subir', barbecue: 'refuser', vacances: 'rester' });
});
ajoute('malin', () => {
  const s = maligne(); return s;
});
ajoute('maître', () => maitre());
// v1.4 (passe GD 3, §3.3) : « premiers pas » = 3 gestes faciles et gratuits, rien d'autre (palier Malin atteignable vite)
export function premiersPas() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  return jouer(s, (s) => {
    if (s.jour === 0) { s.central = { consigneJour: 19, consigneNuit: 17 }; s.transport.repas = 'emporte'; s.sys.liste = true; }
    if (s.jour % 7 === 6) planifierLessive(s, { temp: 40, sechage: 'air' });
  });
}
ajoute('premiers pas', () => premiersPas());
// v0.9 : le débutant ne connaît rien mais suit le tableau de bord : deux fois par semaine (tous les 3 jours), il clique « Faire » sur
// la première recommandation applicable (lessive comprise). Il ne fait rien d'autre de lui-même ; aux choix, il prend le premier.
export function debutant() {
  const s = nouvellePartie(GRAINE, ANNEES, SCEN);
  return jouer(s, (s) => {
    if (s.jour % 3 === 0) { let n = 0; for (const r of recommandations(s)) { if (n >= 1) break; if (suivreConseil(s, r) && !CORVEES.has(r.action.type)) n++; } }
  }, { premier: true });
}
ajoute('débutant guidé', debutant);
// v0.8.1 : économiser en laissant une jauge vers 30 doit coûter plus cher que le malin
ajoute('moral négligé', () => maligne());
ajoute('bien-être négligé', () => maligne());
ajoute('autosuffisant', () => maligne());

// enrichit malin et maître avec les nouveaux systèmes via un hook
const HOOKS = {
  malin(s) {
    const c = actions(s), j = s.jour;
    if (j === 2) { acheter(s, 'pommeau'); s.sys.ballon.consigne = 55; s.sys.douche.minutes = 7; }
    if (j === 3) { acheter(s, 'multiprise'); s.sys.regime = 'maison'; s.sys.plaisirs = 20; }
    if (j === 6) { faireReleves(s, c); }
    if (j === 7) { resilier(s, 'cloud', c); resilier(s, 'appli', c); }
    if (j === 20) acheter(s, 'led');
    if (j === 9) { calculerCoutReel(s, c); }
    if (j === 10) { Object.assign(s.transport, { mode: 'commun', abonnementTC: true, courses: 'regroupees' }); }
    if (j === 24) s.transport.repas = 'emporte';
    if (j % 30 === 15) verifierPression(s, c);
    if (j === 60) s.sys.vaisselle = 'bassine';
    if (deb(s, 'ete')) { acheter(s, 'ventilateur', true); s.ventilateur = true; }
    if (j % 365 === 200) acheter(s, 'purge');
    saisons(s, true); rafraichirVet(s);
  },
  maître(s) {
    const c = actions(s), j = s.jour, y = s.sys;
    if (j % 30 === 2 && s.argent > 2500) { const m = Math.floor(s.argent - 2000); if (!deposer(s, 'livretA', m, c).ok) deposer(s, 'ldds', Math.min(m, 12000 - s.fin.livrets.ldds.solde), c); }
    if (j === 0) { changerTarif(s, 'hphc', c); acheter(s, 'pommeau'); acheter(s, 'mousseurs'); y.ballon.consigne = 55; y.douche.minutes = 6; }
    if (j === 3) { acheter(s, 'jaquette'); acheter(s, 'multiprise'); faireReleves(s, c); }
    if (j === 16) y.multipriseGeste = true;
    if (j === 4) { for (const id of ['cloud', 'assurance', 'appli', 'sport']) resilier(s, id, c); renegocier(s, c); }
    if (j === 6) { revendre(s, 'console', c); prendreMediatheque(s, c); y.plaisirs = 10; }
    if (j === 8) { acheter(s, 'boites'); acheter(s, 'autocuiseur', true); y.regime = 'batch'; }
    if (j === 12) acheter(s, 'led');
    if (j === 10) { acheter(s, 'velo', true); acheter(s, 'kitSecu'); }
    if (j === 11) { Object.assign(s.transport, { mode: 'velo', modeLoisirs: 'velo', modeCourses: 'velo', courses: 'regroupees' }); acheter(s, 'outilsVelo'); }
    if (j === 18) { acheter(s, 'tenuePluie'); acheter(s, 'gourde'); }
    if (j === 21) s.transport.repas = 'emporte';
    if (j === 35) vendreVoiture(s, c);
    if (s.transport.veloEnPanne) reparerVelo(s, 'diy', c);
    if (j === 58) { acheter(s, 'caisse'); y.stockage = { actif: true, contenant: 'caisse' }; }
    if (j === 15) y.ballon.mode = 'hc';
    if (j === 25) y.vaisselle = 'bassine';
    if (j === 30) { revendre(s, 'velo', c); }
    if (j === 40) degivrer(s, c);
    if (j === 54) acheter(s, 'solaire');
    if (j === 55) { acheter(s, 'composteur'); acheter(s, 'potager'); acheter(s, 'herbes'); }
    if (j === 56) { acheter(s, 'corde'); acheter(s, 'cuve'); }
    if (j === 60) { acheter(s, 'fourSolaire', true); y.cuisineSolaire = true; y.ballon.mode = 'midi'; }
    if (deb(s, 'ete')) { acheter(s, 'ventilateur', true); acheter(s, 'moustiquaire'); s.ventilateur = true; }
    if (j > 300) for (const id of ['purge', 'potager', 'herbes', 'calfeutrage', 'boudin', 'bouillotte', 'housse', 'gourde', 'kitSecu', 'tenuePluie', 'composteur', 'corde', 'led', 'boites']) if (!s.possede[id]) acheter(s, id);
    if (deb(s, 'automne', 45) && s.possede.bouillotte) s.utiliserBouillotte = true;
    // v1.1 : autosuffisance (planches, paillage, conserves, poules, cueillette, toilettes sèches, ballon thermodynamique)
    const oA = { prendreTemps, payer, msg: () => {}, debloquer: () => {} };
    if (j === 57) { acheter(s, 'lombri', true); acheter(s, 'silo'); }
    if (j === 62) { acheter(s, 'toilettesSeches'); acheter(s, 'potLacto'); }
    if (j === 90) { acheter(s, 'oyas', true); acheter(s, 'goutte'); }
    if (j >= 101 && !s.possede.poules) acheter(s, 'poules', true);
    if (s.possede.poules && !s.possede.cloture) acheter(s, 'cloture');
    if (s.possede.cloture) actionAutonomie(s, 'declarer', null, oA);
    if (j === 20) actionAutonomie(s, 'demanderCEE', null, oA);
    if (j === 22) acheter(s, 'cet');
    if (j === 140) acheter(s, 'guideCueillette');
    if (j >= 200 && !s.possede.potagerGrand && s.argent > 300) acheter(s, 'potagerGrand');
    if (j > 60 && j % 3 === 0) { actionAutonomie(s, 'pailler', null, oA); if (kgBocaux(s) >= 4 && s.possede.sterilisateur) actionAutonomie(s, 'bocaux', null, oA); if (kgLacto(s) >= 2) actionAutonomie(s, 'lacto', null, oA); }
    if (j > 140 && j % 7 === 5 && tempsLibre(s) > 3) actionAutonomie(s, 'cueillette', null, oA);
    if (j >= 230 && !s.possede.sterilisateur) acheter(s, 'sterilisateur', true);
    saisons(s, true, 'durable'); rafraichirVet(s);
    // v0.7 : la santé d'abord. Mars reste froid (on garde les couches), avril-mai demi-saison, juin des nuits fraîches.
    const mo = new Date(Date.UTC(2026, 11, 1) + j * 864e5).getUTCMonth();
    const porter = (ids) => { for (const id of ids) if (s.vetements[id]?.possede) s.vetements[id].porte = true; };
    if (mo === 2) { porter(['souscouche', 'sweat', 'polaire', 'chaussettes']); s.utiliserBouillotte = !!s.possede.bouillotte; s.rideaux = 'nuit'; }
    if (mo === 3 || mo === 4) { porter(['sweat', 'chaussettes']); if (mo === 3) porter(['souscouche']); }
    if (mo === 5 || mo === 8) porter(['sweat']);
    if (j >= 56 && linge(s).length && remplissage(s) >= 0.75) planifierLessive(s, { temp: 30, sechage: chapitreDuJour(j).saison === 'hiver' ? 'air' : 'dehors', hc: true });
  },
};
// v1.3 (passe GD 2, D) : l'autosuffisant = le malin + jardin, poules et poêle à bois achetés la première année.
// Un vrai pari de long terme : moins bien que le malin sur 3 ans, mieux sur 10 ans.
HOOKS.autosuffisant = (s) => {
  HOOKS.malin(s);
  const j = s.jour, d = j % 365, oA = { prendreTemps, payer, msg: () => {}, debloquer: () => {} };
  const an1 = j < 365;   // tout s'achète la première année, dès que le temps libre le permet
  // poêle payé avec le compte courant à l'automne de la 1re année, sans entamer l'épargne de précaution (la vider stresse et coûte plus cher)
  if (an1 && j >= 280 && !s.possede.poele && s.argent >= ACHATS.poele.prix + 1200) { if (acheter(s, 'poele')) { etatAutonomie(s).poele.mode = 'jour';   /* 2 jours de télétravail : il tourne en journée, réglé sur la consigne */ actionAutonomie(s, 'bois', 'sec', oA); actionAutonomie(s, 'bois', 'sec', oA); } }
  if (an1 && s.possede.poele && !s.possede.abriBois) acheter(s, 'abriBois');
  if (an1 && j >= 70) for (const id of ['composteur', 'potager', 'herbes', 'cuve']) if (!s.possede[id]) acheter(s, id);
  if (an1 && j >= 100 && !s.possede.poules) acheter(s, 'poules', true);
  // usure : graines et plants chaque année, poules réformées au bout de quelques années… on renouvelle ce qui arrive en fin de vie
  if (!an1) for (const id of ['potager', 'herbes', 'composteur', 'cuve', 'poules', 'abriBois']) if (!s.possede[id] && s.eco?.finVie?.[id]) acheter(s, id, id === 'poules');
  if (s.possede.poules && !s.possede.cloture) acheter(s, 'cloture');
  if (s.possede.poules) actionAutonomie(s, 'declarer', null, oA);
  if (j >= 200 && s.possede.potager && !s.possede.potagerGrand) acheter(s, 'potagerGrand');
  if (j >= 230 && !s.possede.sterilisateur) acheter(s, 'sterilisateur', true);
  if (j > 70 && j % 3 === 0) { actionAutonomie(s, 'pailler', null, oA); if (kgBocaux(s) >= 4 && s.possede.sterilisateur) actionAutonomie(s, 'bocaux', null, oA); }
  // bois : on achète vert au printemps (sèche 18 mois sous l'abri), du sec en dépannage si le stock manque en saison de chauffe
  if (s.possede.poele) {
    const A = etatAutonomie(s), stock = A.bois.reduce((t, l) => t + l.st, 0);
    if (d === 130 && stock < 3) actionAutonomie(s, 'bois', 'vert', oA);   // ~2 hivers d'avance, pas plus
    const sec = A.bois.filter(l => lotSec(s, l)).reduce((t, l) => t + l.st, 0);
    if ((d >= 280 || d < 110) && sec < 0.3) actionAutonomie(s, 'bois', 'sec', oA);
    if (d === 250) actionAutonomie(s, 'ramoner', null, oA);
  }
};
// moral négligé : le malin, mais plaisirs au minimum (10 €/sem.), plus de streaming ni de musique, tout en télétravail (isolé)
HOOKS['moral négligé'] = (s) => {
  HOOKS.malin(s); const c = actions(s);
  s.sys.plaisirs = 10; s.transport.teletravail = 5; if (s.jour > 3) s.sys.regime = 'batch';
  if (s.jour === 5) { resilier(s, 'streaming', c); resilier(s, 'musique', c); }
};
// bien-être négligé : le malin, mais zéro plaisir et chambre à 14 °C la nuit (sommeil et loisirs sacrifiés)
HOOKS['bien-être négligé'] = (s) => {
  HOOKS.malin(s);
  s.central.consigneNuit = Math.min(s.central.consigneNuit, 14); s.sys.plaisirs = 0;
};
const _jouer = jouer;

function lancer(graine) {
  GRAINE = graine;
  const res = [];
  for (const [nom, f] of STRATS) {
    HOOK = HOOKS[nom] || null;
    const s = f(); HOOK = null;
    const r = scoreFinal(s); r.defis = (s.eco?.defisReussis || []).map(d => d.fait);
    if (process.env.DETAIL_DEFIS) console.log('DEFIS', graine, nom, JSON.stringify(s.eco?.defisReussis || []));
    if (process.env.EMPREINTE) appendFileSync(process.env.EMPREINTE, `${graine} ${nom} ${createHash('sha256').update(JSON.stringify(s)).digest('hex')}\n`);
    res.push([nom, s, r]);
  }
  return res;
}
const pad = (x, n) => String(x).padEnd(n);
const lignes = [];
let ok = true;
const graines = [2026, 7, 1789];
const tous = {};
const SEUL = process.env.SEUL || '';
for (const g of (SEUL && SEUL !== 'profils' ? [] : graines)) {
  console.log(`\n=== graine ${g} ===`);
  for (const [nom, s, r] of lancer(g)) {
    const m = r.moy;
    console.log(`${pad(nom, 16)} coût ${r.cout.toFixed(0)} € | voisin ${r.base.toFixed(0)} € | éco ${r.economies.toFixed(0)} € (${r.pct.toFixed(1)} %) | confort ${m.confort.toFixed(0)} santé ${m.sante.toFixed(0)} moral ${m.moral.toFixed(0)} hygiène ${m.hygiene.toFixed(0)} bien-être ${m.bienetre.toFixed(0)} | rechutes ${s.rechutes} hab ${r.habitudes} princ ${r.principes} | défis ${(s.eco?.defisReussis || []).map(d => d.fait ? '✓' : '✗').join('') || '-'} | ${r.titre}${r.note ? ' (' + r.note + ')' : ''}`);
    console.log(`   coûts v0.7 : santé ${Math.round(s.depenses.sante || 0)} € · moisissures ${Math.round(s.depenses.logement || 0)} € · revenus perdus ${Math.round(s.depenses.revenus || 0)} € · imprévus ${Math.round(s.depenses.imprevus || 0)} € · ${s.mor.episodes} épisodes, ${s.mor.joursArret} j d'arrêt, salaire ×${s.mor.facteurSalaire.toFixed(3)}`);
    (tous[nom] ||= []).push(r);
    if (g === 2026 && nom === 'maître') {
      console.log('   domaines maître :', r.domaines.map(d => `${d.nom} ${d.valeur.toFixed(0)}`).join(' · '));
      console.log('   autonomie maître :', JSON.stringify(tauxAutosuffisance(s), (k, v) => typeof v === 'number' ? Math.round(v) : v), JSON.stringify(etatAutonomie(s).stats, (k, v) => typeof v === 'number' ? Math.round(v) : v));
      console.log('   combos maître :', Object.keys(s.combos).join(', '));
      console.log('   rentabilité maître :', tableauROI(s).sort((a, b) => b.ratio - a.ratio).map(x => `${x.nom.slice(0, 22)} payé ${x.prix} mesuré ${x.mesure.toFixed(0)} net5 ${x.net5.toFixed(0)}`).join(' | '));
      if (Object.keys(s.combos).length < 3) { ok = false; console.log('✗ combos'); }
    }
  }
}
// v0.9 : rentabilité réalisée de chaque équipement, toutes stratégies confondues (graine 2026)
if (process.env.ROI) {
  GRAINE = 2026; const agg = {};
  for (const [nom, s] of lancer(2026)) for (const x of tableauROI(s)) { const a = (agg[x.nom] ||= { n: 0, prix: 0, mes: 0, strats: [] }); a.n++; a.prix += x.prix; a.mes += x.mesure / (s.nbJours / 365); a.strats.push(nom.split(' ')[0]); }
  console.log('\nROI réalisé (€/an mesurés / prix), graine 2026 :');
  for (const [n, a] of Object.entries(agg).sort((x, y) => y[1].mes / y[1].prix - x[1].mes / x[1].prix)) console.log(`  ${n.slice(0, 40).padEnd(40)} ${String(a.n).padStart(2)} strat. · prix moy ${(a.prix / a.n).toFixed(0).padStart(4)} € · ${(a.mes / a.n).toFixed(0).padStart(5)} €/an · ROI ${(a.mes / a.prix * 100).toFixed(0).padStart(5)} %/an · ${a.strats.join(',')}`);
}
const R = (n) => tous[n];
for (let i = 0; i < (SEUL && SEUL !== 'profils' ? 0 : graines.length); i++) {
  const ch = (c, t) => { if (!c) { ok = false; console.log('✗', graines[i], t); } };
  ch(R('maître')[i].rang > R('austère extrême')[i].rang, 'maître > austère (rang)');
  ch(R('maître')[i].rang >= 4, `maître au moins Autonome (obtenu ${R('maître')[i].titre})`);
  ch(R('malin')[i].economies > R('ne rien toucher')[i].economies, 'malin > défaut');
  ch(R('austère extrême')[i].rang <= 2, 'austère plafonné');
  ch(R('glacial')[i].rang <= 1, 'glacial perd');
  ch(R('tout à fond')[i].rang === 0, 'tout à fond perd');
  ch(R('maître')[i].moy.moral >= 45, 'moral moyen du maître ≥ 45');
  // v0.9 : suivre le tableau de bord ne doit jamais punir
  const d = R('débutant guidé')[i];
  ch(d.rang === 2 || d.rang === 3, `débutant guidé : Optimiseur ou Économe (obtenu ${d.titre})`);
  ch(R('malin')[i].rang === 3 || R('malin')[i].rang === 4, `malin : Économe ou Autonome (obtenu ${R('malin')[i].titre})`);
  // v1.3 (passe GD 2, B et C)
  ch(R('bien-être négligé')[i].rang === 0, `bien-être négligé : Dépensier (obtenu ${R('bien-être négligé')[i].titre})`);
  // v1.4 (passe GD 3, §3.2) : taux de réussite des défis ciblés par profil
  { const n = (p) => R(p)[i].defis.filter(Boolean).length;
    ch(n('malin') >= 1 && n('malin') <= 2, `malin : 1 à 2 défis réussis sur 3 (obtenu ${n('malin')})`);
    ch(n('maître') >= 2, `maître : au moins 2 défis réussis (obtenu ${n('maître')})`); }
  // v1.4 (passe GD 3, §3.3) : 3 gestes faciles suffisent pour quitter Dépensier
  ch(R('premiers pas')[i].rang >= 1, `premiers pas : au moins Malin (obtenu ${R('premiers pas')[i].titre})`);
  { const dn = R('ne rien toucher')[i].defis; ch(dn.length >= 2 && dn.every(x => !x), `ne rien toucher : aucun défi réussi (${dn.map(x => x ? '✓' : '✗').join('')})`); }
  // v0.9.2 : le conseiller aide à débuter, il ne remplace pas le joueur
  ch(d.economies < R('malin')[i].economies, 'débutant guidé < malin');
  ch(d.pct >= 18 && d.pct <= 32, `débutant guidé ${d.pct.toFixed(1)} % dans [18, 32]`);
  ch(d.economies > R('ne rien toucher')[i].economies + 10000, 'débutant guidé > défaut + 10 k€');
  ch(d.moy.sante >= 70 && d.moy.hygiene >= 70 && d.moy.moral >= 45, 'débutant guidé en bonne santé');
  // v0.7 : l'austérité coûte aussi de l'argent (santé, arrêts, dents, moisissures, augmentations perdues)
  ch(R('maître')[i].economies > R('austère extrême')[i].economies && R('austère extrême')[i].economies <= 0.7 * R('maître')[i].economies && R('austère extrême')[i].rang < R('maître')[i].rang, 'le maître économise plus que l\'austère (≤ 70 %) et le bat au titre');
  ch(R('glacial')[i].economies < R('malin')[i].economies, 'le glacial perd de l\'argent face au malin');
  ch(R('maître')[i].moy.sante >= 85, 'santé moyenne du maître ≥ 85');
  // moral sur 5 ans : cibles de conception
  const mo = (n) => R(n)[i].moy.moral;
  ch(mo('ne rien toucher') >= 55 && mo('ne rien toucher') <= 65, `moral ne rien toucher ${mo('ne rien toucher').toFixed(0)} dans [55, 65]`);
  ch(mo('tout à fond') >= 65 && mo('tout à fond') <= 75, `moral tout à fond ${mo('tout à fond').toFixed(0)} dans [65, 75]`);
  ch(mo('malin') >= 55 && mo('malin') <= 65, `moral malin ${mo('malin').toFixed(0)} dans [55, 65]`);
  ch(mo('maître') >= 55 && mo('maître') <= 65, `moral maître ${mo('maître').toFixed(0)} dans [55, 65]`);
  ch(mo('austère extrême') < 25 && mo('glacial') < 30, 'moral austère < 25 et glacial < 30');
  ch(R('ne rien toucher')[i].rang <= 1, 'défaut perd');
  // v0.8.1 : négliger le moral ou le bien-être pour économiser finit par coûter plus cher que le malin
  ch(R('moral négligé')[i].moy.moral <= 38, `moral négligé ${mo('moral négligé').toFixed(0)} ≤ 38`);
  ch(R('bien-être négligé')[i].moy.bienetre <= 38, `bien-être négligé ${R('bien-être négligé')[i].moy.bienetre.toFixed(0)} ≤ 38`);
  ch(R('moral négligé')[i].economies < R('malin')[i].economies, `moral négligé ${R('moral négligé')[i].economies.toFixed(0)} € < malin`);
  ch(R('bien-être négligé')[i].economies < R('malin')[i].economies, `bien-être négligé ${R('bien-être négligé')[i].economies.toFixed(0)} € < malin`);
}

// v1.3 (passe GD 2, D) : jardin + poules + poêle achetés la 1re année = pari de long terme (moins bien que le malin sur 3 ans, mieux sur 10 ans)
if (!SEUL || SEUL === 'auto') for (const g of graines) for (const an of [3, 10]) {
  GRAINE = g; ANNEES = an;
  HOOK = HOOKS.malin; const sm = maligne(); const m = scoreFinal(sm);
  HOOK = HOOKS.autosuffisant; const sa = maligne(); const a = scoreFinal(sa); HOOK = null; ANNEES = 5;
  const t = tauxAutosuffisance(sa), roi = Object.fromEntries(tableauROI(sa).map(x => [x.nom.slice(0, 12), Math.round(x.mesure)]));
  console.log(`autosuffisant ${an} ans, graine ${g} : ${a.economies.toFixed(0)} € (${a.pct.toFixed(1)} %, ${a.titre}) vs malin ${m.economies.toFixed(0)} € (${m.pct.toFixed(1)} %) → écart ${(a.economies - m.economies).toFixed(0)} € · autosuffisance ${Math.round(t.global)} % · mesuré : ${JSON.stringify(roi)}`);
  const okA = an === 3 ? a.economies < m.economies : a.economies > m.economies;
  if (!okA) { ok = false; console.log(`✗ autosuffisant ${an === 3 ? '< malin sur 3 ans' : '> malin sur 10 ans'} (graine ${g})`); }
}
// v1.3 (passe GD 2, P6) : pour chaque scénario de départ, « ne rien toucher » ≈ voisin ± 5 %
if (!SEUL || SEUL === 'scenarios') for (const sc of Object.keys(SCENARIOS)) for (const g of graines) {
  GRAINE = g; SCEN = sc; const sd = defaut(); const r = scoreFinal(sd); SCEN = 'standard';
  console.log(`scénario ${sc.padEnd(21)} graine ${String(g).padEnd(4)} : ne rien toucher ${r.pct.toFixed(1)} % (voisin ${Math.round(r.base / (sd.nbJours / 365))} €/an, chauffage voisin ${Math.round(sd.base.gaz / (sd.nbJours / 365))} €/an, ${sd.scenario})`);
  if (!(Math.abs(r.pct) <= 5) || sd.scenario !== sc) { ok = false; console.log(`✗ scénario ${sc} : ne rien toucher hors voisin ± 5 %`); }
}
// v1.4 (passe GD 3, §3.4) : la meilleure première action (conseil n°1 au jour 7, gestes gratuits déjà pris) dépend du scénario
if (!SEUL || SEUL === 'scenarios') for (const g of graines) {
  const premiers = {};
  for (const sc of Object.keys(SCENARIOS)) {
    const s = nouvellePartie(g, 5, sc);
    for (let i = 0; i < 7; i++) jourSuivant(s);
    s.transport.repas = 'emporte'; s.sys.prixKiloGeste = true;
    premiers[sc] = recommandations(s)[0]?.titre || '-';
  }
  const n = new Set(Object.values(premiers)).size;
  console.log(`conseil n°1 par scénario, graine ${g} : ${Object.entries(premiers).map(([k, v]) => `${k} → ${v}`).join(' · ')}`);
  if (n < 2) { ok = false; console.log(`✗ conseil n°1 identique dans les ${Object.keys(premiers).length} scénarios (graine ${g})`); }
}
// sauvegarde aller-retour + ancienne sauvegarde
const mem = { d: {}, setItem(k, v) { this.d[k] = v; }, getItem(k) { return this.d[k] ?? null; }, removeItem(k) { delete this.d[k]; } };
GRAINE = 2026; const sv = defaut(); sauvegarder(sv, mem); const sv2 = charger(mem);
if (!(sv2.jour === sv.jour && sv2.meteo.length === sv.meteo.length && sv2.sys && sv2.hygiene === sv.hygiene)) { ok = false; console.log('✗ sauvegarde'); }
mem.setItem('economie-game-sauvegarde', JSON.stringify({ version: 2, jour: 5 }));
if (charger(mem) !== 'ancienne' || mem.getItem('economie-game-sauvegarde') !== null) { ok = false; console.log('✗ migration ancienne sauvegarde'); }
// migration v0.3 -> v0.4 : la partie continue
{ const v3 = defaut(); const o = JSON.parse(JSON.stringify(v3)); delete o.meteo; delete o.transport; delete o.roi; o.version = 3; delete o.depenses.transport; delete o.base.transport;
  mem.setItem('economie-game-sauvegarde', JSON.stringify(o)); const m = charger(mem);
  if (!(m && m.version === 10 && m.transport && m.fin && m.eco && !m.fini)) { ok = false; console.log('✗ migration v3'); } }
// migration v0.4 -> v0.5 : la banque démarre au jour de la sauvegarde, sans rattrapage
{ const v4 = defaut(); const o = JSON.parse(JSON.stringify(v4)); delete o.meteo; delete o.fin; delete o.coutVoisinCumul; delete o.depenses.banque; delete o.base.banque; o.version = 4; o.fini = false; o.jour = 40;
  mem.setItem('economie-game-sauvegarde', JSON.stringify(o)); const m = charger(mem);
  const okM = m && m.version === 10 && m.fin && m.fin.cal === 39 && m.fin.livrets.livretA.solde === 4000 && m.migre === 4;
  if (okM) { jourSuivant(m); }
  if (!(okM && m.jour === 41 && m.fin.cal === 40 && Number.isFinite(scoreFinal(m).economies))) { ok = false; console.log('✗ migration v4'); } else console.log('✓ migration v4 -> v8'); }
// migration v0.5 -> v0.6 : une partie de 18 semaines terminée devient le début d'une campagne de 5 ans
{ const v5 = defaut(); const o = JSON.parse(JSON.stringify(v5)); delete o.meteo; delete o.eco; delete o.auto; delete o.annees; delete o.joursTotal; o.version = 5; o.jour = 126; o.fini = true; o.evenementsVus = ['invites', 'chap-printemps'];
  mem.setItem('economie-game-sauvegarde', JSON.stringify(o)); const m = charger(mem);
  let okM = m && m.version === 10 && !m.fini && m.jour === 254 && m.annees === 5 && m.evenementsVus.includes('invites@0');
  if (okM) { for (let i = 0; i < 400 && !m.fini; i++) { if (m.dilemme) resoudreDilemme(m, choixDilemme(m).filter(x => x.possible !== false).at(-1).id); else jourSuivant(m); } okM = m.jour > 600 && Number.isFinite(scoreFinal(m).economies); }
  if (!okM) { ok = false; console.log('✗ migration v5'); } else console.log('✓ migration v5 -> v8 (la partie continue, jour', m.jour, ')'); }
// migration v0.6 -> v0.7 : le moral sur la durée démarre au jour de la sauvegarde
{ GRAINE = 2026; const v6 = defaut(); const o = JSON.parse(JSON.stringify(v6)); delete o.meteo; delete o.mor; o.version = 6; o.fini = false; o.jour = 400;
  mem.setItem('economie-game-sauvegarde', JSON.stringify(o)); const m = charger(mem);
  let okM = m && m.version === 10 && m.mor && m.migre === 6;
  if (okM) { for (let i = 0; i < 60; i++) { if (m.dilemme) resoudreDilemme(m, choixDilemme(m).filter(x => x.possible !== false).at(-1).id); else jourSuivant(m); } okM = Number.isFinite(m.volonte) && Number.isFinite(scoreFinal(m).economies); }
  if (!okM) { ok = false; console.log('✗ migration v6'); } else console.log('✓ migration v6 -> v8'); }
console.log('principes :', Object.keys(PRINCIPES).length);
if (Object.keys(PRINCIPES).length < 75) ok = false;
console.log(ok ? '\nOK' : '\nÉCHEC'); process.exit(ok ? 0 : 1);
