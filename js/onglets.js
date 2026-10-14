// Onglets par domaine (v0.3) : Maison, Eau chaude, Cuisine, Linge, Électricité, Jardin, Budget
import { GESTES, JOURS_HABITUDE, TARIFS, TEMPO, BALLON, DOUCHE, VAISSELLE, REGIMES, CUISINE, ABONNEMENTS, PLAISIRS, GRENIER, MEDIATHEQUE, CHANGEMENT_TARIF, ETE } from './data.js';
import { chapitreDuJour } from './meteo.js';
import { eur, fmtH, gestesActifs } from './simulation.js';

const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
export const ONGLETS = [
  ['maison', '🏠 Maison', ['Instruments', 'Isolation', 'Chauffage', 'Confort', 'Été']],
  ['eau', '🚿 Eau chaude', ['Eau chaude']],
  ['cuisine', '🍳 Cuisine', ['Cuisine', 'Cuisine solaire']],
  ['linge', '👕 Linge', []],
  ['elec', '⚡ Électricité', ['Électricité', 'Production']],
  ['jardin', '🌱 Jardin', ['Jardin']],
  ['budget', '💶 Budget', []],
];
export const etatUI = { onglet: 'maison' };

// bouton de choix générique : modifie un chemin de l'état (ex. "sys.ballon.consigne")
export const choixSet = (chemin, opts, val) => `<span class="choix">${opts.map(([v, l, off]) => `<button data-set="${chemin}" data-v="${v}" class="${String(v) === String(val) ? 'actif' : ''}" ${off ? 'disabled' : ''}>${l}</button>`).join('')}</span>`;
export function tagGeste(s, g) {
  const st = s.gestes[g];
  if (st.habitude) return '<span class="tag habitude">habitude ✓</span>';
  const t = GESTES[g].temps ? ` · ${fmtH(GESTES[g].temps)}/j` : '';
  if (st.pratique > 0) return `<span class="tag appr">apprentissage ${st.pratique}/${JOURS_HABITUDE} · −${GESTES[g].cout} moral/j${t}</span>`;
  return `<span class="tag">nouveau geste · −${GESTES[g].cout} moral/j${t}</span>`;
}
const ouiNon = (chemin, val, libOui = 'Oui', libNon = 'Non', off = false) => choixSet(chemin, [[false, libNon], [true, libOui, off]], !!val);
const ligne = (lab, contenu) => `<div class="ligne"><label>${lab}</label>${contenu}</div>`;
const aide = (t) => `<p class="aide">${t}</p>`;

export function rendreEte(s) {
  const chap = chapitreDuJour(Math.min(s.jour, 125)).id;
  if (chap === 'hiver') return aide('☀️ Commandes d\'été (volets le jour, nuits ouvertes, ventilateur, clim) disponibles à partir du printemps.');
  const g = gestesActifs(s);
  let h = `<h3>☀️ Contre la chaleur</h3>`;
  h += ligne('Volets le jour', ouiNon('voletsJour', s.voletsJour, 'Fermés 10 h-19 h', 'Ouverts') + (g.voletsJour ? ' ' + tagGeste(s, 'voletsJour') : ''));
  h += ligne('La nuit', ouiNon('ventNuit', s.ventNuit, 'Grand ouvert (courant d\'air)', 'Comme le jour') + (g.ventNuit ? ' ' + tagGeste(s, 'ventNuit') : '') + (s.possede.moustiquaire ? ' <span class="tag">moustiquaire</span>' : ''));
  if (s.possede.ventilateur) h += ligne('Ventilateur', ouiNon('ventilateur', s.ventilateur, `Allumé (${ETE.ventilateur} W)`, 'Éteint'));
  if (s.possede.clim) h += ligne('Clim mobile', ouiNon('climActive', s.climActive, `Active (${ETE.climElec} W)`, 'Éteinte') + (s.climActive ? choixSet('climConsigne', [[23, '23 °C'], [26, '26 °C'], [28, '28 °C']], s.climConsigne) : ''));
  h += aide('En été tout s\'inverse : le soleil et la cuisson réchauffent la maison. Un ventilateur rafraîchit le ressenti de ~3 °C pour 45 W ; une clim mobile consomme 20 fois plus.');
  return h;
}

