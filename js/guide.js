// Guidage (v0.8) : navigation par sections, badges « nouveau », conseiller, objectifs, glossaire, bilan courant,
// tutoriel pas à pas (coach marks) et aperçu des effets avant achat. DOM uniquement : aucune règle de jeu ici.
import { ACHATS, PRINCIPES, PIECES, ORDRE_PIECES, ROI_ITEMS, JOURS_HABITUDE } from './data.js';
import { estimationAchat } from './roi.js';
import { scoreFinal, tempsLibre, eur, ROUTINES, routineDispo } from './simulation.js';
import { valeurs } from './finance.js';
import { icone } from './icones.js';
import { etatUI } from './onglets.js';
import { palierMoral, palierBE } from './paliers.js';
import { rendreTableau, rendreCourbes, sourceDeJaugeBasse } from './tableau.js';
import { etatJauges } from './ui.js';

const $ = (id) => document.getElementById(id);
const num = (x, d = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const eurJ = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/jour`;

// ---------------------------------------------------------------- préférences d'interface (thème, sous-sections vues, tutoriel)
const CLE_UI = 'economie-game-ui';
const PREFS_DEFAUT = { vus: [], principesVus: 0, theme: null, tutoFait: false, objectifsFaits: [] };
export const prefs = (() => {
  let lu = {};
  try { lu = JSON.parse(localStorage.getItem(CLE_UI) || '{}'); } catch { lu = {}; }
  if (!lu || typeof lu !== 'object' || Array.isArray(lu)) lu = {};
  const p = { ...PREFS_DEFAUT, ...lu };
  for (const k of ['vus', 'objectifsFaits']) if (!Array.isArray(p[k])) p[k] = [];
  if (typeof p.principesVus !== 'number') p.principesVus = 0;
  return p;
})();
export function sauverPrefs() { try { localStorage.setItem(CLE_UI, JSON.stringify(prefs)); } catch { /* stockage indisponible */ } }

// ---------------------------------------------------------------- sections
// [id, nom, icône, sous-sections [id, nom, visible(s)]]
const toujours = () => true;
// v1.2 : 5 sections (barre du bas sur mobile) ; « Vie quotidienne » rejoint Maison, « Savoir » rejoint Bilan
export const SECTIONS = [
  ['accueil', 'Accueil', 'accueil', [['tableau', 'Tableau de bord', toujours]]],
  ['maison', 'Maison', 'feu', [['maison', 'Chauffage et gestes', toujours], ['eau', 'Eau', toujours], ['cuisine', 'Cuisine', toujours], ['jardin', 'Jardin', (s) => s.jour >= 21 || !!s.possede.potager], ['linge', 'Linge', toujours],
    ['elec', 'Électricité', (s) => s.jour >= 2], ['transport', 'Transport', (s) => s.jour >= 3], ['routines', 'Routines', (s) => Object.keys(ROUTINES).some(k => routineDispo(s, k))]]],
  ['achats', 'Achats', 'achats', [['b-maison', 'Maison', toujours], ['b-eau', 'Eau', toujours], ['b-cuisine', 'Cuisine', toujours], ['b-elec', 'Électricité', (s) => s.jour >= 2],
    ['b-transport', 'Transport', (s) => s.jour >= 3], ['b-jardin', 'Jardin', (s) => s.jour >= 21], ['rentab', 'Rentabilité', (s) => Object.entries(s.possede).some(([k, v]) => v && ACHATS[k]?.prix > 5)]]],
  ['argent', 'Argent', 'argent', [['budget', 'Budget et plaisirs', toujours], ['banque', 'Banque et épargne', toujours], ['invest', 'Investir', (s) => s.jour >= 14 || !!s.fin?.pea || !!s.fin?.av]]],
  ['bilan', 'Bilan', 'bilan', [['resume', 'Où en es-tu ?', toujours], ['factures', 'Factures', (s) => s.factures.length > 0], ['graphes', 'Graphiques', toujours], ['principes', 'Encyclopédie', toujours], ['combos', 'Combos', (s) => Object.keys(s.combos || {}).length > 0 || s.jour >= 30], ['glossaire', 'Glossaire', (s) => s.jour >= 5], ['journal', 'Journal', (s) => s.jour >= 1], ['aide', 'Aide', toujours]]],
];
export const sectionDe = (onglet) => SECTIONS.find(x => x[3].some(y => y[0] === onglet))?.[0] || 'maison';
const sousVisibles = (s, sec) => SECTIONS.find(x => x[0] === sec)[3].filter(([, , v]) => v(s));
const nouveau = (s, id) => !prefs.vus.includes(id);

export function ouvrir(onglet) { etatUI.onglet = onglet; if (onglet === 'tableau') choisirVue('tableau'); etatUI.section = sectionDe(onglet); if (!prefs.vus.includes(onglet)) { prefs.vus.push(onglet); sauverPrefs(); } if (onglet === 'principes') { prefs.principesVus = -1; } }
export function ouvrirSection(s, sec) {
  const subs = sousVisibles(s, sec);
  const der = etatUI.dernier?.[sec];
  ouvrir(subs.find(x => x[0] === der)?.[0] || subs[0][0]);
}

export function rendreNavigation(s) {
  // au premier affichage, tout ce qui est déjà visible est « vu »
  if (!prefs.init) { prefs.init = true; for (const [, , , subs] of SECTIONS) for (const [id, , v] of subs) if (v(s) && !prefs.vus.includes(id)) prefs.vus.push(id); sauverPrefs(); }
  if (!etatUI.section) etatUI.section = sectionDe(etatUI.onglet);
  if (prefs.principesVus === -1) { prefs.principesVus = s.principes.length; sauverPrefs(); }
  const sec = etatUI.section = sectionDe(etatUI.onglet);
  document.body.dataset.section = sec;
  (etatUI.dernier ||= {})[sec] = etatUI.onglet;
  const nouvPrincipes = Math.max(0, s.principes.length - (prefs.principesVus || 0));
  $('sections').innerHTML = SECTIONS.map(([id, nom, ic, subs]) => {
    const n = subs.filter(([sid, , v]) => v(s) && nouveau(s, sid)).length + (id === 'bilan' ? Math.min(9, nouvPrincipes) : 0);
    return `<button role="tab" data-section="${id}" aria-selected="${id === sec}" aria-label="${nom}${n ? `, ${n} nouveauté${n > 1 ? 's' : ''}` : ''}">${icone(ic, 22)}<span>${nom}</span>${n ? `<span class="badge ${id === 'bilan' && nouvPrincipes ? '' : 'nouveau'}">${n}</span>` : ''}</button>`;
  }).join('');
  $('onglets').innerHTML = sousVisibles(s, sec).map(([id, nom]) => `<button role="tab" data-onglet="${id}" aria-selected="${id === etatUI.onglet}">${nom}${nouveau(s, id) ? '<span class="badge nouveau">nouveau</span>' : ''}${id === 'principes' && nouvPrincipes ? `<span class="badge">+${nouvPrincipes}</span>` : ''}</button>`).join('');
  if (!prefs.vus.includes(etatUI.onglet)) { prefs.vus.push(etatUI.onglet); sauverPrefs(); }
}

// ---------------------------------------------------------------- conseiller : un conseil à la fois, selon l'état
// v0.9.1 : domaine du bilan → poste source d'une jauge (on ne pointe pas une « fuite » de plaisirs en pleine déprime)
const POSTE_DOMAINE = [['Chauffage', 'chauffage'], ['Eau chaude', 'eauChaude'], ['Alimentation', 'alim'], ['Abonnements', 'services'], ['Plaisirs', 'plaisirs'], ['Linge', 'linge']];
const SECTION_DOMAINE = [['Chauffage', 'maison'], ['Rafraîch', 'maison'], ['Eau chaude', 'eau'], ['Eau', 'eau'], ['Alimentation', 'cuisine'], ['Autre électricité', 'elec'], ['Abonnements', 'budget'], ['Plaisirs', 'budget'], ['Transport', 'transport'], ['Linge', 'linge'], ['Imprévus', 'budget'], ['Banque', 'banque']];
function conseils(s, r) {
  const L = [];
  const raisonsNeg = (s.mor?.raisons || []).filter(([, x]) => x < 0).map(([k]) => k);
  if (s.sante < 45) L.push({ alerte: true, txt: `Ta santé est à ${Math.round(s.sante)} %. Sous 40, tu tombes malade : médecin et jours de carence non payés. Remonte la chambre d'1 °C la nuit, porte une couche de plus ou mange mieux.`, aller: 'maison', bouton: 'Régler le chauffage' });
  // paliers (v0.8.1) : prévenir dès qu'une jauge passe sous un seuil qui coûte
  const PM = palierMoral(s.volonte), PB = palierBE(s.bienetre);
  if (s.volonte < 40) L.push({ alerte: true, txt: `${PM.ico} Moral ${PM.nom.toLowerCase()} (${Math.round(s.volonte)} %) : ${PM.effet.charAt(0).toLowerCase() + PM.effet.slice(1)} ${PM.conseil}`, aller: 'budget', bouton: 'Voir les plaisirs' });
  if (s.bienetre < 50) L.push({ alerte: true, txt: `${PB.ico} Bien-être ${PB.nom.toLowerCase()} (${Math.round(s.bienetre)} %) : ${PB.effet.charAt(0).toLowerCase() + PB.effet.slice(1)} ${PB.conseil}`, aller: 'budget', bouton: 'Voir les plaisirs' });
  if (s.volonte < 35) L.push({ alerte: true, txt: `Moral à ${Math.round(s.volonte)} %. ${raisonsNeg.includes('stress') ? 'Le stress (argent, panne, maladie) pèse. ' : ''}${raisonsNeg.includes('monotonie') ? 'Varie tes repas. ' : ''}${raisonsNeg.includes('plaisirs') ? 'Un petit plaisir neuf fait du bien. ' : ''}Évite d'apprendre plusieurs gestes à la fois.`, aller: 'budget', bouton: 'Voir les plaisirs' });
  if (s.hygiene < 45) L.push({ alerte: true, txt: `Hygiène à ${Math.round(s.hygiene)} % : lance une lessive et reprends des douches normales. Basse trop longtemps, elle te coûte ton augmentation.`, aller: 'linge', bouton: 'Ouvrir le linge' });
  if (s.argent < 0) L.push({ alerte: true, txt: `Tu es à découvert (${eur(s.argent)}). Les agios coûtent cher : retire un peu de ton Livret A ou active le virement automatique.`, aller: 'banque', bouton: 'Ouvrir la banque' });
  if (!s.possede.thermometre) L.push({ txt: 'Tu ne sais pas quelle pièce te coûte le plus. Des thermomètres (12 €) révèlent la température et le coût de chaque pièce.', aller: 'b-maison', bouton: 'Voir la boutique' });
  // plus grosse fuite : le poste où tu dépenses le plus de plus que le voisin
  const fuites = r.domaines.filter(d => !d.nom.startsWith('Épargne') && !d.nom.startsWith('Autres') && !d.nom.startsWith('Équipements') && !d.nom.startsWith('Vêtements') && d.valeur < -15 && !sourceDeJaugeBasse(s, POSTE_DOMAINE.find(([pre]) => d.nom.startsWith(pre))?.[1])).sort((a, b) => a.valeur - b.valeur);
  if (fuites.length && s.jour >= 7) { const f = fuites[0]; L.push({ txt: `Plus grosse fuite : ${f.nom.split(' (')[0].toLowerCase()}, ${eur(-f.valeur)} de plus que le voisin depuis le début.`, aller: SECTION_DOMAINE.find(([p]) => f.nom.startsWith(p))?.[1] || 'resume', bouton: 'Agir' }); }
  // meilleur achat rentable à ta portée
  let best = null;
  for (const [id, a] of Object.entries(ACHATS)) {
    if (s.possede[id] || a.prix > s.argent - 150 || (a.temps || 0) > Math.max(0, tempsLibre(s))) continue;
    const e = estimationAchat(id); if (!e || e.mois === null || !(e.annuel > 0)) continue;
    const t = e.annuel / a.prix; if (!best || t > best.t) best = { id, a, e, t };
  }
  if (best) { const dom = Object.entries({ maison: ['Instruments', 'Isolation', 'Chauffage', 'Confort', 'Été', 'Ventilation passive'], eau: ['Eau chaude'], cuisine: ['Cuisine', 'Cuisine solaire'], elec: ['Électricité', 'Production'], transport: ['Transport'], jardin: ['Jardin'] }).find(([, c]) => c.includes(best.a.cat))?.[0] || 'maison';
    L.push({ txt: `Meilleur achat à ta portée : ${best.a.nom} (${eur(best.a.prix)}). Il rapporte ~${eur(best.e.annuel)}/an et se rembourse en ~${best.e.mois < 1 ? 'moins d\'un mois' : `${num(best.e.mois)} mois`}.`, aller: 'b-' + dom, bouton: 'Voir l\'article' }); }
  const routineOff = Object.keys(ROUTINES).find(k => routineDispo(s, k) && !s.auto?.[k]);
  if (routineOff) L.push({ txt: `Routine disponible : « ${ROUTINES[routineOff].nom} ». Active-la pour ne plus y penser quand tu avances d'un mois.`, aller: 'routines', bouton: 'Ouvrir les routines' });
  if (s.fin && s.argent > 3500) L.push({ txt: `${eur(s.argent - 1500)} dorment sur ton compte à 0 %. Le Livret A rapporte sans risque et reste disponible.`, aller: 'banque', bouton: 'Placer' });
  if (!L.length) L.push({ txt: s.jour < 7 ? 'Tout va bien. Avance d\'une semaine : la première facture arrive et le conseiller verra où part ton argent.' : 'Rien d\'urgent. Avance jusqu\'au prochain événement, tes habitudes travaillent pour toi.', aller: null });
  return L;
}

