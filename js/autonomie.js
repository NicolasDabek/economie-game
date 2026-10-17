// v1.1 : autosuffisance. Potager par planches et calendrier, garde-manger (stock, péremption, conserves),
// poules, cueillette, eau du jardin (paillage, oyas, goutte-à-goutte, arrêté sécheresse), poêle et bois sec,
// ballon thermodynamique et prime CEE, toilettes sèches, taux d'autosuffisance.
// Aucune dépendance vers simulation.js : la journée passe par le contexte (ctx) et les actions par des « outils ».
import { CULTURES, ASSOCIATIONS, POTAGER, GARDE, CONSERVES, ACHATS_SAISON, POULES, BOIS, CUEILLETTE, CET, TOILETTES, SECHERESSE, AUTOSUFFISANCE, REGIMES, PRIX, CUISINE } from './data.js';
import { makeRng } from './rng.js';
import { dateDuJour, anneeDuJour, chapitreDuJour } from './meteo.js';
import { mensualiser } from './annee.js';

export const PLAN_CONSEILLE = ['salade', 'tomate', 'courgette', 'haricot', 'pdt', 'carotte', 'poireau', 'courge'];
const planche = () => ({ culture: null, etat: 'libre', seme: 0, kgPrevu: 0, recolte: 0, famillePrec: null, gel: false, horsFenetre: false });

export function nouvelEtatAutonomie() {
  return {
    planches: Array.from({ length: POTAGER.planchesBase + POTAGER.planchesGrand }, planche),
    precoce: false,                // semer les cultures frileuses dès l'ouverture de la fenêtre (risque de gel)
    stock: [],                     // lots du garde-manger : { cat, nom, kg, valeurKg, coutKg, fin, maison, bocal, lacto, risque }
    paillageJusqua: -1,
    secheresse: {},                // par année : { debut, fin } ou null
    poules: { n: 0, declare: false },
    poele: { mode: 'eteint', encrassement: 0, ramonage: -999, horsService: -1 },
    bois: [],                      // lots : { st, jour, sec, prixSt }
    toilettes: false,
    cet: { demande: null, prime: 0, primeJour: null },
    cueillette: { derniere: -99, sorties: 0, pharmacie: true },
    absentJusqua: -1,
    alertes: {},
    stats: { alimMaison: 0, alimAchat: 0, pluie: 0, reseau: 0, boisKwh: 0, chaleurKwh: 0, solaire: 0, elecReseau: 0,
      produitKg: 0, gaspilleKg: 0, gaspilleEur: 0, oeufs: 0, bocaux: 0, cueilliKg: 0, intox: 0 },
  };
}
export const etatAutonomie = (s) => (s.autonomie ||= nouvelEtatAutonomie());
export const nbPlanches = (s) => !s.possede.potager ? 0 : POTAGER.planchesBase + (s.possede.potagerGrand ? POTAGER.planchesGrand : 0);
const doy = (j) => chapitreDuJour(j).doy;
const dansFenetre = (c, d) => d >= c.semis[0] && d <= c.semis[1];
const jardinActif = (s) => !!s.gestes?.jardiner && s.sys.potagerDepuis !== null;

// plan conseillé appliqué au premier achat du potager (et à l'agrandissement)
export function surAchat(s, id, occasion, outils) {
  const A = etatAutonomie(s);
  if (id === 'potager' || id === 'potagerGrand') {
    const n = nbPlanches(s);
    for (let i = 0; i < n; i++) if (!A.planches[i].culture) A.planches[i].culture = PLAN_CONSEILLE[i];
    outils.msg(`🌱 ${n} planches de ${POTAGER.m2Planche} m² : plan conseillé (${A.planches.slice(0, n).map(p => CULTURES[p.culture].nom.toLowerCase()).join(', ')}). Change les cultures dans Jardin ; chaque planche se sème dans sa fenêtre.`, 'info');
  }
  if (id === 'poules') { A.poules.n = POULES.n; outils.msg('🐔 Trois poules s\'installent. Pense à les déclarer en mairie (onglet Jardin).', 'info'); }
  if (id === 'toilettesSeches') A.toilettes = true;
  if (id === 'poele') A.poele.mode = 'soir';
  if (id === 'cet') {
    if (occasion) { outils.msg('⚖️ Artisan non RGE : aucune prime CEE possible. Le moins cher au devis n\'est pas le moins cher payé.', 'alerte'); outils.debloquer('aidesAvant'); }
    else if (A.cet.demande === null) { outils.msg('⚖️ Piège des aides : le devis a été signé avant de demander la prime CEE. Elle est perdue (la demande doit précéder l\'engagement).', 'alerte'); outils.debloquer('aidesAvant'); }
    else {
      const bonif = A.cet.demande < CET.finBonif;   // opérations engagées avant le 1er janvier 2027 : prime ×7 (modestes) ou ×4
      A.cet.prime = bonif ? (s.fin?.profil === 'modeste' ? CET.ceeModeste : CET.ceeAutre) : CET.ceeBase;
      A.cet.primeJour = s.jour + CET.delaiPrime;
      outils.msg(`📨 Dossier CEE complet : ${A.cet.prime} € de prime versés dans ${CET.delaiPrime} jours${bonif ? ' (bonification jusqu\'au 31 décembre 2026)' : ' (bonification terminée)'}.`, 'info');
      outils.debloquer('aidesAvant');
    }
  }
}