export function rendreEau(s) {
  const y = s.sys, b = y.ballon, d = y.douche;
  let h = `<h3>🛢️ Ballon électrique ${BALLON.litres} L</h3>`;
  h += ligne('Température', choixSet('sys.ballon.consigne', [[65, '65 °C'], [60, '60 °C'], [55, '55 °C'], [50, '50 °C ⚠️'], [45, '45 °C ⚠️']], b.consigne));
  h += ligne('Chauffe', choixSet('sys.ballon.mode', [['continu', 'En continu'], ['hc', 'Heures creuses (22 h-6 h)'], ['midi', 'À midi (solaire)']], b.mode));
  h += aide(`Pertes en attente : ~${num(BALLON.UA * (b.consigne - 20) * 24 / 1000, 2)} kWh/jour${s.possede.jaquette ? ' (−35 % avec la jaquette)' : ''}. Sous ${BALLON.legionelles} °C, les légionelles prolifèrent : risque pour la santé. Chauffer en HC ne fait gagner que si l'option tarifaire est HC ou Tempo.`);
  h += `<h3>🚿 Douche</h3>`;
  h += ligne('Type', choixSet('sys.douche.seau', [[false, 'Douche'], [true, 'Au seau (12 L)', !s.possede.seau]], d.seau));
  if (!d.seau) {
    h += ligne('Durée', choixSet('sys.douche.minutes', [[15, '15 min'], [10, '10 min'], [7, '7 min'], [5, '5 min'], [3, '3 min']], d.minutes));
    h += ligne('Savonnage', ouiNon('sys.douche.couperEau', d.couperEau, 'Couper l\'eau', 'Eau qui coule') + (d.couperEau ? ' ' + tagGeste(s, 'couperEau') : ''));
    h += ligne('Eau froide du début', ouiNon('sys.douche.recupEau', d.recupEau, 'Récupérer dans le seau', 'Perdue', !s.possede.seau) + (d.recupEau && s.possede.seau ? ' ' + tagGeste(s, 'recupEau') : ''));
  }
  h += ligne('Fréquence', choixSet('sys.douche.frequence', [['quotidienne', 'Chaque jour'], ['unJourSurDeux', 'Un jour sur deux']], d.frequence));
  h += aide(`Pommeau : ${s.possede.pommeau ? DOUCHE.debitEco : DOUCHE.debitVieux} l/min. La douche au seau économise beaucoup… mais l'hygiène et le bien-être en pâtissent. Une douche trop courte ou trop rare fait baisser l'hygiène.`);
  return h;
}

