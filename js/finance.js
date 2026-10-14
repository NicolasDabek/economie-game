// Banque et placements (v0.5) : livrets à quinzaines, PEL, assurance vie, PEA, CTO, SCPI, découvert,
// marchés stochastiques déterministes par graine, projection à long terme.
import { BANQUE, MARCHES, PROFILS, CALENDRIER, ARGENT_DEPART } from './data.js';
import { makeRng } from './rng.js';
import { chapitreDuJour } from './meteo.js';

const J = 86400000;
const D0 = Date.UTC(2026, 11, 1);
export const dateCal = (c) => new Date(D0 + c * J);
export function calDuJour(jour) {
  const ch = chapitreDuJour(jour);
  const [y, m, d] = CALENDRIER.chapitres[ch.id].split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - D0) / J) + ch.index;
}
export const dateTexte = (c) => dateCal(c).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const LIVRETS = ['livretA', 'ldds', 'lep'];
// jour calendaire en cours (les opérations du joueur ont lieu pendant la journée, avant sa clôture)
const aujourdhui = (s) => Math.max(s.fin.cal + 1, s.meteo ? calDuJour(Math.min(s.jour, 125)) : 0);
const r2 = (x) => Math.round(x * 100) / 100;

export function nouvelEtatFinance(profil = 'median') {
  const P = PROFILS[profil];
  const liv = () => ({ solde: 0, debutQ: 0, retraitsQ: 0, courus: 0, interets: 0 });
  const f = {
    profil, verrou: false, cal: -1,
    livrets: { livretA: liv(), ldds: liv(), lep: liv() },
    pel: null, av: null, pea: null, cto: { monde: 0, oblig: 0, cout: { monde: 0, oblig: 0 } }, scpi: null,
    cours: { monde: 100, cac: 100, oblig: 100 }, regime: 0, enAttente: [],
    epargneInitiale: P.epargne, apport: P.epargne, revenusCash: 0, frais: 0, impots: 0, agios: 0, commissionsMois: {},
    voisin: { livret: liv(), agios: 0, retire: 0 }, autoLivret: true, hist: [], pic: 0, alerteBaisse: false, stats: { joursNegatif: 0, joursHorsAutorisation: 0, ventesPerte: 0 },
  };
  f.livrets.livretA.solde = f.livrets.livretA.debutQ = P.epargne;
  f.voisin.livret.solde = f.voisin.livret.debutQ = P.epargne;
  return f;
}
export function changerProfil(s, profil) {
  if (s.fin.verrou || !PROFILS[profil]) return false;
  s.fin = nouvelEtatFinance(profil); return true;
}
export const eligibleLEP = (s) => PROFILS[s.fin.profil].rfr <= BANQUE.lep.plafondRfr;

// ---------------------------------------------------------------- marchés
function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// un pas journalier (jour calendaire) ; état = { regime, cours }
export function pasMarche(etat, rng) {
  const M = MARCHES;
  if (etat.regime === 0 && rng() < M.regime.pTendu) etat.regime = 1; else if (etat.regime === 1 && rng() < M.regime.pCalme) etat.regime = 0;
  const z1 = gauss(rng), z2 = gauss(rng), z3 = gauss(rng);
  const krach = rng() < M.krach.p ? M.krach.taille[0] + (M.krach.taille[1] - M.krach.taille[0]) * rng() : 0;
  const kMoy = M.krach.p * (M.krach.taille[0] + M.krach.taille[1]) / 2;   // perte moyenne due aux krachs, compensée dans la dérive
  const pas = (a, z, kFact) => {
    const sg = a.sigma[etat.regime];
    const drift = Math.log(1 + a.mu - a.ter) / 365 - kMoy * kFact;
    return Math.exp(drift - sg * sg / 730 + sg / Math.sqrt(365) * z + krach * kFact);
  };
  etat.cours.monde *= pas(M.monde, z1, 1);
  etat.cours.cac *= pas(M.cac, M.cac.correl * z1 + Math.sqrt(1 - M.cac.correl ** 2) * z2, 1.1);
  etat.cours.oblig *= pas(M.oblig, M.oblig.correl * z1 + Math.sqrt(1 - M.oblig.correl ** 2) * z3, 0.1);
}

