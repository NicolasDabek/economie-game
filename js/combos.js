// Stocker le surplus solaire en chaleur, et détecter les combos de techniques (v0.4)
import { STOCKAGE, COMBOS, TARIFS } from './data.js';
import { hasCheminee, typePuits, jourLourd } from './passif.js';

const K = 1.163 / 1000;   // kWh par litre et par kelvin
// loi de Newton : température après t heures
export const newton = (t0, tAmb, tau, t) => tAmb + (t0 - tAmb) * Math.exp(-t / tau);

export function contenantPossible(s, id) { const c = STOCKAGE.contenants[id]; return !c.requiert || s.possede[c.requiert]; }

export function stockerSurplus(s, surplusH, jourElec, ctx, faits, chap) {
  const y = (s.sys.stockage ||= { actif: false, contenant: 'torchon' });
  const tf = chap.tEauFroide, tAmb = s.pieces.cuisine.t;
  const p = (h) => TARIFS[s.sys.tarif].prix(h, ctx.jm.tempo || 'bleu');
  const res = { solaire: 0, reseau: 0, evite: 0, routed: 0, perdu: 0, eurEvites: 0, kwhEvites: 0, t19: null, t22: null, bouillotteSolaire: false, contenant: null };
  const reste = [...surplusH];
  if (y.actif && contenantPossible(s, y.contenant)) {
    const c = STOCKAGE.contenants[y.contenant];
    const E = c.litres * K * (STOCKAGE.tChauffe - tf);
    // le bidon de 10 L chauffe lentement (thermoplongeur 300 W de 11 h à 15 h), les petits volumes à la bouilloire (2 000 W, à midi)
    let sol = 0;
    if (y.contenant === 'caisse') { for (let h = 11; h < 15; h++) { const u = Math.min(reste[h], 300) / 1000; sol += u; reste[h] -= u * 1000; } sol = Math.min(sol, E); }
    else { sol = Math.min(E, E * Math.min(1, reste[13] / 2000)); reste[13] = Math.max(0, reste[13] - sol * 1000); }
    const grid = y.contenant === 'caisse' ? 0 : E - sol;   // le thermoplongeur n'est branché que sur le surplus
    const litres = y.contenant === 'caisse' ? c.litres * sol / Math.max(1e-6, E) : c.litres;
    res.solaire = sol; res.reseau = grid; res.contenant = y.contenant;
    const t19 = newton(STOCKAGE.tChauffe, tAmb, c.tau, 19 - 13), t22 = newton(STOCKAGE.tChauffe, tAmb, c.tau, 22 - 13);
    res.t19 = t19; res.t22 = t22;
    // usages : thé et cuisson + vaisselle à 19 h (préchauffage), puis bouillotte à 22 h si l'eau est encore chaude (≥ 50 °C)
    let dispo = litres * K * Math.max(0, t19 - tf);
    const besoin19 = STOCKAGE.usages.the + (s.sys.vaisselle === 'bassine' || y.contenant === 'caisse' ? STOCKAGE.usages.vaisselle : 0);
    let evite = 0;
    const bouillotte = faits.bouillotte && t22 >= 50 && litres >= 1;
    if (bouillotte) { evite += STOCKAGE.usages.bouillotte; dispo -= litres * K * (t19 - t22) + Math.min(dispo, STOCKAGE.usages.bouillotte); }
    evite += Math.min(Math.max(0, dispo), besoin19);
    res.evite = evite;
    res.bouillotteSolaire = bouillotte && sol >= 0.5 * E;
    res.eurEvites += evite * p(20) - grid * p(13);
    res.kwhEvites += evite - grid;
    const id = y.contenant === 'caisse' ? 'caisse' : y.contenant === 'thermos' ? 'thermos' : null;
    if (id) s.attribution[id] = (s.attribution[id] || 0) + evite * p(20) - grid * p(13);
    if (sol > 0.05) ctx.debloquer('stockageChaleur');
  }
  // routeur : le surplus restant chauffe le ballon
  const surplusReste = reste.reduce((a, b) => a + Math.max(0, b), 0) / 1000;
  if (s.possede.routeur && s.possede.solaire) {
    const ballonReseau = (ctx.kwh.ballon || 0) * (s.sys.ballon.mode === 'midi' ? 0.5 : 0.95);
    const routed = Math.min(surplusReste, ballonReseau);
    const perte = s.possede.jaquette ? 0.05 : 0.15;     // ballon chaud plus longtemps : pertes supplémentaires
    const hB = s.sys.ballon.mode === 'hc' ? 2 : s.sys.ballon.mode === 'midi' ? 13 : 20;
    const gain = routed * (1 - perte) * p(hB);
    res.routed = routed; res.eurEvites += gain; res.kwhEvites += routed * (1 - perte);
    s.attribution.routeur = (s.attribution.routeur || 0) + gain;
    if (routed > 0.05) ctx.debloquer('routeur');
    res.perdu = surplusReste - routed;
  } else res.perdu = surplusReste;
  if (res.perdu > 0.3) ctx.debloquer('batterie');
  return res;
}

