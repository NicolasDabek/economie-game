// Rendu de l'interface (DOM uniquement, aucune logique de jeu ici)
import { PIECES, ORDRE_PIECES, VETEMENTS, ACHATS, GESTES, JOURS_HABITUDE, PRINCIPES, PRIX_KWH, LESSIVE, PRIX_EAU_L } from './data.js';
import { prevision } from './meteo.js';
import { isolationVetements, scoreFinal, coutTotal } from './simulation.js';

const $ = (id) => document.getElementById(id);
const eur = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const deg = (t) => `${t.toFixed(1).replace('.', ',')} °C`;

function couleurTemp(t) {
  // 10 °C bleu -> 18 vert pâle -> 24 rouge
  const x = Math.max(0, Math.min(1, (t - 10) / 14));
  const h = 220 - 220 * x;
  return `hsl(${h}, 75%, 82%)`;
}

export function rendreJauges(s) {
  const j = [
    ['💶 Argent', s.argent, 900, eur(s.argent)],
    ['😊 Confort', s.confort, 100, Math.round(s.confort) + ' %'],
    ['❤️ Santé', s.sante, 100, Math.round(s.sante) + ' %'],
    ['💪 Volonté', s.volonte, 100, Math.round(s.volonte) + ' %'],
  ];
  $('jauges').innerHTML = j.map(([l, v, max, txt]) => `<div class="jauge"><div class="lib"><span>${l}</span><b>${txt}</b></div><div class="barre"><div style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></div></div></div>`).join('');
  const sem = Math.floor(s.jour / 7) + 1, jr = (s.jour % 7) + 1;
  $('date').textContent = s.fini ? 'Fin de l\'hiver' : `Semaine ${sem} · Jour ${jr}`;
}

export function rendreHorloge(h) {
  const nuit = h >= 18 || h < 8;
  $('ciel').classList.toggle('nuit', nuit);
  $('astre').textContent = nuit ? '🌙' : '☀️';
  $('heure').textContent = `${h} h`;
}

export function rendreMaison(s) {
  const last = s.historique.at(-1);
  const voit = s.possede.thermometre;
  let pire = null;
  if (voit && last) pire = ORDRE_PIECES.reduce((a, b) => (last.kwh[a] > last.kwh[b] ? a : b));
  $('maison').innerHTML = ORDRE_PIECES.map(id => {
    const p = s.pieces[id];
    const coutHier = last ? last.kwh[id] * PRIX_KWH : 0;
    const contenu = voit
      ? `<div class="temp">${deg(p.t)}</div><div class="info">Hier : ${eur(coutHier)} · ${last ? last.kwh[id].toFixed(1).replace('.', ',') : 0} kWh</div>`
      : `<div class="temp">? °C</div><div class="info">Sans thermomètre, impossible de savoir</div>`;
    const occ = id === 'salon' ? '🧑‍💻' : id === 'chambre' ? '🛏️' : '🍳';
    return `<div class="piece ${id} ${voit ? '' : 'inconnu'} ${pire === id ? 'cher' : ''}" style="${voit ? 'background:' + couleurTemp(p.t) : ''}">
      <span class="occ">${occ}</span><div class="nom">${PIECES[id].nom}</div>${contenu}</div>`;
  }).join('');
  $('aideMaison').innerHTML = voit
    ? (pire ? `🔴 Pièce la plus coûteuse hier : <b>${PIECES[pire].nom}</b>. Portes ${s.portes === 'fermees' ? 'fermées' : 'ouvertes'}.` : '')
    : 'Tu ne vois que la facture globale. Les thermomètres (quincaillerie) révèlent la pièce qui coûte le plus.';
}