// ---------------------------------------------------------------- valeurs
export function valeurs(s) {
  const f = s.fin, c = f.cours;
  const livrets = LIVRETS.reduce((t, k) => t + f.livrets[k].solde + f.livrets[k].courus, 0);
  const pel = f.pel ? f.pel.solde + f.pel.courus : 0;
  const avEuros = f.av ? f.av.euros + f.av.courus : 0, avUC = f.av ? f.av.uc * c.monde : 0;
  const pea = f.pea ? f.pea.monde * c.monde + f.pea.cac * c.cac : 0;
  const cto = f.cto.monde * c.monde + f.cto.oblig * c.oblig;
  const scpi = f.scpi ? f.scpi.parts * f.scpi.prix : 0;
  const attente = f.enAttente.reduce((t, x) => t + x.montant, 0);
  return { livrets, pel, avEuros, avUC, pea, cto, scpi, attente, risque: avUC + pea + cto + scpi, total: livrets + pel + avEuros + avUC + pea + cto + scpi + attente };
}
// valeur si l'on soldait tout aujourd'hui : impôts de sortie, frais de retrait, règles de durée
export function valeurLiquidation(s) {
  const f = s.fin, B = BANQUE, c = f.cours, v = valeurs(s);
  let net = v.livrets + v.attente;
  if (f.pel) { const ans = (f.cal - f.pel.ouvert) / 365; const courus = ans < 2 ? f.pel.courusCel : f.pel.courus; net += f.pel.solde + courus * (1 - B.pel.pfu); }
  if (f.av) {
    const gainUC = Math.max(0, v.avUC - f.av.coutUC), gainEur = Math.max(0, f.av.euros + f.av.courus * (1 - B.av.psFondsEuros) - f.av.versesEuros);
    net += f.av.euros + f.av.courus * (1 - B.av.psFondsEuros) + v.avUC - gainUC * (B.av.irAvant8 + B.av.psFondsEuros) - gainEur * B.av.irAvant8;
  }
  if (f.pea) { const g = v.pea - f.pea.verse; net += v.pea - Math.max(0, g) * B.pfu - v.pea * MARCHES.courtage.pea; }
  for (const k of ['monde', 'oblig']) { const val = f.cto[k] * c[k]; if (val > 0) net += val - Math.max(0, val - f.cto.cout[k]) * B.pfu - Math.max(MARCHES.courtage.ctoMin, val * MARCHES.courtage.ctoPct); }
  if (f.scpi) net += f.scpi.parts * f.scpi.prix * (1 - MARCHES.scpi.frais);
  return net;
}
export function gainFinancier(s) {
  const f = s.fin;
  const gain = valeurLiquidation(s) + f.revenusCash - f.apport;   // les agios sont comptés au poste « banque »
  const vl = f.voisin.livret;
  const voisin = vl.solde + vl.courus + f.voisin.retire - f.epargneInitiale;   // = ses intérêts
  return { gain, voisin, net: gain - voisin, agios: f.agios, voisinAgios: f.voisin.agios };
}

// ---------------------------------------------------------------- un jour calendaire
function quinzaine(l, taux) { l.courus += Math.max(0, l.debutQ - l.retraitsQ) * taux / 24; l.debutQ = l.solde; l.retraitsQ = 0; }