export function rendreCuisine(s) {
  const y = s.sys, g = gestesActifs(s);
  let h = ligne('Alimentation', `<span class="choix col">${Object.entries(REGIMES).map(([k, r]) => `<button data-set="sys.regime" data-v="${k}" class="${y.regime === k ? 'actif' : ''}">${r.nom} · ~${eur(r.cout)}/j</button>`).join('')}</span>`);
  if (y.regime === 'batch' && !s.possede.boites) h += aide('⚠️ Sans boîtes de conservation, le batch prend plus de temps (+25 min/jour).');
  h += ligne('Vaisselle', choixSet('sys.vaisselle', Object.entries(VAISSELLE).map(([k, v]) => [k, v.nom]), y.vaisselle));
  if (y.vaisselle.startsWith('lv')) h += ligne('Lave-vaisselle', ouiNon('sys.vaisselleHC', y.vaisselleHC, 'Départ différé en HC', 'Après le repas'));
  h += ligne('Pain', choixSet('sys.pain', [['baguette', `Baguette (${eur(CUISINE.painBaguette)})`], ['maison', `Pain maison (${eur(CUISINE.painMaison)} + 15 min)`]], y.pain));
  h += ligne('Courses', ouiNon('sys.liste', y.liste, 'Liste et menu des restes', 'Au feeling') + (g.liste ? ' ' + tagGeste(s, 'liste') : ''));
  h += ligne('Prix', ouiNon('sys.prixKiloGeste', y.prixKiloGeste, 'Comparer au kilo', 'Prix affiché') + (g.prixKilo ? ' ' + tagGeste(s, 'prixKilo') : ''));
  h += ligne('Vrac', ouiNon('sys.vrac', y.vrac, 'Acheter en vrac', 'Paquets'));
  h += ligne('Casseroles', ouiNon('sys.couvercle', y.couvercle, 'Avec couvercle', 'Sans') + (g.couvercle ? ' ' + tagGeste(s, 'couvercle') : ''));
  h += ligne('Bouilloire', ouiNon('sys.bouilloire', y.bouilloire, 'Quantité exacte', 'Pleine') + (g.bouilloire ? ' ' + tagGeste(s, 'bouilloire') : ''));
  if (s.possede.fresnel || s.possede.fourSolaire) h += ligne('Cuisine solaire', ouiNon('sys.cuisineSolaire', y.cuisineSolaire, 'Quand il fait beau', 'Non') + (s.possede.fresnel && !s.possede.lunettes ? ' <span class="tag" style="color:#b91c1c">⚠️ lentille sans lunettes</span>' : ''));
  h += `<h3>🧊 Frigo</h3>` + ligne('Réglage', choixSet('sys.frigo.reglage', [[2, 'Très froid (1-2 °C)'], [4, '4 °C (conseillé)']], y.frigo.reglage));
  h += ligne('Plats chauds', ouiNon('sys.frigoGeste', y.frigoGeste, 'Laisser refroidir avant', 'Directement au frigo') + (g.frigo ? ' ' + tagGeste(s, 'frigo') : ''));
  h += ligne('Givre', `<span>${Math.round(y.frigo.givre * 100)} %</span> <button class="btn" data-action="degivrer" ${y.frigo.givre < 0.1 ? 'disabled' : ''}>Dégivrer (1 h)</button>`);
  h += aide('Un quart d\'heure de cuisine en plus par jour peut économiser plus que n\'importe quel équipement : les courses sont le premier poste. Mais « pâtes et riz » à tous les repas ruine le bien-être et la santé.');
  return h;
}

export function rendreElec(s) {
  const y = s.sys, g = gestesActifs(s);
  const desc = { base: `${num(TARIFS.base.prix(12), 4)} €/kWh à toute heure`, hphc: `HP ${num(TARIFS.hphc.prix(12), 4)} · HC ${num(TARIFS.hphc.prix(2), 4)} €/kWh (22 h-6 h)`, tempo: `bleu ${num(TEMPO.bleu[1], 4)}, blanc ${num(TEMPO.blanc[1], 4)}, rouge ${num(TEMPO.rouge[1], 4)} €/kWh en HP` };
  let h = `<h3>📑 Option tarifaire</h3>` + Object.entries(TARIFS).map(([k, t]) => `<div class="article"><div><b>${t.nom}</b>${y.tarif === k ? ' <span class="tag habitude">actuelle</span>' : ''}${y.tarifFutur === k ? ` <span class="tag appr">au jour ${y.tarifEffet + 1}</span>` : ''}<div class="d">${desc[k]} · abonnement ${eur(t.aboMois)}/mois</div></div>${y.tarif === k || y.tarifFutur === k ? '' : `<button class="btn" data-action="tarif" data-v="${k}">Changer</button>`}</div>`).join('');
  h += aide(`Changer d'option : ${fmtH(CHANGEMENT_TARIF.temps)} de démarches, effectif au bout de ${CHANGEMENT_TARIF.delai} jours. Tempo : la couleur du lendemain est annoncée la veille (jusqu'à 22 jours rouges, en semaine, en hiver). Décale ballon, lessive et lave-vaisselle.`);
  h += `<h3>🔌 Veilles et éclairage</h3>`;
  h += ligne('Multiprise', s.possede.multiprise ? ouiNon('sys.multipriseGeste', y.multipriseGeste, 'Éteinte le soir', 'Toujours allumée') + (g.multiprise ? ' ' + tagGeste(s, 'multiprise') : '') : '<span class="aide">achète une multiprise à interrupteur</span>');
  h += ligne('Ampoules', s.possede.led ? '<span class="tag habitude">LED</span>' : '<span class="aide">anciennes ampoules (150 W allumés le soir)</span>');
  h += aide(s.possede.wattmetre ? '⚡ Le wattmètre révèle les veilles : box, TV, chargeurs… ~45 W en continu, soit ~400 kWh/an.' : 'Sans wattmètre, impossible de voir ce qui consomme en veille.');
  return h;
}