// ---------------------------------------------------------------- objectifs suggérés (3 à la fois, avec progression)
function objectifs(s, r) {
  const b = s.base, d = s.depenses;
  const pctGain = (base, moi) => base > 1 ? (base - moi) / base * 100 : 0;
  const hab = Object.values(s.gestes).filter(g => g.habitude).length;
  const maxPrat = Math.max(0, ...Object.values(s.gestes).map(g => g.habitude ? JOURS_HABITUDE : g.pratique || 0));
  const prec = s.fin ? valeurs(s).livrets + Math.max(0, s.argent) : 0, rav = s.eco ? s.eco.salaire - s.eco.loyer : 1500;
  return [
    { id: 'thermo', titre: 'Installe des thermomètres', v: s.possede.thermometre ? 1 : 0, cible: 1, fmt: (v) => v ? 'fait' : 'à faire', aller: 'b-maison' },
    { id: 'chauf10', titre: 'Baisse ton chauffage de 10 % par rapport au voisin', v: pctGain(b.gaz, d.gaz + (d.appointEur || 0)), cible: 10, fmt: (v) => `${num(v)} %`, aller: 'maison' },
    { id: 'habitude1', titre: `Ancre ta première habitude (${JOURS_HABITUDE} jours de pratique)`, v: Math.min(maxPrat, JOURS_HABITUDE), cible: JOURS_HABITUDE, fmt: (v) => `${num(v)} / ${JOURS_HABITUDE} j`, aller: 'maison' },
    { id: 'principes10', titre: 'Découvre 10 principes', v: s.principes.length, cible: 10, fmt: (v) => `${v} / 10`, aller: 'principes' },
    { id: 'eco250', titre: 'Économise 250 € par rapport au voisin', v: r.economies, cible: 250, fmt: (v) => eur(v), aller: 'resume' },
    { id: 'eau15', titre: 'Réduis l\'eau chaude de 15 %', v: pctGain(b.eauChaude || 0, d.eauChaudeEur || 0), cible: 15, fmt: (v) => `${num(v)} %`, aller: 'eau' },
    { id: 'precaution', titre: 'Garde 3 mois de reste à vivre en épargne de précaution', v: prec, cible: 3 * rav, fmt: (v) => eur(v), aller: 'banque' },
    { id: 'chauf25', titre: 'Baisse ton chauffage de 25 %', v: pctGain(b.gaz, d.gaz + (d.appointEur || 0)), cible: 25, fmt: (v) => `${num(v)} %`, aller: 'maison' },
    { id: 'habitudes5', titre: 'Ancre 5 habitudes', v: hab, cible: 5, fmt: (v) => `${v} / 5`, aller: 'maison' },
    { id: 'eco2000', titre: 'Économise 2 000 € par rapport au voisin', v: r.economies, cible: 2000, fmt: (v) => eur(v), aller: 'resume' },
    { id: 'principes40', titre: 'Découvre 40 principes', v: s.principes.length, cible: 40, fmt: (v) => `${v} / 40`, aller: 'principes' },
    { id: 'eco10000', titre: 'Économise 10 000 € par rapport au voisin', v: r.economies, cible: 10000, fmt: (v) => eur(v), aller: 'resume' },
  ];
}
export function objectifsAtteints(s) {
  const r = scoreFinal(s), nouveaux = [];
  for (const o of objectifs(s, r)) if (o.v >= o.cible && !prefs.objectifsFaits.includes(o.id)) { prefs.objectifsFaits.push(o.id); nouveaux.push(o.titre); }
  if (nouveaux.length) sauverPrefs();
  if (s.jour <= 1) return [];   // déjà acquis au départ : pas de fanfare
  return nouveaux;
}