function jourCalendaire(s, c, ctx) {
  const f = s.fin, B = BANQUE, d = dateCal(c), dm = d.getUTCDate(), mois = d.getUTCMonth(), dernier = new Date(D0 + (c + 1) * J).getUTCDate() === 1;
  pasMarche(f, makeRng(s.seed * 7919 + c * 104729 + 13));
  // quinzaines : arrêtés le 15 et le dernier jour du mois
  if (dm === 15 || dernier) {
    for (const k of LIVRETS) quinzaine(f.livrets[k], B[k].taux);
    quinzaine(f.voisin.livret, B.livretA.taux);
  }
  // 31 décembre : capitalisation des intérêts, fonds euros, PEL
  if (mois === 11 && dm === 31) {
    if (LIVRETS.some(k => f.livrets[k].courus > 0.5)) ctx?.debloquer?.('interetsComposes');
    for (const k of LIVRETS) { const l = f.livrets[k]; l.solde += l.courus; l.debutQ += l.courus; l.interets += l.courus; l.courus = 0; }
    const vl = f.voisin.livret; vl.solde += vl.courus; vl.debutQ += vl.courus; vl.courus = 0;
    if (f.av && f.av.courus > 0) { const ps = f.av.courus * B.av.psFondsEuros; f.av.euros += f.av.courus - ps; f.impots += ps; f.av.courus = 0; }
    if (f.scpi) { const rng = makeRng(s.seed * 31 + c); const choc = rng() < MARCHES.scpi.chocP ? MARCHES.scpi.choc : 0; f.scpi.prix *= 1 + MARCHES.scpi.revalo + MARCHES.scpi.revaloSigma * gauss(rng) * 0.5 + choc; }
  }
  // intérêts courus journaliers : fonds euros, PEL (taux contractuel et taux CEL en cas de clôture avant 2 ans)
  if (f.av) f.av.courus += f.av.euros * BANQUE.av[f.av.contrat].fondsEuros / 365;
  if (f.pel) { f.pel.courus += f.pel.solde * B.pel.taux / 365; f.pel.courusCel += f.pel.solde * B.pel.tauxCel / 365; }
  // frais de gestion des UC de l'assurance vie
  if (f.av && f.av.uc > 0) { const fr = f.av.uc * BANQUE.av[f.av.contrat].gestionUC / 365; f.av.uc -= fr; f.frais += fr * f.cours.monde; }
  // PEL : versement mensuel automatique (540 €/an minimum)
  if (f.pel && dm === 1) { s.argent -= 45; f.pel.solde += 45; f.apport += 45; }
  // SCPI : loyers mensuels versés sur le compte courant après le délai de jouissance, imposés (micro-foncier)
  if (f.scpi && dernier && c >= f.scpi.jouissance) {
    const brut = f.scpi.parts * f.scpi.prixSouscription * MARCHES.scpi.distribution / 12;
    const impot = brut * (1 - B.microFoncier) * (PROFILS[f.profil].tmi + B.psFoncier);
    s.argent += brut - impot; f.revenusCash += brut - impot; f.impots += impot; f.scpi.loyers += brut - impot;
    ctx?.msg?.(`🏢 SCPI : ${(brut - impot).toFixed(2).replace('.', ',')} € de loyers nets versés (impôt ${impot.toFixed(2).replace('.', ',')} €).`, 'info');
  }
  if (f.scpi?.retrait && c >= f.scpi.retrait.cal) {
    const parts = f.scpi.retrait.parts, montant = parts * f.scpi.prix * (1 - MARCHES.scpi.frais);
    f.scpi.parts -= parts; s.argent += montant; f.apport -= montant; f.scpi.retrait = null;
    ctx?.msg?.(`🏢 Retrait de SCPI exécuté : ${Math.round(montant)} € (prix de retrait, frais de souscription perdus).`, 'info');
    if (f.scpi.parts <= 1e-9) f.scpi = null;
  }
  // ventes en attente (règlement-livraison J+2)
  f.enAttente = f.enAttente.filter(x => { if (c >= x.cal) { s.argent += x.montant; return false; } return true; });
  // découvert : agios (et commission d'intervention hors autorisation)
  const D = B.decouvert;
  if (s.argent < 0 && f.autoLivret) renflouer(s, ctx);
  if (s.argent < 0) {
    const a = Math.min(-s.argent, D.autorise) * D.taeg / 365 + Math.max(0, -s.argent - D.autorise) * D.horsAutorisation / 365;
    let com = 0;
    const cle = `${d.getUTCFullYear()}-${mois}`;
    if (-s.argent > D.autorise && (f.commissionsMois[cle] || 0) < D.commissionMois) { com = D.commission; f.commissionsMois[cle] = (f.commissionsMois[cle] || 0) + com; }
    s.argent -= a + com; f.agios += a + com; s.depenses.banque = (s.depenses.banque || 0) + a + com;
  }
  // le voisin : même budget de départ, il dépense ce que coûte sa vie ; quand son compte passe à découvert,
  // il pioche dans son Livret A (comme le virement automatique du joueur), puis seulement paie des agios
  const besoin = Math.max(0, (s.coutVoisinCumul || 0) - ARGENT_DEPART) - f.voisin.retire;
  if (besoin > 0) { const vl = f.voisin.livret, m = Math.min(besoin, vl.solde); vl.solde -= m; vl.retraitsQ = Math.min(vl.debutQ, vl.retraitsQ + m); f.voisin.retire += m; }
  const decVoisin = Math.max(0, (s.coutVoisinCumul || 0) - ARGENT_DEPART - f.voisin.retire);
  if (decVoisin > 0) { const a = Math.min(decVoisin, D.autorise) * D.taeg / 365 + Math.max(0, decVoisin - D.autorise) * D.horsAutorisation / 365; f.voisin.agios += a; s.base.banque = (s.base.banque || 0) + a; }
}

