// Test headless : 4 stratégies sur 8 semaines (graine 2026)
import { nouvellePartie, sauvegarder, charger } from '../js/state.js';
import { jourSuivant, scoreFinal, acheter, acheterVetement, planifierLessive, resoudreDilemme, choixDilemme, aererVetement, repriser, reparerMachine, laverMain, linge, remplissage } from '../js/simulation.js';

function jouer(s, chaqueJour, dilemmes = {}) {
  while (!s.fini) {
    if (s.dilemme) {
      const voulu = dilemmes[s.dilemme];
      const opts = choixDilemme(s).filter(o => o.possible !== false);
      resoudreDilemme(s, opts.find(o => o.id === voulu) ? voulu : opts.at(-1).id);
    }
    chaqueJour(s);
    jourSuivant(s);
  }
  return s;
}
const toutes = (s, j, n) => { for (const p of ['salon', 'chambre', 'cuisine']) { s.pieces[p].consigneJour = j; s.pieces[p].consigneNuit = n; } };

function naive() {
  const s = nouvellePartie(2026);
  s.central = { consigneJour: 22, consigneNuit: 21 };
  return jouer(s, (s) => { if (s.jour % 3 === 2) planifierLessive(s, { temp: 40, sechage: 'machine' }); },
    { invites: 'chauffer', promo: 'acheter', panne: 'technicien' });
}
function defaut() { // ne touche à rien : thermostat 20/18, fenêtre entrouverte, lessive 40 °C hebdo
  const s = nouvellePartie(2026);
  return jouer(s, (s) => { if (s.jour % 7 === 6) planifierLessive(s, { temp: 40, sechage: 'air' }); });
}
function glacial() {
  const s = nouvellePartie(2026);
  s.central = { consigneJour: 8, consigneNuit: 8 };
  return jouer(s, (s) => { if (s.jour % 4 === 3) planifierLessive(s, { temp: 30, sechage: 'air' }); }, { panne: 'laverie' });
}
// Malin : équipements bon marché, consignes basses, quelques couches, sans optimiser à fond
function maligne() {
  const s = nouvellePartie(2026);
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
  const s = nouvellePartie(2026);
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
const lignes = [];
const fmt = (n, s) => { const r = scoreFinal(s); lignes.push([n, r]); return `${n.padEnd(8)} coût ${r.cout.toFixed(0)} € | voisin ${r.base.toFixed(0)} € | économies ${r.economies.toFixed(0)} € (${r.pct.toFixed(0)} %) | confort ${r.confortMoy.toFixed(0)} | santé ${r.sante.toFixed(0)} | volonté ${s.volonte.toFixed(0)} | rechutes ${s.rechutes} | habitudes ${r.habitudes} | principes ${r.principes} | capital ${r.capital.toFixed(0)} € | ${r.titre}${r.note ? ' (' + r.note + ')' : ''}`; };
const a = naive(), b = maligne(), c = glacial(), m = maitre();
for (const [n, s] of [["malin", b], ["maître", m]]) console.log(n, "lessives", s.lessives, "remplissage moyen", (s.sommeRemplissage / Math.max(1, s.lessives)).toFixed(2), "dépenses", JSON.stringify(Object.fromEntries(Object.entries(s.depenses).map(([k, v]) => [k, Math.round(v)]))), "attrib", JSON.stringify(Object.fromEntries(Object.entries(s.attribution).map(([k, v]) => [k, Math.round(v)]))), "panne", s.machine.enPanne);
const d0 = defaut();
for (const [n, s] of [['défaut', d0], ['naïf', a], ['glacial', c], ['malin', b], ['maître', m]]) console.log(fmt(n, s));
const rm = scoreFinal(m); console.log('maître, domaines :', rm.domaines.map(d => `${d.nom} ${d.valeur.toFixed(0)}`).join(' · '));
console.log('maître, meilleure :', rm.meilleure.nom, rm.meilleure.gain.toFixed(0), '€ ; voisin gaz', m.base.gaz.toFixed(0), '€');
// sauvegarde aller-retour
const mem = { d: {}, setItem(k, v) { this.d[k] = v; }, getItem(k) { return this.d[k] ?? null; } };
sauvegarder(b, mem); const b2 = charger(mem);
const ra = scoreFinal(a), rb = scoreFinal(b), rc = scoreFinal(c);
const ok = rb.economies > ra.economies + 80 && rb.sante > 60 && rb.confortMoy > 60 && rb.confortMoy < 97
  && rc.rang <= 1 && rm.economies > rb.economies && rm.rang >= 3 && rm.sante >= 75 && b2.jour === b.jour && b2.meteo.length === b.meteo.length;
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