// ---------------------------------------------------------------- potager
function facteurCompost(s) {
  const age = (id) => s.jour - (s.eco?.achats?.[id] ?? 0);
  let f = 1;
  if (s.possede.composteur) { const a = age('composteur'); f = a < 180 ? 1.1 : a < 365 ? 1.3 : 1.45; }
  if (s.possede.lombri) { const a = age('lombri'); f = Math.max(f, a < 60 ? 1.1 : a < 180 ? 1.3 : 1.4); }
  if (f > 1 && s.possede.bokashi) f += 0.05;
  if (f > 1 && s.possede.poules && etatAutonomie(s).poules.n > 0) f += 0.05;   // fientes : azote du compost
  return f;
}
function associations(A, i, n) {
  const c = A.planches[i].culture; let k = 0;
  for (const j of [i - 1, i + 1]) if (j >= 0 && j < n && A.planches[j].culture && ASSOCIATIONS.some(([a, b]) => (a === c && b === A.planches[j].culture) || (b === c && a === A.planches[j].culture))) k++;
  return k;
}
export function previsionPlanche(s, i, d = doy(s.jour)) {
  const A = etatAutonomie(s), p = A.planches[i], C = CULTURES[p.culture]; if (!C) return null;
  const n = nbPlanches(s);
  const ans = Math.min(3, Math.max(0, Math.floor((s.jour - (s.eco?.jardinDepuis ?? s.jour)) / 365)));
  const f = { base: C.kgm2 * POTAGER.m2Planche, rotation: p.famillePrec === C.famille ? POTAGER.rotation : 1, assoc: 1 + POTAGER.association * associations(A, i, n),
    fenetre: dansFenetre(C, d) ? 1 : POTAGER.horsFenetre, compost: facteurCompost(s), savoir: 1 + 0.12 * ans, precoce: C.gel && d < POTAGER.saintsGlace ? 1.15 : 1 };
  return { kg: f.base * f.rotation * f.assoc * f.fenetre * f.compost * f.savoir * f.precoce, f, eur: 0 };
}
export function semer(s, i, outils, auto = false) {
  const A = etatAutonomie(s), p = A.planches[i], C = CULTURES[p.culture];
  if (!C || p.etat !== 'libre' || i >= nbPlanches(s)) return false;
  if (!auto && !outils.prendreTemps(s, 0.25)) return false;
  const pv = previsionPlanche(s, i);
  Object.assign(p, { etat: 'pousse', seme: s.jour, kgPrevu: pv.kg, recolte: 0, gel: false, horsFenetre: pv.f.fenetre < 1 });
  outils.payer(s, C.graines, 'nourriture');
  if (pv.f.rotation < 1) outils.msg(`🔁 ${C.nom} sur la planche ${i + 1} : même famille que l'an dernier, −20 % de récolte.`, 'info');
  if (pv.f.fenetre < 1) { outils.msg(`📅 ${C.nom} semé hors saison : récolte divisée par deux.`, 'info'); outils.debloquer('calendrier'); }
  if (pv.f.assoc > 1) outils.debloquer('rotation');
  return true;
}
function potagerJour(s, ctx, A, rng) {
  const n = nbPlanches(s), d = ctx.chap.doy ?? doy(s.jour), jm = ctx.jm;
  let kgJour = 0, valeur = 0, m2 = 0;
  const gelee = d < POTAGER.saintsGlace && d > 60 && jm.tMoy - (jm.amplitude || 8) / 2 < 0.5;
  for (let i = 0; i < n; i++) {
    const p = A.planches[i], C = CULTURES[p.culture];
    if (p.etat === 'libre' && C && jardinActif(s) && ctx.faits.jardiner && dansFenetre(C, d) && (!C.gel || A.precoce || d >= POTAGER.saintsGlace) && (p.anFin ?? -1) !== anneeDuJour(s.jour) + p.culture) semer(s, i, ctx.outils, true);
    if (p.etat === 'libre' || !C) continue;
    m2 += POTAGER.m2Planche;
    if (gelee && C.gel && !p.gel) { p.gel = true; p.kgPrevu *= 1 - POTAGER.gelPerte; ctx.msg(`🥶 Gel tardif : ${C.nom.toLowerCase()} de la planche ${i + 1} brûlé (−60 %). Les saints de glace (mi-mai) sont passés par là.`, 'alerte'); ctx.debloquer('calendrier'); }
    if (!ctx.faits.jardiner && ctx.chap.id !== 'hiver') p.kgPrevu *= 0.995;    // potager négligé : les mauvaises herbes gagnent
    if (s.jour - p.seme >= C.pousse) {
      p.etat = 'recolte';
      const part = Math.min(p.kgPrevu - p.recolte, p.kgPrevu / C.recolte) * (ctx.stressEau ? 1 - POTAGER.stressEau : 1);
      if (ctx.stressEau) p.kgPrevu -= p.kgPrevu / C.recolte * POTAGER.stressEau;
      if (part > 0) { p.recolte += part; kgJour += part; valeur += part * C.prixKg; ajouterLot(A, { cat: C.garde, nom: C.nom, kg: part, valeurKg: C.prixKg, coutKg: 0, maison: true, bocal: !!C.bocal, lacto: !!C.lacto }, s.jour); }
      const finSaison = C.gel && d >= 305;
      if (p.recolte >= p.kgPrevu - 1e-6 || s.jour - p.seme >= C.pousse + C.recolte || finSaison) {
        p.famillePrec = C.famille; p.anFin = anneeDuJour(s.jour) + p.culture; p.etat = 'libre';
        if (p.recolte > 0.1) ctx.msg(`🧺 Planche ${i + 1} : récolte de ${C.nom.toLowerCase()} terminée, ${num1(p.recolte)} kg.`, 'info');
      }
    }
  }
  A.stats.produitKg += kgJour;
  return { kgJour, valeur, m2 };
}
const num1 = (x) => x.toFixed(1).replace('.', ',');