export function rendreGraphe(s) {
  const c = $('graphe'), g = c.getContext('2d');
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const last = s.historique.at(-1);
  if (!last) { g.fillStyle = '#6b7280'; g.font = '14px system-ui'; g.fillText('Passe une première journée pour voir les courbes.', 20, H / 2); $('legende').textContent = ''; return; }
  const tMin = -6, tMax = 26;
  const x = (k) => 30 + k * (W - 40) / 23, y = (t) => H - 20 - (t - tMin) / (tMax - tMin) * (H - 30);
  // nuit
  last.heures.forEach((hh, k) => { if (hh.h >= 18 || hh.h < 8) { g.fillStyle = 'rgba(49,46,129,0.08)'; g.fillRect(x(k) - (W - 40) / 46, 0, (W - 40) / 23, H - 20); } });
  g.strokeStyle = '#e5e7eb'; g.fillStyle = '#6b7280'; g.font = '10px system-ui';
  for (let t = -5; t <= 25; t += 5) { g.beginPath(); g.moveTo(30, y(t)); g.lineTo(W - 10, y(t)); g.stroke(); g.fillText(t + '°', 4, y(t) + 3); }
  last.heures.forEach((hh, k) => { if (k % 3 === 0) g.fillText(hh.h + 'h', x(k) - 6, H - 6); });
  const tracer = (f, col, larg = 2, dash = []) => { g.strokeStyle = col; g.lineWidth = larg; g.setLineDash(dash); g.beginPath(); last.heures.forEach((hh, k) => (k ? g.lineTo(x(k), y(f(hh))) : g.moveTo(x(k), y(f(hh))))); g.stroke(); g.setLineDash([]); g.lineWidth = 1; };
  tracer(hh => hh.te, '#64748b', 2, [4, 3]);
  const leg = ['<span style="color:#64748b">┅ extérieur</span>', '<span style="color:#f59e0b">━ ton ressenti</span>'];
  if (s.possede.thermometre) {
    const cols = { salon: '#ef4444', chambre: '#8b5cf6', cuisine: '#10b981' };
    for (const p of ORDRE_PIECES) { tracer(hh => hh.t[p], cols[p], 1.5); leg.push(`<span style="color:${cols[p]}">━ ${PIECES[p].nom.toLowerCase()}</span>`); }
  }
  tracer(hh => hh.ressenti, '#f59e0b', 3);
  $('legende').innerHTML = leg.join(' · ') + (s.possede.thermometre ? '' : ' · (températures des pièces : thermomètre requis)');
}

export function rendreThermostats(s) {
  $('thermostats').innerHTML = ORDRE_PIECES.map(id => {
    const p = s.pieces[id];
    const sl = (k, v) => `<input type="range" min="8" max="23" step="1" value="${v}" data-piece="${id}" data-k="${k}"><span class="val">${v <= 8 ? 'Hors-gel' : v + ' °C'}</span>`;
    return `<div class="ligne"><label>${PIECES[id].nom}</label>☀️ ${sl('consigneJour', p.consigneJour)}</div>
            <div class="ligne"><label></label>🌙 ${sl('consigneNuit', p.consigneNuit)}</div>`;
  }).join('') + '<p class="aide">Jour : 7 h-23 h · Nuit : 23 h-7 h. Tu es au salon la journée, en cuisine aux repas, dans la chambre la nuit.</p>';
}

function tagGeste(s, g) {
  const st = s.gestes[g];
  if (st.habitude) return '<span class="tag habitude">habitude ✓</span>';
  if (st.pratique > 0) return `<span class="tag appr">apprentissage ${st.pratique}/${JOURS_HABITUDE} · −${GESTES[g].cout} volonté/j</span>`;
  return `<span class="tag">nouveau geste · −${GESTES[g].cout} volonté/j</span>`;
}

const choix = (nom, opts, val) => `<span class="choix">${opts.map(([v, l]) => `<button data-choix="${nom}" data-v="${v}" class="${v === val ? 'actif' : ''}">${l}</button>`).join('')}</span>`;

