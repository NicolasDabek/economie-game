// Tableau de bord (v0.8.1) : vue d'ensemble pour décider. Lecture seule de l'état, sauf l'instantané mensuel
// (dépenses par poste au 1er du mois) pris par la simulation pour comparer « ce mois-ci » et « le mois dernier ».
import { ACHATS, BANQUE } from './data.js';
import { dateDuJour, prevision } from './meteo.js';
import { scoreFinal, evenementsAVenir, tempsLibre, eur } from './simulation.js';
import { valeurs } from './finance.js';
import { tableauROI, estimationAchat } from './roi.js';
import { palierMoral, palierBE } from './paliers.js';

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
  s.tab.mois = m; s.tab.debut = v;
}
export function moisCourant(s) {
  if (!s.tab) instantaneMois(s);
  return postes(s).map(p => ({ ...p, mois: p.moi - (s.tab.debut[p.id]?.[0] || 0), moisVoisin: p.voisin - (s.tab.debut[p.id]?.[1] || 0), prec: s.tab.prec?.[p.id]?.[0] ?? null }));
}

// actions recommandées, classées par impact en €/an
export function recommandations(s, r = scoreFinal(s)) {
  const L = [], jours = Math.max(7, s.nbJours || s.jour || 7);
  for (const [id, a] of Object.entries(ACHATS)) {
    if (s.possede[id] || a.prix > s.argent - 100 || (a.temps || 0) > Math.max(0, tempsLibre(s))) continue;
    const e = estimationAchat(id); if (!e || e.mois === null || !(e.annuel > 5)) continue;
    const dom = { Instruments: 'maison', Isolation: 'maison', Chauffage: 'maison', Confort: 'maison', 'Été': 'maison', 'Ventilation passive': 'maison', 'Eau chaude': 'eau', Cuisine: 'cuisine', 'Cuisine solaire': 'cuisine', 'Électricité': 'elec', Production: 'elec', Transport: 'transport', Jardin: 'jardin' }[a.cat] || 'maison';
    if ((dom === 'transport' && s.jour < 3) || (dom === 'jardin' && s.jour < 21) || (dom === 'elec' && s.jour < 2)) continue;   // sous-onglet pas encore débloqué
    L.push({ titre: `Acheter : ${a.nom}`, an: e.annuel, roi: e.annuel / a.prix * 100, jauge: a.temps ? `−${a.temps} h de temps libre` : null, aller: 'b-' + dom });
  }
  for (const p of postes(s)) {
    const fuite = (p.moi - p.voisin) / jours * 365;
    if (p.id !== 'imprevus' && fuite > 30 && s.jour >= 7 && !(p.aller === 'transport' && s.jour < 3)) L.push({ titre: `Réduire le poste « ${p.nom.toLowerCase()} »`, an: fuite, roi: null, jauge: 'tu dépenses plus que le voisin', aller: p.aller, fuite: true });
  }
  if (s.fin && s.argent > 3000) { const m = s.argent - 1500; L.push({ titre: `Placer ${eur(m)} sur le Livret A`, an: m * BANQUE.livretA.taux, roi: BANQUE.livretA.taux * 100, jauge: 'disponible à tout moment', aller: 'banque' }); }
  const pm = palierMoral(s.volonte), pb = palierBE(s.bienetre);
  if (s.volonte < 40 || s.bienetre < 50) L.push({ titre: `Remonter ${s.volonte < 40 ? 'le moral' : 'le bien-être'} (${s.volonte < 40 ? pm.nom : pb.nom})`, an: 600, roi: null, jauge: s.volonte < 40 ? pm.conseil : pb.conseil, aller: 'budget', urgent: true });
  return L.sort((a, b) => (b.urgent ? 1e9 : b.an) - (a.urgent ? 1e9 : a.an)).slice(0, 3);
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
  const projMois = depMois / Math.max(1, jm - 1 || 1) * jdm;
  const pct = (x) => `${Math.round(x)} %`;

  // 1. situation
  const situation = `<div class="tb-carte tb-situation"><h3>Ta situation</h3><div class="tb-chiffres">
    <div><span>Compte courant</span><b class="${s.argent < 0 ? 'moins' : ''}">${eur(s.argent)}</b></div>
    <div><span>Patrimoine (placements compris)</span><b>${eur(r.patrimoine)}</b><small>voisin ${eur(r.patrimoineVoisin ?? 0)}</small></div>
    <div><span>Économisé vs voisin</span><b class="${r.economies >= 0 ? 'plus' : 'moins'}">${eur(r.economies)}</b></div></div>
    <div class="tb-prec"><span>Épargne de précaution : ${eur(prec)} / ${eur(cible)} (3 mois de reste à vivre)</span><div class="progres" role="progressbar" aria-valuenow="${Math.round(pPrec)}" aria-valuemin="0" aria-valuemax="100" aria-label="Épargne de précaution"><div style="width:${pPrec}%"></div></div><small>${pPrec >= 100 ? '✓ Constituée : une panne ne te mettra pas à découvert.' : 'À constituer avant d\'investir à risque.'}</small></div>
    ${s.eco ? `<div class="tb-budget"><div>Entrées / mois<b class="plus">+${eur(salaire)}</b></div><div>Loyer<b class="moins">−${eur(loyer)}</b></div><div>Dépenses du mois (projection)<b class="moins">−${eur(projMois)}</b></div><div>Solde estimé<b class="${salaire - loyer - projMois >= 0 ? 'plus' : 'moins'}">${eur(salaire - loyer - projMois)}</b></div></div>` : ''}</div>`;

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
  const recos = `<div class="tb-carte"><h3>Que faire maintenant ?</h3><ol class="tb-reco">${reco.map(x => `<li><div><b>${x.titre}</b><small>${x.urgent ? '⚠️ prioritaire' : `~${eur(x.an)}/an`}${x.roi ? ` · rendement ${Math.round(x.roi)} %/an` : ''}${x.jauge ? ` · ${x.jauge}` : ''}</small></div><button class="btn primaire" data-aller="${x.aller}">Y aller</button></li>`).join('') || '<li>Rien d\'urgent : avance dans le temps.</li>'}</ol></div>`;

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
