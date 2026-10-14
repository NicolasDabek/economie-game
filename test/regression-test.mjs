// Tests de non-régression v0.8.1 : réabonnement, étiquettes d'habitude, paliers de moral et de bien-être
import { nouvellePartie } from '../js/state.js';
import { actions, jourSuivant, resoudreDilemme, choixDilemme, gestesActifs } from '../js/simulation.js';
import { resilier, reabonner, renegocier, faireReleves } from '../js/systemes.js';
import { ABONNEMENTS, REABONNEMENT, JOURS_HABITUDE, HABITUDE_OUBLI } from '../js/data.js';
import { tagGeste } from '../js/onglets.js';
import { palierMoral, palierBE } from '../js/paliers.js';

let ok = true;
const ch = (c, t) => { console.log(c ? '✓' : '✗', t); if (!c) ok = false; };
const jour = (s, n = 1) => { for (let i = 0; i < n; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false).at(-1).id); jourSuivant(s); } };

// ---------- 1. se réabonner ----------
{
  const s = nouvellePartie(2026), c = actions(s), A = s.sys.abonnements;
  ch(resilier(s, 'streaming', c) && !A.streaming.actif, 'streaming résilié');
  jour(s);
  const services0 = s.depenses.services, argent0 = s.argent;
  ch(reabonner(s, 'streaming', c) && A.streaming.actif, 'se réabonner au streaming');
  ch(s.argent === argent0, 'streaming : sans frais');
  ch(!reabonner(s, 'streaming', c), 'pas de double réabonnement');
  jour(s);
  ch(s.depenses.services > services0, 'le réabonnement est facturé dès le lendemain (carnet de comptes)');
  // forfait : la remise négociée est perdue, carte SIM facturée
  renegocier(s, c); ch(A.forfait.renegocie, 'forfait renégocié');
  resilier(s, 'forfait', c); ch(!A.forfait.renegocie, 'la remise disparaît à la résiliation');
  const sv = s.depenses.services, ar = s.argent;
  reabonner(s, 'forfait', c);
  ch(A.forfait.actif && !A.forfait.renegocie && Math.abs(ar - s.argent - REABONNEMENT.forfait.frais) < 1e-9 && Math.abs(s.depenses.services - sv - REABONNEMENT.forfait.frais) < 1e-9, `forfait : prix catalogue ${ABONNEMENTS.forfait.mois} €, SIM ${REABONNEMENT.forfait.frais} € au carnet`);
  // sport : frais d'inscription et engagement de 12 mois
  jour(s); resilier(s, 'sport', c); jour(s);
  ch(reabonner(s, 'sport', c) && A.sport.engageJusqua > s.jour + 360, 'salle de sport : engagement 12 mois');
  jour(s);
  ch(!resilier(s, 'sport', c) && A.sport.actif, 'impossible de résilier pendant l\'engagement');
  // moral / plaisir : le bien-être des abonnements revient
  const b = nouvellePartie(2026), cb = actions(b);
  resilier(b, 'streaming', cb); resilier(b, 'musique', cb); jour(b, 20); const sans = b.bienetre;
  reabonner(b, 'streaming', cb); reabonner(b, 'musique', cb); jour(b, 20);
  ch(b.bienetre > sans, `plaisir rétabli : bien-être ${sans.toFixed(1)} → ${b.bienetre.toFixed(1)}`);
}

// ---------- 2. étiquettes d'habitude ----------
{
  const s = nouvellePartie(2026);
  s.portes = 'fermees';
  jour(s, JOURS_HABITUDE + 1);
  ch(s.gestes.portes.habitude && tagGeste(s, 'portes').includes('habitude acquise'), 'portes fermées : habitude acquise');
  s.portes = 'ouvertes';
  const t = tagGeste(s, 'portes');
  ch(!t.includes('acquise') && t.includes('pause'), `changement immédiat de l'étiquette : « ${t.replace(/<[^>]+>/g, '')} »`);
  jour(s, HABITUDE_OUBLI.graceJours);
  ch(!s.gestes.portes.habitude && s.gestes.portes.pratique === HABITUDE_OUBLI.retourPratique, `habitude perdue après ${HABITUDE_OUBLI.graceJours} jours sans pratique, reprise à ${HABITUDE_OUBLI.retourPratique}/${JOURS_HABITUDE}`);
  s.portes = 'fermees';
  ch(tagGeste(s, 'portes').includes(`en cours ${HABITUDE_OUBLI.retourPratique}/${JOURS_HABITUDE}`), 'reprise : habitude en cours');
  // apprentissage abandonné : le progrès s'efface
  const r = nouvellePartie(2026); r.rideaux = 'nuit'; jour(r, 4);
  const p = r.gestes.rideaux.pratique; r.rideaux = 'ouverts'; jour(r, 2);
  ch(r.gestes.rideaux.pratique === p - 2 && tagGeste(r, 'rideaux').includes('pause'), `rideaux : progrès ${p} → ${r.gestes.rideaux.pratique} après abandon`);
  r.rideaux = 'fermes'; jour(r, 10);
  ch(r.gestes.rideaux.pratique === 0 && tagGeste(r, 'rideaux') === '', 'progrès effacé : plus d\'étiquette');
  // tous les gestes : jamais « acquise » quand le geste n'est pas actif
  const z = nouvellePartie(2026);
  for (const g of Object.keys(z.gestes)) { z.gestes[g].habitude = true; z.gestes[g].pratique = JOURS_HABITUDE; }
  const actifs = gestesActifs(z);
  const faux = Object.keys(z.gestes).filter(g => !actifs[g] && tagGeste(z, g).includes('acquise'));
  ch(faux.length === 0, `aucun geste inactif affiché « acquis » (${Object.keys(z.gestes).length} gestes vérifiés)`);
}

// ---------- 3. paliers ----------
ch(palierMoral(65).id === 'epanoui' && palierMoral(50).id === 'neutre' && palierMoral(30).id === 'fragile' && palierMoral(15).id === 'deprime' && palierMoral(5).id === 'crise', 'paliers de moral 60/40/25/10');
ch(palierBE(75).id === 'forme' && palierBE(55).id === 'correct' && palierBE(40).id === 'fatigue' && palierBE(25).id === 'epuise' && palierBE(10).id === 'burnout', 'paliers de bien-être 70/50/35/20');
{
  const s = nouvellePartie(2026); jour(s, 3); const a0 = s.depenses.revenus || 0;
  s.volonte = 5; jour(s);
  ch((s.depenses.revenus || 0) > a0 && s.volonte >= 25 && s.mor.crises === 1, 'crise de moral : arrêt coûteux puis remontée');
  s.bienetre = 10; jour(s);
  ch(s.mor.burnouts === 1 && s.bienetre >= 35, 'burn-out : arrêt de 2 semaines');
}
console.log(ok ? 'OK' : 'ÉCHEC'); if (!ok) process.exit(1);