// ---------------------------------------------------------------- garde-manger
function ajouterLot(A, lot, jour) {
  const duree = GARDE[lot.cat] ?? 7;
  const memeJour = A.stock.find(l => l.nom === lot.nom && l.cat === lot.cat && l.entre === jour && !l.risque);
  if (memeJour) { memeJour.kg += lot.kg; return memeJour; }
  const l = { ...lot, entre: jour, fin: jour + duree };
  A.stock.push(l); return l;
}
export function dureeGarde(s, cat) {
  let d = GARDE[cat] ?? 7;
  if (cat === 'racines' || cat === 'courges') { if (s.possede.silo) d *= GARDE.silo; if (s.passif?.cave && (s.possede.puitsDIY || s.possede.puitsPro || s.possede.puitsHydro)) d *= GARDE.cave; }
  return Math.round(d);
}
export const valeurStock = (A) => A.stock.reduce((t, l) => t + l.kg * l.valeurKg, 0);
export const argentImmobilise = (A) => A.stock.reduce((t, l) => t + l.kg * (l.coutKg || 0), 0);
export const kgStock = (A) => A.stock.reduce((t, l) => t + l.kg, 0);
// consommation : les lots qui périment le plus tôt d'abord, jusqu'à la part fruits-légumes-œufs des courses
function garderMangerJour(s, ctx, A, R) {
  for (const l of A.stock) if (l.entre === s.jour && (l.cat === 'racines' || l.cat === 'courges')) l.fin = l.entre + dureeGarde(s, l.cat);
  let besoin = R.cout * (s.sys.regime === 'livraison' ? 0.1 : GARDE.partLegumes), maison = 0, achat = 0, lacto = false, chou = false;
  A.stock.sort((a, b) => a.fin - b.fin);
  for (const l of A.stock) {
    if (besoin <= 0) break;
    const kg = Math.min(l.kg, besoin / l.valeurKg);
    if (l.risque && kg > 0) {
      l.risque = false;
      if (s.principes.includes('douteJeter')) { const perte = Math.min(l.kg, CONSERVES.bocaux.kgParBocal); l.kg -= perte; A.stats.gaspilleKg += perte; ctx.msg('🫙 Un bocal bombé, couvercle qui ne tient plus : tu le jettes sans le goûter. Bonne réflexe.', 'info'); continue; }
      ctx.d.sante -= 20; ctx.couts.imprevus += CUEILLETTE.intox.cout; A.stats.intox++;
      ctx.msg('🤢 Intoxication : un bocal mal stérilisé (botulisme). Urgences, plusieurs jours de convalescence. Un bocal bombé ou qui sent mauvais se jette.', 'alerte');
      ctx.debloquer('douteJeter');
    }
    l.kg -= kg; besoin -= kg * l.valeurKg;
    if (l.maison) maison += kg * l.valeurKg; else achat += kg * l.valeurKg;
    if (l.cat === 'lacto') { lacto = true; if (l.nom.startsWith('Chou')) chou = true; }
  }
  // péremption
  let perdu = 0;
  for (const l of A.stock) if (l.fin <= s.jour && l.kg > 0) { A.stats.gaspilleKg += l.kg; A.stats.gaspilleEur += l.kg * l.valeurKg; perdu += l.kg; l.kg = 0; }
  if (perdu > 1) { ctx.msg(`🗑️ ${num1(perdu)} kg du garde-manger perdus (périmés). Bocaux, lactofermentation ou silo les auraient sauvés.`, 'alerte'); ctx.debloquer('stockImmobilise'); }
  A.stock = A.stock.filter(l => l.kg > 0.01);
  if (lacto) ctx.d.sante += CONSERVES.lacto.santeJour;
  return { maison, achat, lacto, chou };
}
export function aConsommerBientot(s, jours = 3) {
  const A = etatAutonomie(s);
  return A.stock.filter(l => l.fin - s.jour <= jours).reduce((t, l) => t + l.kg, 0);
}

