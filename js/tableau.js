// Tableau de bord (v0.8.1) : vue d'ensemble pour décider. Lecture seule de l'état, sauf l'instantané mensuel
// (dépenses par poste au 1er du mois) pris par la simulation pour comparer « ce mois-ci » et « le mois dernier ».
import { ACHATS, BANQUE } from './data.js';
import { dateDuJour, prevision } from './meteo.js';
import { scoreFinal, evenementsAVenir, tempsLibre, eur, acheter, actions, acheterVetement, gestesActifs, planifierLessive, laverMain, linge, remplissage, ROUTINES, routineDispo } from './simulation.js';
import { chapitreDuJour } from './meteo.js';
import { faireReleves, resilier, reabonner } from './systemes.js';
import { deposer } from './finance.js';
import { valeurs } from './finance.js';
import { tableauROI, estimationAchat } from './roi.js';
import { palierMoral, palierBE } from './paliers.js';
import { arbitrer, PROTEGE } from './arbitre.js';
// postes qui nourrissent une jauge : on ne les coupe pas quand cette jauge est basse
export const SOURCES = { plaisirs: ['volonte', 'bienetre'], services: ['volonte', 'bienetre'], abonnements: ['volonte', 'bienetre'], alim: ['bienetre'], chauffage: ['sante', 'confort'], eauChaude: ['hygiene'], linge: ['hygiene'] };
const valJ = (s, g) => g === 'volonte' ? s.volonte : g === 'confort' ? s.confort : s[g];
export const sourceDeJaugeBasse = (s, poste) => (SOURCES[poste] || []).some(g => valJ(s, g) < (PROTEGE[g] ?? 60) + 5);

// dépenses cumulées par poste, toi et le voisin
export function postes(s) {
  const d = s.depenses, b = s.base;
  const elecMoi = d.elec - (d.climEur || 0) - (d.appointEur || 0) - (d.eauChaudeEur || 0);
  const elecVoisin = b.elec - (b.clim || 0) - (b.eauChaude || 0);
  return [
    ['chauffage', 'Chauffage', d.gaz + (d.appointEur || 0), b.gaz, 'maison'],
    ['eauChaude', 'Eau chaude', d.eauChaudeEur || 0, b.eauChaude || 0, 'eau'],
    ['eau', 'Eau', d.eau, b.eau, 'eau'],
    ['alim', 'Alimentation', d.nourriture, b.nourriture || 0, 'cuisine'],
    ['elec', 'Électricité', elecMoi, elecVoisin, 'elec'],
    ['clim', 'Clim', d.climEur || 0, b.clim || 0, 'maison'],
    ['services', 'Abonnements', d.services, b.services || 0, 'budget'],
    ['plaisirs', 'Plaisirs', d.plaisirs, b.plaisirs || 0, 'budget'],
    ['transport', 'Transport', d.transport || 0, b.transport || 0, 'transport'],
    ['linge', 'Linge', d.produits + d.laverie, b.produits, 'linge'],
    ['imprevus', 'Imprévus et santé', d.imprevus + (d.sante || 0) + (d.logement || 0) + (d.revenus || 0), 0, 'resume'],
  ].map(([id, nom, moi, voisin, aller]) => ({ id, nom, moi, voisin, aller }));
}
const vecteur = (s) => Object.fromEntries(postes(s).map(p => [p.id, [p.moi, p.voisin]]));
/** Appelé chaque jour par la simulation : instantané au changement de mois. Sans effet sur le jeu. */
export function instantaneMois(s) {
  const m = dateDuJour(s.jour).getUTCMonth(), v = vecteur(s);
  if (!s.tab) { s.tab = { mois: m, debut: v, prec: null }; return; }
  if (s.tab.mois === m) return;
  s.tab.prec = Object.fromEntries(Object.entries(v).map(([k, [a, b]]) => [k, [a - (s.tab.debut[k]?.[0] || 0), b - (s.tab.debut[k]?.[1] || 0)]]));
  // historique mensuel (v0.9) : dépenses du mois écoulé et patrimoine, pour les courbes
  const tot = (o) => Object.values(o).reduce((t, x) => t + x, 0);
  const moi = tot(Object.fromEntries(Object.entries(s.tab.prec).map(([k, x]) => [k, x[0]]))), vz = tot(Object.fromEntries(Object.entries(s.tab.prec).map(([k, x]) => [k, x[1]])));
  const r = scoreFinal(s);
  (s.tab.hist ||= []).push({ jour: s.jour, moi, voisin: vz, pat: r.patrimoine, patV: r.patrimoineVoisin ?? null });
  s.tab.mois = m; s.tab.debut = v;
}

