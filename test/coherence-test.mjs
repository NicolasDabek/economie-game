// v1.0 : cohérence des chiffres affichés avec la simulation.
// - factures = consommations × tarifs (somme des factures = gaz + électricité + eau + abonnements d'énergie) ;
// - économies par domaine : leur somme = économies totales (bilan, tableau de bord, écran de fin) ;
// - postes du tableau de bord = domaines du bilan (même écart au voisin) ;
// - « déjà rapporté » du tableau de bord = rentabilité mesurée (roi.js) ;
// - aucun NaN / Infinity / undefined / valeur impossible, dans l'état comme dans le HTML rendu ;
// - dates continues, fin de campagne au bon jour ;
// - prix de data.js = prix documentés dans docs/prix.md.
import fs from 'fs';
import { nouvellePartie } from '../js/state.js';
import { jourSuivant, choixDilemme, resoudreDilemme, scoreFinal, eur, acheter, actions } from '../js/simulation.js';
import { rendreTableau, postes, recommandations, suivreConseil, appliquerConseil, alertes } from '../js/tableau.js';
import { tableauROI } from '../js/roi.js';
import { dateDuJour } from '../js/meteo.js';
import { PRIX, ACHATS, TARIFS } from '../js/data.js';
import { makeRng } from '../js/rng.js';
import { reinitialiserIndices } from '../js/annee.js';
import { VERSION } from '../js/version.js';
import { readFileSync } from 'node:fs';

