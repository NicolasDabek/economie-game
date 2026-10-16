// v1.1 : écrans de l'autosuffisance, intégrés aux onglets existants
// Jardin (planches, eau du jardin, compost, poules, cueillette), Cuisine (garde-manger, conserves),
// Maison (poêle et bois), Eau chaude (ballon thermodynamique, toilettes sèches), tableau de bord (taux).
import { CULTURES, POTAGER, CONSERVES, BOIS, CET, POULES, CUEILLETTE, GARDE } from './data.js';
import { etatAutonomie, nbPlanches, previsionPlanche, calendrier, kgStock, valeurStock, argentImmobilise, dureeGarde, kgBocaux, kgLacto, achatsSaison,
  cueillettePossible, especesDuMois, secheresseActive, boisDisponible, lotSec, saisonChauffe, tauxAutosuffisance } from './autonomie.js';
import { chapitreDuJour, dateDuJour } from './meteo.js';

const eur = (x) => x.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: x < 100 ? 2 : 0 });
const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
const ligne = (lab, c) => `<div class="ligne"><label>${lab}</label>${c}</div>`;
const aide = (t) => `<p class="aide">${t}</p>`;
const bouton = (action, v, lib, off = false, titre = '') => `<button class="btn" data-autonomie="${action}"${v !== null && v !== undefined ? ` data-v="${v}"` : ''}${off ? ' disabled' : ''}${titre ? ` title="${titre}"` : ''}>${lib}</button>`;
const choix = (chemin, opts, val) => `<span class="choix">${opts.map(([v, l]) => `<button data-set="${chemin}" data-v="${v}" class="${String(v) === String(val) ? 'actif' : ''}">${l}</button>`).join('')}</span>`;
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const dateDoy = (d) => { const x = new Date(Date.UTC(2027, 0, 1) + d * 864e5); return `${x.getUTCDate()} ${MOIS[x.getUTCMonth()]}`; };
const jourMax = (s) => Math.min(s.jour, (s.joursTotal || 365) - 1);

