// Onglets Banque et Investissement (v0.5) : rendu uniquement
import { BANQUE, MARCHES, PROFILS, ACHATS, ROI_ITEMS } from './data.js';
import { valeurs, valeurLiquidation, gainFinancier, eligibleLEP, tauxPlacements, meilleurUsage, dateTexte, dateCal, ALLOCATIONS } from './finance.js';
import { estimationAchat } from './roi.js';
import { eur } from './simulation.js';

const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
const pc = (x, d = 1) => `${num(x * 100, d)} %`;
export const etatFin = { proj: { alloc: 'mixte', ans: 20, versement: 1200, res: null } };
const champ = (id, def = 100) => `<input type="number" min="1" step="10" value="${def}" id="m-${id}" class="montant" aria-label="Montant en euros">`;
const btns = (id, dep = 'Verser', ret = 'Retirer', offDep = false, offRet = false) => `${champ(id)}<button class="btn" data-fin="dep" data-v="${id}" ${offDep ? 'disabled' : ''}>${dep}</button>${ret ? `<button class="btn" data-fin="ret" data-v="${id}" ${offRet ? 'disabled' : ''}>${ret}</button>` : ''}`;

// rendement annualisé des équipements non possédés (économie annuelle estimée / prix)
export function rendementsEquipements(s) {
  return Object.keys(ROI_ITEMS).filter(id => ACHATS[id] && !s.possede[id]).map(id => {
    const e = estimationAchat(id);
    return e && e.annuel > 0.5 ? { id, nom: ACHATS[id].nom, prix: ACHATS[id].prix, annuel: e.annuel, taux: e.annuel / ACHATS[id].prix } : null;
  }).filter(Boolean).sort((a, b) => b.taux - a.taux);
}
export const tauxTxt = (t) => t >= 10 ? `${Math.round(t * 100).toLocaleString('fr-FR')} %/an` : `${num(t * 100, t < 0.1 ? 1 : 0)} %/an`;

function prochaineQuinzaine(c) { const d = dateCal(c + 1); const j = d.getUTCDate(); return j === 1 || j === 16 ? 'aujourd\'hui même' : j < 16 ? 'le 16' : 'le 1er du mois prochain'; }