// ---------------------------------------------------------------- alimentation du jour (appelée par systemesJour)
export function alimentationAutonome(s, ctx, R) {
  const A = etatAutonomie(s), rng = makeRng(s.seed * 131 + s.jour * 17 + 3);
  const absent = s.jour < A.absentJusqua;
  const pg = potagerJour(s, ctx, A, rng);
  let couts = 0, oeufsVal = 0;
  // poules
  if (s.possede.poules && A.poules.n > 0) {
    const sais = POULES.saison[ctx.chap.saison] ?? 1;
    const conf = A.poules.confinement && s.jour < A.poules.confinement ? 0.7 : 1;
    const oeufs = A.poules.n * POULES.oeufsAn / 365 * sais * conf;
    const epl = ['maison', 'batch', 'classique'].includes(s.sys.regime) ? POULES.epluchures : 0;
    const aliment = A.poules.n * POULES.alimentKgJour * POULES.alimentPrixKg * (1 - epl);
    couts += aliment;
    if (!absent) { ajouterLot(A, { cat: 'oeufs', nom: 'Œufs', kg: oeufs, valeurKg: POULES.prixOeuf, coutKg: 0, maison: true }, s.jour); A.stats.oeufs += oeufs; oeufsVal = oeufs * POULES.prixOeuf; }
    if (s.possede.poules) s.attribution.poules = (s.attribution.poules || 0) + oeufsVal - aliment;
    if (!s.possede.cloture && rng() < POULES.renardRisque) { A.poules.n--; ctx.d.bienetre -= 3; s.volonte -= 3; ctx.msg(`🦊 Le renard est passé : il reste ${A.poules.n} poule${A.poules.n > 1 ? 's' : ''}. Un grillage enterré l'aurait arrêté.`, 'alerte'); }
    // influenza aviaire : confinement l'hiver ; une basse-cour non déclarée n'est pas prévenue
    const d = ctx.chap.doy;
    if (d === 320 && rng() < 0.3) { A.poules.confinement = s.jour + 30;
      if (A.poules.declare) ctx.msg('🦠 Influenza aviaire : la mairie te prévient, les poules restent à l\'abri 30 jours (ponte −30 %).', 'annonce');
      else if (rng() < 0.4 && A.poules.n > 0) { A.poules.n--; ctx.msg('🦠 Influenza aviaire : non déclarée, ta basse-cour n\'a pas reçu l\'alerte de confinement. Une poule est morte.', 'alerte'); } }
    ctx.d.bienetre += POULES.bienetre;
  }
  if (s.possede.bokashi) { const g = 0.02 * R.cout / (1 + CUISINE.gaspillageBase); couts -= g; s.attribution.bokashi = (s.attribution.bokashi || 0) + g; }
  if (s.possede.lombri && s.possede.herbes) { couts -= 0.06; s.attribution.lombri = (s.attribution.lombri || 0) + 0.06; }
  // attribution du potager : valeur produite (planches 1-4 au potager, 5-8 à l'agrandissement), le compost prend sa part
  if (pg.valeur > 0) {
    const fc = facteurCompost(s), base = pg.valeur / fc;
    const grand = A.planches.slice(4, nbPlanches(s)).some(p => p.etat === 'recolte') && s.possede.potagerGrand ? 0.5 : 0;
    s.attribution.potager = (s.attribution.potager || 0) + base * (1 - grand);
    if (grand) s.attribution.potagerGrand = (s.attribution.potagerGrand || 0) + base * grand;
    const cid = s.possede.composteur ? 'composteur' : s.possede.lombri ? 'lombri' : null;
    if (cid) s.attribution[cid] = (s.attribution[cid] || 0) + pg.valeur - base;
    ctx.debloquer('cycles');
  }
  const gm = garderMangerJour(s, ctx, A, R);
  ctx.autonomie = { ...pg, oeufsVal, ...gm };
  A.stats.alimMaison += gm.maison;
  return { valeur: gm.maison + gm.achat, couts };
}

