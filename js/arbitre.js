// v0.9.1 : arbitre des recommandations.
// Chaque action candidate est jouée à blanc sur une copie de la partie pendant HORIZON jours et comparée
// à « ne rien faire » : argent (annualisé) + pénalités de jauges sous leur seuil, valorisées en euros
// (mêmes seuils que l'écran de fin). On en déduit :
//  - les leviers touchés (réglage, abonnement, vêtement porté…) et le sens du changement ;
//  - les conflits : deux conseils sur le même levier → on garde le mieux évalué ;
//  - la protection des jauges : pas d'économie qui enfonce une jauge dans un mauvais palier ;
//  - l'hystérésis : pas de retour en arrière sur un levier changé il y a moins de DELAI jours,
//    sauf urgence (jauge critique que l'action remonte) ; conseils ignorés masqués IGNORE jours.
import { jourSuivant, choixDilemme, resoudreDilemme } from './simulation.js';
import { valeurs } from './finance.js';
import { ACHATS } from './data.js';

export const HORIZON = 30, DELAI = 21, IGNORE = 30;
// seuils de l'écran de fin (scoreFinal : « équilibre ») et valeur d'un point-jour sous le seuil
export const SEUILS = { volonte: 40, bienetre: 55, hygiene: 60, sante: 70, confort: 70 };
export const EUR_POINT_JOUR = 1.5;
// paliers qu'une économie ne doit jamais entamer
export const PROTEGE = { volonte: 40, bienetre: 50, hygiene: 50, sante: 60 };
const NOM_JAUGE = { volonte: 'moral', bienetre: 'bien-être', hygiene: 'hygiène', sante: 'santé', confort: 'confort' };

// ---------------------------------------------------------------- leviers
function aplatir(o, pre, out, prof) {
  if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o)) {
    if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) out[pre + k] = v;
    else if (!Array.isArray(v) && typeof v === 'object' && prof < 3) aplatir(v, pre + k + '.', out, prof + 1);
  }
  return out;
}
export function leviers(s) {
  const o = {};
  aplatir({ sys: s.sys, central: s.central, auto: s.auto, transport: s.transport, rideaux: s.rideaux, aeration: s.aeration, utiliserBouillotte: s.utiliserBouillotte }, '', o, 0);
  for (const [k, v] of Object.entries(s.vetements || {})) o['porte.' + k] = !!v.porte;
  for (const [k, p] of Object.entries(s.pieces || {})) { o['piece.' + k + '.jour'] = p.consigneJour; o['piece.' + k + '.nuit'] = p.consigneNuit; }
  for (const [k, v] of Object.entries(s.possede || {})) o['possede.' + k] = !!v;
  return o;
}
export function difference(a, b) { const d = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) d[k] = [a[k], b[k]]; return d; }

/** Mémorise les changements de leviers (joueur ou conseil) pour l'hystérésis. */
export function majLeviers(s) {
  const R = (s.reco ??= { snap: null, chg: {}, ignores: {} });
  const cur = leviers(s);
  if (R.snap) for (const [k, [de, a]] of Object.entries(difference(R.snap, cur))) {
    if (k.startsWith('possede.')) continue;
    (R.chg[k] ??= []).push({ jour: s.jour, de, a });
    R.chg[k] = R.chg[k].filter(e => e.jour >= s.jour - 60);
  }
  R.snap = cur;
  return R;
}

// ---------------------------------------------------------------- simulation à blanc
export function cloner(s) { const { meteo, messages, ...r } = s; return { ...structuredClone(r), meteo, messages: [] }; }
const patrimoine = (t) => t.argent + (t.fin ? valeurs(t).total : 0) + (t.depenses.equipement || 0) + (t.depenses.vetements || 0);
function derouler(t, H) {
  const p0 = patrimoine(t), m = { volonte: 0, bienetre: 0, hygiene: 0, sante: 0, confort: 0 };
  let pen = 0, n = 0;
  for (let i = 0; i < H && !t.fini; i++) {
    if (t.dilemme) { const o = choixDilemme(t).filter(o => o.possible !== false); if (o.length) resoudreDilemme(t, o.at(-1).id); else t.dilemme = null; }
    jourSuivant(t); n++;
    for (const g in m) { const v = g === 'volonte' ? t.volonte : t[g]; m[g] += v; pen += Math.max(0, SEUILS[g] - v) * EUR_POINT_JOUR; }
  }
  for (const g in m) m[g] /= Math.max(1, n);
  return { argent: patrimoine(t) - p0, pen, moy: m, n: Math.max(1, n) };
}
/** Coût d'investissement amorti sur l'horizon (achat d'équipement ou de vêtements). */
function amorti(s, t, H) {
  let x = 0;
  for (const [id, v] of Object.entries(t.possede)) if (v && !s.possede[id] && ACHATS[id]) x += ACHATS[id].prix / Math.min(2, Math.max(1, ACHATS[id].vie || 5)) / 365 * H   /* le conseiller ne voit pas plus loin que 2 ans */;
  x += ((t.depenses.vetements || 0) - (s.depenses.vetements || 0)) / 365 * H;
  return x;
}