// ---------------------------------------------------------------- glossaire
export const GLOSSAIRE = {
  'Consigne': 'La température que tu demandes au chauffage. Chaque degré en moins fait économiser environ 7 % du chauffage (ADEME).',
  'kWh': 'Kilowattheure : l\'unité d\'énergie des factures. Un radiateur de 1 000 W allumé une heure consomme 1 kWh.',
  'HP / HC': 'Heures pleines et heures creuses : avec l\'option HP/HC, l\'électricité coûte moins cher 8 heures par jour (souvent la nuit).',
  'Tempo': 'Option EDF : électricité très bon marché 300 jours par an (bleus), plus chère 43 jours (blancs) et très chère 22 jours d\'hiver (rouges).',
  'Ressenti': 'La température que tu perçois : pièce + vêtements − courants d\'air − humidité.',
  'Humidité relative': 'Part de vapeur d\'eau dans l\'air. Au-dessus de 70 % durablement, les moisissures apparaissent.',
  'Habitude': 'Un geste répété 21 jours ne coûte plus de moral et prend moitié moins de temps.',
  'Rechute': 'Moral à zéro : un jour sans nouveaux gestes et des dépenses pour se consoler.',
  'Retour sur investissement': 'Le temps qu\'un achat met à se rembourser par ses économies. 12 € qui font gagner 1 €/mois : 12 mois.',
  'Coût d\'opportunité': 'Ce que ton argent aurait rapporté ailleurs (par exemple au Livret A) si tu ne l\'avais pas dépensé.',
  'Livret A': 'Épargne sans risque, disponible à tout moment, intérêts sans impôts. Taux fixé par l\'État et révisé en février et en août.',
  'LEP': 'Livret d\'épargne populaire : comme le Livret A mais mieux rémunéré, réservé aux revenus modestes.',
  'PEL': 'Plan d\'épargne logement : taux garanti, mais argent bloqué au moins 2 ans (et versements réguliers).',
  'Assurance vie': 'Enveloppe d\'épargne : fonds euros garanti ou unités de compte (actions). Fiscalité allégée après 8 ans.',
  'PEA': 'Plan d\'épargne en actions : pour investir en Bourse. Après 5 ans, seuls les prélèvements sociaux sont dus sur les gains.',
  'ETF': 'Fonds indiciel : un seul produit qui achète des centaines d\'entreprises du monde entier, avec peu de frais.',
  'SCPI': 'Immobilier « papier » : tu achètes des parts d\'immeubles de bureaux et touches des loyers, mais la revente prend du temps.',
  'Inflation': 'La hausse générale des prix. Si ton épargne rapporte moins que l\'inflation, elle perd du pouvoir d\'achat.',
  'Mensualisation': 'L\'énergie est payée chaque mois par 1/12 de la facture estimée, puis régularisée une fois par an.',
  'Régularisation': 'Le 15 juin : on compare ce que tu as consommé à ce que tu as payé, et tu paies ou reçois la différence.',
  'Jours de carence': 'Les 3 premiers jours d\'un arrêt maladie ne sont pas payés (salarié du privé).',
  'Adaptation hédonique': 'On s\'habitue aux plaisirs répétés : ils font de moins en moins effet. La nouveauté recharge.',
  'Épargne de précaution': 'Argent disponible tout de suite (compte, livrets) pour une panne ou un coup dur : viser 3 mois de dépenses.',
  'Combo': 'Deux techniques qui se renforcent l\'une l\'autre. Le jeu les détecte et les ajoute à ta collection.',
};
function rendreGlossaire() {
  const q = (etatUI.rechercheGlossaire || '').toLowerCase();
  const items = Object.entries(GLOSSAIRE).filter(([k, v]) => !q || (k + v).toLowerCase().includes(q));
  const zone = $('glossaireListe');
  const html = `<dl class="glossaire">${items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') || '<dd>Aucun terme trouvé.</dd>'}</dl>`;
  if (zone) zone.innerHTML = html;
  else $('glossaire').innerHTML = `<label class="aide" for="rechercheGlossaire">Chercher un terme</label><input id="rechercheGlossaire" class="recherche" type="search" placeholder="ex. Livret A, kWh, carence…" value=""><div id="glossaireListe">${html}</div>`;
}
export const filtrerGlossaire = (q) => { etatUI.rechercheGlossaire = q; rendreGlossaire(); };

