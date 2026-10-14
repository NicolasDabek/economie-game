// Test headless v0.3 : 6 stratégies sur les 126 jours (hiver → printemps → été), plusieurs graines
import { nouvellePartie, sauvegarder, charger } from '../js/state.js';
import { changerTarif, faireReleves, resilier, renegocier, revendre, degivrer, prendreMediatheque } from '../js/systemes.js';
let GRAINE = 2026;
let HOOK = null;
import { actions, jourSuivant, scoreFinal, acheter, acheterVetement, planifierLessive, resoudreDilemme, choixDilemme, aererVetement, repriser, reparerMachine, laverMain, linge, remplissage } from '../js/simulation.js';

function jouer(s, chaqueJour, dilemmes = {}) {
  while (!s.fini) {
    if (s.dilemme) {
      const voulu = dilemmes[s.dilemme];
      const opts = choixDilemme(s).filter(o => o.possible !== false);
      resoudreDilemme(s, opts.find(o => o.id === voulu) ? voulu : opts.at(-1).id);
    }
    chaqueJour(s); if (HOOK) HOOK(s);
    jourSuivant(s);
  }
  return s;
}
const toutes = (s, j, n) => { for (const p of ['salon', 'chambre', 'cuisine']) { s.pieces[p].consigneJour = j; s.pieces[p].consigneNuit = n; } };

function naive() {
  const s = nouvellePartie(GRAINE);
  s.central = { consigneJour: 22, consigneNuit: 21 };
  return jouer(s, (s) => { if (s.jour % 3 === 2) planifierLessive(s, { temp: 40, sechage: 'machine' }); },
    { invites: 'chauffer', promo: 'acheter', panne: 'technicien' });
}
function defaut() { // ne touche à rien : thermostat 20/18, fenêtre entrouverte, lessive 40 °C hebdo
  const s = nouvellePartie(GRAINE);
  return jouer(s, (s) => { if (s.jour % 7 === 6) planifierLessive(s, { temp: 40, sechage: 'air' }); });
}
function glacial() {
  const s = nouvellePartie(GRAINE);
  s.central = { consigneJour: 8, consigneNuit: 8 };
  return jouer(s, (s) => { if (s.jour % 4 === 3) planifierLessive(s, { temp: 30, sechage: 'air' }); }, { panne: 'laverie' });
}
// Malin : équipements bon marché, consignes basses, quelques couches, sans optimiser à fond
function maligne() {
  const s = nouvellePartie(GRAINE);
  return jouer(s, (s) => {
    if (s.jour === 0) { acheter(s, 'thermometre'); acheter(s, 'purge'); acheterVetement(s, 'sweat'); acheterVetement(s, 'polaire'); acheterVetement(s, 'chaussettes'); s.aeration = 'breve'; }
    if (s.jour === 1) { acheter(s, 'calfeutrage'); acheter(s, 'bouillotte'); acheter(s, 'housse'); s.utiliserBouillotte = true; }
    if (s.jour === 5) { acheter(s, 'robinets'); toutes(s, 16, 14); s.pieces.salon.consigneJour = 18; s.pieces.salon.consigneNuit = 15; s.pieces.chambre.consigneNuit = 15; }
    if (s.jour === 10) s.rideaux = 'nuit';
    if (s.jour % 7 === 6) planifierLessive(s, { temp: 30, sechage: 'air' });
    if (s.jour < 5) s.central = { consigneJour: 19, consigneNuit: 15 };
  }, { invites: 'preter', promo: 'attendre', panne: 'laverie' });
}
// Maître : tout l'arsenal, introduit progressivement pour ménager la volonté
export function maitre() {
  const s = nouvellePartie(GRAINE);
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
  }, { invites: 'preter', promo: 'attendre', panne: 'diy' });
}
// --- saisons : alléger les vêtements, stratégies d'été
function saisons(s, malin) {
  const j = s.jour;
  if (j === 56) for (const id of ['pilou', 'plaid', 'polaire', 'souscouche']) if (s.vetements[id]) s.vetements[id].porte = false;
  if (j === 56) { s.vetements.tshirt.porte = true; s.rideaux = 'ouverts'; s.utiliserBouillotte = false; }
  if (j === 84) { for (const id of Object.keys(s.vetements)) s.vetements[id].porte = id === 'tshirt' || id === 'chaussettes' && false; s.vetements.tshirt.porte = true; s.portes = 'ouvertes'; }
  if (malin && j === 84) { s.voletsJour = true; s.ventNuit = true; s.aeration = 'breve'; }
}
const rafraichirVet = (s) => { if (s.vetements.tshirt.salete >= 80 && s.jour >= 84) laverMain(s, 'tshirt'); };