export function rendreBanque(s) {
  const f = s.fin, P = PROFILS[f.profil], v = valeurs(s), B = BANQUE;
  const precaution = v.livrets + Math.max(0, s.argent);
  let h = `<p class="aide">📅 ${f.cal >= 0 ? dateTexte(f.cal) : '1er décembre 2026'} · la banque vit au calendrier réel : les semaines entre deux chapitres comptent (intérêts, loyers, marchés).</p>`;
  h += `<h3>👤 Ton profil</h3>`;
  h += f.verrou ? `<p><b>${P.nom}</b> · revenu fiscal de référence ${P.rfr.toLocaleString('fr-FR')} € · tranche marginale ${Math.round(P.tmi * 100)} % · LEP ${eligibleLEP(s) ? '✅ éligible' : '❌ non éligible'}</p>`
    : `<span class="choix col">${Object.entries(PROFILS).map(([k, p]) => `<button data-fin="profil" data-v="${k}" class="${f.profil === k ? 'actif' : ''}">${p.nom} · RFR ${p.rfr.toLocaleString('fr-FR')} € · épargne ${eur(p.epargne)} · ${p.desc}</button>`).join('')}</span><p class="aide">Choisis avant ton premier placement. LEP réservé aux RFR ≤ ${B.lep.plafondRfr.toLocaleString('fr-FR')} € (1 part, 2026).</p>`;
  h += `<h3>💳 Compte courant : ${eur(s.argent)}</h3>`;
  h += `<p class="aide">Découvert autorisé ${eur(B.decouvert.autorise)} à ${pc(B.decouvert.taeg, 0)} ; au-delà ${pc(B.decouvert.horsAutorisation, 0)} + ${B.decouvert.commission} € de commission par jour (plafond ${B.decouvert.commissionMois} €/mois). Agios payés : <b>${eur(f.agios)}</b>.</p>`;
  h += `<div class="ligne"><label>Virement automatique</label><span class="choix"><button data-fin="auto" data-v="1" class="${f.autoLivret ? 'actif' : ''}">Livrets → compte si découvert</button><button data-fin="auto" data-v="0" class="${!f.autoLivret ? 'actif' : ''}">Désactivé</button></span></div>`;
  h += precaution >= 600 * B.precautionMois ? `<p class="ok">🛡️ Épargne de précaution : ${eur(precaution)} disponibles tout de suite. Une panne ne te mettra pas à découvert : +sérénité chaque jour.</p>`
    : `<p class="alerte">⚠️ Épargne de précaution faible (${eur(precaution)} disponibles) : une panne te mettra à découvert. Vise au moins 600 € (1 mois de dépenses).</p>`;
  h += `<h3>📘 Livrets réglementés (exonérés d'impôt)</h3><table><tr><th>Livret</th><th>Taux</th><th>Plafond</th><th>Solde</th><th>Intérêts courus</th><th></th></tr>`;
  for (const k of ['livretA', 'ldds', 'lep']) {
    const l = f.livrets[k], off = k === 'lep' && !eligibleLEP(s);
    h += `<tr${off ? ' class="off"' : ''}><td><b>${B[k].nom}</b>${off ? '<br><small>RFR trop élevé</small>' : ''}</td><td>${pc(B[k].taux, 2)}</td><td>${B[k].plafond.toLocaleString('fr-FR')} €</td><td>${eur(l.solde)}</td><td>${eur(l.courus)}<br><small>versés le 31/12</small></td><td>${btns(k, 'Verser', 'Retirer', off)}</td></tr>`;
  }
  h += `</table><p class="aide">Quinzaines : un dépôt rapporte à partir du 1er ou du 16 suivant (prochain départ : ${prochaineQuinzaine(f.cal)}) ; un retrait cesse de rapporter dès le début de sa quinzaine. Intérêts capitalisés le 31 décembre. Taux du 1er août 2026 (arrêté du 28 juillet 2026), supposés maintenus après le 31 janvier 2027.</p>`;
  h += `<h3>🏠 Plan d'épargne logement</h3>`;
  h += f.pel ? `<p>Solde ${eur(f.pel.solde)} · intérêts acquis ${eur(f.pel.courus)} (${eur(f.pel.courusCel)} si clôture avant 2 ans) · 45 €/mois prélevés le 1er.</p>${btns('pel', 'Verser', 'Clôturer')}`
    : `<p class="aide">PEL ouvert en 2026 : ${pc(B.pel.taux, 0)} brut figé, imposé au PFU 30 % dès la 1re année (soit ${pc(B.pel.taux * (1 - B.pel.pfu), 2)} net). Ouverture ${B.pel.ouverture} € minimum, puis ${B.pel.versementAn} €/an obligatoires. Aucun retrait partiel : retirer = clôturer ; avant 2 ans, intérêts recalculés à ${pc(B.pel.tauxCel, 2)}.</p>${btns('pel', 'Ouvrir', null)}`;
  h += `<h3>🛡️ Assurance vie</h3>`;
  if (!f.av) h += `<p class="aide">Fonds euros (capital garanti, ${pc(B.av.enLigne.fondsEuros, 1)} en ligne / ${pc(B.av.banque.fondsEuros, 1)} en banque, prélèvements sociaux 17,2 % chaque 31/12) et unités de compte (ETF monde, risque). Rachat en ~3 jours ; gains taxés à 12,8 % + 17,2 % avant 8 ans, abattement de 4 600 € après 8 ans.</p><span class="choix"><button data-fin="av" data-v="enLigne">Ouvrir un contrat en ligne (0 % d'entrée, UC 0,5 %/an)</button><button data-fin="av" data-v="banque">Contrat de banque (2,5 % d'entrée, UC 0,85 %/an)</button></span>`;
  else h += `<p>${B.av[f.av.contrat].nom} · fonds euros ${eur(v.avEuros)} · UC ${eur(v.avUC)} (versé ${eur(f.av.coutUC)})</p><div class="ligne"><label>Fonds euros</label>${btns('avEuros')}</div><div class="ligne"><label>UC ETF monde</label>${btns('avUC')}</div>`;
  // arbitrage
  h += `<h3>⚖️ Équipement ou placement ?</h3>` + comparaison(s);
  h += `<h3>💡 Meilleur usage de 100 €</h3>`;
  h += s.principes.includes('coutOpportunite') ? meilleurUsageHtml(s, 100) : `<p class="aide">🔒 Débloque le principe « Le coût d'opportunité » (place de l'argent, ou achète un équipement après avoir placé) pour activer ce conseiller.</p>`;
  return h;
}