// ---------------------------------------------------------------- bilan courant
function rendreResume(s, r) {
  const doms = r.domaines.filter(d => Math.abs(d.valeur) >= 1).sort((a, b) => b.valeur - a.valeur);
  const mx = Math.max(1, ...doms.map(d => Math.abs(d.valeur)));
  const m = r.moy, g = (l, v) => `<div>${l}<b style="color:var(--${v >= 60 ? 'ok' : v >= 40 ? 'warn' : 'mal'})">${Math.round(v)} %</b></div>`;
  $('resume').innerHTML = `<div class="stats">
      <div>Économies vs voisin<b class="${r.economies >= 0 ? 'plus' : 'moins'}">${eur(r.economies)}</b><small>${num(r.pct, 1)} % de ses dépenses</small></div>
      <div>Titre si la partie finissait<b>${r.titre}</b><small>${r.note ? r.note.split('.')[0] + '.' : 'Équilibre respecté.'}</small></div>
      <div>Ton patrimoine<b>${eur(r.patrimoine)}</b><small>voisin : ${eur(r.patrimoineVoisin ?? 0)}</small></div>
      <div>Principes · habitudes<b>${r.principes} · ${r.habitudes}</b><small>sur ${Object.keys(PRINCIPES).length} principes</small></div></div>
    <h3>Jauges moyennes depuis le début</h3><div class="stats">${g('Confort', m.confort)}${g('Santé', m.sante)}${g('Moral', m.moral)}${g('Hygiène', m.hygiene)}${g('Bien-être', m.bienetre)}</div>
    <h3>Gagné (vert) ou perdu (rouge) par poste, par rapport au voisin</h3>
    <div class="barres-dom" role="list">${doms.map(d => `<div class="barre-dom" role="listitem"><span>${d.nom.split(' (')[0]}</span><span class="b ${d.valeur < 0 ? 'neg' : ''}"><div style="width:${Math.abs(d.valeur) / mx * 100}%"></div></span><b class="${d.valeur >= 0 ? 'plus' : 'moins'}">${eur(d.valeur)}</b></div>`).join('') || '<p class="aide">Avance de quelques jours pour voir tes premiers résultats.</p>'}</div>
    ${s.eco?.dernierBilan ? `<h3>Dernier bilan annuel</h3><p>Année ${s.eco.dernierBilan.an + 1} : ${eur(s.eco.dernierBilan.economies)} économisés. Objectifs fixés : ${s.eco.dernierBilan.objectifs.slice(0, 2).join(' ')}</p>` : ''}`;
}