export function rendreGestes(s) {
  const lignes = [
    `<div class="ligne"><label>Portes</label>${choix('portes', [['ouvertes', 'Ouvertes'], ['fermees', 'Fermées']], s.portes)} ${tagGeste(s, 'portes')}</div>`,
    `<div class="ligne"><label>Rideaux</label>${choix('rideaux', [['ouverts', 'Toujours ouverts'], ['nuit', 'Fermés la nuit'], ['fermes', 'Toujours fermés']], s.rideaux)} ${tagGeste(s, 'rideaux')}</div>`,
  ];
  if (s.possede.bouillotte) lignes.push(`<div class="ligne"><label>Bouillotte</label>${choix('bouillotte', [['non', 'Non'], ['oui', 'Chaque soir']], s.utiliserBouillotte ? 'oui' : 'non')} ${tagGeste(s, 'bouillotte')}${s.possede.housse ? ' <span class="tag">avec housse</span>' : ''}</div>`);
  lignes.push(`<div class="ligne"><label>Couches</label>${tagGeste(s, 'couches')}<span class="aide">(porter 2 vêtements chauds ou plus)</span></div>`);
  $('gestes').innerHTML = lignes.join('');
}

function minibarre(v, col) { return `<span class="minibarre"><div style="width:${Math.min(100, v)}%;background:${col}"></div></span>`; }

export function rendreVetements(s) {
  const iso = isolationVetements(s);
  $('vetements').innerHTML = Object.entries(VETEMENTS).map(([id, v]) => {
    const e = s.vetements[id];
    let action;
    if (!e.possede) action = `<button class="btn" data-acheter-vet="${id}" ${s.argent < v.prix ? 'disabled' : ''}>Acheter ${eur(v.prix)}</button>`;
    else action = `<button class="btn" data-porter="${id}">${e.porte ? 'Retirer' : 'Porter'}</button>`;
    const etat = e.possede ? `<span>saleté ${minibarre(e.salete, e.salete >= 100 ? '#b91c1c' : '#a16207')}</span><span>usure ${minibarre(e.usure, '#6b7280')}</span>` : '<span>non possédé</span>';
    return `<div class="vet"><span class="ico">${v.icone}</span><div><b>${v.nom}</b> <span class="tag">+${String(v.iso).replace('.', ',')} °C</span>${e.porte && e.possede ? ' <span class="tag habitude">porté</span>' : ''}<div class="mini">${etat}</div></div>${action}</div>`;
  }).join('') + `<p class="aide">Isolation portée : <b>+${iso.toFixed(1).replace('.', ',')} °C ressentis</b>${s.possede.calfeutrage ? '' : ' · courants d\'air : −1 °C'}</p>`;
  const cout = LESSIVE.kwh * PRIX_KWH + LESSIVE.litres * PRIX_EAU_L + LESSIVE.produit;
  $('lessive').innerHTML = `<div class="ligne"><button class="btn" id="btnLessive">${s.lessiveDemandee ? '✓ Lessive prévue demain' : '🧺 Lancer une lessive'}</button>
    <span class="aide">${eur(cout)} (eau, élec., lessive) · −${LESSIVE.volonte} volonté · use les vêtements et la machine (${Math.round(s.usureMachine)} %)</span></div>`;
}

export function rendreMeteo(s) {
  const pv = prevision(s.meteo, s.jour, s.seed);
  const auj = s.meteo[s.jour];
  const jours = [];
  if (auj && !s.fini) jours.push({ ...auj, nom: 'Aujourd\'hui', tMin: Math.round(auj.tMoy - auj.amplitude / 2), tMax: Math.round(auj.tMoy + auj.amplitude / 2) });
  pv.forEach((j, i) => jours.push({ ...j, nom: ['Demain', 'J+2', 'J+3'][i] }));
  $('meteo').innerHTML = jours.map(j => `<div class="jourMeteo"><div>${j.nom}</div><div class="ico">${j.icone}</div><div>${j.libelle}</div><b>${j.tMin}° / ${j.tMax}°</b></div>`).join('') || '<p>L\'hiver est fini.</p>';
}