// virement automatique : livrets (LEP en dernier, c'est le mieux rémunéré) -> compte courant
function renflouer(s, ctx) {
  const f = s.fin;
  for (const k of ['livretA', 'ldds', 'lep']) {
    if (s.argent >= 0) break;
    const l = f.livrets[k], m = Math.min(l.solde, Math.ceil(-s.argent / 10) * 10);
    if (m <= 0) continue;
    l.solde -= m; l.retraitsQ = Math.min(l.debutQ, l.retraitsQ + m); s.argent += m; f.apport -= m; f.virements = (f.virements || 0) + m;
    ctx?.msg?.(`🏦 Virement automatique : ${m} € du ${BANQUE[k].nom} vers le compte courant (épargne de précaution).`, 'info');
  }
}

/** Avance le calendrier bancaire jusqu'au jour calendaire « cible » inclus (tests, outils). */
export function avancerCalendrier(s, cible, ctx) { for (let c = s.fin.cal + 1; c <= cible; c++) jourCalendaire(s, c, ctx); s.fin.cal = Math.max(s.fin.cal, cible); }

/** Fin de journée de jeu : fait avancer le calendrier (y compris les semaines sautées entre chapitres). */
export function financeJour(s, ctx) {
  s.fin ||= nouvelEtatFinance();
  const f = s.fin, cible = calDuJour(s.jour);
  const gap = cible - f.cal > 1;
  for (let c = f.cal + 1; c <= cible; c++) jourCalendaire(s, c, gap && c < cible ? null : ctx);
  f.cal = cible;
  const v = valeurs(s);
  f.hist.push({ j: s.jour, c: cible, monde: r2(f.cours.monde), total: Math.round(v.total), risque: Math.round(v.risque) });
  if (f.hist.length > 200) f.hist.shift();
  // moral : sécurité de l'épargne de précaution, stress du découvert et des baisses
  const precaution = v.livrets + Math.max(0, s.argent);
  let dm = 0;
  if (precaution >= 600 * BANQUE.precautionMois) dm += 0.03;
  if (s.argent < 0) { dm -= s.argent < -BANQUE.decouvert.autorise ? 0.3 : 0.1; f.stats.joursNegatif++; if (s.argent < -BANQUE.decouvert.autorise) f.stats.joursHorsAutorisation++; }
  const cout = coutRisque(s);
  if (v.risque > 300 && cout > 0) {
    const ratio = v.risque / cout;
    if (ratio < 0.92) { dm -= Math.min(0.3, (0.92 - ratio) * 2); if (!f.alerteBaisse) { f.alerteBaisse = true; ctx?.msg?.(`📉 Tes placements à risque valent ${Math.round((1 - ratio) * 100)} % de moins que ce que tu as versé. Ça stresse… mais vendre maintenant figerait la perte.`, 'alerte'); ctx?.debloquer?.('volatilite'); } }
    else if (ratio > 0.97) f.alerteBaisse = false;
  }
  s.volonte = Math.max(0, Math.min(100, s.volonte + dm));
  if (s.argent < 0 && v.risque + v.pel > 300) ctx?.debloquer?.('precaution');
  if (s.argent < -BANQUE.decouvert.autorise && !f.alerteDecouvert) { f.alerteDecouvert = true; ctx?.msg?.('🏦 Découvert dépassé : 20 % d\'agios et 8 € de commission par jour (80 €/mois). Vends un placement ou retire de ton livret.', 'alerte'); }
  if (s.argent > 0) f.alerteDecouvert = false;
  if (v.livrets > 500 && s.jour >= 30) ctx?.debloquer?.('inflationReelle');
  const classes = [v.livrets + v.avEuros + v.pel > 0, v.pea + v.avUC + f.cto.monde > 0, f.cto.oblig > 0, v.scpi > 0].filter(Boolean).length;
  if (classes >= 3) ctx?.debloquer?.('diversification');
}
function coutRisque(s) {
  const f = s.fin;
  return (f.av ? f.av.coutUC : 0) + (f.pea ? f.pea.verse : 0) + f.cto.cout.monde + f.cto.cout.oblig + (f.scpi ? f.scpi.verse : 0);
}