function ajoute(nom, f) { STRATS.push([nom, f]); }
const STRATS = [];
ajoute('ne rien toucher', defaut);
ajoute('naïf', () => {
  const s = nouvellePartie(GRAINE);
  s.central = { consigneJour: 22, consigneNuit: 21 };
  s.sys.douche.minutes = 15; s.sys.regime = 'livraison'; s.sys.plaisirs = 35;
  return jouer(s, (s) => {
    saisons(s, false);
    if (s.jour === 84) { acheter(s, 'clim'); s.climActive = true; s.climConsigne = 23; }
    if (s.jour % 3 === 2) planifierLessive(s, { temp: 40, sechage: 'machine' });
  }, { invites: 'chauffer', promo: 'acheter', panne: 'technicien', livraison: 'accepter', robot: 'acheter', promoPerissable: 'acheter', canicule: 'clim', barbecue: 'aller' });
});
ajoute('glacial', () => {
  const s = glacial(); return s;
});
// Austère extrême : tout couper, douche au seau, pâtes, zéro plaisir, rien ne se lave
ajoute('austère extrême', () => {
  const s = nouvellePartie(GRAINE);
  const c = actions(s);
  s.central = { consigneJour: 14, consigneNuit: 12 };
  Object.assign(s.sys, { regime: 'austere', plaisirs: 0, vaisselle: 'bassine' });
  s.sys.douche.seau = true; s.sys.ballon.consigne = 45; s.aeration = 'jamais';
  return jouer(s, (s) => {
    if (s.jour === 0) { acheter(s, 'seau'); for (const id of ['streaming', 'musique', 'sport']) resilier(s, id, c); }
    if (s.jour === 1) { faireReleves(s, c); for (const id of ['cloud', 'assurance', 'appli']) resilier(s, id, c); renegocier(s, c); }
    saisons(s, true);
    if (s.jour % 14 === 13) planifierLessive(s, { temp: 30, sechage: 'air' });
  }, { invites: 'refuser', promo: 'attendre', panne: 'laverie', livraison: 'refuser', robot: 'refuser', promoPerissable: 'refuser', canicule: 'subir', barbecue: 'refuser' });
});
ajoute('malin', () => {
  const s = maligne(); return s;
});
ajoute('maître', () => maitre());

// enrichit malin et maître avec les nouveaux systèmes via un hook
const HOOKS = {
  malin(s) {
    const c = actions(s), j = s.jour;
    if (j === 2) { acheter(s, 'pommeau'); s.sys.ballon.consigne = 55; s.sys.douche.minutes = 7; }
    if (j === 3) { acheter(s, 'multiprise'); s.sys.regime = 'maison'; s.sys.plaisirs = 20; }
    if (j === 6) { faireReleves(s, c); }
    if (j === 7) { resilier(s, 'cloud', c); resilier(s, 'appli', c); }
    if (j === 20) acheter(s, 'led');
    if (j === 60) s.sys.vaisselle = 'bassine';
    if (j === 84) acheter(s, 'ventilateur', true), s.ventilateur = true;
    saisons(s, true); rafraichirVet(s);
  },
  maître(s) {
    const c = actions(s), j = s.jour, y = s.sys;
    if (j === 0) { changerTarif(s, 'hphc', c); acheter(s, 'pommeau'); acheter(s, 'mousseurs'); y.ballon.consigne = 55; y.douche.minutes = 6; }
    if (j === 3) { acheter(s, 'jaquette'); acheter(s, 'multiprise'); faireReleves(s, c); }
    if (j === 4) { for (const id of ['cloud', 'assurance', 'appli', 'sport']) resilier(s, id, c); renegocier(s, c); }
    if (j === 6) { revendre(s, 'console', c); prendreMediatheque(s, c); y.plaisirs = 10; }
    if (j === 8) { acheter(s, 'boites'); acheter(s, 'autocuiseur', true); y.regime = 'batch'; }
    if (j === 12) acheter(s, 'led');
    if (j === 15) y.ballon.mode = 'hc';
    if (j === 25) y.vaisselle = 'bassine';
    if (j === 30) { revendre(s, 'velo', c); }
    if (j === 40) degivrer(s, c);
    if (j === 56) { acheter(s, 'composteur'); acheter(s, 'potager'); acheter(s, 'herbes'); acheter(s, 'corde'); acheter(s, 'cuve'); }
    if (j === 60) { acheter(s, 'fourSolaire', true); y.cuisineSolaire = true; y.ballon.mode = 'midi'; }
    if (j === 84) { acheter(s, 'ventilateur', true); acheter(s, 'moustiquaire'); s.ventilateur = true; }
    saisons(s, true); rafraichirVet(s);
    if (j >= 56 && linge(s).length && remplissage(s) >= 0.75) planifierLessive(s, { temp: 30, sechage: 'dehors', hc: true });
  },
};
const _jouer = jouer;