export function rendreBoutique(s) {
  $('boutique').innerHTML = Object.entries(ACHATS).map(([id, a]) => {
    const bloque = id === 'housse' && !s.possede.bouillotte;
    const btn = s.possede[id] ? '<span class="tag habitude">acquis</span>' : `<button class="btn" data-acheter="${id}" ${(s.argent < a.prix || bloque) ? 'disabled' : ''}>${eur(a.prix)}</button>`;
    return `<div class="article"><div><b>${a.nom}</b><div class="d">${a.desc}${bloque ? ' (il faut d\'abord une bouillotte)' : ''}</div></div>${btn}</div>`;
  }).join('');
}

export function rendrePrincipes(s) {
  $('nbPrincipes').textContent = s.principes.length;
  $('principes').innerHTML = Object.entries(PRINCIPES).map(([id, p]) => s.principes.includes(id)
    ? `<div class="principe-item"><b>${p.titre}</b>${p.texte}</div>`
    : `<div class="principe-item verrou">🔒 Principe à découvrir</div>`).join('');
}

export function rendreJournal(s) {
  $('journal').innerHTML = s.messages.slice(0, 60).map(m => `<div class="${m.type}"><small>J${m.jour + 1}</small> ${m.texte}</div>`).join('') || '<div>Ton hiver commence. Bonne chance !</div>';
}

export function rendreFactures(s) {
  const voit = s.possede.thermometre;
  if (!s.factures.length) { $('factures').innerHTML = '<p class="aide">Première facture à la fin de la semaine 1.</p>'; return; }
  $('factures').innerHTML = `<table><tr><th>Semaine</th>${voit ? ORDRE_PIECES.map(p => `<th>${PIECES[p].nom}</th>`).join('') : ''}<th>Total</th></tr>` +
    s.factures.map(f => `<tr><td>S${f.semaine}</td>${voit ? ORDRE_PIECES.map(p => `<td>${eur(f.parPiece[p])}</td>`).join('') : ''}<td><b>${eur(f.montant)}</b></td></tr>`).join('') +
    `</table>${voit ? '' : '<p class="aide">Détail par pièce visible avec les thermomètres.</p>'}`;
}

export function toast(texte) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = texte;
  $('toasts').appendChild(d); setTimeout(() => d.remove(), 6000);
}

export function rendreFin(s) {
  const r = scoreFinal(s);
  $('finContenu').innerHTML = `<h2>Fin de l'hiver 🌱</h2><div class="grand">${r.titre}</div>
    ${r.note ? `<p style="text-align:center;color:#b45309">${r.note}</p>` : ''}
    <div class="stats">
      <div>Économies nettes<b style="color:${r.economies >= 0 ? '#16a34a' : '#b91c1c'}">${eur(r.economies)} (${Math.round(r.pct)} %)</b></div>
      <div>Ton coût total<b>${eur(r.cout)}</b></div>
      <div>Voisin « tout chauffé »<b>${eur(r.base)}</b></div>
      <div>Confort moyen<b>${Math.round(r.confortMoy)} %</b></div>
      <div>Santé finale<b>${Math.round(r.sante)} %</b></div>
      <div>Habitudes · Principes<b>${r.habitudes}/4 · ${r.principes}/12</b></div>
    </div>
    <p class="aide">Coût = chauffage + lessives + achats + imprévus. Le voisin chauffe tout à 21 °C, portes et rideaux ouverts, sans rien acheter.</p>
    <p class="aide">Titres : Dépensier &lt; 15 % · Malin &lt; 35 % · Optimiseur &lt; 50 % · Autonome &lt; 62 % · Maître de la sobriété (avec 8 principes et 3 habitudes).</p>
    <button class="primaire btn" id="btnRejouer" style="width:100%;padding:12px">Rejouer un nouvel hiver</button>`;
  $('fin').classList.remove('cache');
}

export function rendreTout(s) {
  rendreJauges(s); rendreMaison(s); rendreGraphe(s); rendreThermostats(s); rendreGestes(s);
  rendreVetements(s); rendreMeteo(s); rendreBoutique(s); rendrePrincipes(s); rendreJournal(s); rendreFactures(s);
  $('btnJour').disabled = $('btnSemaine').disabled = s.fini;
}
export { coutTotal };