// ---------------------------------------------------------------- opérations
const err = (t) => ({ ok: false, msg: t });
const ok = (t) => ({ ok: true, msg: t });
function prendre(s, m) { if (m <= 0 || !isFinite(m)) return 'Montant invalide.'; if (s.argent - m < 0) return 'Pas assez d\'argent sur le compte courant (on ne place pas avec un découvert).'; s.argent -= m; s.fin.apport += m; s.fin.verrou = true; return null; }

export function deposer(s, compte, m, ctx) {
  const r = deposer1(s, compte, m, ctx);
  if (r.ok) ctx?.debloquer?.('coutOpportunite');
  return r;
}
function deposer1(s, compte, m, ctx) {
  const f = s.fin, B = BANQUE; m = r2(m);
  if (LIVRETS.includes(compte)) {
    if (compte === 'lep' && !eligibleLEP(s)) return err(`LEP réservé aux revenus modestes (RFR ≤ ${B.lep.plafondRfr} €).`);
    const l = f.livrets[compte];
    if (l.solde + m > B[compte].plafond) return err(`Plafond du ${B[compte].nom} : ${B[compte].plafond} €.`);
    const e = prendre(s, m); if (e) return err(e);
    l.solde += m;
    const dm = dateCal(aujourdhui(s)).getUTCDate();
    if (dm === 1 || dm === 16) l.debutQ += m;   // déposé le jour même d'un début de quinzaine : il compte pour celle-ci
    if (dm !== 1 && dm !== 16) ctx?.debloquer?.('quinzaine');
    return ok(`${m} € versés sur le ${B[compte].nom} : ils rapportent à partir du ${dm <= 15 ? '16' : '1er'} (règle des quinzaines).`);
  }
  if (compte === 'pel') {
    if (!f.pel) { if (m < B.pel.ouverture) return err(`Ouverture d'un PEL : ${B.pel.ouverture} € minimum.`); const e = prendre(s, m); if (e) return err(e); f.pel = { solde: m, ouvert: f.cal, courus: 0, courusCel: 0 }; return ok(`PEL ouvert à ${B.pel.taux * 100} % brut (taux figé 15 ans). Puis 45 €/mois prélevés automatiquement. Retrait = clôture.`); }
    if (f.pel.solde + m > B.pel.plafond) return err('Plafond du PEL atteint.');
    const e = prendre(s, m); if (e) return err(e); f.pel.solde += m; return ok(`${m} € versés sur le PEL.`);
  }
  if (compte === 'avEuros' || compte === 'avUC') {
    if (!f.av) return err('Ouvre d\'abord un contrat d\'assurance vie.');
    const e = prendre(s, m); if (e) return err(e);
    const C = BANQUE.av[f.av.contrat], net = m * (1 - C.entree);
    f.frais += m * C.entree;
    if (compte === 'avEuros') { f.av.euros += net; f.av.versesEuros += net; } else { f.av.uc += net / f.cours.monde; f.av.coutUC += m; }
    ctx?.debloquer?.('enveloppe');
    return ok(`${m} € versés (${C.entree ? `${(m * C.entree).toFixed(2).replace('.', ',')} € de frais d'entrée` : 'sans frais d\'entrée'}).`);
  }
  if (compte === 'peaMonde' || compte === 'peaCac') {
    if (!f.pea) { f.pea = { monde: 0, cac: 0, verse: 0, ouvert: f.cal }; ctx?.debloquer?.('enveloppe'); }
    if (f.pea.verse + m > MARCHES.peaPlafond) return err('Plafond de versements du PEA : 150 000 €.');
    const e = prendre(s, m); if (e) return err(e);
    const fr = m * MARCHES.courtage.pea; f.frais += fr; f.pea.verse += m;
    const k = compte === 'peaMonde' ? 'monde' : 'cac'; f.pea[k] += (m - fr) / f.cours[k];
    return ok(`Achat de ${m - fr} € d'ETF dans le PEA (courtage ${fr.toFixed(2).replace('.', ',')} €).`);
  }
  if (compte === 'ctoMonde' || compte === 'ctoOblig') {
    const e = prendre(s, m); if (e) return err(e);
    const fr = Math.max(MARCHES.courtage.ctoMin, m * MARCHES.courtage.ctoPct); f.frais += fr;
    const k = compte === 'ctoMonde' ? 'monde' : 'oblig'; f.cto[k] += (m - fr) / f.cours[k]; f.cto.cout[k] += m;
    if (fr / m > 0.02) ctx?.debloquer?.('fraisRendement');
    return ok(`Achat de ${(m - fr).toFixed(2).replace('.', ',')} € sur le compte-titres (courtage ${fr.toFixed(2).replace('.', ',')} €).`);
  }
  if (compte === 'scpi') {
    const e = prendre(s, m); if (e) return err(e);
    if (!f.scpi) f.scpi = { parts: 0, prix: 1, prixSouscription: 1, verse: 0, jouissance: f.cal + Math.round(MARCHES.scpi.jouissanceMois * 30.4), loyers: 0, retrait: null };
    f.scpi.parts += m / f.scpi.prix; f.scpi.verse += m; f.frais += m * MARCHES.scpi.frais;
    ctx?.debloquer?.('fraisRendement');
    return ok(`${m} € de parts de SCPI : ~10 % de frais inclus dans le prix, premiers loyers dans ${MARCHES.scpi.jouissanceMois} mois.`);
  }
  return err('Compte inconnu.');
}