// courbes SVG simples (deux séries, axes, légende) ; état vide explicite
export function courbe(points, series, { unite = ' €', hauteur = 180, vide = 'Pas encore assez de données.' } = {}) {
  if (!points || points.length < 2) return `<p class="vide">📈 ${vide}</p>`;
  const W = 560, H = hauteur, g = 46, b = 24, xs = (i) => g + i * (W - g - 8) / (points.length - 1);
  const vals = points.flatMap(p => series.map(se => p[se.cle]).filter(x => x != null));
  let mn = Math.min(0, ...vals), mx = Math.max(...vals); if (mx - mn < 1) mx = mn + 1;
  const ys = (v) => H - b - (v - mn) / (mx - mn) * (H - b - 10);
  const fmt = (v) => Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k${unite.trim()}` : `${Math.round(v)}${unite}`;
  const grad = [0, 0.5, 1].map(f => mn + f * (mx - mn));
  const date = (j) => dateDuJour(j).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const pas = Math.max(1, Math.ceil(points.length / 6));
  return `<svg viewBox="0 0 ${W} ${H}" class="courbe" role="img" aria-label="${series.map(se => se.nom).join(' et ')}, de ${date(points[0].jour)} à ${date(points.at(-1).jour)}">
    ${grad.map(v => `<line x1="${g}" x2="${W - 8}" y1="${ys(v)}" y2="${ys(v)}" class="grille"/><text x="${g - 4}" y="${ys(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('')}
    ${points.map((p, i) => i % pas === 0 ? `<text x="${xs(i)}" y="${H - 6}" text-anchor="middle">${date(p.jour)}</text>` : '').join('')}
    ${series.map(se => `<polyline fill="none" stroke="${se.couleur}" stroke-width="2.5" ${se.tirets ? 'stroke-dasharray="5 4"' : ''} points="${points.map((p, i) => p[se.cle] == null ? '' : `${xs(i)},${ys(p[se.cle])}`).join(' ')}"/>`).join('')}
  </svg><div class="tb-legende">${series.map(se => `<span style="color:${se.couleur}">${se.nom}</span>`).join('')}</div>`;
}
export function rendreCourbes(s) {
  const h = s.tab?.hist || [];
  const d = document.getElementById('courbeDepenses'), p = document.getElementById('courbePatrimoine');
  if (d) d.innerHTML = courbe(h, [{ cle: 'moi', nom: 'Toi', couleur: 'var(--accent)' }, { cle: 'voisin', nom: 'Le voisin', couleur: '#9aa4b2', tirets: true }], { vide: 'La courbe apparaît après deux mois complets.' })
    + (h.length >= 2 ? `<p class="aide">Énergie, eau, courses, abonnements, plaisirs, transport, linge et imprévus (hors loyer).</p>` : '');
  if (p) p.innerHTML = courbe(h, [{ cle: 'pat', nom: 'Ton patrimoine', couleur: 'var(--ok)' }, { cle: 'patV', nom: 'Patrimoine du voisin', couleur: '#9aa4b2', tirets: true }], { vide: 'La courbe apparaît après deux mois complets.' })
    + (h.length >= 2 ? '<p class="aide">Compte courant et placements, nets de frais et d\'impôts s\'ils étaient vendus aujourd\'hui.</p>' : '');
}
export function moisCourant(s) {
  if (!s.tab) instantaneMois(s);
  return postes(s).map(p => ({ ...p, mois: p.moi - (s.tab.debut[p.id]?.[0] || 0), moisVoisin: p.voisin - (s.tab.debut[p.id]?.[1] || 0), prec: s.tab.prec?.[p.id]?.[0] ?? null }));
}

// une action concrète par poste en dérapage (le joueur sait quoi faire en arrivant)
export const GESTE_POSTE = {
  chauffage: { titre: 'Baisser le chauffage d\'1 °C (≈ −7 % de gaz)' },
  eauChaude: { titre: 'Douche de 7 min et ballon à 55 °C' },
  eau: { titre: 'Douches plus courtes, vaisselle à la bassine' },
  alim: { titre: 'Cuisiner maison plutôt qu\'acheter tout prêt' },
  elec: { titre: 'Éteindre les veilles et passer aux LED' },
  clim: { titre: 'Volets fermés le jour, fenêtres ouvertes la nuit' },
  services: { titre: 'Éplucher tes relevés et résilier l\'inutile' },
  plaisirs: { titre: 'Ramener les plaisirs à 20 €/semaine' },
  transport: { titre: 'Essayer les transports en commun ou le vélo' },
  linge: { titre: 'Lessives pleines à 30 °C, séchage à l\'air' },
};
// gestes conseillés : économie mesurée en simulant un an de « ne rien toucher » avec le seul geste en plus (graine 2026)
export const GESTES_RECO = [
  { id: 'gamelle', titre: 'Emporter sa gamelle le midi', an: 1700, aller: 'transport', fait: (s) => s.transport.repas === 'emporte', faire: (s) => { s.transport.repas = 'emporte'; }, dispo: (s) => s.jour >= 3 },
  { id: 'prixKilo', titre: 'Comparer les prix au kilo', an: 275, aller: 'cuisine', fait: (s) => !!s.sys.prixKiloGeste, faire: (s) => { s.sys.prixKiloGeste = true; } },
  { id: 'liste', titre: 'Faire une liste de courses et un menu des restes', an: 200, aller: 'cuisine', fait: (s) => !!s.sys.liste, faire: (s) => { s.sys.liste = true; } },
  { id: 'aerer', titre: 'Aérer 5 min matin et soir (fini la fenêtre entrouverte)', an: 145, aller: 'maison', fait: (s) => s.aeration !== 'entrouverte', faire: (s) => { s.aeration = 'breve'; }, hiver: true },
  { id: 'couperEau', titre: 'Couper l\'eau pendant le savonnage', an: 140, aller: 'eau', fait: (s) => !!s.sys.douche.couperEau, faire: (s) => { s.sys.douche.couperEau = true; } },
  { id: 'rideaux', titre: 'Fermer rideaux et volets la nuit', an: 70, aller: 'maison', fait: (s) => s.rideaux !== 'ouverts', faire: (s) => { s.rideaux = 'nuit'; }, hiver: true },
];
const saisonFroide = (s) => ['hiver', 'automne'].includes(chapitreDuJour(s.jour).saison);
const enApprentissage = (s) => Object.entries(gestesActifs(s)).some(([g, on]) => on && !s.gestes[g]?.habitude);
// se couvrir : pull et pantalon polaire (deux couches chaudes), achetés si besoin
function seCouvrir(s) {
  if (gestesActifs(s).couches) return null;
  for (const id of ['sweat', 'polaire']) { const v = s.vetements[id]; if (!v.possede && !acheterVetement(s, id, 'eco')) return null; s.vetements[id].porte = true; }
  return 'Pull et pantalon polaire enfilés : deux couches chaudes.';
}
// achats qui ne rapportent rien sans un réglage : on l'active (conseil) ou on le rappelle (achat manuel)
export const ACTIVATION = {
  seau: { texte: 'Active « récupérer l\'eau froide du début » dans Eau chaude.', aller: 'eau', faire: (s) => { s.sys.douche.recupEau = true; } },
  fourSolaire: { texte: 'Active la cuisine solaire dans Cuisine.', aller: 'cuisine', faire: (s) => { s.sys.cuisineSolaire = true; } },
  fresnel: { texte: 'Active la cuisine solaire dans Cuisine.', aller: 'cuisine', faire: (s) => { s.sys.cuisineSolaire = true; } },
  marmite: { texte: 'Elle ne sert qu\'en cuisinant maison : choisis « maison » ou « batch » dans Cuisine.', aller: 'cuisine', faire: (s) => { if (!['maison', 'batch', 'austere'].includes(s.sys.regime)) s.sys.regime = 'maison'; } },
  multiprise: { texte: 'Pense à l\'éteindre le soir (Électricité).', aller: 'elec', faire: (s) => { s.sys.multipriseGeste = true; } },
  bouillotte: { texte: 'Active la bouillotte du soir dans Maison › Gestes.', aller: 'maison', faire: (s) => { s.utiliserBouillotte = true; } },
  velo: { texte: 'Choisis le vélo pour aller au travail (Transport).', aller: 'transport', faire: (s) => { if (s.transport.mode === 'voiture') s.transport.mode = 'velo'; } },
  vae: { texte: 'Choisis le vélo électrique pour aller au travail (Transport).', aller: 'transport', faire: (s) => { if (s.transport.mode === 'voiture') s.transport.mode = 'vae'; } },
  corde: { texte: 'Choisis « dehors » pour le séchage quand il fait beau.', aller: 'linge', faire: () => {} },
  robinets: { texte: 'Règle maintenant chaque pièce : chambre plus fraîche, cuisine au minimum.', aller: 'maison', faire: () => {} },
};
// essai à blanc : ne proposer « Faire » que si l'action change vraiment quelque chose
function faisable(s, action) {
  const { meteo, messages, ...reste } = s;
  const t = { ...structuredClone(reste), meteo, messages: [] };
  try { return !!appliquerConseil(t, action); } catch { return false; }
}
/** Applique une recommandation en un clic (et sert de « débutant qui suit les conseils » dans les tests). Renvoie un texte ou null. */
export function appliquerConseil(s, a) {
  const y = s.sys, c = actions(s);
  if (!a) return null;
  if (a.type === 'achat') {
    if (!acheter(s, a.id)) return null;
    ACTIVATION[a.id]?.faire(s);
    return `Acheté et mis en service : ${ACHATS[a.id].nom}.`;
  }
  if (a.type === 'placer') return deposer(s, 'livretA', Math.floor(a.montant), c).ok ? `${eur(Math.floor(a.montant))} placés sur le Livret A.` : null;
  if (a.type === 'geste') { const g = GESTES_RECO.find(x => x.id === a.id); if (!g || g.fait(s)) return null; g.faire(s); return `Nouveau geste : ${g.titre.toLowerCase()}.`; }
  if (a.type === 'couvrir') return seCouvrir(s);
  if (a.type === 'lessive') { if (s.lessivePrevue || !linge(s).length) return null; return planifierLessive(s, s.sys.lessiveConseil || { temp: 30, sechage: 'air' }) ? 'Lessive lancée (30 °C, séchage à l\'air) : elle tourne cette nuit.' : null; }
  if (a.type === 'laverMain') { const ids = Object.entries(s.vetements).filter(([id, v]) => v.porte && v.salete >= 40 && laverMain(s, id)).map(([id]) => id); return ids.length ? `Lavé à la main (${ids.length} pièce${ids.length > 1 ? 's' : ''}) : propre pour demain.` : null; }
  if (a.type === 'routine') { s.auto ??= {}; if (s.auto[a.id]) return null; s.auto[a.id] = true; return `Routine activée : ${ROUTINES[a.id].nom.toLowerCase()}.`; }
  if (a.type === 'alleger') { let n = 0; for (const [id, v] of Object.entries(s.vetements)) if (v.porte && id !== 'tshirt' && id !== 'chaussettes') { v.porte = false; n++; } s.vetements.tshirt.porte = true; return n ? 'Vêtements chauds rangés jusqu\'à l\'automne.' : null; }
  if (a.type === 'sante') { if (!saisonFroide(s)) return null; const t = seCouvrir(s); if (t) return t; const C = s.central; if (s.possede.robinets) { for (const p of Object.values(s.pieces)) { p.consigneJour = Math.min(20, p.consigneJour + 1); p.consigneNuit = Math.min(18, p.consigneNuit + 1); } return 'Chauffage remonté d\'1 °C dans chaque pièce.'; } if (C.consigneJour >= 20 && C.consigneNuit >= 18) return null; C.consigneJour = Math.min(20, C.consigneJour + 1); C.consigneNuit = Math.min(18, C.consigneNuit + 1); return `Thermostat remonté : ${C.consigneJour} °C / ${C.consigneNuit} °C.`; }
  if (a.type === 'jauge') {
    if (y.plaisirs < 20) { y.plaisirs = 20; return 'Plaisirs remontés à 20 €/semaine.'; }
    if (y.plaisirs < 35) { y.plaisirs = 35; return 'Plaisirs à 35 €/semaine le temps de remonter.'; }
    for (const k of ['streaming', 'musique']) if (!y.abonnements[k].actif && reabonner(s, k, c)) return `Réabonné : ${k === 'streaming' ? 'streaming vidéo' : 'musique en ligne'}.`;
    if (!s.sys.mediatheque && s.argent > 50) { s.argent -= 20; s.depenses.services += 20; s.sys.mediatheque = true; return 'Carte de médiathèque prise (20 €/an) : livres et films à volonté.'; }
    return null;
  }
  const P = {
    chauffage: () => {
      if (saisonFroide(s) && !gestesActifs(s).couches) return seCouvrir(s);
      if (s.sante < 70) return null;   // pas de froid supplémentaire quand la santé flanche
      if (s.possede.robinets) { let ok = false; for (const p of Object.values(s.pieces)) { if (p.consigneJour > 17) { p.consigneJour--; ok = true; } if (p.consigneNuit > 15) { p.consigneNuit--; ok = true; } } return ok && 'Chaque pièce baissée d\'1 °C.'; }
      const C = s.central; if (C.consigneJour <= 18 && C.consigneNuit <= 15) return null;
      C.consigneJour = Math.max(18, C.consigneJour - 1); C.consigneNuit = Math.max(15, C.consigneNuit - 1); return `Thermostat : ${C.consigneJour} °C le jour, ${C.consigneNuit} °C la nuit.`;
    },
    eauChaude: () => { if (y.douche.minutes <= 7 && y.ballon.consigne <= 55) return null; y.douche.minutes = Math.min(7, y.douche.minutes); y.ballon.consigne = Math.min(55, y.ballon.consigne); return 'Douche de 7 min, ballon à 55 °C.'; },
    eau: () => { if (y.douche.minutes <= 7 && y.vaisselle === 'bassine') return null; y.douche.minutes = Math.min(7, y.douche.minutes); y.vaisselle = 'bassine'; return 'Douche de 7 min, vaisselle à la bassine.'; },
    alim: () => { if (y.regime === 'maison' || y.regime === 'batch') return null; y.regime = 'maison'; return 'Cuisine maison.'; },
    elec: () => { if (!s.possede.multiprise) return acheter(s, 'multiprise') ? 'Multiprise à interrupteur achetée.' : null; if (y.multipriseGeste) return null; y.multipriseGeste = true; return 'Multiprise éteinte le soir.'; },
    clim: () => { if (s.voletsJour && s.ventNuit) return null; s.voletsJour = true; s.ventNuit = true; return 'Volets fermés le jour, fenêtres ouvertes la nuit.'; },
    services: () => { const r = y.relevesFaits || faireReleves(s, c); if (!r) return null; let n = 0; for (const k of ['cloud', 'appli', 'assurance', 'sport']) if (resilier(s, k, c)) n++; return n ? `${n} abonnement(s) inutile(s) résilié(s).` : null; },
    plaisirs: () => { if (y.plaisirs <= 20) return null; y.plaisirs = 20; return 'Plaisirs à 20 €/semaine.'; },
    transport: () => { const t = s.transport; if (t.mode === 'commun' || t.mode === 'velo' || t.mode === 'vae') return null; if (s.possede.velo || s.possede.vae) { t.mode = s.possede.vae ? 'vae' : 'velo'; return 'Au travail à vélo.'; } t.mode = 'commun'; t.abonnementTC = true; return 'Transports en commun avec abonnement (50 % remboursés).'; },
    linge: () => { if (s.sys.lessiveConseil) return null; s.sys.lessiveConseil = { temp: 30, sechage: 'air' }; return 'Prochaines lessives : pleines, 30 °C, séchage à l\'air.'; },
  };
  return P[a.id]?.() || null;
}
// actions recommandées, classées par impact en €/an
export function recommandations(s, r = scoreFinal(s)) {
  const L = [], jours = Math.max(7, s.nbJours || s.jour || 7);
  for (const [id, a] of Object.entries(ACHATS)) {
    if (s.possede[id] || a.prix > s.argent - 100 || (a.temps || 0) > Math.max(0, tempsLibre(s))) continue;
    const e = estimationAchat(id); if (!e || e.mois === null || !(e.annuel > 5) || e.mois > 24) continue;
    if ((id === 'vae' && s.possede.velo) || (id === 'velo' && s.possede.vae)) continue;   // un vélo suffit
    const dom = { Instruments: 'maison', Isolation: 'maison', Chauffage: 'maison', Confort: 'maison', 'Été': 'maison', 'Ventilation passive': 'maison', 'Eau chaude': 'eau', Cuisine: 'cuisine', 'Cuisine solaire': 'cuisine', 'Électricité': 'elec', Production: 'elec', Transport: 'transport', Jardin: 'jardin' }[a.cat] || 'maison';
    if ((dom === 'transport' && s.jour < 3) || (dom === 'jardin' && s.jour < 21) || (dom === 'elec' && s.jour < 2)) continue;   // sous-onglet pas encore débloqué
    L.push({ titre: `Acheter : ${a.nom}`, an: e.annuel, roi: e.annuel / a.prix * 100, jauge: a.temps ? `−${a.temps} h de temps libre` : null, aller: 'b-' + dom, action: { type: 'achat', id } });
  }
  for (const p of postes(s)) {
    const fuite = (p.moi - p.voisin) / jours * 365;
    if (p.id !== 'imprevus' && fuite > 30 && s.jour >= 7 && !(p.aller === 'transport' && s.jour < 3)) L.push({ titre: GESTE_POSTE[p.id]?.titre || `Réduire le poste « ${p.nom.toLowerCase()} »`, an: fuite, roi: null, jauge: `${p.nom} : ${eur(fuite)}/an de plus que le voisin`, aller: p.aller, fuite: true, poste: p.id, action: { type: 'poste', id: p.id } });
  }
  // gestes : un seul à la fois (la volonté s'use quand on en apprend plusieurs)
  if (!enApprentissage(s)) for (const g of GESTES_RECO) if (!g.fait(s) && (g.dispo?.(s) ?? true) && (!g.hiver || saisonFroide(s))) { L.push({ titre: g.titre, an: g.an, roi: null, jauge: 'nouveau geste : un peu de volonté pendant 10 jours', aller: g.aller, action: { type: 'geste', id: g.id } }); break; }
  // chauffage : baisser d'1 °C si on est couvert (≈ 7 %/°C, ADEME)
  const C = s.central, haut = s.possede.robinets ? Object.values(s.pieces).some(p => p.consigneJour > 18) : C.consigneJour > 18 || C.consigneNuit > 16;
  if (saisonFroide(s) && haut && s.sante >= 70 && s.jour >= 3) {
    const gazAn = (s.base.gaz || 0) / Math.max(7, s.jour) * 365 * 0.6;
    L.push(gestesActifs(s).couches ? { titre: GESTE_POSTE.chauffage.titre, an: gazAn * 0.07, roi: null, jauge: 'confort −3 environ', aller: 'maison', action: { type: 'poste', id: 'chauffage' } }
      : { titre: 'Mettre une couche de plus (pull + polaire)', an: gazAn * 0.07, roi: null, jauge: 'confort + : permet ensuite de baisser le chauffage', aller: 'linge', action: { type: 'couvrir' } });
  }
  // hygiène : lessive (souvent la vraie cause d'une santé qui baisse hors hiver)
  const sale = Object.values(s.vetements).some(v => v.possede && v.porte && v.salete >= 80);
  const peauSale = Object.entries(s.vetements).some(([id, v]) => v.porte && v.salete >= 40 && ['tshirt', 'souscouche', 'chaussettes'].includes(id));
  if (peauSale && remplissage(s) < 0.5 && !s.auto?.entretien)
    L.push({ titre: 'Laver ton t-shirt à la main (10 min)', an: 0, roi: null, jauge: 'un seul haut porté tous les jours se salit en 3 jours', aller: 'linge', urgent: s.hygiene < 70 || sale, action: { type: 'laverMain' } });
  if (routineDispo(s, 'entretien') && !s.auto?.entretien) L.push({ titre: 'Activer la routine d\'entretien des vêtements', an: 30, roi: null, jauge: 'aérer et laver à la main sans y penser', aller: 'routines', action: { type: 'routine', id: 'entretien' } });
  if (!s.lessivePrevue && linge(s).length && (s.hygiene < 50 || remplissage(s) >= 0.5))
    L.push({ titre: 'Lancer une lessive', an: 0, roi: null, jauge: `hygiène ${Math.round(s.hygiene)} %${sale ? ' · vêtements sales sur toi' : ''}`, aller: 'linge', urgent: s.hygiene < 50 || sale, action: { type: 'lessive' } });
  if (routineDispo(s, 'lessive') && !s.auto?.lessive) L.push({ titre: 'Confier la lessive au pilote automatique', an: 50, roi: null, jauge: 'plus jamais de linge oublié', aller: 'routines', action: { type: 'routine', id: 'lessive' } });
  const chaudSaison = ['ete'].includes(chapitreDuJour(s.jour).saison) || (chapitreDuJour(s.jour).saison === 'printemps' && chapitreDuJour(s.jour).index > 45);
  if (chaudSaison && gestesActifs(s).couches) L.push({ titre: 'Ranger les vêtements chauds', an: 0, roi: null, jauge: 'confort + : il fait doux', aller: 'linge', urgent: true, action: { type: 'alleger' } });
  if (s.sante < 60 && saisonFroide(s) && s.hygiene >= 50) L.push({ titre: s.sante < 45 ? 'Te réchauffer : santé en danger' : 'Te réchauffer avant de tomber malade', an: 500, roi: null, jauge: `santé ${Math.round(s.sante)} % : sous 40, maladie et jours de carence`, aller: gestesActifs(s).couches ? 'maison' : 'linge', urgent: true, action: { type: 'sante' } });
  if (s.fin && s.argent > 3000) { const m = s.argent - 1500; L.push({ titre: `Placer ${eur(m)} sur le Livret A`, an: m * BANQUE.livretA.taux, roi: BANQUE.livretA.taux * 100, jauge: 'disponible à tout moment', aller: 'banque', action: { type: 'placer', montant: m } }); }
  const pm = palierMoral(s.volonte), pb = palierBE(s.bienetre);
  if (s.volonte < 40 || s.bienetre < 50) L.push({ titre: `Remonter ${s.volonte < 40 ? 'le moral' : 'le bien-être'} (${s.volonte < 40 ? pm.nom : pb.nom})`, an: 0, roi: null, jauge: s.volonte < 40 ? pm.conseil : pb.conseil, aller: 'budget', urgent: true, action: { type: 'jauge', id: s.volonte < 40 ? 'moral' : 'bienetre' } });
  // v0.9.1 : une fuite sans geste applicable n'est plus proposée (elle reste visible dans « Dépenses du mois par poste »)
  const ok = L.filter(x => !x.fuite || (faisable(s, x.action) && !sourceDeJaugeBasse(s, x.poste)));
  // préfiltre bon marché (les 8 meilleurs a priori), puis arbitrage par simulation à blanc
  const pre = ok.sort((a, b) => (b.urgent ? 1e9 : b.an) - (a.urgent ? 1e9 : a.an)).slice(0, 8);
  return arbitrer(s, pre, appliquerConseil).slice(0, 3);
}

export function alertes(s) {
  const A = [];
  const pm = palierMoral(s.volonte), pb = palierBE(s.bienetre);
  if (s.volonte < 40) A.push(['mal', `${pm.ico} Moral ${pm.nom.toLowerCase()} : ${pm.effet}`, 'budget']);
  if (s.bienetre < 50) A.push(['mal', `${pb.ico} Bien-être ${pb.nom.toLowerCase()} : ${pb.effet}`, 'budget']);
  if (s.sante < 45) A.push(['mal', `❤️ Santé à ${Math.round(s.sante)} % : sous 40, maladie et jours de carence.`, 'maison']);
  if (s.hygiene < 45) A.push(['warn', `🧼 Hygiène à ${Math.round(s.hygiene)} % : lance une lessive.`, 'linge']);
  if (s.argent < 0) A.push(['mal', `💶 Découvert : ${eur(s.argent)}. Les agios courent.`, 'banque']);
  const pv = prevision(s.meteo, s.jour, s.seed);
  if (pv[0]?.tempo === 'rouge' && s.sys.tarif === 'tempo') A.push(['warn', '🔴 Jour Tempo rouge demain : électricité très chère de 6 h à 22 h, décale lessive et ballon.', 'elec']);
  for (const e of evenementsAVenir(s).filter(e => e.jour - s.jour <= 7)) A.push(['info', `📅 Dans ${e.jour - s.jour} j : ${e.titre}.`, null]);
  const app = s.eco?.appareils; if (app) for (const [id, a] of Object.entries(app)) if (a.panne - s.jour > 0 && a.panne - s.jour <= 45) { A.push(['info', '🔧 Un appareil vieillit : une panne est probable dans les semaines à venir. Garde une épargne disponible.', 'banque']); break; }
  const f = s.fin;
  if (f?.pea) { const ans = (f.cal - f.pea.ouvert) / 365; if (ans >= 4.75 && ans < 5) A.push(['ok', `📈 Ton PEA aura 5 ans dans ${Math.ceil((5 - ans) * 365)} j : retraits sans impôt sur le revenu.`, 'invest']); }
  if (f?.pel) { const ans = (f.cal - f.pel.ouvert) / 365; if (ans >= 1.85 && ans < 2) A.push(['ok', `🏠 Ton PEL aura 2 ans dans ${Math.ceil((2 - ans) * 365)} j : intérêts acquis.`, 'banque']); }
  A.push(['info', `📄 Prochaine facture d'énergie dans ${s.jour % 7 === 0 ? 7 : 7 - s.jour % 7} j (en cours : ${eur(s.factureSemaine || 0)}).`, 'factures']);
  return A;
}

const CAUSES = {
  confort: (s) => s.confort < 60 ? 'froid ou courants d\'air : vérifie le chauffage et les couches' : 'température agréable',
  sante: (s) => s.sante < 60 ? 'froid, humidité ou alimentation : surveille-la' : 'bonne forme',
  hygiene: (s) => s.hygiene < 60 ? 'linge sale ou douches trop courtes' : 'linge propre',
};
export function rendreTableau(s, etat = {}) {
  const r = scoreFinal(s), v = s.fin ? valeurs(s) : { livrets: 0, total: 0 };
  const rav = s.eco ? s.eco.salaire - s.eco.loyer : 1500, prec = v.livrets + Math.max(0, s.argent);
  const cible = 3 * rav, pPrec = Math.min(100, prec / cible * 100);
  const salaire = s.eco ? s.eco.salaire * (s.mor?.facteurSalaire || 1) : 0, loyer = s.eco?.loyer || 0;
  const mc = moisCourant(s), depMois = mc.reduce((t, p) => t + p.mois, 0);
  const jm = dateDuJour(s.jour).getUTCDate(), jdm = new Date(Date.UTC(dateDuJour(s.jour).getUTCFullYear(), dateDuJour(s.jour).getUTCMonth() + 1, 0)).getUTCDate();
  // en début de mois, les prélèvements mensuels faussent l'extrapolation : on prend le mois dernier
  const depPrec = mc.some(p => p.prec !== null) ? mc.reduce((t, p) => t + (p.prec || 0), 0) : null;
  const projMois = jm < 8 && depPrec !== null ? depPrec : depMois / Math.max(7, jm - 1) * jdm;
  const projLib = jm < 8 && depPrec !== null ? 'Dépenses (mois dernier)' : 'Dépenses du mois (projection)';
  const pct = (x) => `${Math.round(x)} %`;

  // 1. situation
  const situation = `<div class="tb-carte tb-situation"><h3>Ta situation</h3><div class="tb-chiffres">
    <div><span>Compte courant</span><b class="${s.argent < 0 ? 'moins' : ''}">${eur(s.argent)}</b></div>
    <div><span>Patrimoine (placements compris)</span><b>${eur(r.patrimoine)}</b><small>voisin ${eur(r.patrimoineVoisin ?? 0)}</small></div>
    <div><span>Économisé vs voisin</span><b class="${r.economies >= 0 ? 'plus' : 'moins'}">${eur(r.economies)}</b></div></div>
    <div class="tb-prec"><span>Épargne de précaution : ${eur(prec)} / ${eur(cible)} (3 mois de reste à vivre)</span><div class="progres" role="progressbar" aria-valuenow="${Math.round(pPrec)}" aria-valuemin="0" aria-valuemax="100" aria-label="Épargne de précaution"><div style="width:${pPrec}%"></div></div><small>${pPrec >= 100 ? '✓ Constituée : une panne ne te mettra pas à découvert.' : 'À constituer avant d\'investir à risque.'}</small></div>
    ${s.eco ? `<div class="tb-budget"><div>Entrées / mois<b class="plus">+${eur(salaire)}</b></div><div>Loyer<b class="moins">−${eur(loyer)}</b></div><div>${projLib}<b class="moins">−${eur(projMois)}</b></div><div>Solde estimé<b class="${salaire - loyer - projMois >= 0 ? 'plus' : 'moins'}">${eur(salaire - loyer - projMois)}</b></div></div>` : ''}</div>`;

  // 2. jauges
  const ej = etat.prec || {};
  const J = [['😊', 'Confort', 'confort', s.confort, null, CAUSES.confort(s)], ['❤️', 'Santé', 'sante', s.sante, null, CAUSES.sante(s)],
    ['💪', 'Moral', 'volonte', s.volonte, palierMoral(s.volonte), (s.mor?.raisons || []).slice(0, 2).map(([k, x]) => `${{ plaisirs: 'plaisirs', social: 'vie sociale', lumiere: 'jours courts', monotonie: 'repas monotones', vacances: 'vacances', stress: 'stress', controle: 'budget maîtrisé', sommeil: 'sommeil' }[k] || k} ${x > 0 ? '+' : ''}${Math.round(x)}`).join(', ') || 'stable'],
    ['🧼', 'Hygiène', 'hygiene', s.hygiene, null, CAUSES.hygiene(s)], ['🌻', 'Bien-être', 'bienetre', s.bienetre, palierBE(s.bienetre), `${Math.round(Math.max(0, tempsLibre(s)) * 10) / 10} h libres aujourd'hui · plaisirs ${s.sys.plaisirs} €/sem.`],
    ['⏳', 'Temps libre', 'libre', Math.max(0, tempsLibre(s)) / 6 * 100, null, 'pour les gestes et les chantiers']];
  const jauges = `<div class="tb-carte"><h3>Tes jauges</h3><div class="tb-jauges">${J.map(([ic, nom, k, val, pal, cause]) => {
    const niv = pal ? (['epanoui', 'neutre', 'forme', 'correct'].includes(pal.id) ? 'ok' : ['fragile', 'fatigue'].includes(pal.id) ? 'warn' : 'mal') : val >= 60 ? 'ok' : val >= 40 ? 'warn' : 'mal';
    const avant = ej[`${ic} ${nom}`]; const tend = avant === undefined || k === 'libre' ? '' : val > avant + 0.5 ? '▲' : val < avant - 0.5 ? '▼' : '▬';
    return `<div class="tb-jauge niv-${niv}"><div class="l"><span>${ic} ${nom}</span><b>${k === 'libre' ? `${Math.round(Math.max(0, tempsLibre(s)) * 10) / 10} h` : pct(val)} <span aria-label="tendance">${tend}</span></b></div><div class="progres"><div style="width:${Math.max(0, Math.min(100, val))}%"></div></div>${pal ? `<small class="pal">${pal.ico} ${pal.nom} · ${pal.effet}</small>` : ''}<small>${cause}</small></div>`;
  }).join('')}</div></div>`;

  // 3. dépenses du mois
  const lignes = mc.filter(p => p.mois > 0.5 || p.moisVoisin > 0.5 || (p.prec || 0) > 0.5);
  const mx = Math.max(1, ...lignes.flatMap(p => [p.mois, p.moisVoisin, p.prec || 0]));
  const fuite = lignes.filter(p => p.id !== 'imprevus').sort((a, b) => (b.mois - b.moisVoisin) - (a.mois - a.moisVoisin))[0];
  const depenses = `<div class="tb-carte tb-large"><h3>Dépenses du mois par poste</h3><div class="tb-legende"><span class="c-moi">Toi, ce mois</span><span class="c-voisin">Voisin, ce mois</span><span class="c-prec">Toi, mois dernier</span></div>
    <div class="tb-barres" role="list">${lignes.map(p => `<div class="tb-barre ${fuite && p.id === fuite.id && p.mois > p.moisVoisin ? 'fuite' : ''}" role="listitem" aria-label="${p.nom} : toi ${eur(p.mois)}, voisin ${eur(p.moisVoisin)}${p.prec !== null ? `, mois dernier ${eur(p.prec)}` : ''}">
      <span class="n">${p.nom}${fuite && p.id === fuite.id && p.mois > p.moisVoisin ? ' <span class="tag mal">plus grosse fuite</span>' : ''}</span>
      <span class="bb"><i class="c-moi" style="width:${p.mois / mx * 100}%"></i><i class="c-voisin" style="width:${p.moisVoisin / mx * 100}%"></i>${p.prec !== null ? `<i class="c-prec" style="width:${p.prec / mx * 100}%"></i>` : ''}</span>
      <b>${eur(p.mois)}</b></div>`).join('') || '<p class="aide">Le mois commence : avance de quelques jours.</p>'}</div></div>`;

  // 4. recommandations
  const reco = recommandations(s, r);
  const df = s.eco?.defi, dfFait = df ? s.depenses[df.poste] - df.debut : 0, dfP = df ? Math.min(100, dfFait / df.cible * 100) : 0;
  const defiH = df ? `<div class="tb-defi"><span>🎯 Défi ${df.an} : <b>${df.nom}</b> — ${eur(dfFait)} / ${eur(df.cible)}</span><div class="progres ${dfP > 100 * (s.jour - df.jour + 1) / 365 ? 'alerte' : ''}" role="progressbar" aria-valuenow="${Math.round(dfP)}" aria-valuemin="0" aria-valuemax="100" aria-label="Budget du défi consommé"><div style="width:${dfP}%"></div></div></div>` : '';
  const recos = `<div class="tb-carte"><h3>Que faire maintenant ?</h3>${defiH}<ol class="tb-reco">${reco.map((x, i) => `<li><div><b>${x.titre}</b><small>${x.urgent ? '⚠️ prioritaire' : x.an > 0 ? `~${eur(x.an)}/an` : ''}${x.roi ? ` · rendement ${Math.round(x.roi)} %/an` : ''}${x.jauge ? ` · ${x.jauge}` : ''}</small></div><span class="tb-acts">${x.action && x.action.type !== 'poste' || (x.action?.type === 'poste' && x.action.id !== 'linge') ? `<button class="btn primaire" data-appliquer="${i}" aria-label="Faire : ${x.titre}">Faire</button>` : ''}<button class="btn" data-aller="${x.aller}" aria-label="Y aller : ${x.titre}">Y aller</button><button class="btn discret" data-ignorer="${i}" aria-label="Ignorer pendant 30 jours : ${x.titre}" title="Ne plus proposer pendant 30 jours">Ignorer</button></span></li>`).join('') || '<li class="vide">Rien d\'urgent : avance dans le temps.</li>'}</ol></div>`;

  // 5. alertes
  const al = alertes(s);
  const alertesH = `<div class="tb-carte"><h3>Alertes</h3><ul class="tb-alertes">${al.map(([t, x, aller]) => `<li class="a-${t}">${aller ? `<button class="lien" data-aller="${aller}">${x}</button>` : x}</li>`).join('')}</ul></div>`;

  // 6. progression
  const tot = s.joursTotal || 365, pc = Math.min(100, s.jour / tot * 100);
  const progres = `<div class="tb-carte"><h3>Ta campagne</h3><div class="progres" role="progressbar" aria-valuenow="${Math.round(pc)}" aria-valuemin="0" aria-valuemax="100" aria-label="Avancement de la campagne"><div style="width:${pc}%"></div></div><small>Jour ${s.jour} sur ${tot}</small>
    <p>Titre si la partie finissait : <b>${r.titre}</b>${r.note ? `<br><small>${r.note.split('.')[0]}.</small>` : ''}</p><p><small>${r.habitudes} habitudes · ${r.principes} principes · ${Math.round(r.pct)} % de moins que le voisin</small></p></div>`;

  // 7. rentabilité
  const roi = tableauROI(s), inv = roi.reduce((t, x) => t + x.prix, 0), mes = roi.reduce((t, x) => t + x.mesure, 0);
  const top = [...roi].sort((a, b) => b.mesure - a.mesure).slice(0, 3);
  const rent = `<div class="tb-carte"><h3>Ce qui rapporte</h3><div class="tb-chiffres"><div><span>Équipements</span><b>${eur(inv)}</b><small>ont déjà rapporté ${eur(mes)}</small></div><div><span>Placements</span><b>${eur(v.total || 0)}</b><small>${s.fin ? `dont livrets ${eur(v.livrets)}` : ''}</small></div></div>
    ${top.length ? `<ul class="tb-liste">${top.map(x => `<li>${x.nom}<b class="${x.mesure >= x.prix ? 'plus' : ''}">${eur(x.mesure)}</b></li>`).join('')}</ul>` : '<p class="aide">Pas encore d\'équipement rentable mesuré.</p>'}</div>`;

  // 8. prévisions
  const pv = prevision(s.meteo, s.jour, s.seed);
  const JS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const conseilJ = (p) => p.tempo === 'rouge' ? 'Tempo rouge : rien de gourmand' : p.nuage < 0.35 && s.possede.solaire ? 'Soleil : lessive et ballon à midi' : p.nuage < 0.35 ? 'Soleil : séchage dehors, rideaux ouverts' : p.tMin <= 0 ? 'Gel : couches et rideaux fermés le soir' : p.tMax >= 30 ? 'Chaleur : volets fermés le jour' : 'Journée ordinaire';
  const prev = `<div class="tb-carte"><h3>Les 3 prochains jours</h3><div class="tb-prev">${pv.map((p, k) => `<div><b>${JS[dateDuJour(s.jour + k + 1).getUTCDay()]}</b><span>${p.icone} ${p.tMin}…${p.tMax} °C</span><small>${p.libelle}${p.tempo ? ` · Tempo ${p.tempo}` : ''}</small><small class="conseil-j">${conseilJ(p)}</small></div>`).join('')}</div></div>`;

  return `<div class="tb">${situation}${recos}${jauges}${alertesH}${depenses}${progres}${rent}${prev}</div>`;
}