// ---------------------------------------------------------------- vue principale : tableau de bord ou maison (v0.8.1)
export function choisirVue(v) {
  prefs.vue = v === 'maison' ? 'maison' : 'tableau'; sauverPrefs();
  for (const b of document.querySelectorAll('[data-vue]')) b.setAttribute('aria-selected', String(b.dataset.vue === prefs.vue));
  $('vueTableau')?.classList.toggle('cache', prefs.vue !== 'tableau');
  $('vueMaison')?.classList.toggle('cache', prefs.vue !== 'maison');
}

// ---------------------------------------------------------------- rendu global du guidage
export function rendreGuide(s) {
  const r = scoreFinal(s);
  choisirVue(prefs.vue || 'tableau');
  if (prefs.vue !== 'maison' && $('tableau')) $('tableau').innerHTML = rendreTableau(s, { prec: etatJauges.prec || etatJauges.cur });
  // conseiller
  const L = conseils(s, r), i = (etatUI.conseil || 0) % L.length, c = L[i];
  $('titreConseiller').innerHTML = `${icone('conseil', 18)} Conseiller`;
  $('conseiller').innerHTML = `<div class="conseil ${c.alerte ? 'alerte' : ''}"><span class="ic">${icone(c.alerte ? 'info' : 'conseil', 20)}</span><div><p>${c.txt}</p>
    <div class="conseil-nav">${c.aller ? `<button class="btn primaire" data-aller="${c.aller}">${c.bouton}</button>` : ''}${L.length > 1 ? `<button class="btn" data-conseil-suivant="1" aria-label="Conseil suivant">Autre conseil</button><span>${i + 1} / ${L.length}</span>` : ''}</div></div></div>`;
  // objectifs
  const os = objectifs(s, r).filter(o => o.v < o.cible).slice(0, 3);
  $('objectifs').innerHTML = os.map(o => `<div class="objectif"><div class="tete"><button class="lien" data-aller="${o.aller}"><b>${o.titre}</b></button><span>${o.fmt(o.v)}</span></div>
    <div class="progres" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.max(0, Math.min(1, o.v / o.cible)) * 100)}" aria-label="${o.titre}"><div style="width:${Math.max(0, Math.min(1, o.v / o.cible)) * 100}%"></div></div></div>`).join('') || '<p>Tous les objectifs sont atteints. Bravo !</p>';
  if (etatUI.onglet === 'glossaire') rendreGlossaire();
  if (etatUI.onglet === 'resume') rendreResume(s, r);
  if (etatUI.onglet === 'graphes') rendreCourbes(s);
  majCoach(s);
}