// ---------------------------------------------------------------- Jardin
export function rendreJardinAutonomie(s, tagGeste) {
  const A = etatAutonomie(s), n = nbPlanches(s), chap = chapitreDuJour(jourMax(s)), y = s.sys;
  let h = '';
  if (!s.possede.potager) h += aide('Le potager se cultive par planches de 2 m² : chaque culture a sa fenêtre de semis, sa famille (à faire tourner d\'une année sur l\'autre) et ses bons voisins. Achète le petit potager dans la boutique Jardin pour commencer avec 4 planches et un plan conseillé.');
  else {
    const cal = calendrier(s);
    h += `<h3>🌱 Potager · ${n} planches (${n * POTAGER.m2Planche} m²)</h3>`;
    h += ligne('Entretien', `${chap.id === 'hiver' ? 'en sommeil' : 'un quart d\'heure par jour'} ${tagGeste(s, 'jardiner')}`);
    h += ligne('Semis des frileuses', choix('autonomie.precoce', [[false, 'Après les saints de glace (15 mai)'], [true, 'Dès que la fenêtre s\'ouvre (+15 %, risque de gel)']], A.precoce));
    const lignes = A.planches.slice(0, n).map((p, i) => {
      const C = CULTURES[p.culture], pv = C ? previsionPlanche(s, i) : null;
      const etat = !C ? 'vide' : p.etat === 'libre' ? (chap.doy >= C.semis[0] && chap.doy <= C.semis[1] ? '🟢 à semer' : `semis ${dateDoy(C.semis[0])} → ${dateDoy(C.semis[1])}`) : p.etat === 'pousse' ? `🌱 pousse (récolte dans ${Math.max(0, C.pousse - (s.jour - p.seme))} j)` : `🧺 récolte ${num(p.recolte)}/${num(p.kgPrevu)} kg`;
      const sel = `<select data-set-select="autonomie.planches.${i}.culture" aria-label="Culture de la planche ${i + 1}"${p.etat !== 'libre' ? ' disabled' : ''}>${Object.entries(CULTURES).map(([k, c]) => `<option value="${k}"${k === p.culture ? ' selected' : ''}>${c.ico} ${c.nom}</option>`).join('')}</select>`;
      const f = pv?.f || {};
      const notes = [f.rotation < 1 ? '🔁 même famille qu\'avant : −20 %' : '', f.assoc > 1 ? `🤝 bons voisins +${Math.round((f.assoc - 1) * 100)} %` : '', p.gel ? '🥶 gelé' : ''].filter(Boolean).join(' · ');
      return `<tr><td>${i + 1}</td><td>${sel}</td><td>${etat}</td><td>${pv && p.etat !== 'recolte' ? `~${num(pv.kg)} kg · ${eur(pv.kg * C.prixKg)}` : ''}</td><td class="d">${notes}${C && p.etat === 'libre' && !A.planches[i].anFin ? '' : ''}</td><td>${C && p.etat === 'libre' ? bouton('semer', i, 'Semer (15 min)', !s.possede.potager) : ''}</td></tr>`;
    }).join('');
    h += `<div class="tableau-defile"><table class="planches"><thead><tr><th>#</th><th>Culture</th><th>État</th><th>Prévision</th><th>Effets</th><th></th></tr></thead><tbody>${lignes}</tbody></table></div>`;
    h += aide(`📅 Ce mois-ci : ${cal.semer.length ? `à semer ${cal.semer.join(', ')}` : 'rien à semer'}${cal.recolte.length ? ` · en récolte : ${cal.recolte.join(', ')}` : ''}${cal.cueillette.length ? ` · cueillette : ${cal.cueillette.join(', ').toLowerCase()}` : ''}. Les planches se sèment seules dans leur fenêtre si tu jardines ; semer hors fenêtre divise la récolte par deux. Bons voisins : carotte-poireau, haricot-courge, tomate-salade, chou-salade, ail-carotte.`);
    if (!s.possede.potagerGrand) h += aide('➕ L\'agrandissement (4 planches de plus) se trouve dans la boutique Jardin.');
  }
  // eau du jardin
  if (s.possede.potager) {
    const sec = secheresseActive(s);
    h += `<h3>💧 Eau du jardin</h3>`;
    if (sec) h += `<p class="alerte-ligne">🚱 Arrêté sécheresse jusqu'au ${dateDuJour(sec.fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })} : arrosage au robinet interdit.</p>`;
    h += ligne('Paillage', s.jour < A.paillageJusqua ? `<span class="tag habitude">paillé encore ${A.paillageJusqua - s.jour} j</span>` : bouton('pailler', null, chap.saison === 'automne' ? 'Pailler aux feuilles mortes (1 h, gratuit)' : 'Pailler (1 h, 5 €)', chap.id === 'hiver'));
    h += ligne('Arrosage', [s.possede.oyas ? 'oyas (−60 %)' : '', s.possede.goutte ? (s.possede.cuve ? 'goutte-à-goutte sur la cuve (−50 %)' : 'goutte-à-goutte sans cuve : inutile') : '', s.possede.cuve ? `cuve ${Math.round(y.pluie)} L` : 'au robinet'].filter(Boolean).join(' · '));
    h += aide(`Besoin : ~${num(POTAGER.arrosage.ete, 1)} l/m²/jour l'été. Le paillage garde l'humidité 4 mois (−40 %). Un été sur deux ou presque, un arrêté sécheresse interdit l'arrosage au robinet pendant 3 à 6 semaines : seule l'eau de pluie sauve alors les cultures.`);
  }
  // compost
  const comp = ['composteur', 'lombri', 'bokashi'].filter(k => s.possede[k]);
  if (comp.length || s.possede.potager) {
    h += `<h3>♻️ Compost</h3>`;
    h += comp.length ? ligne('Équipement', comp.map(k => ({ composteur: 'composteur de jardin', lombri: 'lombricomposteur (mûr en 2 mois)', bokashi: 'bokashi (restes cuits, viande, pain)' })[k]).join(' + ')) : aide('Sans compost, le sol s\'épuise : composteur ou lombricomposteur (même en appartement) jusqu\'à +40 % de récolte une fois mûr.');
    if (s.possede.poules && A.poules.n) h += aide('🔄 La boucle tourne : épluchures → poules → fientes → compost → potager.');
  }
  // poules
  if (s.possede.poules) {
    h += `<h3>🐔 Poules</h3>`;
    h += ligne('Basse-cour', A.poules.n ? `${A.poules.n} poule${A.poules.n > 1 ? 's' : ''} ${tagGeste(s, 'poules')}` : 'le poulailler est vide');
    h += ligne('Déclaration en mairie', A.poules.declare ? '<span class="tag habitude">faite</span>' : bouton('declarer', null, 'Déclarer (15 min)'));
    h += ligne('Renard', s.possede.cloture ? '<span class="tag habitude">grillage enterré</span>' : '<span class="tag" style="color:var(--mal)">⚠️ sans grillage enterré</span>');
    h += aide(`~${POULES.oeufsAn} œufs par poule et par an (presque rien l'hiver), soit ~${eur(POULES.prixOeuf)} l'œuf plein air économisé. Aliment : ${Math.round(POULES.alimentKgJour * 1000)} g/jour par poule, moins 30 % si elles mangent les épluchures. En vacances, les œufs vont au voisin.`);
  }
  // cueillette
  const esp = especesDuMois(s);
  h += `<h3>🌿 Cueillette sauvage</h3>`;
  h += ligne('Ce mois-ci', esp.length ? esp.map(([, e]) => e.nom + (e.risque ? ' ⚠️' : '')).join(', ') : 'rien à cueillir');
  h += ligne('Champignons', choix('autonomie.cueillette.pharmacie', [[true, 'Les faire vérifier en pharmacie (+30 min)'], [false, 'Me fier à moi']], A.cueillette.pharmacie));
  h += ligne('Sortie', bouton('cueillette', null, `Partir cueillir (${CUEILLETTE.temps} h)`, !cueillettePossible(s)) + (s.possede.guideCueillette ? ' <span class="tag habitude">guide</span>' : ''));
  h += aide('Une sortie toutes les deux semaines au plus. Ail des ours, sureau et champignons ont des sosies toxiques : un guide de terrain divise le risque par trois, la vérification en pharmacie par dix pour les champignons.');
  if (s.possede.silo) h += ligne('Silo à racines', `les pommes de terre, carottes et courges se gardent ${GARDE.silo} fois plus longtemps`);
  return h;
}