// ---------------------------------------------------------------- eau du jardin (appelée par systemesJour)
export function arrosageJour(s, ctx) {
  const A = etatAutonomie(s), y = s.sys, chap = ctx.chap, jm = ctx.jm;
  const m2 = ctx.autonomie?.m2 || 0;
  const sec = secheresseActive(s);
  ctx.stressEau = false;
  if (!m2 || chap.id === 'hiver') return { reseau: 0, pluie: 0 };
  let besoin = m2 * (POTAGER.arrosage[chap.saison] ?? 0) * (jm.canicule ? 1.4 : 1) * (jm.nuage > 0.75 ? 0.3 : 1);
  if (s.jour < A.paillageJusqua) besoin *= POTAGER.paillage;
  if (s.possede.oyas) besoin *= POTAGER.oyas;
  if (s.possede.goutte && s.possede.cuve) besoin *= POTAGER.goutte;
  if (jm.nuage > 0.75 && s.possede.cuve) y.pluie = Math.min(300, y.pluie + 60);
  const dePluie = s.possede.cuve ? Math.min(y.pluie, besoin) : 0;
  y.pluie -= dePluie;
  let reste = besoin - dePluie;
  if (ctx.faits.recupEau && s.possede.seau) reste = Math.max(0, reste - 8);
  const ref = m2 * (POTAGER.arrosage[chap.saison] ?? 0) * (jm.canicule ? 1.4 : 1) * (jm.nuage > 0.75 ? 0.3 : 1);
  const evite = Math.max(0, ref - besoin) / 1000 * PRIX.eauM3, part = (s.possede.oyas ? 1 : 0) + (s.possede.goutte && s.possede.cuve ? 1 : 0);
  if (part) { if (s.possede.oyas) s.attribution.oyas = (s.attribution.oyas || 0) + evite / part; if (s.possede.goutte && s.possede.cuve) s.attribution.goutte = (s.attribution.goutte || 0) + evite / part; }
  s.attribution.cuve = (s.attribution.cuve || 0) + dePluie / 1000 * PRIX.eauM3;
  if (sec && reste > 0.5) { ctx.stressEau = true; reste = 0; if (!A.alertes['stress' + sec.debut]) { A.alertes['stress' + sec.debut] = 1; ctx.msg('🚱 Arrêté sécheresse : arrosage interdit au robinet. Sans eau de pluie, le potager souffre (−60 % de récolte par jour sans eau).', 'alerte'); ctx.debloquer('solCouvert'); } }
  A.stats.pluie += dePluie;
  ctx.pluieJour = dePluie;
  return { reseau: reste, pluie: dePluie };
}
export function secheresseActive(s) {
  const A = etatAutonomie(s), an = anneeDuJour(s.jour);
  if (!(an in A.secheresse)) {
    const r = makeRng(s.seed * 59 + an * 7 + 11);
    if (r() < SECHERESSE.proba) { const debut = jourDoy(s, an, SECHERESSE.debut + Math.floor(r() * 25)); A.secheresse[an] = { debut, fin: debut + SECHERESSE.duree[0] + Math.floor(r() * (SECHERESSE.duree[1] - SECHERESSE.duree[0])) }; }
    else A.secheresse[an] = null;
  }
  const x = A.secheresse[an];
  return x && s.jour >= x.debut && s.jour < x.fin ? x : null;
}
// jour de campagne correspondant à un jour de l'année civile qui suit le 1er décembre de l'année de campagne an
function jourDoy(s, an, d) { const t0 = Date.UTC(2026, 11, 1), t = Date.UTC(2027 + an, 0, 1) + d * 86400000; return Math.round((t - t0) / 86400000); }

// ---------------------------------------------------------------- poêle à bois (chaleur injectée dans le salon)
export const saisonChauffe = (d) => d >= 288 || d < 115;
export function boisDisponible(s) { const A = etatAutonomie(s); return A.bois.reduce((t, l) => t + l.st, 0); }
export const lotSec = (s, l) => s.jour - l.jour >= (s.possede.abriBois ? BOIS.sechageAbri : BOIS.sechage) || l.sec;
// v1.3 : le poêle se règle comme on le fait vraiment (allure, nombre de bûches) : il chauffe le salon jusqu'à POELE_CIBLE °C, pas au-delà.
// poeleJour prépare la flambée (bois disponible, puissance) ; la simulation horaire décide de la chaleur utile ; poeleConsommer brûle le bois.
export const POELE_CIBLE = 21;
export function poeleJour(s, ctx) {
  const A = etatAutonomie(s), P = A.poele;
  ctx.boisKwh = 0; ctx.poele = null;
  if (!s.possede.poele || P.mode === 'eteint' || !saisonChauffe(ctx.chap.doy) || s.jour < P.horsService) return;
  const heures = P.mode === 'jour' ? [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] : [17, 18, 19, 20, 21, 22];
  A.bois.sort((a, b) => (lotSec(s, b) - lotSec(s, a)) || a.jour - b.jour);
  const lot = A.bois.find(l => l.st > 0.001);
  if (!lot) { if (!A.alertes.sansBois) { A.alertes.sansBois = 1; ctx.msg('🪵 Plus de bois : le poêle reste froid. Commande du bois (onglet Maison).', 'alerte'); } return; }
  A.alertes.sansBois = 0;
  const sec = lotSec(s, lot), rend = sec ? BOIS.rendement : BOIS.humideRendement;
  // bois humide : 25 % de chaleur en moins pour la même flambée
  ctx.poele = { heures: new Set(heures), p: BOIS.puissance * rend / BOIS.rendement, cible: POELE_CIBLE, sec, rend };
}
export function poeleConsommer(s, ctx, chaleur, prixGazUtile) {
  const A = etatAutonomie(s), P = A.poele, f = ctx.poele;
  if (!f || chaleur <= 0.05) return;
  let reste = chaleur / f.rend / BOIS.kwhStere, cout = 0, st = 0;
  for (const l of A.bois) { if (reste <= 0) break; const x = Math.min(l.st, reste); l.st -= x; reste -= x; st += x; cout += x * l.prixSt; }
  A.bois = A.bois.filter(l => l.st > 0.001);
  P.encrassement += (f.sec ? BOIS.encrassementJour : BOIS.encrassementHumide) * Math.min(1, chaleur / 15);
  if (!f.sec && !A.alertes.humide) { A.alertes.humide = 1; ctx.msg('💨 Bois humide : il fume, chauffe 25 % de moins et encrasse le conduit trois fois plus vite. Le bois se fait sécher 18 à 24 mois.', 'alerte'); ctx.debloquer('boisSec'); }
  if (f.sec) ctx.debloquer('boisSec');
  ctx.boisKwh = chaleur;
  ctx.d.bienetre += BOIS.bienetre; s.volonte = Math.min(100, s.volonte + BOIS.moral * 0.1);
  s.attribution.poele = (s.attribution.poele || 0) + chaleur * 0.85 * prixGazUtile - cout;
  // feu de cheminée : conduit encrassé
  const r = makeRng(s.seed * 83 + s.jour * 29 + 1)();
  if (P.encrassement > 150 && r < BOIS.feuRisque * (P.encrassement - 150) / 50) {
    const assure = s.jour - P.ramonage <= 365;
    const c = assure ? 300 : BOIS.franchise;
    ctx.couts.imprevus += c; ctx.d.sante -= 10; P.horsService = s.jour + 14; P.encrassement = 0;
    ctx.msg(`🔥 Feu de cheminée ! Pompiers, conduit à vérifier, poêle arrêté 14 jours. ${assure ? 'Assurance : franchise de 300 €.' : `Pas d'attestation de ramonage de moins d'un an : l'assurance refuse d'indemniser (${c} € à ta charge).`}`, 'alerte');
    ctx.debloquer('ramonage');
  }
  return st;
}

