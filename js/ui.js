// Rendu de l'interface (DOM uniquement, aucune règle de jeu ici)
import { PIECES, ORDRE_PIECES, VETEMENTS, ACHATS, PRINCIPES, PRIX, LESSIVE, SEUIL_ENCOMBREMENT, ARGENT_DEPART } from './data.js';
import { prevision, chapitreDuJour } from './meteo.js';
import { ONGLETS, etatUI, rendreEte, rendrePassif, rendreEau, rendreCuisine, rendreElec, rendreJardin, rendreBudget, rendreTransport, rendreEncyclopedie, rendreCombos, tagGeste } from './onglets.js';
import { tableauROI, estimationAchat } from './roi.js';
import { rendreBanque, rendreInvest, tauxTxt } from './ui-finance.js';
import { projection } from './finance.js';
import { BANQUE } from './data.js';
import { FINANCE, STOCKAGE, ROI_ITEMS } from './data.js';
import { COMBOS } from './data.js';
import { dateDuJour, anneeDuJour } from './meteo.js';
import { ROUTINES, routineDispo } from './simulation.js';
import { palierMoral, palierBE } from './paliers.js';
import { rendreNavigation, rendreGuide } from './guide.js';
import { isolationVetements, encombrement, scoreFinal, eur, tempsLibre, tempsBudget, tempsGestes, fmtH, humiditeRelative, coutLessive, remplissage, linge, tempsLessive, coutParUsage, capitalInvesti, choixDilemme, titreDilemme, moyennes, evenementsAVenir, prixGaz, LAVAGE_MAIN } from './simulation.js';

const $ = (id) => document.getElementById(id);
const deg = (t) => `${t.toFixed(1).replace('.', ',')} °C`;
const num = (x, d = 1) => x.toFixed(d).replace('.', ',');

export const options = { lessive: { temp: 30, sechage: 'air', midi: false, hc: false } };

function couleurTemp(t) {
  const x = Math.max(0, Math.min(1, (t - 10) / 14));
  return `hsl(${220 - 220 * x}, 75%, 82%)`;
}