// ---------------------------------------------------------------- aperçus avant de confirmer
export function apercuAchat(s, id, occasion) {
  const a = ACHATS[id], prix = occasion ? a.occasion : a.prix, e = estimationAchat(id, occasion);
  const lignes = [['Prix', `−${eur(prix)}`, 'moins'], ['Argent après achat', eur(s.argent - prix), s.argent - prix < 0 ? 'moins' : '']];
  if (a.temps || occasion) lignes.push(['Temps libre', `−${num((a.temps || 0) + (occasion ? 1 : 0), 1)} h`, 'moins']);
  if (e && e.mois !== null && e.annuel > 0) { lignes.push(['Économie estimée', `${eurJ(e.annuel / 365)} (~${eur(e.annuel)}/an)`, 'plus']); lignes.push(['Remboursé en', e.mois < 1 ? 'moins d\'un mois' : `~${num(e.mois)} mois (${num(e.min)} à ${num(e.max)})`, '']); }
  else if (ROI_ITEMS[id]?.indirect) lignes.push(['Effet', ROI_ITEMS[id].indirect, '']);
  return `<h2 id="confTitre">Acheter : ${a.nom}${occasion ? ' (occasion)' : ''} ?</h2><p class="aide">${a.desc}</p>
    <dl class="effets">${lignes.map(([k, v, c]) => `<dt>${k}</dt><dd class="${c}">${v}</dd>`).join('')}</dl>
    <div class="actions"><button class="btn" id="confNon">Annuler</button><button class="btn primaire" id="confOui" data-confirmer-achat="${id}" data-occasion="${occasion ? 1 : 0}">Acheter</button></div>`;
}
export function effetAchat(s, id, occasion) {
  const a = ACHATS[id], e = estimationAchat(id, occasion);
  return `−${eur(occasion ? a.occasion : a.prix)} · argent : ${eur(s.argent)}${e && e.mois !== null && e.annuel > 0 ? ` · gain estimé ${eurJ(e.annuel / 365)}` : ''}`;
}
/** Aperçu d'un changement de consigne : chaque °C ≈ 7 % du chauffage de la pièce (ADEME). */
export function apercuConsigne(s, piece, avant, apres) {
  const d = s.dernierJour; if (!d || avant === apres) return '';
  const base = piece ? d.eur[piece] || 0 : ORDRE_PIECES.reduce((t, p) => t + (d.eur[p] || 0), 0);
  const delta = (apres - avant) * 0.07 * base;
  const mois = delta * 30.4;
  return `Impact estimé : ${apres > avant ? '+' : '−'}${Math.abs(apres - avant)} °C ${piece ? `dans ${PIECES[piece].nom.toLowerCase()}` : 'partout'} ≈ ${eurJ(delta)}, soit ${mois >= 0 ? '+' : '−'}${Math.abs(mois).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/mois sur le chauffage, confort ${apres > avant ? '▲' : '▼'}. (Calculé sur ton chauffage réel d'hier ; chaque degré ≈ 7 %, ADEME.)`;
}