// ---------------------------------------------------------------- fin de journée : taux d'autosuffisance
export function autonomieSoir(s, j) {
  const A = etatAutonomie(s), st = A.stats;
  st.alimAchat += j.nourritureAchetee; st.reseau += j.litresReseau; st.boisKwh += j.boisKwh;
  st.chaleurKwh += j.boisKwh + j.gazUtile + j.appoint; st.solaire += j.solaireAuto; st.elecReseau += j.elecReseau;
  if (A.cet.primeJour !== null && s.jour >= A.cet.primeJour) { s.argent += A.cet.prime; s.depenses.equipement -= A.cet.prime; s.prixPayes.cet = (s.prixPayes.cet ?? CET.prix) - A.cet.prime; A.cet.primeJour = null; j.msg(`💶 Prime CEE versée : +${A.cet.prime} € pour le ballon thermodynamique.`, 'info'); }
  // annonce de l'arrêté sécheresse
  const an = anneeDuJour(s.jour); secheresseActive(s); const x = A.secheresse[an];
  if (x && s.jour === x.debut - SECHERESSE.annonce) j.msg(`📅 Annonce : arrêté sécheresse dans ${SECHERESSE.annonce} jours, arrosage interdit au robinet pendant ${x.fin - x.debut} jours. Cuve pleine, paillage et oyas sauvent le potager.`, 'annonce');
  if (tauxAutosuffisance(s).global >= 25) j.debloquer('autonomie');
}
export function tauxAutosuffisance(s) {
  const st = etatAutonomie(s).stats;
  const pc = (a, b) => (a + b > 0 ? 100 * a / (a + b) : 0);
  const t = { alim: pc(st.alimMaison, st.alimAchat), eau: pc(st.pluie, st.reseau), chaleur: st.chaleurKwh > 0 ? 100 * st.boisKwh / st.chaleurKwh : 0, elec: pc(st.solaire, st.elecReseau) };
  t.global = (t.alim + t.eau + t.chaleur + t.elec) / 4;
  t.titre = AUTOSUFFISANCE.titres.filter(([m]) => t.global >= m).at(-1)[1];
  return t;
}

// ---------------------------------------------------------------- actions du joueur
// outils : { prendreTemps, payer, msg, debloquer }
const MOIS = (s) => dateDuJour(s.jour).getUTCMonth();
export function especesDuMois(s) { const m = MOIS(s); return Object.entries(CUEILLETTE.especes).filter(([, e]) => e.mois.includes(m)); }
export function cueillettePossible(s) { const A = etatAutonomie(s); return especesDuMois(s).length > 0 && s.jour - A.cueillette.derniere >= CUEILLETTE.intervalle; }
export function achatsSaison(s) { const m = MOIS(s); return Object.entries(ACHATS_SAISON).filter(([, a]) => a.mois.includes(m)); }
const kgTransformable = (A, f) => A.stock.filter(l => l.cat === 'frais' && l[f]).reduce((t, l) => t + l.kg, 0);
export const kgBocaux = (s) => kgTransformable(etatAutonomie(s), 'bocal');
export const kgLacto = (s) => kgTransformable(etatAutonomie(s), 'lacto');