export const etatJauges = { prec: null, cur: null, jour: -1 };
export function rendreJauges(s) {
  const libre = Math.max(0, tempsLibre(s)), budget = tempsBudget(s);
  const cap = capitalInvesti(s);
  const j = [
    ['💶 Argent', s.argent, ARGENT_DEPART, eur(s.argent)],
    ['😊 Confort', s.confort, 100, Math.round(s.confort) + ' %'],
    ['❤️ Santé', s.sante, 100, Math.round(s.sante) + ' %'],
    ['💪 Moral', s.volonte, 100, Math.round(s.volonte) + ' %'],
    ['🧼 Hygiène', s.hygiene, 100, Math.round(s.hygiene) + ' %'],
    ['🌻 Bien-être', s.bienetre, 100, Math.round(s.bienetre) + ' %'],
    ['⏳ Temps libre', libre, budget, `${fmtH(libre)} / ${fmtH(budget)}`],
    ['🏗️ Équipements', cap, 400, eur(cap)],
  ];
  const NOMS_M = { plaisirs: 'plaisirs (usés par la répétition)', social: 'vie sociale', lumiere: 'jours courts', monotonie: 'assiette monotone', vacances: 'vacances', stress: 'stress (argent, pannes, maladie)', controle: 'budget maîtrisé' };
  const raisonsM = s.mor?.raisons?.length ? ` En ce moment : ${s.mor.raisons.slice(0, 3).map(([k, x]) => `${NOMS_M[k] || k} ${x > 0 ? '+' : ''}${Math.round(x)}`).join(', ')}.` : '';
  const TIPS = [
    'Ton compte courant. Le salaire (loyer déduit) arrive le 1er du mois. Sous zéro : découvert et agios.',
    'Comment tu te sens dans ta maison : chaleur ressentie, courants d\'air, humidité. Le froid abîme la santé ; sous 55 de moyenne sur la partie, aucun titre de sobriété.',
    'Froid, chaleur, moisissures et alimentation l\'abîment. Sous 40, tu tombes malade : médecin, pharmacie et jours de carence non payés.',
    'Ton moral, le carburant de ta volonté. Chaque nouveau geste en coûte jusqu\'à devenir une habitude. À zéro : rechute (dépenses impulsives).' + raisonsM,
    'Douches, linge propre, vaisselle. Basse, elle isole et pèse sur ta carrière.',
    'Plaisirs, repas, sommeil, lumière, vie sociale. Le carburant du moral.',
    'Le temps qu\'il te reste aujourd\'hui après le travail et les gestes. Les chantiers et les nouveaux gestes en consomment.',
    'Ce que tu as dépensé en équipements encore en service.',
  ];
  const PM = palierMoral(s.volonte), PB = palierBE(s.bienetre);
  TIPS[3] += ` Palier ${PM.ico} ${PM.nom} : ${PM.effet} Pour remonter : ${PM.conseil}`;
  TIPS[5] += ` Palier ${PB.ico} ${PB.nom} : ${PB.effet} Pour remonter : ${PB.conseil}`;
  const PAL = { 3: PM, 5: PB };
  const nivPal = (p) => ['epanoui', 'neutre', 'forme', 'correct'].includes(p.id) ? 'ok' : ['fragile', 'fatigue'].includes(p.id) ? 'warn' : 'mal';
  const prec = etatJauges.prec, mem = {};
  $('jauges').innerHTML = j.map(([l, v, max, txt], i) => {
    const pct = Math.max(0, Math.min(100, v / max * 100));
    const niv = PAL[i] ? nivPal(PAL[i]) : i === 7 ? 'ok' : pct >= 60 ? 'ok' : pct >= 40 ? 'warn' : 'mal';
    mem[l] = v; const avant = prec?.[l];
    const fl = avant === undefined || Math.abs(v - avant) < (i === 0 || i === 7 ? 1 : 0.5) ? '' : v > avant ? '<span class="fl" aria-label="en hausse">▲</span>' : '<span class="fl" aria-label="en baisse">▼</span>';
    return `<div class="jauge niv-${niv}" role="listitem" tabindex="0" data-tip="${TIPS[i]}" aria-label="${l.replace(/^\S+ /, '')} : ${txt}. ${TIPS[i]}"><div class="lib"><span>${l}</span><b>${txt}${fl}</b></div><div class="barre"><div style="width:${pct}%"></div></div>${PAL[i] ? `<span class="palier" data-palier="${PAL[i].id}">${PAL[i].ico} ${PAL[i].nom}</span>` : ''}</div>`;
  }).join('');
  if (etatJauges.jour !== s.jour) { etatJauges.prec = etatJauges.cur; etatJauges.cur = mem; etatJauges.jour = s.jour; }
  const tot = s.joursTotal || 365, nAns = Math.round(tot / 365);
  const ch = chapitreDuJour(Math.min(s.jour, tot - 1));
  const dt = dateDuJour(Math.min(s.jour, tot - 1)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const SAI = { hiver: '❄️ Hiver', printemps: '🌱 Printemps', ete: '☀️ Été', automne: '🍂 Automne' };
  $('date').textContent = s.fini ? 'Fin de la campagne' : `${dt} · ${SAI[ch.saison] || ch.nom} · année ${anneeDuJour(s.jour) + 1}/${nAns}`;
  const av = evenementsAVenir(s).filter(e => e.annonce > 0);
  $('annonces').innerHTML = av.map(e => `<span>📅 Dans ${e.jour - s.jour} j : <b>${e.titre}</b>. ${e.texte}</span>`).join('');
  $('annonces').classList.toggle('cache', !av.length);
}

// Lever et coucher du soleil à Lyon (heure légale), selon le jour de l'année : ~8 h 10 / 17 h 00 fin décembre,
// ~5 h 50 / 21 h 35 fin juin (éphémérides IMCCE). Aube et crépuscule : ~1 h avant le lever / après le coucher.
export function soleil(jourJeu = 0) {
  const doy = (334 + jourJeu) % 365, a = 2 * Math.PI * (doy - 172) / 365;
  return { lever: 7.0 - 1.15 * Math.cos(a), coucher: 19.25 + 2.3 * Math.cos(a) };
}
export function rendreHorloge(h, jourJeu = 0) {
  const { lever, coucher } = soleil(jourJeu);
  const jour = h >= lever && h < coucher, aube = !jour && (h >= lever - 1.5 && h < lever || h >= coucher && h < coucher + 1);
  $('ciel').classList.toggle('nuit', !jour && !aube);
  $('astre').textContent = jour ? '☀️' : aube ? '🌅' : '🌙';
  $('astre').title = jour ? 'Jour' : aube ? (h < 12 ? 'Aube' : 'Crépuscule') : 'Nuit';
  $('heure').textContent = `${h} h`;
}

const ROOMS = { salon: [50, 120, 262, 210], chambre: [318, 120, 232, 102], cuisine: [318, 228, 232, 102] };
const SAISON_CIEL = { hiver: ['#bcd3f2', '#e8f0fb'], printemps: ['#a7d8f5', '#e6f6ec'], ete: ['#7cc6f7', '#fff3d6'], automne: ['#c9c1e8', '#f7e7d4'] };
export function rendreMaison(s) {
  const d = s.dernierJour;
  const voit = s.possede.thermometre, hygro = s.possede.hygrometre;
  let pire = null;
  if (voit && d) pire = ORDRE_PIECES.reduce((a, b) => (d.eur[a] > d.eur[b] ? a : b));
  const sa = chapitreDuJour(Math.min(s.jour, (s.joursTotal || 365) - 1)).saison, [c1, c2] = SAISON_CIEL[sa] || SAISON_CIEL.hiver;
  const ext = s.meteo?.[Math.min(s.jour, s.meteo.length - 1)];
  const pieces = ORDRE_PIECES.map(id => {
    const p = s.pieces[id], [x, y, w, h] = ROOMS[id];
    const hr = humiditeRelative(p), humide = hygro && hr > 70;
    const occ = id === 'salon' ? '🧑‍💻' : id === 'chambre' ? '🛏️' : '🍳';
    const temp = voit ? deg(p.t) : '? °C';
    const info = voit ? `Hier : ${d ? eur(d.eur[id]) : '—'}${hygro ? ` · 💧 ${Math.round(hr)} %` : ''}` : (hygro ? `💧 ${Math.round(hr)} %` : 'Thermomètre requis');
    const grand = id === 'salon';
    return `<g class="piece-svg" tabindex="0" role="button" data-piece-clic="${id}" aria-label="${PIECES[id].nom} : ${voit ? temp : 'température inconnue'}${hygro ? `, humidité ${Math.round(hr)} %` : ''}. Régler son chauffage.">
      <rect class="fondP" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${voit ? couleurTemp(p.t) : 'url(#hachures)'}" stroke="${pire === id ? '#dc2626' : '#475569'}" stroke-width="${pire === id ? 4 : 2}"/>
      <text x="${x + 12}" y="${y + 24}" font-size="15" font-weight="700" fill="#0f172a">${PIECES[id].nom}</text>
      <text x="${x + w - 12}" y="${y + 26}" font-size="22" text-anchor="end">${occ}</text>
      <text x="${x + 12}" y="${y + (grand ? 110 : 62)}" font-size="${grand ? 40 : 28}" font-weight="800" fill="#0f172a">${temp}</text>
      <text x="${x + 12}" y="${y + h - 12}" font-size="12.5" fill="#1e293b">${info}</text>
      ${humide ? `<text x="${x + w - 14}" y="${y + h - 10}" font-size="18" text-anchor="end">💧</text>` : ''}
      ${pire === id ? `<text x="${x + w - 12}" y="${y + (grand ? 60 : 56)}" font-size="11.5" font-weight="700" fill="#b91c1c" text-anchor="end">la plus coûteuse</text>` : ''}
    </g>`;
  }).join('');
  const deco = sa === 'hiver' ? '<path d="M110 100 300 22 490 100" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>' : sa === 'ete' ? '<circle cx="545" cy="40" r="20" fill="#fbbf24"/>' : sa === 'automne' ? '<text x="520" y="50" font-size="22">🍂</text>' : '<text x="520" y="50" font-size="22">🌱</text>';
  $('maison').innerHTML = `<svg viewBox="0 0 600 350" role="group" aria-label="Plan de la maison">
    <defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <pattern id="hachures" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#e5e7eb"/><rect width="6" height="12" fill="#f3f4f6"/></pattern></defs>
    <rect width="600" height="350" fill="url(#ciel)"/>
    <rect x="0" y="336" width="600" height="14" fill="${sa === 'hiver' ? '#e2e8f0' : '#86c58b'}"/>
    <path d="M30 112 300 18 570 112z" fill="#7c4a3a"/>${deco}
    <rect x="40" y="110" width="520" height="228" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="4"/>
    ${pieces}
    ${ext ? `<g><rect x="12" y="12" width="128" height="30" rx="15" fill="rgba(255,255,255,.85)"/><text x="76" y="32" font-size="13" text-anchor="middle" fill="#0f172a">Dehors ${Math.round(ext.tMoy)} °C</text></g>` : ''}
  </svg><div class="legende-temp" aria-hidden="true">10 °C <i></i> 24 °C ${voit ? '' : '· pièces hachurées : achète un thermomètre pour voir'}</div>`;
  const buee = !hygro && ORDRE_PIECES.some(id => humiditeRelative(s.pieces[id]) > 75) ? ' 💧 De la buée sur les vitres…' : '';
  $('aideMaison').innerHTML = (voit
    ? (pire ? `Pièce la plus coûteuse hier : <b>${PIECES[pire].nom}</b>.` : 'Passe une journée pour voir les coûts par pièce.')
    : 'Tu ne vois que la facture globale. Les thermomètres révèlent la pièce qui coûte le plus.') + buee
    + ` Gaz : ${num(prixGaz(s), 4)} €/kWh · électricité : ${num(PRIX.elecKwh, 4)} €/kWh.`;
}

export function rendreGrapheElec(s) {
  const c = $('grapheElec'); if (!c) return;
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const d = s.dernierJour?.elecH;
  if (!d) { $('legendeElec').textContent = ''; return; }
  const mx = Math.max(500, ...d.map(x => Math.max(x?.prod || 0, x?.demande || 0)));
  const x = (h) => 30 + h * (W - 40) / 24, y = (w) => H - 18 - w / mx * (H - 28), bw = (W - 40) / 24 - 2;
  g.font = '10px system-ui'; g.fillStyle = '#6b7280';
  for (let h = 0; h < 24; h += 3) g.fillText(h + 'h', x(h), H - 4);
  g.fillText(Math.round(mx) + ' W', 0, 10);
  d.forEach((e, h) => { if (!e) return;
    g.fillStyle = '#93c5fd'; g.fillRect(x(h), y(e.demande), bw, H - 18 - y(e.demande));
    if (e.prod > 0) { g.fillStyle = 'rgba(250,204,21,0.55)'; g.fillRect(x(h), y(e.prod), bw, H - 18 - y(e.prod)); }
    if (e.surplus > 0) { g.fillStyle = '#dc2626'; g.fillRect(x(h), y(e.prod), bw, Math.max(2, y(e.prod - e.surplus) - y(e.prod))); }
  });
  const perdu = d.reduce((a, e) => a + (e?.surplus || 0), 0) / 1000;
  const st = s.dernierJour.stockage;
  $('legendeElec').innerHTML = `<span><span style="color:#3b82f6" aria-hidden="true">■</span> consommation</span> · <span><span style="color:#ca8a04" aria-hidden="true">■</span> production solaire</span> · <span><span style="color:#dc2626" aria-hidden="true">■</span> surplus perdu</span>${s.possede.solaire ? ` · surplus perdu hier : <b>${num(perdu, 2)} kWh</b>${st?.solaire ? `, eau chauffée au soleil ${num(st.solaire, 2)} kWh` : ''}${st?.routed ? `, routé vers le ballon ${num(st.routed, 2)} kWh` : ''}` : ' · (pas de panneau solaire)'}`;
}

export function rendreGraphe(s) {
  const c = $('graphe'), g = c.getContext('2d');
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const d = s.dernierJour;
  if (!d) { g.fillStyle = '#6b7280'; g.font = '14px system-ui'; g.fillText('Passe une première journée pour voir les courbes.', 20, H / 2); $('legende').textContent = ''; return; }
  const tMin = -6, tMax = 28;
  const x = (k) => 30 + k * (W - 40) / 23, y = (t) => H - 20 - (t - tMin) / (tMax - tMin) * (H - 30);
  d.heures.forEach((hh, k) => { if (hh.h >= 18 || hh.h < 8) { g.fillStyle = 'rgba(49,46,129,0.08)'; g.fillRect(x(k) - (W - 40) / 46, 0, (W - 40) / 23, H - 20); } });
  g.strokeStyle = '#e5e7eb'; g.fillStyle = '#6b7280'; g.font = '10px system-ui';
  for (let t = -5; t <= 25; t += 5) { g.beginPath(); g.moveTo(30, y(t)); g.lineTo(W - 10, y(t)); g.stroke(); g.fillText(t + '°', 4, y(t) + 3); }
  d.heures.forEach((hh, k) => { if (k % 3 === 0) g.fillText(hh.h + 'h', x(k) - 6, H - 6); });
  const tracer = (f, col, larg = 2, dash = []) => { g.strokeStyle = col; g.lineWidth = larg; g.setLineDash(dash); g.beginPath(); d.heures.forEach((hh, k) => (k ? g.lineTo(x(k), y(f(hh))) : g.moveTo(x(k), y(f(hh))))); g.stroke(); g.setLineDash([]); g.lineWidth = 1; };
  tracer(hh => hh.te, '#64748b', 2, [4, 3]);
  const leg = ['<span><span style="color:#64748b" aria-hidden="true">┅</span> extérieur</span>', '<span><span style="color:#f59e0b" aria-hidden="true">━</span> ton ressenti</span>'];
  if (s.possede.thermometre) {
    const cols = { salon: '#ef4444', chambre: '#8b5cf6', cuisine: '#10b981' };
    for (const p of ORDRE_PIECES) { tracer(hh => hh.t[p], cols[p], 1.5); leg.push(`<span><span style="color:${cols[p]}" aria-hidden="true">━</span> ${PIECES[p].nom.toLowerCase()}</span>`); }
  }
  tracer(hh => hh.ressenti, '#f59e0b', 3);
  let txt = leg.join(' · ') + (s.possede.thermometre ? '' : ' · (températures des pièces : thermomètres requis)');
  if (s.possede.wattmetre) txt += `<br>⚡ Wattmètre : ${num(d.elecKwh)} kWh achetés hier (dont appoint ${num(d.appointKwh)} kWh)${s.possede.solaire ? `, solaire autoconsommé ${num(d.solaire, 2)} kWh` : ''}.`;
  $('legende').innerHTML = txt;
}

const sl = (attrs, v, lab = 'Consigne') => `<input type="range" min="8" max="23" step="1" value="${v}" ${attrs} data-depart="${v}" aria-label="${lab}" aria-valuetext="${v <= 8 ? 'Arrêt (hors-gel)' : v + ' degrés'}"><span class="val">${v <= 8 ? 'Arrêt' : v + ' °C'}</span>`;
export function rendreChauffage(s) {
  let html = '';
  if (s.possede.robinets) {
    html += ORDRE_PIECES.map(id => {
      const p = s.pieces[id];
      return `<div class="ligne"><label>${PIECES[id].nom}</label>☀️ ${sl(`data-piece="${id}" data-k="consigneJour"`, p.consigneJour, `${PIECES[id].nom}, consigne de jour`)}</div>
              <div class="ligne"><label></label>🌙 ${sl(`data-piece="${id}" data-k="consigneNuit"`, p.consigneNuit, `${PIECES[id].nom}, consigne de nuit`)}</div>`;
    }).join('');
  } else {
    html += `<div class="ligne"><label>Thermostat</label>☀️ ${sl('data-central="consigneJour"', s.central.consigneJour, 'Thermostat, consigne de jour')}</div>
             <div class="ligne"><label></label>🌙 ${sl('data-central="consigneNuit"', s.central.consigneNuit, 'Thermostat, consigne de nuit')}</div>
             <p class="aide">Un seul thermostat, dans le salon : tous les radiateurs chauffent en même temps. Des robinets thermostatiques permettent une consigne par pièce.</p>`;
  }
  if (s.possede.appoint) {
    html += `<div class="ligne"><label>Appoint</label>${choix('appoint', [['non', 'Éteint'], ['oui', 'Suit ma pièce']], s.appoint.actif ? 'oui' : 'non')}
      ${s.appoint.actif ? sl('data-appoint="1"', s.appoint.consigne) : ''}</div>`;
  }
  html += `<p class="aide">Chaudière gaz (rendement 85 %)${s.possede.purge ? ', radiateurs purgés' : ' · ⚠️ radiateurs jamais purgés : haut froid, puissance réduite'}. Jour 7 h-23 h, nuit 23 h-7 h. « Arrêt » = hors-gel (8 °C).</p>`;
  $('thermostats').innerHTML = html;
}

const choix = (nom, opts, val) => `<span class="choix">${opts.map(([v, l]) => `<button data-choix="${nom}" data-v="${v}" class="${v === val ? 'actif' : ''}">${l}</button>`).join('')}</span>`;

export function rendreGestes(s) {
  const l = [
    `<div class="ligne"><label>Portes</label>${choix('portes', [['ouvertes', 'Ouvertes'], ['fermees', 'Fermées']], s.portes)} ${tagGeste(s, 'portes')}</div>`,
    `<div class="ligne"><label>Rideaux</label>${choix('rideaux', [['ouverts', 'Ouverts'], ['nuit', 'Rideaux + volets la nuit'], ['fermes', 'Toujours fermés']], s.rideaux)} ${tagGeste(s, 'rideaux')}</div>`,
    `<div class="ligne"><label>Aération</label>${choix('aeration', [['entrouverte', 'Fenêtre entrouverte'], ['breve', '5 min matin et soir'], ['jamais', 'Jamais']], s.aeration)} ${tagGeste(s, 'aerer')}</div>`,
    `<div class="ligne"><label>Cuisson</label>${choix('cuisson', [['non', 'Normal'], ['oui', 'Four ouvert après usage, couvercles']], s.recupCuisson ? 'oui' : 'non')} ${tagGeste(s, 'cuisson')}</div>`,
  ];
  if (s.possede.bouillotte) l.push(`<div class="ligne"><label>Bouillotte</label>${choix('bouillotte', [['non', 'Non'], ['oui', 'Chaque soir']], s.utiliserBouillotte ? 'oui' : 'non')} ${tagGeste(s, 'bouillotte')}${s.possede.housse ? ' <span class="tag">avec housse</span>' : ''}</div>`);
  l.push(`<div class="ligne"><label>Couches</label>${tagGeste(s, 'couches')}<span class="aide">(2 vêtements chauds ou plus)</span></div>`);
  l.push(`<p class="aide">Gestes du jour : ${fmtH(tempsGestes(s))} de temps. Le temps libre restant en fin de journée redonne du bien-être et du moral.</p>`);
  $('gestes').innerHTML = l.join('');
}

function minibarre(v, col) { return `<span class="minibarre"><div style="width:${Math.min(100, v)}%;background:${col}"></div></span>`; }

export function rendreVetements(s) {
  const iso = isolationVetements(s), enc = encombrement(s);
  $('vetements').innerHTML = Object.entries(VETEMENTS).map(([id, V]) => {
    const e = s.vetements[id];
    let actions = '';
    if (!e.possede) {
      actions += `<button class="btn" data-acheter-vet="${id}" data-q="eco" ${s.argent < V.eco.prix ? 'disabled' : ''}>Premier prix ${eur(V.eco.prix)}</button>`;
      if (V.durable) actions += `<button class="btn" data-acheter-vet="${id}" data-q="durable" ${s.argent < V.durable.prix ? 'disabled' : ''}>Durable ${eur(V.durable.prix)}</button>`;
    } else {
      actions += `<button class="btn" data-porter="${id}">${e.porte ? 'Retirer' : 'Porter'}</button>`;
      if (!V.peau && e.salete > 0 && e.salete < 70 && !e.aere) actions += `<button class="btn" data-aerer-vet="${id}" title="Aérer au lieu de laver (3 min)">Aérer</button>`;
      if (V.peau && e.salete >= 20) actions += `<button class="btn" data-laver-main="${id}" title="${fmtH(LAVAGE_MAIN.temps)}, ${LAVAGE_MAIN.litres} l d'eau tiède">Laver à la main</button>`;
      if (s.possede.couture && e.usure >= 30 && e.reprises < 2) actions += `<button class="btn" data-repriser="${id}" title="1 h de couture">Repriser</button>`;
    }
    const cpu = coutParUsage(s, id);
    const etat = e.possede
      ? `<span>saleté ${minibarre(e.salete, e.salete >= 100 ? 'var(--mal)' : '#a16207')}</span><span>usure ${minibarre(e.usure, '#6b7280')}</span>${cpu !== null && e.prixPaye ? `<span>${eur(cpu)}/jour porté</span>` : ''}`
      : `<span>usure/jour : ${num(V.eco.usure)} %${V.durable ? ` (durable ${num(V.durable.usure, 2)} %)` : ''}</span>`;
    const tags = `<span class="tag">+${num(V.iso)} °C</span>${V.enc ? ` <span class="tag">encombrement ${num(V.enc)}</span>` : ''}${V.assis ? ' <span class="tag">assis, au salon</span>' : ''}${V.protege ? ' <span class="tag">protège les couches du dessus</span>' : ''}${e.possede && e.qualite === 'durable' ? ' <span class="tag habitude">durable</span>' : ''}${e.porte && e.possede ? ' <span class="tag porte">porté</span>' : ''}`;
    return `<div class="vet"><span class="ico">${V.icone}</span><div><b>${V.nom}</b> ${tags}<div class="mini">${etat}</div></div><div class="acts">${actions}</div></div>`;
  }).join('') + `<p class="aide">Isolation portée au salon : <b>+${num(iso)} °C ressentis</b> · encombrement ${num(enc)}/${SEUIL_ENCOMBREMENT}${enc > SEUIL_ENCOMBREMENT ? ' ⚠️ trop de couches, on bouge mal' : ''}${s.possede.calfeutrage ? '' : ' · courants d\'air : jusqu\'à −1 °C'}${s.possede.couture ? '' : ' · Un kit de couture permet de repriser.'}</p>`;
  const o = options.lessive;
  const sale = linge(s), rempli = remplissage(s);
  const opts = { ...o, laverie: s.machine.enPanne };
  const L = s.lessivePrevue;
  $('lessive').innerHTML = `
    <div class="ligne"><label>Température</label>${choix('ltemp', [['30', '30 °C'], ['40', '40 °C'], ['60', '60 °C']], String(o.temp))}</div>
    <div class="ligne"><label>Séchage</label>${choix('lsechage', [['air', 'Étendoir (gratuit, humidifie)'], ['machine', `Sèche-linge (${num(LESSIVE.secheLingeKwh)} kWh)`], ...(s.possede.corde ? [['dehors', 'Dehors (hors hiver)']] : [])], o.sechage)}</div>
    <div class="ligne"><label>Horaire</label>${choix('lheure', [['soir', 'Le soir'], ['hc', 'Heures creuses (22 h)'], ...(s.possede.solaire ? [['midi', 'À midi, au soleil']] : [])], o.hc ? 'hc' : o.midi ? 'midi' : 'soir')}</div>
    <div class="ligne"><label>Panier</label><span>${sale.length ? sale.map(id => VETEMENTS[id].icone).join(' ') : 'vide'} · machine remplie à <b>${Math.round(rempli * 100)} %</b></span></div>
    <div class="ligne"><button class="btn ${L ? 'actif-btn' : ''}" id="btnLessive">${L ? '✓ Lessive prévue aujourd\'hui (annuler)' : (s.machine.enPanne ? '🧺 Aller à la laverie' : '🧺 Lancer une lessive')}</button>
    <span class="aide">${eur(coutLessive(s, opts))} · ${fmtH(tempsLessive(s, opts))} · −${LESSIVE.volonte} moral</span></div>
    <p class="aide">Lave-linge : usure ${Math.round(s.machine.usure)} %${s.machine.enPanne ? ' · <b style="color:#b91c1c">EN PANNE</b>' : ''}. Une machine coûte pareil pleine ou vide.</p>
    ${s.machine.enPanne ? `<div class="ligne"><button class="btn" data-reparer="technicien">Technicien ${eur(PRIX.reparationTechnicien)}</button><button class="btn" data-reparer="diy">Réparer moi-même (${eur(PRIX.reparationPiece)} + 2 h)</button></div>` : ''}`;
}

export function rendreMeteo(s) {
  const pv = prevision(s.meteo, s.jour, s.seed);
  const auj = s.meteo[s.jour];
  const jours = [];
  if (auj && !s.fini) jours.push({ ...auj, nom: 'Aujourd\'hui', tMin: Math.round(auj.tMoy - auj.amplitude / 2), tMax: Math.round(auj.tMoy + auj.amplitude / 2) });
  pv.forEach((j, i) => jours.push({ ...j, nom: ['Demain', 'J+2', 'J+3'][i] }));
  $('meteo').innerHTML = jours.map(j => `<div class="jourMeteo"><div>${j.nom}</div><div class="ico">${j.icone}</div><div>${j.libelle}</div><b>${j.tMin}° / ${j.tMax}°</b>${j.tempo ? `<div class="tempo ${j.tempo}">Tempo ${j.tempo}</div>` : ''}${j.canicule ? '<div class="tempo rouge">canicule</div>' : ''}</div>`).join('') || '<p>La partie est finie.</p>';
}

export function rendreBoutique(s) {
  const cats = {};
  const dom = etatUI.onglet.startsWith('b-') ? etatUI.onglet.slice(2) : etatUI.onglet;
  const filtre = ONGLETS.find(o => o[0] === dom)?.[2] || [];
  if ($('titreBoutique')) $('titreBoutique').textContent = `Boutique : ${(ONGLETS.find(o => o[0] === dom)?.[1] || '').replace(/^\S+ /, '')}`;
  for (const [id, a] of Object.entries(ACHATS)) if (filtre.includes(a.cat)) (cats[a.cat] ||= []).push([id, a]);
  if (!Object.keys(cats).length) { $('boutique').innerHTML = ['banque', 'invest'].includes(etatUI.onglet) ? '<p class="aide">La boutique de chaque domaine affiche le rendement annuel de chaque équipement, à comparer aux placements.</p>' : '<p class="aide">Rien à acheter pour ce domaine. Change d\'onglet pour voir d\'autres articles.</p>'; return; }
  $('boutique').innerHTML = Object.entries(cats).map(([cat, items]) => `<h3>${cat}</h3>` + items.map(([id, a]) => {
    const bloque = id === 'housse' && !s.possede.bouillotte;
    const btn = s.possede[id] ? '<span class="tag habitude">acquis</span>' : `<div class="acts"><button class="btn" data-acheter="${id}" aria-label="Acheter ${a.nom} neuf, ${eur(a.prix)}" ${(s.argent < a.prix || bloque || tempsLibre(s) < (a.temps || 0)) ? 'disabled' : ''}>${eur(a.prix)}</button>${a.occasion ? `<button class="btn" data-acheter="${id}" data-occasion="1" title="Chercher d'occasion : 1 h de recherche" ${(s.argent < a.occasion || bloque || tempsLibre(s) < (a.temps || 0) + 1) ? 'disabled' : ''}>Occasion ${eur(a.occasion)}</button>` : ''}</div>`;
    const est = !s.possede[id] && estimationAchat(id);
    const estTxt = est ? (est.mois === null ? (ROI_ITEMS[id]?.indirect ? `<div class="estim">📈 Gain indirect : ${ROI_ITEMS[id].indirect}</div>` : `<div class="estim">📈 Pas d'économie directe estimée (${eur(est.annuel)}/an)</div>`)
      : `<div class="estim">📈 Retour estimé : ~${dureeTxt(est.mois)} (${dureeTxt(est.min)} à ${dureeTxt(est.max)}) · ~${eur(est.annuel)}/an · rendement <b>~${tauxTxt(est.annuel / est.prix)}</b> vs Livret A ${num(BANQUE.livretA.taux * 100)} %${a.occasion ? ` · d'occasion ~${dureeTxt(estimationAchat(id, true).mois)}` : ''}</div>`) : '';
    return `<div class="article"><div><b>${a.nom}</b>${a.temps ? ` <span class="tag">⏳ ${fmtH(a.temps)}</span>` : ''}<div class="d">${a.desc}${a.fourchette ? ` <i>Fourchette réelle ${a.fourchette[0]}-${a.fourchette[1]} € (estimation, pas de barème officiel).</i>` : ''}${bloque ? ' (il faut d\'abord une bouillotte)' : ''}</div>${estTxt}</div>${btn}</div>`;
  }).join('')).join('');
}

const dureeTxt = (m) => (m == null || !isFinite(m) ? '∞' : m < 1 ? `${Math.max(1, Math.round(m * 30))} j` : m < 24 ? `${Math.round(m)} mois` : `${num(m / 12)} ans`);
function sparkline(r) {
  const W = 110, H = 30, serie = r.serie.length ? r.serie : [0];
  const projAns = r.proj.map(p => p.cumul);
  const vals = [...serie, ...projAns, r.prix, 0];
  const mx = Math.max(...vals), mn = Math.min(...vals);
  const n = serie.length, tot = n + projAns.length * 20;
  const X = (i) => i / Math.max(1, tot) * W, Y = (v) => H - 2 - (v - mn) / Math.max(1e-6, mx - mn) * (H - 4);
  const pts = serie.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const proj = [`${X(n).toFixed(1)},${Y(serie.at(-1)).toFixed(1)}`, ...projAns.map((v, k) => `${X(n + (k + 1) * 20).toFixed(1)},${Y(v).toFixed(1)}`)].join(' ');
  return `<svg width="${W}" height="${H}" class="spark"><line x1="0" x2="${W}" y1="${Y(r.prix)}" y2="${Y(r.prix)}" stroke="#b91c1c" stroke-dasharray="3 2"/><polyline points="${proj}" fill="none" stroke="#94a3b8" stroke-dasharray="2 2"/><polyline points="${pts}" fill="none" stroke="#16a34a" stroke-width="2"/></svg>`;
}
const COLS = [['nom', 'Équipement'], ['prix', 'Payé'], ['mesure', 'Mesuré'], ['annuel', '€/an'], ['entretienAn', 'Entretien/an'], ['payback', 'Retour'], ['residuelAuj', 'Valeur rés.'], ['net5', 'Net 5 ans'], ['ratio', 'Net / €']];
export function rendreInvestissements(s) {
  const rows = tableauROI(s);
  const k = etatUI.roiTri, sens = etatUI.roiSens;
  const cle = (r) => k === 'payback' ? (r.atteint !== null ? -1e6 + r.atteint : r.payback ?? 1e9) : r[k];
  rows.sort((a, b) => (typeof cle(a) === 'string' ? cle(a).localeCompare(cle(b)) : cle(a) - cle(b)) * sens);
  const ligneR = (r) => {
    const sais = ['hiver', 'printemps', 'ete'].map(x => `${x === 'ete' ? 'été' : x} ${num(r.pj[x].v, 2)}${r.pj[x].mesure ? '' : '*'}`).join(' · ');
    const retour = r.atteint !== null ? `✅ jour ${r.atteint + 1}` : r.payback !== null ? `~${dureeTxt(r.payback)} (±${Math.round(r.incertitude * 100)} %)` : (ROI_ITEMS[r.id].indirect ? 'indirect' : '∞');
    return `<tr><td><b>${r.nom}</b>${r.occasion ? ' <span class="tag">occasion</span>' : ''}<br><small>€/jour : ${sais}${r.note ? ' · ' + r.note : ''}${ROI_ITEMS[r.id].indirect ? ' · ' + ROI_ITEMS[r.id].indirect : ''}${r.climEvitee ? ` · clim mobile évitée ${eur(r.climEvitee)}/an (${r.climEviteeFourchette.map(x => Math.round(x)).join('-')} €/an : amortissement + électricité)` : ''}${ACHATS[r.id].fourchette ? ` · prix réel ${ACHATS[r.id].fourchette.join('-')} €` : ''}</small><br>${sparkline(r)}</td>
      <td>${eur(r.prix)}</td><td>${eur(r.mesure)}<br><small>${r.jours} j</small></td><td>${eur(r.annuel)}</td><td>${eur(r.entretienAn)}</td><td>${retour}</td><td>${eur(r.residuelAuj)}<br><small>vie ${num(r.vieAns, 0)} ans, −${Math.round(r.degr * 100)} %/an</small></td>
      <td style="color:${r.net5 >= 0 ? 'var(--ok)' : 'var(--mal)'}">${eur(r.net5)}</td><td>${num(r.ratio, 2)}</td></tr>`;
  };
  const head = COLS.map(([c, l]) => `<th><button class="lien" data-tri="${c}">${l}${k === c ? (sens > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('');
  // batterie contre ballon
  const perdu = s.solaire?.perdu || 0;
  const joursSol = s.possede.solaire ? Math.max(1, s.jour - (s.solaireDepuis ?? 0)) : 0;
  const comp = s.possede.solaire ? `<h3>🔋 Stocker le surplus : batterie ou eau chaude ?</h3>
    <table><tr><th>Solution</th><th>Prix</th><th>Capacité</th><th>€ par kWh stockable</th></tr>
    <tr><td>Batterie plug-and-play</td><td>${eur(ACHATS.batterie.prix)}</td><td>${num(STOCKAGE.batterieUtile)} kWh électriques (rendement ${Math.round(STOCKAGE.batterieRendement * 100)} %)</td><td>${eur(ACHATS.batterie.prix / STOCKAGE.batterieUtile)}</td></tr>
    <tr><td>Routeur → ballon 200 L</td><td>${eur(ACHATS.routeur.prix)}</td><td>~10 kWh de chaleur (ballon existant)</td><td>${eur(ACHATS.routeur.prix / 10)}</td></tr>
    <tr><td>Bidon 10 L en caisse isolée</td><td>${eur(ACHATS.caisse.prix)}</td><td>~0,8 kWh de chaleur</td><td>${eur(ACHATS.caisse.prix / 0.8)}</td></tr>
    <tr><td>Thermos 1 L</td><td>${eur(ACHATS.thermos.prix)}</td><td>~0,08 kWh</td><td>${eur(ACHATS.thermos.prix / 0.08)}</td></tr></table>
    <p class="aide">Surplus solaire perdu depuis l'installation : <b>${num(perdu, 1)} kWh</b> (${num(perdu / joursSol, 2)} kWh/jour, soit ~${eur(perdu / joursSol * 0.2)}/jour à valoriser au mieux). Avec un seul panneau de 400 Wc, aucun stockage ne se rentabilise vite. La chaleur se stocke 10 à 50 fois moins cher que l'électricité, mais elle ne rallume pas la télé le soir.</p>` : '';
  $('investissements').innerHTML = `<p>Capital investi : <b>${eur(capitalInvesti(s))}</b>. Gains <b>mesurés</b> (même usage sans l'équipement), puis projection sur ${FINANCE.annees} ans avec l'énergie à +${Math.round(FINANCE.inflationEnergie * 100)} %/an, la perte d'efficacité, l'entretien, la valeur de revente et le coût d'opportunité (Livret A ${num(FINANCE.livretA * 100)} %).</p>
    ${rows.length ? `<div class="tableau"><table class="roi"><tr>${head}</tr>${rows.map(ligneR).join('')}</table></div><p class="aide">* saison pas encore vécue avec l'équipement : estimation issue de simulations types. Courbe verte : gains cumulés mesurés ; grise : projection annuelle ; rouge : prix payé.</p>` : '<p class="aide">Aucun équipement pour l\'instant. La boutique affiche une estimation de retour avant chaque achat.</p>'}${comp}`;
}

export function rendrePrincipes(s) {
  $('nbPrincipes').textContent = s.principes.length;
  $('totPrincipes').textContent = Object.keys(PRINCIPES).length;
  $('principes').innerHTML = rendreEncyclopedie(s);
  $('combos').innerHTML = rendreCombos(s);
}

export function rendreJournal(s) {
  $('journal').innerHTML = s.messages.slice(0, 80).map(m => `<div class="${m.type}"><small>J${m.jour + 1}</small> ${m.texte}</div>`).join('') || '<div>Ton hiver commence. Bonne chance !</div>';
}

export function rendreFactures(s) {
  const voit = s.possede.thermometre;
  if (!s.factures.length) { $('factures').innerHTML = '<p class="aide">Première facture à la fin de la semaine 1 (gaz, électricité, eau et abonnements).</p>'; return; }
  $('factures').innerHTML = `<table><tr><th>Semaine</th>${voit ? ORDRE_PIECES.map(p => `<th>${PIECES[p].nom}</th>`).join('') : ''}<th>Total</th></tr>` +
    s.factures.slice(-12).map(f => `<tr><td>S${f.semaine}</td>${voit ? ORDRE_PIECES.map(p => `<td>${eur(f.parPiece[p])}</td>`).join('') : ''}<td><b>${eur(f.montant)}</b></td></tr>`).join('') +
    `</table>${voit ? '' : '<p class="aide">Détail du chauffage par pièce visible avec les thermomètres.</p>'}`;
}

export function toast(texte, o = {}) {
  const d = document.createElement('div'); d.className = 'toast ' + (o.type || ''); d.setAttribute('role', 'status');
  d.textContent = texte;
  if (o.effet) { const e = document.createElement('span'); e.className = 'eff'; e.textContent = o.effet; d.appendChild(e); }
  const box = $('toasts'); box.appendChild(d); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => d.remove(), o.duree || 6000);
}

export function rendreDilemme(s) {
  if (!s.dilemme) { $('dilemme').classList.add('cache'); return; }
  const e = titreDilemme(s);
  const corps = s.dilemme === 'bilan' && s.eco?.dernierBilan ? rendreBilan(s.eco.dernierBilan) : `<p>${e.texte}</p>`;
  $('dilemmeContenu').innerHTML = `<h2>${e.titre}</h2>${corps}` + choixDilemme(s).map(o =>
    `<button class="btn choixDilemme" data-dilemme="${o.id}" ${o.possible === false ? 'disabled' : ''}><b>${o.texte}</b><br><small>${o.effet}</small></button>`).join('');
  const dejaVisible = !$('dilemme').classList.contains('cache');
  $('dilemme').classList.remove('cache');
  if (!dejaVisible) setTimeout(() => $('dilemmeContenu').querySelector('button:not([disabled])')?.focus(), 50);
}

function rendreBilan(b) {
  const c = (v) => `color:${v >= 0 ? 'var(--ok)' : 'var(--mal)'}`;
  const g = (l, v) => `<div>${l}<b style="color:${v >= 60 ? 'var(--ok)' : v >= 40 ? 'var(--warn)' : 'var(--mal)'}">${Math.round(v)} %</b></div>`;
  const dom = [...b.parDomaine].sort((x, y) => y.valeur - x.valeur).map(d => `<tr><td>${d.nom}</td><td style="${c(d.valeur)}">${eur(d.valeur)}</td></tr>`).join('');
  return `<div class="stats"><div>Économies de l'année<b style="${c(b.economies)}">${eur(b.economies)}</b></div><div>Cumul depuis le début<b style="${c(b.economiesCumul)}">${eur(b.economiesCumul)}</b></div>
    <div>Patrimoine<b>${eur(b.patrimoine)}</b><small>voisin : ${eur(b.patrimoineVoisin)}</small></div><div>Livrets · placements<b>${eur(b.livrets)} · ${eur(b.placements - b.livrets)}</b></div>
    <div>Placements vs Livret A (année)<b style="${c(b.gainFin)}">${eur(b.gainFin)}</b></div><div>Salaire · inflation<b>${eur(b.salaire)}/mois · ${(b.inflation * 100).toFixed(1).replace('.', ',')} %</b></div></div>
    <h3>Jauges moyennes de l'année</h3><div class="stats">${g('😊 Confort', b.moy.confort)}${g('❤️ Santé', b.moy.sante)}${g('💪 Moral', b.moy.volonte)}${g('🧼 Hygiène', b.moy.hygiene)}${g('🌻 Bien-être', b.moy.bienetre)}</div>
    <h3>Économies par domaine</h3><table class="domaines">${dom || '<tr><td>Aucune</td></tr>'}</table>
    <h3>🎯 Objectifs pour l'année prochaine</h3><ul>${b.objectifs.map(o => `<li>${o}</li>`).join('')}</ul>`;
}
export function rendreRoutines(s) {
  const el = $('routines'); if (!el) return;
  el.innerHTML = Object.entries(ROUTINES).map(([k, r]) => {
    const ok = routineDispo(s, k), on = !!s.auto?.[k];
    return `<div class="ligne"><span>${r.nom}${ok ? '' : ` <small class="aide">(débloqué par le principe « ${PRINCIPES[r.principe]?.titre || r.principe} »)</small>`}</span><button class="btn" data-routine="${k}" ${ok ? '' : 'disabled'}>${on && ok ? '✅ Automatique' : '⬜ Manuel'}</button></div>`;
  }).join('') + '<p class="aide">Une fois un principe compris, la routine se fait toute seule : utile pour avancer d\'un mois sans tout refaire à la main.</p>';
}

function finProjection(s, r) {
  if (r.economies <= 0) return '';
  const an = Math.round(r.economies * 365 / Math.max(1, s.joursTotal || 365) / 10) * 10;   // moyenne annuelle sur la campagne
  const p = { livret: projection(s.seed, an, 20, 'livret', 120), mixte: projection(s.seed, an, 20, 'mixte', 120), actions: projection(s.seed, an, 20, 'actions', 120) };
  return `<h3>⏩ Et si tu plaçais ces économies pendant 20 ans ?</h3><p>Tes habitudes économisent ~${eur(an)}/an. Placés chaque année pendant 20 ans (médiane, après impôts) : Livret A <b>${eur(p.livret.p50.nominal)}</b> · 50/50 fonds euros-ETF <b>${eur(p.mixte.p50.nominal)}</b> (10 % des cas sous ${eur(p.mixte.p10.nominal)}) · 100 % ETF monde <b>${eur(p.actions.p50.nominal)}</b> (10 % des cas sous ${eur(p.actions.p10.nominal)}).</p>`;
}
export function rendreFin(s) {
  const r = scoreFinal(s);
  const dom = r.domaines.map(d => `<tr><td>${d.nom}</td><td style="color:${d.valeur >= 0 ? 'var(--ok)' : 'var(--mal)'}">${eur(d.valeur)}</td></tr>`).join('');
  const inv = r.invest.filter(i => i.prix > 0).map(i => `<li>${i.nom} : ${eur(i.prix)} → ${eur(i.gain)} économisés ${i.rentable ? '✅ rentabilisé' : i.amorti ? '🟡 amorti pour cet hiver' : '❌ pas encore'}</li>`).join('');
  const classement = tableauROI(s).sort((a, b) => b.ratio - a.ratio).map(x => `<li><b>${x.nom}</b> : payé ${eur(x.prix)}, mesuré ${eur(x.mesure)}, net 5 ans ${eur(x.net5)} ${x.atteint !== null ? '✅ rentabilisé' : x.payback !== null ? `(retour ~${dureeTxt(x.payback)})` : ROI_ITEMS[x.id].indirect ? '(gain indirect)' : '❌'}</li>`).join('');
  const m = r.moy;
  const g = (l, v) => `<div>${l}<b style="color:${v >= 60 ? 'var(--ok)' : v >= 40 ? 'var(--warn)' : 'var(--mal)'}">${Math.round(v)} %</b></div>`;
  $('finContenu').innerHTML = `<h2>Fin de la campagne : ${Math.round((s.joursTotal || 365) / 365)} ans ❄️🌱☀️🍂</h2><div class="grand">${r.titre}</div>
    ${r.note ? `<p style="text-align:center;color:#b45309">${r.note}</p>` : ''}
    <div class="stats">
      <div>Économies nettes<b style="color:${r.economies >= 0 ? 'var(--ok)' : 'var(--mal)'}">${eur(r.economies)} (${Math.round(r.pct)} %)</b></div>
      <div>Ton coût (investissements amortis)<b>${eur(r.cout)}</b></div>
      <div>Voisin « sans réfléchir »<b>${eur(r.base)}</b></div>
      <div>Capital investi<b>${eur(r.capital)}</b></div>
      <div>Habitudes · principes<b>${r.habitudes} · ${r.principes}/${Object.keys(PRINCIPES).length}</b></div>
      <div>Rechutes<b>${s.rechutes}</b></div>
      <div>Économies par an en moyenne<b>${eur(r.economies * 365 / Math.max(1, s.joursTotal || 365))}</b></div>
      <div>Patrimoine final (après frais et impôts de sortie)<b>${eur(r.patrimoine)}</b><small>voisin : ${eur(r.patrimoineVoisin)}</small></div>
      <div>Épargne et placements vs Livret A<b style="color:${r.fin.net >= 0 ? 'var(--ok)' : 'var(--mal)'}">${r.fin.net >= 0 ? '+' : ''}${eur(r.fin.net)}</b></div>
    </div>
    ${finProjection(s, r)}
    ${(s.eco?.bilans || []).length ? `<h3>Année par année</h3><table class="domaines"><tr><th>Année</th><th>Économies</th><th>Patrimoine</th><th>Moral moyen</th></tr>${s.eco.bilans.map(b => `<tr><td>${b.an + 1}</td><td>${eur(b.economies)}</td><td>${eur(b.patrimoine)}</td><td>${Math.round(b.moy.volonte)} %</td></tr>`).join('')}</table>` : ''}
    <h3>Moyennes sur la partie</h3><div class="stats">${g('😊 Confort', m.confort)}${g('❤️ Santé', m.sante)}${g('💪 Moral', m.moral)}${g('🧼 Hygiène', m.hygiene)}${g('🌻 Bien-être', m.bienetre)}</div>
    <h3>Économies par domaine</h3><table class="domaines">${dom}</table>
    <h3>Classement de rentabilité (net sur ${FINANCE.annees} ans par euro investi)</h3>${classement ? `<ol>${classement}</ol>` : '<p class="aide">Aucun équipement.</p>'}
    <h3>Combos découverts</h3><p>${Object.keys(s.combos || {}).length ? Object.keys(s.combos).map(id => '🔗 ' + COMBOS[id].nom).join('<br>') : 'Aucun.'}</p>
    <h3>Meilleure découverte</h3><p>🏆 <b>${r.meilleure.nom}</b> : ${eur(r.meilleure.gain)} économisés.</p>
    <p class="aide">Les abonnements d'énergie (${eur(r.abonnements)}) sont exclus de la comparaison. Les équipements comptent pour prix ÷ durée de vie, les vêtements pour leur part usée, les reventes en déduction. Les placements comptent pour leur valeur de revente du jour (frais et impôts de sortie déduits) plus les revenus versés, moins ce que le voisin a gagné en laissant la même épargne sur son Livret A.</p>
    <p class="aide">Titres : Dépensier &lt; 8 % · Malin &lt; 20 % · Optimiseur &lt; 32 % · Autonome &lt; 45 % · Maître de la sobriété. Autonome et Maître exigent en moyenne confort ≥ 70, santé ≥ 70, hygiène ≥ 60, bien-être ≥ 55, moral ≥ 40 ; Maître demande aussi 28 principes et 8 habitudes. Maître exige aussi une épargne gérée au moins aussi bien que le Livret A du voisin et au plus 10 jours de découvert non autorisé par an. Hygiène &lt; 45, bien-être &lt; 40 ou plus de 4 × √(années) rechutes plafonnent à Malin. Les pourcentages comparent tes dépenses à celles du voisin sur toute la campagne.</p>
    <button class="primaire btn" id="btnRejouer" style="width:100%;padding:12px">Rejouer une nouvelle campagne</button>`;
  $('fin').classList.remove('cache');
}

export function rendreTout(s) {
  rendreJauges(s); rendreMaison(s); rendreGraphe(s); rendreGrapheElec(s); rendreMeteo(s);
  rendreOnglets(s); rendreBoutique(s); rendreInvestissements(s); rendrePrincipes(s); rendreJournal(s); rendreFactures(s);
  rendreDilemme(s); rendreRoutines(s); rendreGuide(s);
  for (const id of ['btnJour', 'btnSemaine', 'btnMois', 'btnEvenement']) if ($(id)) $(id).disabled = s.fini;
}

export function rendreOnglets(s) {
  rendreNavigation(s);
  const o = etatUI.onglet, panneau = o.startsWith('b-') ? 'boutique' : o;
  document.querySelectorAll('.panneau').forEach(p => p.classList.toggle('cache', p.dataset.panneau !== panneau));
  if (o === 'maison') { rendreChauffage(s); rendreGestes(s); $('ete').innerHTML = rendreEte(s) + rendrePassif(s); }
  if (o === 'linge') rendreVetements(s);
  if (o === 'eau') $('pEau').innerHTML = rendreEau(s);
  if (o === 'cuisine') $('pCuisine').innerHTML = rendreCuisine(s);
  if (o === 'elec') $('pElec').innerHTML = rendreElec(s);
  if (o === 'jardin') $('pJardin').innerHTML = rendreJardin(s);
  if (o === 'budget') $('pBudget').innerHTML = rendreBudget(s);
  if (o === 'transport') $('pTransport').innerHTML = rendreTransport(s);
  if (o === 'banque') $('pBanque').innerHTML = rendreBanque(s);
  if (o === 'invest') $('pInvest').innerHTML = rendreInvest(s);
}