export function rendreJardin(s) {
  const y = s.sys, chap = chapitreDuJour(Math.min(s.jour, 125)).id;
  let h = '';
  if (!s.possede.potager && !s.possede.herbes) h += aide('Un petit potager (tomates, courgettes, salades) et des herbes aromatiques réduisent les courses à partir du printemps. Il faut ~3 semaines avant la première récolte et un quart d\'heure par jour.');
  if (s.possede.potager) h += ligne('Potager', y.potagerDepuis === null ? 'semé dès le printemps' : chap === 'hiver' ? 'en sommeil' : `${s.jour - y.potagerDepuis >= 21 ? '🥗 récoltes en cours' : `🌱 récolte dans ${21 - (s.jour - y.potagerDepuis)} j`} ${tagGeste(s, 'jardiner')}`);
  if (s.possede.cuve) h += ligne('Cuve de pluie', `💧 ${Math.round(y.pluie)} L en réserve`);
  if (s.possede.composteur) h += ligne('Compost', 'épluchures compostées : moins de sacs poubelle, engrais gratuit');
  return h || aide('Rien au jardin pour l\'instant.');
}

export function rendreBudget(s) {
  const y = s.sys;
  let h = `<h3>📒 Carnet de comptes</h3>`;
  h += y.relevesFaits ? aide('Relevés épluchés ✓') : ligne('Relevés', '<button class="btn" data-action="releves">Éplucher 3 mois de relevés (1 h 30)</button>');
  h += `<h3>🔁 Abonnements</h3>` + Object.entries(ABONNEMENTS).filter(([, a]) => !a.cache || y.relevesFaits).map(([k, a]) => {
    const st = y.abonnements[k];
    const prix = k === 'forfait' && st.renegocie ? a.renegocie : a.mois;
    const acts = !st.actif ? '<span class="tag">résilié</span>' : `${k === 'forfait' && !st.renegocie ? '<button class="btn" data-action="renegocier">Renégocier (30 min)</button>' : ''}<button class="btn" data-action="resilier" data-v="${k}">Résilier (20 min)</button>`;
    return `<div class="article"><div><b>${a.nom}</b><div class="d">${eur(prix)}/mois${a.plaisir ? ` · plaisir +${num(a.plaisir)} bien-être/j` : ''}</div></div><div>${acts}</div></div>`;
  }).join('') + (y.relevesFaits ? '' : aide('Certains prélèvements oubliés n\'apparaissent qu\'en épluchant les relevés.'));
  h += ligne('Médiathèque', y.mediatheque ? '<span class="tag habitude">carte active</span>' : `<button class="btn" data-action="mediatheque">Carte annuelle (${eur(MEDIATHEQUE)})</button>`);
  h += `<h3>🎈 Petits plaisirs</h3>` + ligne('Budget', choixSet('sys.plaisirs', Object.keys(PLAISIRS).map(k => [Number(k), `${k} €/sem.`]), y.plaisirs));
  h += aide('Café en terrasse, cinéma, un livre… Zéro plaisir fait chuter le bien-être, puis le moral. Les premiers euros comptent le plus.');
  h += `<h3>📦 Grenier</h3>` + Object.entries(GRENIER).map(([k, g]) => `<div class="article"><div><b>${g.nom}</b><div class="d">${eur(g.prix)} d'occasion · ${fmtH(g.temps)}</div></div>${y.grenier[k] ? '<span class="tag">vendu</span>' : `<button class="btn" data-action="revendre" data-v="${k}">Revendre</button>`}</div>`).join('');
  return h;
}
