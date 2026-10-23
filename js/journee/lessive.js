// Étape du jour : lessive (machine, laverie, séchage)
import { PRIX, LESSIVE, SC } from '../data.js';
import { debloquer, linge, msg, payer, remplissage, eur } from '../simulation.js';

export function lessiveDuJour(s, v) {
  const { ctx, hiver } = v;
  // --- lessive du jour ---
  const L = s.lessivePrevue;
  let sechageInterieur = false;
  ctx.lessive = L;
  if (L) {
    const sale = linge(s);
    const rempli = remplissage(s);
    s.lessives++; s.sommeRemplissage += Math.min(1, rempli);
    if (L.laverie) {
      payer(s, (SC.linge || 1) * (PRIX.laverieLavage + PRIX.laverieSechage), 'laverie');
      s.depenses.linge += (SC.linge || 1) * (PRIX.laverieLavage + PRIX.laverieSechage);
      msg(s, `🧺 Laverie : ${eur(PRIX.laverieLavage + PRIX.laverieSechage)} et 1 h 30.`, 'info');
    } else {
      const dehors = L.sechage === 'dehors' && s.possede.corde && !hiver;
      if (dehors) debloquer(s, 'airLibre');
      if (L.temp === 30 && ++s.l30 >= 5) debloquer(s, 'trenteDegres');
      const kL = SC.linge || 1;   // v1.3 : une famille lave deux fois plus de linge (une « lessive » = kL machines)
      const kwh = (LESSIVE.kwh[L.temp] + (L.sechage === 'machine' ? LESSIVE.secheLingeKwh : 0)) * kL;
      const heures = L.hc ? [22, 23, 0] : L.midi ? [12, 13, 14] : [19, 20, 21];
      let reste = kwh * 1000; for (const h of heures) { const x = Math.min(2200 * kL, reste); ctx.elecH[h] += x; reste -= x; }
      ctx.kwh.lessive = kwh;
      ctx.couts.eau += kL * LESSIVE.litres / 1000 * PRIX.eauM3;
      payer(s, kL * PRIX.doseLessive, 'produits');
      s.depenses.linge += kL * (PRIX.doseLessive + LESSIVE.litres / 1000 * PRIX.eauM3) + kwh * PRIX.elecKwh;
      s.machine.usure += LESSIVE.usureMachine * (L.temp === 60 ? 1.3 : 1);
      sechageInterieur = L.sechage === 'air' || (L.sechage === 'dehors' && !dehors);
      if (L.temp <= 30 && rempli >= 0.75) debloquer(s, 'volume');
      if ((L.midi && s.possede.solaire) || L.hc) debloquer(s, 'decaler');
    }
    for (const id of sale) {
      const v = s.vetements[id];
      v.salete = 0;
      v.usure += L.laverie ? 3 : LESSIVE.usureVet[L.temp] + (L.sechage === 'machine' ? LESSIVE.usureSecheLinge : 0);
    }
    if (rempli < 0.5) msg(s, `🧺 Machine remplie à ${Math.round(rempli * 100)} % seulement : même coût pour moitié moins de linge.`, 'alerte');
    s.volonte -= LESSIVE.volonte;
    s.lessivePrevue = null;
    if (!L.laverie && s.machine.usure >= 100) { s.machine.enPanne = true; msg(s, '💥 Le lave-linge est en panne ! Laverie ou réparation (onglet Linge).', 'alerte'); }
  }
  return sechageInterieur;
}