export function detecterCombos(s, { faits, chap, st, ctx }) {
  s.combos ||= {};
  const t = s.transport, y = s.sys, hiver = chap.id === 'hiver', ete = chap.id === 'ete';
  const bureau = s.jour % 7 < 5 - (t?.teletravail ?? 5);
  const actifs = {
    soleilBouillotte: st.bouillotteSolaire && ['housse', 'thermos', 'caisse'].includes(st.contenant),
    ballonBatterie: st.routed > 0.2 && s.possede.jaquette,
    fresnelPierre: hiver && s.possede.fresnel && s.possede.pierre && (ctx.kwh.cuissonSolaire || 0) > 0,
    cuissonChaleur: hiver && faits.cuisson,
    eauJardinCompost: faits.recupEau && s.possede.potager && s.possede.composteur && (ctx.recolte || 0) > 0,
    batchGamelle: y.regime === 'batch' && s.possede.boites && t?.repas === 'emporte' && bureau,
    veloSport: (t?.mode === 'velo' || t?.mode === 'vae') && !y.abonnements.sport.actif && bureau,
    heuresCreuses: y.tarif === 'hphc' && y.ballon.mode === 'hc' && (y.vaisselleHC || ctx.lessive?.hc),
    nuitsFraiches: ete && faits.voletsJour && faits.ventNuit,
    climTerre: ete && !!s.passif?.j && s.passif.j.heuresCombo >= 4,
    respirationHiver: hiver && !!s.passif?.j && s.passif.j.heuresTube > 0 && s.passif.mode === 'trombe' && (s.passif.clapetNuit === 'ferme' || s.possede.chemineePro) && hasCheminee(s),
    purgeNocturne: ete && hasCheminee(s) && ['purge', 'purgeNuit'].includes(s.passif?.mode) && faits.voletsJour && faits.ventNuit,
    sechoirTirage: hasCheminee(s) && s.passif?.mode !== 'ferme' && !!ctx.lessive && !ctx.lessive.laverie && ctx.lessive.sechage !== 'machine',
    caveNaturelle: !!typePuits(s) && s.passif?.cave && (s.possede.potager || s.possede.boites),
    serreHumide: !!s.passif?.j && s.passif.j.heuresTube > 0 && jourLourd(ctx.jm, chap) && s.passif.debit !== 'reduit' && !(s.passif.debit === 'hygro' && s.possede.hygrometre) && s.passif.j.hrMax > 75,
    lessiveSoleil: !!(ctx.lessive?.midi && ctx.lessive?.sechage === 'dehors' && s.possede.solaire && !hiver),
  };
  let n = 0;
  for (const [id, on] of Object.entries(actifs)) {
    if (!on) continue;
    const c = s.combos[id] ||= { jour: s.jour, fois: 0 };
    c.fois++;
    if (COMBOS[id].anti) {   // piège : pas de bonus, une leçon
      s.volonte -= 1; s.passif.serreJours++;
      if (c.fois === 1) { ctx.msg(`${COMBOS[id].nom} : ${COMBOS[id].texte} Réduis le débit les jours lourds.`, 'alerte'); ctx.debloquer(COMBOS[id].principe); }
      continue;
    }
    n++;
    if (id === 'caveNaturelle') { const g = ctx.couts.nourriture * 0.03; ctx.couts.nourriture -= g; const p = typePuits(s); s.attribution[p] = (s.attribution[p] || 0) + g; }
    if (id === 'climTerre' && ctx.jm.canicule) ctx.d.bienetre += 1;
    if (c.fois === 1) {
      s.volonte = Math.min(100, s.volonte + 3); s.bienetre = Math.min(100, s.bienetre + 2);
      ctx.msg(`🔗 Combo découvert : ${COMBOS[id].nom}. ${COMBOS[id].texte} (+3 moral)`, 'decouverte');
      ctx.debloquer('combo'); ctx.debloquer(COMBOS[id].principe);
    }
  }
  s.volonte = Math.min(100, s.volonte + Math.min(0.2, 0.05 * n));   // la satisfaction d'un système qui tourne
  return n;
}