let cache = { cle: null, base: null, res: new Map() };
export function evaluer(s, action, appliquer, H = HORIZON) {
  const cle = `${H}|${s.seed}|${s.jour}|${Math.round(s.argent)}|${JSON.stringify(s.reco?.snap ?? '')}`;
  if (cache.cle !== cle) cache = { cle, base: derouler(cloner(s), H), res: new Map() };
  const ka = JSON.stringify(action);
  if (cache.res.has(ka)) return cache.res.get(ka);
  const t = cloner(s); let ok = null;
  try { ok = appliquer(t, action); } catch { ok = null; }
  let r = null;
  if (ok) {
    const dl = difference(leviers(s), leviers(t)), avant = { invest: amorti(s, t, H) };
    const x = derouler(t, H), b = cache.base;
    const eurAn = (x.argent - b.argent - avant.invest) * 365 / H, penAn = (x.pen - b.pen) * 365 / H;
    r = { valeur: eurAn - penAn, eurAn, penAn, leviers: dl, moy: x.moy, base: b.moy };
  }
  cache.res.set(ka, r);
  return r;
}

// ---------------------------------------------------------------- arbitrage
/** Une économie qui enfonce une jauge sous son palier protégé ? Renvoie le nom de la jauge, sinon null. */
export function jaugeMenacee(ev, s = null) {
  for (const [g, seuil] of Object.entries(PROTEGE)) {
    const a = ev.moy[g], b = ev.base[g], now = s ? (g === 'volonte' ? s.volonte : s[g]) : 100;
    if (a < seuil && a < b - 0.5) return NOM_JAUGE[g];
    // jauge déjà basse aujourd'hui : aucune action qui la ralentit à remonter
    if (now < seuil && a < b - 0.3) return NOM_JAUGE[g];
  }
  return null;
}
const urgence = (s, ev) => Object.keys(PROTEGE).some(g => (g === 'volonte' ? s.volonte : s[g]) < 25 && ev.moy[g] > ev.base[g] + 1);
/** Ce conseil défait-il un changement récent du même levier ? */
export function retourArriere(s, ev) {
  const R = s.reco; if (!R) return null;
  for (const [k, [, nv]] of Object.entries(ev.leviers)) {
    const e = (R.chg[k] || []).find(e => e.jour >= s.jour - DELAI && e.de === nv);
    if (e) return k;
  }
  return null;
}
export const cleConseil = (x) => JSON.stringify(x.action || x.titre);
export function ignorer(s, x) { majLeviers(s).ignores[cleConseil(x)] = s.jour; }

/**
 * Évalue, filtre et classe les candidats. Chaque candidat : { titre, action, urgent?, an? }.
 * Renvoie les candidats retenus, triés par valeur décroissante, avec x.eval.
 */
export function arbitrer(s, L, appliquer, H = HORIZON) {
  const R = majLeviers(s);
  const garde = [];
  for (const x of L) {
    if ((R.ignores[cleConseil(x)] ?? -1e9) > s.jour - IGNORE) continue;
    if (!x.action) { garde.push({ ...x, eval: { valeur: x.an || 0, leviers: {} } }); continue; }
    const ev = evaluer(s, x.action, appliquer, H);
    if (!ev) continue;                                     // sans effet possible
    if (!urgence(s, ev) && (jaugeMenacee(ev, s) || retourArriere(s, ev))) continue;
    if (ev.valeur <= 0 && !x.urgent) continue;             // ne rapporte rien, tout compris
    garde.push({ ...x, eval: ev });
  }
  garde.sort((a, b) => b.eval.valeur - a.eval.valeur);
  // conflits : un seul conseil par levier (le mieux évalué, donc le premier rencontré)
  const pris = new Set(), out = [];
  for (const x of garde) {
    const ks = Object.keys(x.eval.leviers);
    if (ks.some(k => pris.has(k))) continue;
    ks.forEach(k => pris.add(k)); out.push(x);
  }
  return out;
}