function lancer(graine) {
  GRAINE = graine;
  const res = [];
  for (const [nom, f] of STRATS) {
    HOOK = HOOKS[nom] || null;
    const s = f(); HOOK = null;
    res.push([nom, s, scoreFinal(s)]);
  }
  return res;
}
const pad = (x, n) => String(x).padEnd(n);
const lignes = [];
let ok = true;
const graines = [2026, 7, 1789];
const tous = {};
for (const g of graines) {
  console.log(`\n=== graine ${g} ===`);
  for (const [nom, s, r] of lancer(g)) {
    const m = r.moy;
    console.log(`${pad(nom, 16)} coût ${r.cout.toFixed(0)} € | voisin ${r.base.toFixed(0)} € | éco ${r.economies.toFixed(0)} € (${r.pct.toFixed(1)} %) | confort ${m.confort.toFixed(0)} santé ${m.sante.toFixed(0)} moral ${m.moral.toFixed(0)} hygiène ${m.hygiene.toFixed(0)} bien-être ${m.bienetre.toFixed(0)} | rechutes ${s.rechutes} hab ${r.habitudes} princ ${r.principes} | ${r.titre}${r.note ? ' (' + r.note + ')' : ''}`);
    (tous[nom] ||= []).push(r);
    if (g === 2026 && nom === 'maître') console.log('   domaines maître :', r.domaines.map(d => `${d.nom} ${d.valeur.toFixed(0)}`).join(' · '));
  }
}
const R = (n) => tous[n];
for (let i = 0; i < graines.length; i++) {
  const ch = (c, t) => { if (!c) { ok = false; console.log('✗', graines[i], t); } };
  ch(R('maître')[i].rang > R('austère extrême')[i].rang, 'maître > austère (rang)');
  ch(R('maître')[i].rang >= 3, 'maître rang ≥ 3');
  ch(R('malin')[i].economies > R('ne rien toucher')[i].economies, 'malin > défaut');
  ch(R('austère extrême')[i].rang <= 2, 'austère plafonné');
  ch(R('glacial')[i].rang <= 1, 'glacial perd');
  ch(R('naïf')[i].rang === 0, 'naïf perd');
  ch(R('ne rien toucher')[i].rang <= 1, 'défaut perd');
}
// sauvegarde aller-retour + ancienne sauvegarde
const mem = { d: {}, setItem(k, v) { this.d[k] = v; }, getItem(k) { return this.d[k] ?? null; }, removeItem(k) { delete this.d[k]; } };
GRAINE = 2026; const sv = defaut(); sauvegarder(sv, mem); const sv2 = charger(mem);
if (!(sv2.jour === sv.jour && sv2.meteo.length === sv.meteo.length && sv2.sys && sv2.hygiene === sv.hygiene)) { ok = false; console.log('✗ sauvegarde'); }
mem.setItem('economie-game-sauvegarde', JSON.stringify({ version: 2, jour: 5 }));
if (charger(mem) !== 'ancienne' || mem.getItem('economie-game-sauvegarde') !== null) { ok = false; console.log('✗ migration ancienne sauvegarde'); }
console.log(ok ? '\nOK' : '\nÉCHEC'); process.exit(ok ? 0 : 1);