// ---------------------------------------------------------------- tutoriel (coach marks)
const ETAPES = [
  { sel: '.tb-date', titre: 'Bienvenue !', texte: 'Ici, la date, la saison et l\'année de ta campagne. La partie commence le 1er décembre, en plein hiver.' },
  { sel: '#jauges', titre: 'Tes jauges', texte: 'Argent, confort, santé, moral, hygiène, bien-être, temps libre. Survole ou touche une jauge pour savoir ce qu\'elle mesure. Les flèches montrent la tendance.' },
  { sel: '#vueTableau', avant: () => choisirVue('tableau'), titre: 'Ton tableau de bord', texte: 'Tout en un coup d\'œil : ta situation, les conseils du moment (« Faire » applique le conseil, « Y aller » ouvre le bon réglage, 3 conseils par semaine), les alertes, tes dépenses du mois face au voisin et les 3 prochains jours.' },
  { sel: '#scene', avant: () => choisirVue('maison'), titre: 'Ta maison', texte: 'Chaque pièce affiche sa température et ce qu\'elle a coûté hier. Clique sur une pièce pour régler son chauffage.' },
  { sel: '#carteConseiller', titre: 'Le conseiller', texte: 'Un conseil à la fois, adapté à ta situation : la plus grosse fuite, le meilleur achat, une jauge qui baisse.' },
  { sel: '#carteObjectifs', titre: 'Tes objectifs', texte: 'Trois objectifs à la fois, avec ta progression. Clique sur un objectif pour aller au bon endroit.' },
  { sel: '#sections', titre: 'Six sections', texte: 'Maison, Vie quotidienne, Achats, Argent, Savoir, Bilan. Une pastille verte signale une nouveauté débloquée.' },
  { sel: '[data-acheter="thermometre"]', avant: () => ouvrir('b-maison'), titre: 'Ton premier achat', texte: 'Achète les thermomètres (12 €) : sans eux, impossible de savoir quelle pièce te coûte le plus. Clique sur le prix.', fait: (s) => s.possede.thermometre },
  { sel: '#thermostats', avant: () => ouvrir('maison'), titre: 'Le chauffage', texte: 'Baisse la consigne de nuit à 16 °C : sous la couette, on dort mieux au frais, et chaque degré en moins économise environ 7 %.', fait: (s) => (s.possede.robinets ? s.pieces.chambre.consigneNuit : s.central.consigneNuit) <= 16 },
  { sel: '#btnJour', titre: 'Fais avancer le temps', texte: 'Passe au jour suivant. Un message te montrera ce que ta journée a coûté.', fait: (s) => s.jour >= 1 },
  { sel: '.temps-int', titre: 'Avancer plus vite', texte: 'Semaine, mois ou jusqu\'au prochain événement : le jeu s\'arrête de lui-même sur chaque choix important.' },
  { sel: '[data-section="bilan"]', titre: 'Ce que tu apprends', texte: 'Dans Bilan : tes résultats, et chaque découverte devenue un principe dans l\'encyclopédie ; le glossaire explique chaque terme.' },
  { sel: '#btnAide', titre: 'C\'est parti !', texte: 'Tu peux rejouer ce tutoriel à tout moment avec ce bouton. La page « Comment jouer » (Savoir › Aide) résume les règles et les raccourcis. Bon hiver !' },
];
const coach = { actif: false, i: 0 };
export const coachActif = () => coach.actif;
export function demarrerTutoriel(s) { ETAPES.forEach(e => delete e.vu); coach.actif = true; coach.i = 0; afficherEtape(s); }
export function arreterTutoriel() { coach.actif = false; $('coach').classList.add('cache'); prefs.tutoFait = true; sauverPrefs(); }
export function etapeSuivante(s, sens = 1) {
  coach.i += sens;
  if (coach.i >= ETAPES.length) return arreterTutoriel();
  coach.i = Math.max(0, coach.i); afficherEtape(s);
}
let sAct = null;
function afficherEtape(s) {
  sAct = s;
  const e = ETAPES[coach.i];
  if (e.avant) { e.avant(); document.dispatchEvent(new CustomEvent('guide-rendre')); }
  $('coach').classList.remove('cache');
  $('coachEtape').textContent = `Étape ${coach.i + 1} sur ${ETAPES.length}`;
  $('coachTitre').textContent = e.titre; $('coachTexte').textContent = e.texte;
  $('coachPrec').disabled = coach.i === 0;
  majCoach(s);
  setTimeout(() => $('coachSuiv').focus(), 30);
}
export function majCoach(s) {
  if (!coach.actif) return;
  sAct = s || sAct;
  const e = ETAPES[coach.i], el = document.querySelector(e.sel);
  const fait = !e.fait || e.fait(sAct);
  $('coachSuiv').textContent = coach.i === ETAPES.length - 1 ? 'Terminer' : e.fait && !fait ? 'Passer cette étape' : 'Suivant';
  $('coachSuiv').classList.toggle('primaire', fait);
  const halo = document.querySelector('.coach-halo'), bulle = document.querySelector('.coach-bulle');
  if (!el) { halo.style.cssText = 'width:0;height:0;left:50%;top:40%'; bulle.style.left = '50%'; bulle.style.top = '40%'; bulle.style.transform = 'translate(-50%,-50%)'; return; }
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect(), m = 6;
    Object.assign(halo.style, { left: `${r.left - m}px`, top: `${r.top - m}px`, width: `${r.width + 2 * m}px`, height: `${r.height + 2 * m}px` });
    const bw = Math.min(340, innerWidth - 24), bh = bulle.offsetHeight || 170;
    let top = r.bottom + 14; if (top + bh > innerHeight - 90) top = Math.max(12, r.top - bh - 14);
    if (top + bh > innerHeight - 80 || top < 0) top = Math.max(12, innerHeight - bh - 100);
    const left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
    Object.assign(bulle.style, { left: `${left}px`, top: `${top}px`, transform: 'none' });
  });
  if (e.fait && fait && !e.vu) { e.vu = true; setTimeout(() => { if (coach.actif && ETAPES[coach.i] === e) etapeSuivante(sAct); }, 700); }
}