export function actionAutonomie(s, action, v, o) {
  const A = etatAutonomie(s);
  switch (action) {
    case 'semer': return semer(s, Number(v), o);
    case 'pailler': {
      if (s.jour < A.paillageJusqua || chapitreDuJour(s.jour).id === 'hiver') return false;
      if (!o.prendreTemps(s, POTAGER.paillageTemps)) return false;
      const feuilles = chapitreDuJour(s.jour).saison === 'automne';
      if (!feuilles) o.payer(s, POTAGER.paillagePrix, 'nourriture');
      A.paillageJusqua = s.jour + POTAGER.paillageJours;
      o.msg(`🍂 Planches paillées${feuilles ? ' avec les feuilles mortes (gratuit)' : ' (une botte de paille, 5 €)'} : −40 % d'arrosage pendant 4 mois, moins de désherbage.`, 'info');
      o.debloquer('solCouvert'); return true;
    }
    case 'bocaux': {
      const kg = Math.min(CONSERVES.bocaux.kgMax, kgBocaux(s)); if (kg < 1) return false;
      if (!o.prendreTemps(s, CONSERVES.bocaux.temps)) return false;
      const n = Math.ceil(kg / CONSERVES.bocaux.kgParBocal), C = CONSERVES.bocaux;
      prendre(A, 'bocal', kg);
      const elec = C.kwh * PRIX.elecKwh * (s.possede.sterilisateur ? 1 : 1.6);
      o.payer(s, elec, 'elec'); s.factureSemaine += elec; mensualiser(s, elec); s.depenses.eauChaudeEur = s.depenses.eauChaudeEur || 0;
      o.payer(s, n * C.capsule, 'nourriture');
      const risque = makeRng(s.seed * 7 + s.jour * 101)() < (s.possede.sterilisateur ? C.risqueSterilisateur : C.risqueMarmite);
      ajouterLot(A, { cat: 'bocaux', nom: 'Bocaux', kg, valeurKg: C.valeurKg, coutKg: 0, maison: true, risque }, s.jour);
      s.volonte -= C.moral; A.stats.bocaux += n;
      if (s.possede.sterilisateur) s.attribution.sterilisateur = (s.attribution.sterilisateur || 0) + kg * 0.5;
      o.msg(`🫙 ${n} bocaux stérilisés (${num1(kg)} kg) : ils se gardent un an. ${fmt(C.temps)} et un peu de fatigue (−${C.moral} moral).`, 'info');
      o.debloquer('conserver'); return true;
    }
    case 'lacto': {
      if (!s.possede.potLacto) return false;
      const kg = Math.min(CONSERVES.lacto.kgMax, kgLacto(s)); if (kg < 1) return false;
      if (!o.prendreTemps(s, CONSERVES.lacto.temps)) return false;
      const nom = prendre(A, 'lacto', kg);
      o.payer(s, kg * CONSERVES.lacto.sel, 'nourriture');
      ajouterLot(A, { cat: 'lacto', nom: nom === 'Chou' ? 'Chou lactofermenté' : 'Légumes lactofermentés', kg, valeurKg: CONSERVES.lacto.valeurKg, coutKg: 0, maison: true }, s.jour);
      s.attribution.potLacto = (s.attribution.potLacto || 0) + kg * 1.5;
      o.msg(`🥬 ${num1(kg)} kg mis à fermenter : du sel, un poids, aucune énergie. Prêts dans 3 semaines, ils se gardent 6 mois.`, 'info');
      o.debloquer('lacto'); return true;
    }
    case 'acheterSaison': {
      const a = ACHATS_SAISON[v]; if (!a || !achatsSaison(s).some(([k]) => k === v)) return false;
      const prix = a.kg * a.prixKg; if (s.argent < prix || !o.prendreTemps(s, 0.5)) return false;
      o.payer(s, prix, 'nourriture');
      const l = ajouterLot(A, { cat: a.garde, nom: a.nom.replace(/^\d+ kg de /, '').replace(/ \(.*\)/, ''), kg: a.kg, valeurKg: a.valeurKg, coutKg: a.prixKg, maison: false, bocal: !!a.bocal, lacto: !!a.lacto }, s.jour);
      l.fin = l.entre + dureeGarde(s, a.garde);
      o.msg(`🧺 ${a.nom} : ${prix.toFixed(2).replace('.', ',')} € immobilisés dans le garde-manger, à ${a.prixKg.toFixed(2).replace('.', ',')} €/kg au lieu de ~${a.valeurKg.toFixed(2).replace('.', ',')} € en hiver.`, 'info');
      o.debloquer('stockImmobilise'); return true;
    }
    case 'cueillette': {
      if (!cueillettePossible(s) || !o.prendreTemps(s, CUEILLETTE.temps + (A.cueillette.pharmacie ? CUEILLETTE.pharmacieTemps : 0))) return false;
      const r = makeRng(s.seed * 41 + s.jour * 3 + 9);
      A.cueillette.derniere = s.jour; A.cueillette.sorties++;
      let kg = 0, val = 0, intox = null;
      for (const [id, e] of especesDuMois(s)) {
        const k = e.kg * (0.6 + 0.8 * r()); kg += k; val += k * e.prixKg;
        let p = e.risque * (s.possede.guideCueillette ? CUEILLETTE.guide : 1) * (s.principes.includes('cueillette') ? 0.5 : 1) * (id === 'champis' && A.cueillette.pharmacie ? CUEILLETTE.pharmacie : 1);
        if (r() < p) intox = e;
        ajouterLot(A, { cat: id === 'chataignes' ? 'courges' : 'cueillette', nom: e.nom, kg: k, valeurKg: e.prixKg, coutKg: 0, maison: true }, s.jour);
      }
      A.stats.cueilliKg += kg;
      s.bienetre = Math.min(100, s.bienetre + CUEILLETTE.bienetre); s.volonte = Math.min(100, s.volonte + CUEILLETTE.moral);
      if (intox) { const I = CUEILLETTE.intox; s.sante = Math.max(0, s.sante - I.sante); s.volonte -= I.moral; o.payer(s, I.cout, 'imprevus'); A.stats.intox++;
        o.msg(`☠️ Confusion : ce n'était pas ce que tu croyais (${intox.confusion}). Intoxication, urgences. Un guide, et la pharmacie pour les champignons, divisent le risque.`, 'alerte'); o.debloquer('cueillette'); }
      else o.msg(`🧺 Sortie cueillette : ${num1(kg)} kg (${especesDuMois(s).map(([, e]) => e.nom.toLowerCase()).join(', ')}), ~${val.toFixed(0)} € au prix du marché. Grand air : +${CUEILLETTE.bienetre} bien-être.`, 'info');
      if (A.cueillette.sorties >= 3) o.debloquer('cueillette');
      return true;
    }
    case 'declarer': { if (A.poules.declare || !s.possede.poules || !o.prendreTemps(s, POULES.declaration)) return false; A.poules.declare = true; o.msg('📝 Poules déclarées en mairie (Cerfa 15472) : tu seras prévenu en cas d\'influenza aviaire.', 'info'); return true; }
    case 'bois': {
      const sec = v === 'sec', st = 2, prix = st * (sec ? BOIS.prixSec : BOIS.prixVert);
      if (!s.possede.poele || s.argent < prix || !o.prendreTemps(s, 1)) return false;
      o.payer(s, prix, 'bois'); A.bois.push({ st, jour: s.jour, sec, prixSt: prix / st });
      o.msg(`🪵 ${st} stères de bois ${sec ? 'sec, prêt à brûler' : `vert : à faire sécher ${s.possede.abriBois ? '18 mois sous l\'abri' : '2 ans'} avant de le brûler`} (${prix} €).`, 'info');
      if (!sec) o.debloquer('boisSec'); return true;
    }
    case 'ramoner': {
      if (!s.possede.poele || s.argent < BOIS.ramonage || !o.prendreTemps(s, 0.5)) return false;
      o.payer(s, BOIS.ramonage, 'bois'); A.poele.encrassement = 0; A.poele.ramonage = s.jour;
      s.attribution.poele = (s.attribution.poele || 0) - BOIS.ramonage;
      o.msg(`🧹 Ramonage fait (${BOIS.ramonage} €) : attestation à garder 2 ans. Obligatoire au moins une fois par an, l'assurance la demande après un sinistre.`, 'info');
      o.debloquer('ramonage'); return true;
    }
    case 'demanderCEE': {
      if (A.cet.demande !== null || s.possede.cet || !o.prendreTemps(s, 0.5)) return false;
      A.cet.demande = s.jour;
      o.msg('📨 Demande de prime CEE enregistrée avant tout devis signé. Tu peux maintenant faire poser le ballon par un artisan RGE.', 'info');
      return true;
    }
  }
  return false;
}
const fmt = (h) => `${Math.floor(h)} h${h % 1 ? String(Math.round(h % 1 * 60)).padStart(2, '0') : ''}`;
function prendre(A, f, kg) {
  let reste = kg, nom = null;
  for (const l of A.stock.filter(x => x.cat === 'frais' && x[f]).sort((a, b) => a.fin - b.fin)) { const k = Math.min(l.kg, reste); l.kg -= k; reste -= k; nom ||= l.nom; if (reste <= 0) break; }
  A.stock = A.stock.filter(l => l.kg > 0.01);
  return nom;
}
export function partirEnVacances(s, jours) { etatAutonomie(s).absentJusqua = s.jour + jours; }
// estimation pour le calendrier du tableau de bord
export function calendrier(s) {
  const A = etatAutonomie(s), d = doy(s.jour), n = nbPlanches(s), out = { semer: [], recolte: [], cueillette: especesDuMois(s).map(([, e]) => e.nom) };
  for (let i = 0; i < n; i++) {
    const p = A.planches[i], C = CULTURES[p.culture];
    if (C && p.etat === 'libre' && dansFenetre(C, d) && (p.anFin ?? -1) !== anneeDuJour(s.jour) + p.culture) out.semer.push(`${C.nom.toLowerCase()} (planche ${i + 1})`);
    if (C && p.etat === 'recolte') out.recolte.push(C.nom.toLowerCase());
  }
  for (const [k, C] of Object.entries(CULTURES)) if (n && d + 7 >= C.semis[0] && d < C.semis[0] && !A.planches.slice(0, n).some(p => p.culture === k)) out.bientot = (out.bientot || []).concat(C.nom.toLowerCase());
  return out;
}