export function ouvrirAV(s, contrat) { if (s.fin.av) return err('Contrat déjà ouvert.'); s.fin.av = { contrat, euros: 0, versesEuros: 0, uc: 0, coutUC: 0, courus: 0, ouvert: s.fin.cal }; s.fin.verrou = true; return ok(`Assurance vie ouverte : ${BANQUE.av[contrat].nom}.`); }

export function retirer(s, compte, m, ctx) {
  const f = s.fin, B = BANQUE, c = f.cours; m = r2(m);
  const encaisser = (x) => { s.argent += x; f.apport -= x; };
  if (LIVRETS.includes(compte)) {
    const l = f.livrets[compte]; m = Math.min(m, l.solde); if (m <= 0) return err('Livret vide.');
    l.solde -= m; l.retraitsQ = Math.min(l.debutQ, l.retraitsQ + m); encaisser(m);
    return ok(`${m} € retirés du ${B[compte].nom} : disponibles tout de suite (la quinzaine en cours ne rapporte pas sur cette somme).`);
  }
  if (compte === 'pel') {
    if (!f.pel) return err('Pas de PEL.');
    const ans = (f.cal - f.pel.ouvert) / 365, courus = ans < 2 ? f.pel.courusCel : f.pel.courus, impot = courus * B.pel.pfu;
    encaisser(f.pel.solde + courus - impot); f.impots += impot;
    const t = `PEL clôturé${ans < 2 ? ' avant 2 ans : intérêts recalculés au taux du CEL (1,25 %)' : ''} : ${Math.round(f.pel.solde + courus - impot)} € récupérés.`;
    f.pel = null; ctx?.debloquer?.('liquidite'); return ok(t);
  }
  if (compte === 'avEuros' || compte === 'avUC') {
    if (!f.av) return err('Pas d\'assurance vie.');
    if (compte === 'avEuros') {
      const dispo = f.av.euros + f.av.courus * (1 - B.av.psFondsEuros); m = Math.min(m, dispo); if (m <= 0) return err('Fonds euros vide.');
      const gain = Math.max(0, dispo - f.av.versesEuros) * m / dispo, ir = gain * B.av.irAvant8;
      const part = m / dispo; f.av.euros *= 1 - part; f.av.courus *= 1 - part; f.av.versesEuros *= 1 - part;
      encaisser(m - ir); f.impots += ir; return ok(`Rachat de ${m} € (impôt ${ir.toFixed(2).replace('.', ',')} € sur la part de gains, contrat de moins de 8 ans).`);
    }
    const val = f.av.uc * c.monde; m = Math.min(m, val); if (m <= 0) return err('Rien en unités de compte.');
    const part = m / val, gain = (val - f.av.coutUC) * part, imp = Math.max(0, gain) * (B.av.irAvant8 + B.av.psFondsEuros);
    f.av.uc *= 1 - part; f.av.coutUC *= 1 - part; f.impots += imp;
    if (gain < 0) { f.stats.ventesPerte++; ctx?.debloquer?.('volatilite'); }
    f.enAttente.push({ cal: f.cal + 3, montant: m - imp }); f.apport -= m - imp;
    return ok(`Rachat UC de ${Math.round(m)} € : versé sous ~3 jours${gain < 0 ? `, perte réalisée de ${Math.round(-gain)} €` : ''}.`);
  }
  if (compte === 'pea') {
    if (!f.pea) return err('Pas de PEA.');
    const val = f.pea.monde * c.monde + f.pea.cac * c.cac, fr = val * MARCHES.courtage.pea, g = val - fr - f.pea.verse, imp = Math.max(0, g) * B.pfu;
    f.frais += fr; f.impots += imp;
    if (g < 0) { f.stats.ventesPerte++; ctx?.debloquer?.('volatilite'); }
    f.enAttente.push({ cal: f.cal + 2, montant: val - fr - imp }); f.apport -= val - fr - imp; f.pea = null;
    return ok(`PEA de moins de 5 ans : tout retrait le clôture. ${Math.round(val - fr - imp)} € versés en J+2 (impôt ${Math.round(imp)} €${g < 0 ? `, perte ${Math.round(-g)} €` : ''}).`);
  }
  if (compte === 'ctoMonde' || compte === 'ctoOblig') {
    const k = compte === 'ctoMonde' ? 'monde' : 'oblig', val = f.cto[k] * c[k]; m = Math.min(m, val); if (m <= 0) return err('Rien à vendre.');
    const part = m / val, cout = f.cto.cout[k] * part, fr = Math.max(MARCHES.courtage.ctoMin, m * MARCHES.courtage.ctoPct), g = m - fr - cout, imp = Math.max(0, g) * B.pfu;
    f.cto[k] *= 1 - part; f.cto.cout[k] -= cout; f.frais += fr; f.impots += imp;
    if (g < 0) { f.stats.ventesPerte++; ctx?.debloquer?.('volatilite'); }
    f.enAttente.push({ cal: f.cal + 2, montant: m - fr - imp }); f.apport -= m - fr - imp;
    return ok(`Vente de ${Math.round(m)} € : versés en J+2 (${g >= 0 ? `impôt ${imp.toFixed(2).replace('.', ',')} €` : `perte réalisée ${Math.round(-g)} €`}).`);
  }
  if (compte === 'scpi') {
    if (!f.scpi || f.scpi.retrait) return err(f.scpi ? 'Retrait déjà demandé.' : 'Pas de SCPI.');
    const parts = Math.min(f.scpi.parts, m / (f.scpi.prix * (1 - MARCHES.scpi.frais)));
    f.scpi.retrait = { cal: f.cal + MARCHES.scpi.retraitJours, parts };
    ctx?.debloquer?.('liquidite');
    return ok(`Demande de retrait enregistrée : exécution dans ~${MARCHES.scpi.retraitJours} jours, au prix de retrait (−10 % de frais), si un acheteur se présente.`);
  }
  return err('Compte inconnu.');
}