function comparaison(s) {
  const eq = rendementsEquipements(s).slice(0, 6), pl = tauxPlacements(s).filter(p => !p.off);
  const la = BANQUE.livretA.taux;
  let h = `<table><tr><th>Usage de l'argent</th><th>Rendement annuel</th><th>Net d'impôt</th><th>Réel (inflation ${pc(MARCHES.inflation, 0)})</th><th>Liquidité</th><th>Risque</th></tr>`;
  h += eq.map(e => `<tr><td>🛒 ${e.nom} (${eur(e.prix)})</td><td><b>${tauxTxt(e.taux)}</b></td><td>${tauxTxt(e.taux)}</td><td>suit l'énergie</td><td>aucune</td><td>dépend de l'usage</td></tr>`).join('');
  h += pl.map(p => `<tr><td>🏦 ${p.nom}</td><td>${pc(p.taux, 2)}${p.id === 'peaMonde' ? ' (moyenne)' : ''}</td><td>${pc(p.net, 2)}</td><td style="color:${p.reel < 0 ? 'var(--mal)' : 'var(--ok)'}">${pc(p.reel, 2)}</td><td>${p.liquidite}</td><td>${p.risque}</td></tr>`).join('');
  h += `</table><p class="aide">Rendement d'un équipement = économie annuelle estimée ÷ prix (estimation de la boutique). ${eq[0] ? `Exemple : ${eq[0].nom.toLowerCase()} ${tauxTxt(eq[0].taux)} contre Livret A ${pc(la, 1)}.` : 'Tu possèdes déjà tous les équipements rentables : place ton épargne.'} Un euro placé ne peut plus acheter d'équipement.</p>`;
  return h;
}
export function meilleurUsageHtml(s, montant) {
  const eq = rendementsEquipements(s);
  const { plan } = meilleurUsage(s, montant, eq);
  return `<ol>${plan.map(x => `<li>${x.type === 'équipement' ? '🛒' : '🏦'} <b>${x.nom}</b> : ${eur(x.montant)} → ~${eur(x.gainAn)}/an (${tauxTxt(x.taux)}${x.type === 'placement' ? ` net · liquidité : ${x.liquidite}` : ''})</li>`).join('')}</ol><p class="aide">Ordre : rendement décroissant, en gardant d'abord ton épargne de précaution. Les placements à risque affichent leur rendement moyen espéré, pas garanti.</p>`;
}