let ok = true, n = 0;
const ko = (t) => { ok = false; if (n++ < 40) console.log('✗', t); };
const proche = (a, b, tol = 0.01) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const MAUVAIS = /NaN|Infinity|undefined|\[object|null €/;

function verifier(s, nom) {
  const r = scoreFinal(s);
  // 1. nombres finis, jauges dans [0, 100], dépenses positives
  for (const [k, v] of Object.entries(s.depenses)) { if (!Number.isFinite(v)) ko(`${nom} j${s.jour} dépense ${k} = ${v}`); else if (v < -1e-6 && k !== 'reventes') ko(`${nom} j${s.jour} dépense ${k} négative (${v})`); }
  for (const [k, v] of Object.entries(s.base)) if (typeof v === 'number' && !Number.isFinite(v)) ko(`${nom} voisin ${k} = ${v}`);
  for (const g of ['confort', 'sante', 'volonte', 'hygiene', 'bienetre']) if (!(s[g] >= 0 && s[g] <= 100)) ko(`${nom} j${s.jour} jauge ${g} = ${s[g]}`);
  for (const k of ['argent', 'economies', 'pct', 'cout', 'base', 'patrimoine']) { const v = k === 'argent' ? s.argent : r[k]; if (!Number.isFinite(v)) ko(`${nom} ${k} = ${v}`); }
  // 2. somme des domaines = économies
  const somme = r.domaines.reduce((a, d) => a + d.valeur, 0);
  if (!proche(somme, r.economies, 1e-6)) ko(`${nom} Σ domaines ${somme.toFixed(2)} ≠ économies ${r.economies.toFixed(2)}`);
  // 3. factures = gaz + électricité + eau + abonnements d'énergie
  const F = s.factures.reduce((a, f) => a + f.montant, 0) + s.factureSemaine, d = s.depenses;
  if (!proche(F, d.gaz + d.elec + d.eau + d.abonnements, 1e-6)) ko(`${nom} factures ${F.toFixed(2)} ≠ consommations ${(d.gaz + d.elec + d.eau + d.abonnements).toFixed(2)}`);
  for (const f of s.factures) if (!(f.montant >= 0) || Object.values(f.parPiece).some(x => !Number.isFinite(x))) { ko(`${nom} facture S${f.semaine} invalide`); break; }
  // 4. postes du tableau de bord = domaines du bilan
  const P = Object.fromEntries(postes(s).map(p => [p.id, p.voisin - p.moi]));
  const D = (debut) => r.domaines.find(x => debut.endsWith('=') ? x.nom === debut.slice(0, -1) : x.nom.startsWith(debut))?.valeur ?? 0;
  for (const [id, deb] of [['chauffage', 'Chauffage'], ['eauChaude', 'Eau chaude'], ['eau', 'Eau='], ['alim', 'Alimentation'], ['elec', 'Autre électricité'], ['clim', 'Rafraîchissement'], ['services', 'Abonnements'], ['plaisirs', 'Plaisirs'], ['transport', 'Transport'], ['linge', 'Linge']])
    if (!proche(P[id], D(deb), 1e-6)) ko(`${nom} poste ${id} ${P[id].toFixed(2)} ≠ domaine ${deb} ${D(deb).toFixed(2)}`);
  // 5. HTML du tableau de bord : pas de valeur cassée, chiffres clés identiques au bilan
  const html = rendreTableau(s);
  const m = html.match(MAUVAIS); if (m) ko(`${nom} j${s.jour} HTML du tableau de bord contient « ${m[0]} » : …${html.slice(Math.max(0, m.index - 80), m.index + 20)}…`);
  if (!html.includes(eur(r.economies))) ko(`${nom} économies du tableau de bord ≠ bilan (${eur(r.economies)})`);
  const roi = tableauROI(s), deja = roi.reduce((a, x) => a + x.mesure, 0);
  if (roi.length && !html.includes(eur(deja))) ko(`${nom} « déjà rapporté » ≠ rentabilité mesurée (${eur(deja)})`);
  for (const x of roi) if (![x.mesure, x.annuel, x.prix].every(Number.isFinite)) ko(`${nom} ROI ${x.id} non fini`);
  for (const a of alertes(s)) if (MAUVAIS.test(a[1])) ko(`${nom} alerte cassée : ${a[1]}`);
  for (const x of recommandations(s)) if (MAUVAIS.test(x.titre + (x.jauge || ''))) ko(`${nom} conseil cassé : ${x.titre}`);
  // 6b. la simulation à blanc des conseils ne fait pas fuir les prix du futur dans l'affichage
  { const avant = PRIX.gazKwh; recommandations(s); if (PRIX.gazKwh !== avant) ko(`${nom} j${s.jour} le conseiller a modifié le prix du gaz affiché`); }
  // 6. conseils : jamais un achat déjà possédé
  for (const x of recommandations(s)) if (x.action?.type === 'achat' && s.possede[x.action.id]) ko(`${nom} conseille d'acheter ${x.action.id} déjà possédé`);
}

function partie(nom, graine, annees, joueur) {
  const s = nouvellePartie(graine, annees);
  let dPrec = dateDuJour(0);
  while (!s.fini) {
    if (s.dilemme) { const o = choixDilemme(s).filter(o => o.possible !== false); resoudreDilemme(s, (joueur.choix || ((o) => o[0]))(o).id); continue; }
    joueur.jour?.(s);
    jourSuivant(s);
    const dt = dateDuJour(s.jour); if (dt - dPrec !== 86400000) ko(`${nom} date discontinue au jour ${s.jour}`); dPrec = dt;
    if (s.jour % 91 === 0) verifier(s, nom);
  }
  if (s.jour !== s.joursTotal) ko(`${nom} fin au jour ${s.jour} au lieu de ${s.joursTotal}`);
  verifier(s, nom + ' (fin)');
  const r = scoreFinal(s);
  console.log(`✓ ${nom} : ${annees} ans, éco ${eur(r.economies)} (${r.pct.toFixed(1)} %), ${r.titre}`);
}
partie('passif', 2026, 3, {});
partie('débutant', 7, 3, { jour: (s) => { if (s.jour % 3 === 0) for (const r of recommandations(s)) if (suivreConseil(s, r)) break; } });
// fouillis : achats et conseils au hasard, choix au hasard (cherche les NaN et les valeurs impossibles)
{ const rng = makeRng(99);
  partie('fouillis', 1789, 5, {
    choix: (o) => o[Math.floor(rng() * o.length)],
    jour: (s) => {
      if (rng() < 0.05) { const ids = Object.keys(ACHATS).filter(id => !s.possede[id]); const id = ids[Math.floor(rng() * ids.length)]; if (id) acheter(s, id, actions(s)); }
      if (rng() < 0.2) { const R = recommandations(s); const x = R[Math.floor(rng() * R.length)]; if (x?.action) appliquerConseil(s, x.action); }
      if (rng() < 0.02) s.sys.plaisirs = [0, 10, 20, 35][Math.floor(rng() * 4)];
      if (rng() < 0.02) s.sys.tarif = Object.keys(TARIFS)[Math.floor(rng() * Object.keys(TARIFS).length)];
    },
  }); }
// 7. prix documentés (prix de départ : les parties ci-dessus ont fait jouer l'inflation)
{ reinitialiserIndices(); const md = fs.readFileSync(new URL('../docs/prix.md', import.meta.url), 'utf8');
  const nb = (t) => Number(t.replace(/[  ]/g, '').replace(',', '.'));
  const doc = (re) => { const m = md.match(re); return m ? nb(m[1]) : NaN; };
  const PAIRES = [
    ['électricité kWh', PRIX.elecKwh, /Électricité, kWh \| \*\*([\d,]+) €/], ['abonnement électricité', PRIX.aboElecMois, /Électricité, abonnement \| \*\*([\d,]+) €/],
    ['gaz kWh', PRIX.gazKwh, /Gaz, kWh \(chauffage\) \| \*\*([\d,]+) €/], ['abonnement gaz', PRIX.aboGazAn, /Gaz, abonnement \| \*\*([\d,]+) €/],
    ['eau m³', PRIX.eauM3, /Eau \(potable \+ assainissement\) \| \*\*([\d,]+) €/], ['dose de lessive', PRIX.doseLessive, /Dose de lessive \| ([\d,]+) €/],
    ['laverie lavage', PRIX.laverieLavage, /Laverie \| ([\d,]+) € le lavage/], ['laverie séchage', PRIX.laverieSechage, /\+ ([\d,]+) € le séchage/],
    ['réparation technicien', PRIX.reparationTechnicien, /Réparation du lave-linge \(technicien\) \| ([\d,]+) €/], ['pièce détachée', PRIX.reparationPiece, /Pièce détachée.*?\| ([\d,]+) €/],
    ['appoint', ACHATS.appoint.prix, /bain d'huile 1 500 W \| ([\d,]+) €/], ['panneau solaire', ACHATS.solaire.prix, /400 Wc \| \*\*([\d,]+) €/],
    ['HC Base', TARIFS.base?.aboMois ?? PRIX.aboElecMois, /\| Base \| ([\d,]+) €\/mois/],
  ];
  const EQ = { thermometre: 'Thermomètres de pièce ×3', hygrometre: 'Hygromètre', wattmetre: 'Wattmètre de prise', calfeutrage: 'Joints de fenêtres (calfeutrage)', boudin: 'Boudins de porte ×2', rideauxTh: 'Rideaux thermiques (3 fenêtres)', robinets: 'Robinets thermostatiques ×3', purge: 'Clé de purge', bouillotte: 'Bouillotte 2 l', housse: 'Housse de bouillotte tricotée', couture: 'Kit de couture' };
  for (const [id, lib] of Object.entries(EQ)) PAIRES.push([lib, ACHATS[id]?.prix, new RegExp('\\| ' + lib.replace(/[()×]/g, (c) => '\\' + c) + ' \\| ([\\d,]+) €')]);
  let bons = 0;
  for (const [lib, val, re] of PAIRES) { const v = doc(re); if (!Number.isFinite(v)) ko(`prix.md : « ${lib} » introuvable`); else if (Math.abs(v - val) > 1e-9) ko(`prix ${lib} : data.js ${val} ≠ prix.md ${v}`); else bons++; }
  console.log(`✓ ${bons}/${PAIRES.length} prix conformes à docs/prix.md`);
}
// v1.11 (passe GD 11) : euros réels, substitution théorique et confort distincts (corde, ventilateur, clim)
{ const { planifierLessive } = await import('../js/simulation.js');
  const { LESSIVE } = await import('../js/data.js');
  const av = (s, n, f) => { for (let i = 0; i < n && !s.fini; i++) { if (s.dilemme) resoudreDilemme(s, choixDilemme(s).filter(o => o.possible !== false).at(-1).id); s.tempsUtilise = 0; f?.(s, i); jourSuivant(s); } };
  // une partie (machine maintenue en état pour isoler le séchage) : 120 j sans rien, puis 30 j de lessives tous les 3 j avec le séchage « avant », achat de la corde, puis 30 j avec « après »
  const partie = (avant, apres) => { const s = nouvellePartie(2026, 1); s.argent += 2000; av(s, 120);
    av(s, 30, (x, i) => { x.machine.enPanne = false; x.machine.usure = 0; if (i % 3 === 0) planifierLessive(x, { temp: 30, sechage: avant }); });
    s.tempsUtilise = 0; if (!acheter(s, 'corde')) ko('achat corde impossible'); const lin0 = s.depenses.linge, att0 = s.attribution.corde || 0, th0 = s.attributionTheorique?.corde || 0;
    av(s, 30, (x, i) => { x.machine.enPanne = false; x.machine.usure = 0; if (i % 3 === 0) planifierLessive(x, { temp: 30, sechage: apres }); });
    return { s, linge: s.depenses.linge - lin0, att: (s.attribution.corde || 0) - att0, th: (s.attributionTheorique?.corde || 0) - th0 }; };
  const sansSL = partie('air', 'dehors'), avecSL = partie('machine', 'dehors'), temoinSL = partie('machine', 'machine');
  const reelle = temoinSL.linge - avecSL.linge;   // économie réelle correspondante : mêmes lessives au sèche-linge
  if (!(sansSL.att === 0 && sansSL.th > 0)) ko(`corde sans sèche-linge : ${sansSL.att} € réels (attendu 0), ${sansSL.th.toFixed(2)} € théoriques`);
  else console.log(`✓ corde, joueur sans sèche-linge : 0 € réel, ${sansSL.th.toFixed(2)} € de substitution théorique (non comptée)`);
  if (!(avecSL.att > 0 && avecSL.att <= reelle + 0.01 && avecSL.th === 0)) ko(`corde avec sèche-linge : ${avecSL.att.toFixed(2)} € attribués pour ${reelle.toFixed(2)} € réellement économisés`);
  else console.log(`✓ corde, joueur au sèche-linge : ${avecSL.att.toFixed(2)} € attribués ≤ ${reelle.toFixed(2)} € réellement économisés (tolérance 0,01 €)`);
  // ventilateur : un été entier ventilateur allumé, clim éteinte ; sans clim / avec clim possédée mais éteinte
  const ete = (clim) => { const s = nouvellePartie(2026, 1); s.argent += 2000; av(s, 150); acheter(s, 'ventilateur'); if (clim) acheter(s, 'clim'); s.ventilateur = true; s.climActive = false; av(s, 150, (x) => { x.ventilateur = true; x.climActive = false; });
    return { s, reel: s.attribution.ventilateur || 0, th: s.attributionTheorique?.ventilateur || 0, canicule: s.joursCanicule || 0 }; };
  const vS = ete(false), vC = ete(true);
  if (!(vS.reel <= 0 && vC.th === 0 && Math.abs((vS.reel + vS.th) - (vC.reel + vC.th)) <= 0.01)) ko(`ventilateur : sans clim réel ${vS.reel.toFixed(2)} € / théorique ${vS.th.toFixed(2)} € ; avec clim réel ${vC.reel.toFixed(2)} € / théorique ${vC.th.toFixed(2)} € (double attribution ou fuite)`);
  else console.log(`✓ ventilateur (${vS.canicule} j de canicule) : sans clim ${vS.reel.toFixed(2)} € réels (coût d'usage) + ${vS.th.toFixed(2)} € théoriques ; avec clim éteinte ${vC.reel.toFixed(2)} € réels ; aucune double attribution (somme identique à 0,01 €)`);
  const fiche = tableauROI(vS.s).find(x => x.id === 'ventilateur');
  if (!fiche || fiche.reel !== fiche.mesure || !fiche.confort || Math.abs(fiche.theorique - vS.th) > 1e-9) ko('fiche ventilateur : réel / théorique / confort non distingués');
  else console.log(`✓ fiche ventilateur : réel ${fiche.reel.toFixed(2)} €, théorique ${fiche.theorique.toFixed(2)} €, confort`);
}
{ const pk = JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version;
  if (pk !== VERSION) { ok = false; console.log(`✗ version : package.json ${pk} ≠ js/version.js ${VERSION}`); } else console.log(`✓ version ${VERSION} (package.json = interface)`); }
console.log(ok ? 'OK' : 'ÉCHEC'); process.exit(ok ? 0 : 1);