// ---------------------------------------------------------------- arbitrage équipement / placement
// rendement annuel d'un usage de l'argent ; équipement = économie annuelle estimée / prix
export function tauxPlacements(s) {
  const B = BANQUE, M = MARCHES, infl = M.inflation;
  const l = [
    { id: 'livretA', nom: 'Livret A', taux: B.livretA.taux, net: B.livretA.taux, liquidite: 'immédiate', risque: 'aucun' },
    { id: 'ldds', nom: 'LDDS', taux: B.ldds.taux, net: B.ldds.taux, liquidite: 'immédiate', risque: 'aucun' },
    { id: 'lep', nom: 'LEP', taux: B.lep.taux, net: B.lep.taux, liquidite: 'immédiate', risque: 'aucun', off: !eligibleLEP(s) },
    { id: 'pel', nom: 'PEL', taux: B.pel.taux, net: B.pel.taux * (1 - B.pel.pfu), liquidite: 'bloqué (retrait = clôture ; < 2 ans → 1,25 %)', risque: 'aucun' },
    { id: 'avEuros', nom: 'Fonds euros (AV en ligne)', taux: B.av.enLigne.fondsEuros, net: B.av.enLigne.fondsEuros * (1 - B.av.psFondsEuros), liquidite: 'quelques jours', risque: 'capital garanti' },
    { id: 'ctoOblig', nom: 'Fonds obligataire', taux: M.oblig.mu - M.oblig.ter, net: (M.oblig.mu - M.oblig.ter) * (1 - B.pfu), liquidite: 'J+2', risque: 'faible à moyen' },
    { id: 'peaMonde', nom: 'ETF monde (PEA, > 5 ans)', taux: M.monde.mu - M.monde.ter, net: (M.monde.mu - M.monde.ter) * (1 - B.psPea), liquidite: 'J+2 (retrait < 5 ans = clôture)', risque: 'élevé (−30 % possible)' },
    { id: 'scpi', nom: 'SCPI', taux: M.scpi.distribution, net: M.scpi.distribution * (1 - (1 - B.microFoncier) * (PROFILS[s.fin.profil].tmi + B.psFoncier)) - M.scpi.frais / 10, liquidite: 'mois, pas garantie', risque: 'moyen ; 10 % de frais à l\'entrée' },
  ];
  for (const x of l) x.reel = x.net - infl;
  return l;
}
export function meilleurUsage(s, montant, equipements) {
  // equipements : [{ id, nom, prix, annuel }] non possédés ; on remplit d'abord les meilleurs rendements
  const opts = [...equipements.filter(e => e.annuel > 0).map(e => ({ nom: e.nom, taux: e.annuel / e.prix, prix: e.prix, type: 'équipement', liquidite: 'aucune (revente partielle)' })),
    ...tauxPlacements(s).filter(p => !p.off).map(p => ({ nom: p.nom, taux: p.net, prix: Infinity, type: 'placement', liquidite: p.liquidite, risque: p.risque }))]
    .sort((a, b) => b.taux - a.taux);
  let reste = montant; const plan = [];
  for (const o of opts) { if (reste <= 0) break; if (o.prix > reste && o.type === 'équipement') continue; const m = Math.min(reste, o.prix); plan.push({ ...o, montant: m, gainAn: m * o.taux }); reste -= m; }
  return { opts, plan };
}