// ---------------------------------------------------------------- investissement
function graphe(f) {
  const H = f.hist.slice(-120); if (H.length < 2) return '<p class="aide">Le graphique des marchés apparaît après quelques jours.</p>';
  const W = 320, Ht = 90, vals = H.map(x => x.monde), mx = Math.max(...vals), mn = Math.min(...vals);
  const pts = H.map((x, i) => `${(i / (H.length - 1) * W).toFixed(1)},${(Ht - 4 - (x.monde - mn) / Math.max(1e-6, mx - mn) * (Ht - 8)).toFixed(1)}`).join(' ');
  return `<svg width="${W}" height="${Ht}" class="spark" role="img" aria-label="Cours de l'ETF monde"><polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="2"/></svg><p class="aide">ETF monde (base 100 au 1er décembre 2026) : ${num(f.cours.monde, 1)} · plus bas ${num(mn, 1)} · plus haut ${num(mx, 1)}${f.regime ? ' · <b>marché agité</b>' : ''}.</p>`;
}
export function rendreInvest(s) {
  const f = s.fin, v = valeurs(s), g = gainFinancier(s), M = MARCHES, B = BANQUE;
  let h = graphe(f);
  const lat = (val, cout) => `<span style="color:${val >= cout ? 'var(--ok)' : 'var(--mal)'}">${val >= cout ? '+' : ''}${eur(val - cout)}</span>`;
  h += `<h3>📊 Tes positions</h3><table><tr><th>Placement</th><th>Valeur</th><th>Versé</th><th>Latent</th><th></th></tr>`;
  h += `<tr><td><b>PEA · ETF monde</b><br><small>courtage ${pc(M.courtage.pea, 1)} ; retrait avant 5 ans = clôture</small></td><td>${eur(f.pea ? f.pea.monde * f.cours.monde : 0)}</td><td rowspan="2">${eur(f.pea?.verse || 0)}</td><td rowspan="2">${f.pea ? lat(v.pea, f.pea.verse) : '—'}</td><td>${btns('peaMonde', 'Acheter', null)}</td></tr>`;
  h += `<tr><td><b>PEA · ETF CAC 40</b></td><td>${eur(f.pea ? f.pea.cac * f.cours.cac : 0)}</td><td>${btns('peaCac', 'Acheter', null)}${f.pea ? `<button class="btn" data-fin="ret" data-v="pea">Tout vendre (clôture)</button>` : ''}</td></tr>`;
  h += `<tr><td><b>CTO · ETF monde</b><br><small>courtage ${pc(M.courtage.ctoPct, 1)}, min ${num(M.courtage.ctoMin, 2)} € ; PFU ${pc(B.pfu, 1)}</small></td><td>${eur(f.cto.monde * f.cours.monde)}</td><td>${eur(f.cto.cout.monde)}</td><td>${lat(f.cto.monde * f.cours.monde, f.cto.cout.monde)}</td><td>${btns('ctoMonde', 'Acheter', 'Vendre')}</td></tr>`;
  h += `<tr><td><b>CTO · obligations</b><br><small>OAT 10 ans ~4,8 %</small></td><td>${eur(f.cto.oblig * f.cours.oblig)}</td><td>${eur(f.cto.cout.oblig)}</td><td>${lat(f.cto.oblig * f.cours.oblig, f.cto.cout.oblig)}</td><td>${btns('ctoOblig', 'Acheter', 'Vendre')}</td></tr>`;
  h += `<tr><td><b>SCPI</b><br><small>${f.scpi ? (f.cal < f.scpi.jouissance ? `jouissance le ${dateTexte(f.scpi.jouissance)}` : `loyers nets reçus ${eur(f.scpi.loyers)}`) : `${pc(M.scpi.distribution, 2)} distribués, ~10 % de frais, jouissance ${M.scpi.jouissanceMois} mois`}${f.scpi?.retrait ? ` · retrait prévu le ${dateTexte(f.scpi.retrait.cal)}` : ''}</small></td><td>${eur(v.scpi)}<br><small>retrait : ${eur(v.scpi * (1 - M.scpi.frais))}</small></td><td>${eur(f.scpi?.verse || 0)}</td><td>${f.scpi ? lat(v.scpi * (1 - M.scpi.frais), f.scpi.verse) : '—'}</td><td>${btns('scpi', 'Souscrire', 'Demander le retrait')}</td></tr>`;
  h += `</table>`;
  h += `<p>Placements : <b>${eur(v.total)}</b> (dont à risque ${eur(v.risque)}) · valeur si tout était vendu aujourd'hui, après frais et impôts : <b>${eur(valeurLiquidation(s))}</b> · gain net contre un voisin resté au Livret A : <b style="color:${g.net >= 0 ? 'var(--ok)' : 'var(--mal)'}">${g.net >= 0 ? '+' : ''}${eur(g.net)}</b> (compté dans ton score). Frais payés ${eur(f.frais)}, impôts ${eur(f.impots)}.</p>`;
  h += `<h3>🔎 Risque, liquidité, frais, impôts</h3><table><tr><th>Produit</th><th>Rendement espéré</th><th>Volatilité</th><th>Pire année plausible</th><th>Liquidité</th><th>Frais</th><th>Fiscalité 2026</th></tr>
  <tr><td>Livret A / LDDS / LEP</td><td>1,7 % / 1,7 % / 2,5 %</td><td>0</td><td>0 %</td><td>immédiate</td><td>aucun</td><td>exonéré</td></tr>
  <tr><td>PEL</td><td>2 % brut</td><td>0</td><td>0 %</td><td>clôture</td><td>aucun</td><td>PFU 30 %</td></tr>
  <tr><td>Fonds euros</td><td>2,6 %</td><td>0</td><td>0 % (garanti)</td><td>~3 jours</td><td>0 à 2,5 % d'entrée</td><td>PS 17,2 % annuels ; IR au rachat</td></tr>
  <tr><td>Obligations</td><td>~4 %</td><td>~5 %</td><td>−15 % (2022)</td><td>J+2</td><td>courtage + 0,3 %/an</td><td>PFU 31,4 %</td></tr>
  <tr><td>ETF monde</td><td>~7 % (moyenne long terme)</td><td>~15 %</td><td>−35 à −50 %</td><td>J+2</td><td>0,2 %/an + courtage</td><td>PEA : 18,6 % après 5 ans ; CTO : 31,4 %</td></tr>
  <tr><td>ETF CAC 40</td><td>~7 %</td><td>~18 %</td><td>−45 %</td><td>J+2</td><td>0,25 %/an + courtage</td><td>idem</td></tr>
  <tr><td>SCPI</td><td>4,9 % distribués</td><td>faible mais ~1 an sur 8 −10 %</td><td>−15 % (2023-2024)</td><td>semaines à mois, non garantie</td><td>~10 % à l'entrée</td><td>TMI ${Math.round(PROFILS[f.profil].tmi * 100)} % + 17,2 % (micro-foncier −30 %)</td></tr></table>`;
  // projection
  const pj = etatFin.proj;
  h += `<h3>⏩ Avance rapide : et dans 10, 20, 30 ans ?</h3><div class="ligne"><label>Allocation</label><span class="choix col">${Object.entries(ALLOCATIONS).map(([k, a]) => `<button data-fin="alloc" data-v="${k}" class="${pj.alloc === k ? 'actif' : ''}">${a.nom}</button>`).join('')}</span></div>
    <div class="ligne"><label>Horizon</label><span class="choix">${[10, 20, 30].map(a => `<button data-fin="ans" data-v="${a}" class="${pj.ans === a ? 'actif' : ''}">${a} ans</button>`).join('')}</span></div>
    <div class="ligne"><label>Versement</label><span class="choix">${[600, 1200, 3000].map(a => `<button data-fin="vers" data-v="${a}" class="${pj.versement === a ? 'actif' : ''}">${a.toLocaleString('fr-FR')} €/an</button>`).join('')}</span> <button class="btn primaire" data-fin="projeter">Projeter (300 scénarios)</button></div>`;
  if (pj.res) {
    const r = pj.res, fm = (x) => eur(Math.round(x / 10) * 10);
    h += `<table><tr><th></th><th>Défavorable (10 %)</th><th>Médian</th><th>Favorable (90 %)</th></tr><tr><td>Après impôts (€ courants)</td><td>${fm(r.p10.nominal)}</td><td><b>${fm(r.p50.nominal)}</b></td><td>${fm(r.p90.nominal)}</td></tr><tr><td>En euros d'aujourd'hui (inflation 2 %)</td><td>${fm(r.p10.reel)}</td><td>${fm(r.p50.reel)}</td><td>${fm(r.p90.reel)}</td></tr></table>
    <p class="aide">${ALLOCATIONS[r.alloc].nom}, ${r.ans} ans, ${r.versement.toLocaleString('fr-FR')} €/an : ${eur(r.verse)} versés. Scénarios finissant sous la somme versée : <b>${Math.round(r.perte * 100)} %</b>. Projection indicative : le passé ne garantit pas l'avenir ; taux des livrets et du fonds euros supposés constants.</p>`;
  }
  return h;
}