// ---------------------------------------------------------------- Cuisine : garde-manger
export function rendreGardeManger(s) {
  const A = etatAutonomie(s);
  let h = `<h3>🥫 Garde-manger</h3>`;
  const lots = [...A.stock].sort((a, b) => a.fin - b.fin);
  if (!lots.length) h += aide('Vide. Le potager, les poules, la cueillette et les achats de saison le remplissent ; il remplace jusqu\'à 35 % des courses du jour, les produits qui périment le plus tôt d\'abord.');
  else {
    h += ligne('Stock', `${num(kgStock(A))} kg · valeur ${eur(valeurStock(A))}${argentImmobilise(A) > 1 ? ` · ${eur(argentImmobilise(A))} d'argent immobilisé` : ''}`);
    h += `<div class="tableau-defile"><table><thead><tr><th>Produit</th><th>kg</th><th>À consommer avant</th></tr></thead><tbody>${lots.slice(0, 8).map(l => `<tr><td>${l.nom}${l.maison ? ' 🏡' : ''}</td><td>${num(l.kg)}</td><td>${l.fin - s.jour <= 2 ? '<b style="color:var(--mal)">' : ''}${l.fin - s.jour} j${l.fin - s.jour <= 2 ? '</b>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
    if (A.stats.gaspilleKg > 0.5) h += aide(`🗑️ Perdus depuis le début : ${num(A.stats.gaspilleKg)} kg (${eur(A.stats.gaspilleEur)}).`);
  }
  const kb = kgBocaux(s), kl = kgLacto(s);
  h += ligne('Bocaux', bouton('bocaux', null, `Stériliser ${num(Math.min(CONSERVES.bocaux.kgMax, kb))} kg (${CONSERVES.bocaux.temps} h)`, kb < 1) + (s.possede.sterilisateur ? ' <span class="tag habitude">stérilisateur</span>' : ' <span class="tag">à la marmite : risque ×6</span>'));
  h += ligne('Lactofermentation', s.possede.potLacto ? bouton('lacto', null, `Mettre ${num(Math.min(CONSERVES.lacto.kgMax, kl))} kg en pot (1 h)`, kl < 1) : '<span class="aide">pot à lactofermentation dans la boutique Cuisine</span>');
  const as = achatsSaison(s);
  if (as.length) h += ligne('Achats de saison', as.map(([k, a]) => bouton('acheterSaison', k, `${a.nom} · ${eur(a.kg * a.prixKg)}`, s.argent < a.kg * a.prixKg)).join(' '));
  h += aide(`Bocaux : un an de garde, ${CONSERVES.bocaux.kwh} kWh par fournée, mais un bocal mal stérilisé peut donner le botulisme : un couvercle bombé se jette. Lactofermentation : sel et temps, aucune énergie, bon pour la santé. Racines ${dureeGarde(s, 'racines')} j, courges ${dureeGarde(s, 'courges')} j de garde${s.possede.silo ? ' (silo)' : ''}. Acheter en gros en saison coûte moins cher au kilo, mais l'argent dort dans le stock et ce qui pourrit est perdu.`);
  return h;
}

// ---------------------------------------------------------------- Maison : poêle et bois
export function rendrePoele(s, tagGeste) {
  if (!s.possede.poele) return '';
  const A = etatAutonomie(s), P = A.poele;
  let h = `<h3>🔥 Poêle à bois</h3>`;
  h += ligne('Utilisation', choix('autonomie.poele.mode', [['eteint', 'Éteint'], ['soir', 'Le soir (17 h-23 h)'], ['jour', 'Toute la journée']], P.mode) + ' ' + tagGeste(s, 'feuBois'));
  const lots = A.bois.map(l => `${num(l.st)} st ${lotSec(s, l) ? 'sec ✓' : `vert (sec dans ${Math.max(0, (s.possede.abriBois ? BOIS.sechageAbri : BOIS.sechage) - (s.jour - l.jour))} j)`}`).join(' · ');
  h += ligne('Bois', `${num(boisDisponible(s))} stères${lots ? ` : ${lots}` : ''}`);
  h += ligne('Commander', bouton('bois', 'sec', `2 stères secs (${eur(2 * BOIS.prixSec)})`) + ' ' + bouton('bois', 'vert', `2 stères verts (${eur(2 * BOIS.prixVert)})`));
  const depuis = s.jour - P.ramonage;
  h += ligne('Ramonage', `${P.ramonage < 0 ? '<span class="tag" style="color:var(--mal)">jamais fait</span>' : depuis > 365 ? `<span class="tag" style="color:var(--mal)">il y a ${depuis} j</span>` : `<span class="tag habitude">il y a ${depuis} j</span>`} encrassement ${Math.min(100, Math.round(P.encrassement / 2))} % ` + bouton('ramoner', null, `Faire ramoner (${eur(BOIS.ramonage)})`));
  h += aide(`Un stère de bois sec donne ~${BOIS.kwhStere} kWh (${Math.round(BOIS.rendement * 100)} % de rendement). Vert ou humide, il chauffe 25 % de moins et encrasse le conduit trois fois plus vite : le bois se fait sécher 18 à 24 mois${s.possede.abriBois ? ' (abri : 18 mois)' : ''}. Ramonage obligatoire au moins une fois par an : sans attestation, l'assurance peut refuser d'indemniser un feu de cheminée.${saisonChauffe(chapitreDuJour(jourMax(s)).doy) ? '' : ' Hors saison de chauffe, le poêle reste éteint.'}`);
  return h;
}

// ---------------------------------------------------------------- Eau chaude : CET, toilettes sèches
export function rendreEauAutonomie(s) {
  const A = etatAutonomie(s);
  let h = `<h3>🌀 Ballon thermodynamique</h3>`;
  if (s.possede.cet) h += ligne('Installé', `COP ${CET.cop} : ${Math.round((1 - 1 / CET.cop) * 100)} % d'électricité en moins pour l'eau chaude${A.cet.primeJour ? ` · prime CEE de ${eur(A.cet.prime)} attendue dans ${A.cet.primeJour - s.jour} j` : A.cet.prime ? ` · prime CEE de ${eur(A.cet.prime)} reçue` : ''}`);
  else {
    h += ligne('Prime CEE', A.cet.demande !== null ? '<span class="tag habitude">demandée ✓ : tu peux signer le devis</span>' : bouton('demanderCEE', null, 'Demander la prime avant le devis (30 min)'));
    h += aide(`Il pompe la chaleur de l'air de la pièce (COP ~${CET.cop}) : trois fois moins d'électricité que le ballon actuel. Depuis le 1er septembre 2026, MaPrimeRénov' ne finance plus un ballon thermodynamique seul ; il reste la prime CEE (« coup de pouce »), bonifiée jusqu'au 31 décembre 2026 (~${CET.ceeModeste} € pour les ménages modestes, ~${CET.ceeAutre} € sinon, ~${CET.ceeBase} € ensuite). Deux pièges : la demande doit précéder la signature du devis, et l'artisan doit être RGE (l'offre d'occasion à poser soi-même n'y a pas droit).`);
  }
  if (s.possede.toilettesSeches) {
    h += `<h3>🚽 Toilettes sèches</h3>` + ligne('Utilisation', choix('autonomie.toilettes', [[true, 'Oui'], [false, 'Non (WC classiques)']], A.toilettes));
    h += aide('~30 litres d\'eau potable de moins par jour. Un seau de sciure, une vidange au compost : le début gêne (hygiène ressentie en baisse) jusqu\'à ce que ça devienne une habitude.');
  }
  return h;
}

// ---------------------------------------------------------------- tableau de bord
export function carteAutosuffisance(s) {
  const t = tauxAutosuffisance(s);
  const barre = (lab, v, ico) => `<div class="auto-l"><span>${ico} ${lab}</span><span class="auto-b" role="img" aria-label="${lab} ${Math.round(v)} %"><i style="width:${Math.min(100, v)}%"></i></span><b>${Math.round(v)} %</b></div>`;
  return `<div class="carte autosuf"><h3>🏡 Autosuffisance · ${t.titre}</h3>${barre('Alimentation', t.alim, '🥕')}${barre('Eau', t.eau, '💧')}${barre('Chaleur', t.chaleur, '🔥')}${barre('Électricité', t.elec, '☀️')}<p class="aide">Part produite à la maison depuis le début (moyenne ${Math.round(t.global)} %). Ce titre ne compte pas dans le score d'économies : produire soi-même n'est pas toujours rentable.</p></div>`;
}
export function alertesAutonomie(s) {
  const A = etatAutonomie(s), out = [];
  if (!s.possede.potager && !s.possede.poele && !s.possede.cet) return out;
  const cal = calendrier(s);
  if (cal.semer.length) out.push({ t: `🌱 À semer : ${cal.semer.slice(0, 3).join(', ')}`, aller: 'jardin' });
  const bientot = A.stock.filter(l => l.fin - s.jour <= 2 && l.kg > 0.5);
  if (bientot.length) out.push({ t: `🥫 ${num(bientot.reduce((x, l) => x + l.kg, 0))} kg à consommer ou transformer sous 2 j`, aller: 'cuisine' });
  if (secheresseActive(s)) out.push({ t: '🚱 Arrêté sécheresse : pas d\'arrosage au robinet', aller: 'jardin' });
  if (s.possede.poele) {
    if (A.poele.mode !== 'eteint' && A.bois.some(l => l.st > 0 && !lotSec(s, l)) && !A.bois.some(l => l.st > 0 && lotSec(s, l))) out.push({ t: '💨 Bois encore humide : il encrasse le conduit', aller: 'maison' });
    if (s.jour - A.poele.ramonage > 365) out.push({ t: '🧹 Ramonage à faire (obligatoire chaque année)', aller: 'maison' });
  }
  if (A.cet.primeJour) out.push({ t: `💶 Prime CEE dans ${A.cet.primeJour - s.jour} j`, aller: 'eau' });
  return out;
}