// ---------------------------------------------------------------- projection à long terme (Monte-Carlo déterministe)
export const ALLOCATIONS = {
  livret: { nom: '100 % Livret A', livret: 1 },
  euros: { nom: '100 % fonds euros', euros: 1 },
  mixte: { nom: '50 % fonds euros + 50 % ETF monde', euros: 0.5, actions: 0.5 },
  actions: { nom: '100 % ETF monde (PEA)', actions: 1 },
};
export function projection(seed, versementAn, ans, allocId, n = 300) {
  const A = ALLOCATIONS[allocId], B = BANQUE, M = MARCHES;
  const finals = [];
  for (let i = 0; i < n; i++) {
    const rng = makeRng(seed * 97 + i * 7 + ans);
    const etat = { regime: 0, cours: { monde: 100, cac: 100, oblig: 100 } };
    let liv = 0, eur = 0, act = 0, verse = 0;
    for (let y = 0; y < ans; y++) {
      liv += versementAn * (A.livret || 0); eur += versementAn * (A.euros || 0); act += versementAn * (A.actions || 0) * (1 - M.courtage.pea); verse += versementAn;
      const c0 = etat.cours.monde;
      for (let d = 0; d < 365; d += 5) { for (let k = 0; k < 5; k++) pasMarche(etat, rng); }
      act *= etat.cours.monde / c0;
      liv *= 1 + B.livretA.taux; eur *= 1 + B.av.enLigne.fondsEuros * (1 - B.av.psFondsEuros);
    }
    // sortie : PEA > 5 ans (PS 18,6 % sur les gains), AV > 8 ans (abattement 4 600 € puis 7,5 % + PS déjà payés sur le fonds euros)
    const versA = versementAn * (A.actions || 0) * ans, gainA = Math.max(0, act - versA);
    const netA = act - gainA * (ans >= 5 ? B.psPea : B.pfu);
    const versE = versementAn * (A.euros || 0) * ans, gainE = Math.max(0, eur - versE);
    const netE = eur - (ans >= 8 ? Math.max(0, gainE - B.av.abattement8) * B.av.irApres8 : gainE * B.av.irAvant8);
    const nominal = liv + netE + netA;
    finals.push({ nominal, reel: nominal / Math.pow(1 + M.inflationLongTerme, ans), verse });
  }
  finals.sort((a, b) => a.nominal - b.nominal);
  const q = (p) => finals[Math.min(n - 1, Math.floor(p * n))];
  return { verse: versementAn * ans, p10: q(0.1), p50: q(0.5), p90: q(0.9), perte: finals.filter(x => x.nominal < x.verse).length / n };
}
