// Étape du jour : consommation payée (factures, abonnements, mensualités)
import { PRIX, INDICES, RENDEMENT_CHAUDIERE, TARIFS, SC } from '../data.js';
import { mensualiser } from '../annee.js';
import { debloquer, payer, prixGaz } from '../simulation.js';

export function facturesDuJour(s, v) {
  const { ctx, jm, jour, gazKwh, chauffElecEur, chauffElecKwh, elecEur, elecKwh, elecChauffage, attrJour } = v;
  // --- factures du jour ---
  payer(s, gazKwh * prixGaz(s) + chauffElecEur, 'gaz');   // poste « chauffage » (gaz ou convecteurs)
  s.depenses.chauffElecKwh = (s.depenses.chauffElecKwh || 0) + chauffElecKwh;
  payer(s, elecEur, 'elec');
  payer(s, ctx.couts.eau, 'eau');
  payer(s, ctx.couts.nourriture * INDICES.alim, 'nourriture');
  payer(s, ctx.couts.services * INDICES.services * (s.eco?.remise ?? 1), 'services');
  payer(s, ctx.couts.plaisirs * INDICES.general, 'plaisirs');
  payer(s, ctx.couts.transport * INDICES.carburant, 'transport');
  payer(s, ctx.couts.imprevus, 'imprevus');
  const aboJour = ((TARIFS[s.sys.tarif].aboMois + (SC.aboElecPlus || 0) * INDICES.elec) * 12 + (elecChauffage ? 0 : PRIX.aboGazAn)) / 365;
  payer(s, aboJour, 'abonnements');
  s.depenses.eauChaudeEur = (s.depenses.eauChaudeEur || 0) + (ctx.kwh.ballon || 0) * (elecKwh > 0 ? elecEur / elecKwh : PRIX.elecKwh);
  const coutJour = gazKwh * prixGaz(s) + chauffElecEur + elecEur + aboJour + ctx.couts.eau;
  s.factureSemaine += coutJour;
  jour.elecKwh = elecKwh; jour.elecEur = elecEur;
  const eurGazUtile = elecChauffage ? (chauffElecKwh > 0 ? chauffElecEur / chauffElecKwh : PRIX.elecKwh) : prixGaz(s) / RENDEMENT_CHAUDIERE;
  for (const a of Object.keys(attrJour)) s.attribution[a] += attrJour[a] * eurGazUtile;
  if (s.possede.purge) s.attribution.purge += gazKwh * prixGaz(s) * 0.08;
  else if (gazKwh > 0) { const surcout = gazKwh * prixGaz(s) * 0.08; payer(s, surcout, 'gaz'); s.factureSemaine += surcout; mensualiser(s, surcout); }
  mensualiser(s, gazKwh * prixGaz(s) + chauffElecEur + elecEur + aboJour);   // v0.6 : l'énergie se paie par mensualités, régularisées en juin
  if (jm.tempo === 'rouge' && s.sys.tarif === 'tempo') {
    const hpRouge = jour.heures.filter(x => x.prix > 0.5).length;
    if (hpRouge) debloquer(s, 'tempo');
  }
  return { aboJour, coutJour };
}
