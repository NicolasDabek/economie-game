// Étape du jour : vêtements, humidité et jauges (confort, hygiène, bien-être, santé, moral)
import { VETEMENTS } from '../data.js';
import { chapitreDuJour } from '../meteo.js';
import { suivreROI } from '../roi.js';
import { nouvelEtatMoral, moralJour, santeJour, paliersJour } from '../moral.js';
import { palierBE, EFFETS_PALIERS as EP } from '../paliers.js';
import { coutBaseVariable, coutVariable, debloquer, msg, payer, tempsLibre, vetementsPortes, eur } from '../simulation.js';

export function jaugesDuJour(s, v) {
  const { ctx, hiver, ete, faits, invites, deprime, coutVolonte, sommeC, nC, froid, chaud, humMax, sommeil, nS } = v;
  // --- vêtements ---
  let sale = false, devenuSale = false;
  const protege = vetementsPortes(s).some(id => VETEMENTS[id].protege);
  for (const id of vetementsPortes(s)) {
    const V = VETEMENTS[id], v = s.vetements[id];
    const avant = v.salete;
    v.salete = Math.min(130, v.salete + V.sal * (protege && !V.peau ? 0.4 : 1) * (ete ? 1.4 : 1));
    if (avant < 100 && v.salete >= 100) devenuSale = true;
    v.usure += V[v.qualite].usure; v.joursPortes++;
    if (v.salete >= 100) sale = true;
  }
  for (const [id, v] of Object.entries(s.vetements)) {
    v.aere = false;
    if (v.possede && v.usure >= 100) {
      const V = VETEMENTS[id];
      msg(s, `🧵 ${V.nom} usé jusqu'à la corde (coût par usage : ${eur(v.joursPortes ? v.prixPaye / v.joursPortes : 0)}/jour).`, 'alerte');
      if (V.depart) { Object.assign(v, { usure: 0, salete: 0, joursPortes: 0, prixPaye: 5 }); payer(s, 5, 'vetements'); msg(s, 'Nouveau t-shirt : −5 €.', 'achat'); }
      else { v.possede = false; v.porte = false; }
    }
  }
  if (sale) debloquer(s, 'sale');
  if (devenuSale) msg(s, '🧺 Des vêtements sont sales : ils isolent moins, l\'hygiène et la santé en pâtissent.', 'alerte');

  // --- humidité, moisissures ---
  if (humMax > 75) {
    s.moisissure++;
    if (s.moisissure === 3) msg(s, s.possede.hygrometre ? `💧 Humidité à ${Math.round(humMax)} % : moisissures en vue. Aère brièvement !` : '💧 De la buée ruisselle sur les vitres et une odeur de moisi apparaît…', 'alerte');
  } else s.moisissure = Math.max(0, s.moisissure - 1);
  if (s.aeration === 'breve' && faits.aerer) debloquer(s, 'aeration');

  // --- jauges ---
  const confortJour = Math.max(0, sommeC / nC + ctx.d.confort);
  s.confort = s.confort * 0.6 + confortJour * 0.4;
  // hygiène : corps (douche), vêtements, cuisine, moisissures
  let dHyg = ctx.d.hygiene;
  if (sale) dHyg -= 3.5;
  if (s.moisissure >= 3) dHyg -= 1.5;
  s.hygiene = Math.max(0, Math.min(100, s.hygiene + dHyg));
  // bien-être : plaisirs, repos, alimentation, social, lumière, sommeil
  const libre = Math.max(0, tempsLibre(s));
  const sommeilScore = nS ? sommeil / nS : 70;
  const pbe = palierBE(s.bienetre).id;
  let dBE = ctx.d.bienetre + Math.min(1.5, libre * 0.3) * (EP.libreBE[pbe] ?? 1) - 2.5;
  if (sommeilScore < 60) dBE -= 1.5; else if (sommeilScore > 85) dBE += 0.5;
  if (s.rideaux === 'fermes') dBE -= 1;                 // vivre dans le noir
  if (s.hygiene < 30) dBE -= 1.5;                       // gêne sociale
  if (invites) dBE += s.invites.mode === 'pull' ? -1 : 2;
  if (faits.ventNuit && !s.possede.moustiquaire) dBE -= 1; // moustiques
  s.bienetre = Math.max(0, Math.min(100, s.bienetre + dBE - 0.08 * (s.bienetre - 55)));
  // santé
  let dSante = froid > 0 ? -0.3 * froid : 1.0;
  dSante -= Math.min(4, 0.05 * chaud);
  if (sale) dSante -= 1;
  if (s.moisissure >= 3) dSante -= 1;
  if (s.hygiene < 35) dSante -= 0.8;
  if (s.bienetre < 25) dSante -= 0.4;
  dSante += ctx.d.sante + (EP.santeBE[pbe] || 0) - (deprime ? EP.santeDeprime : 0);   // paliers (v0.8.1)
  s.sante = Math.max(0, Math.min(100, s.sante + dSante));
  // santé (v0.7) : consultations, arrêts maladie avec carence, dents, moisissures
  if (!s.mor) s.mor = nouvelEtatMoral();
  const outilsM = { payer, msg: (x, ty) => msg(s, x, ty), salaireJour: (s.eco ? s.eco.salaire * s.mor.facteurSalaire : 2200) / 30 };
  santeJour(s, outilsM);
  paliersJour(s, outilsM);
  // moral (v0.7) : tend vers une ligne de base (bien-être, santé, lumière, social, nouveauté, vacances, stress), usé par les nouveaux gestes
  const cbv = coutBaseVariable(s);
  moralJour(s, { ...outilsM, confortJour, coutVolonte, doy: chapitreDuJour(s.jour).doy, pctEco: cbv > 100 ? (cbv - coutVariable(s)) / cbv : 0 });
  // paliers d'économies : la satisfaction de voir le compteur grimper
  const ecoNow = coutBaseVariable(s) - coutVariable(s);
  // v1.1 (analyse GD, P4) : +3 tous les 250 € jusqu'à 2 000 €, puis +1 tous les 1 000 € (la fierté s'émousse)
  const palier = ecoNow < 2000 ? Math.floor(ecoNow / 250) : 8 + Math.floor((ecoNow - 2000) / 1000);
  if (palier > (s.palier || 0)) { const montant = palier <= 8 ? palier * 250 : 2000 + (palier - 8) * 1000, bonus = palier <= 8 ? 3 : 1;
    s.palier = palier; s.volonte = Math.min(100, s.volonte + bonus); msg(s, `🎯 Palier atteint : ${montant.toLocaleString('fr-FR')} € économisés par rapport au voisin. Fierté (+${bonus} moral) !`, 'habitude'); debloquer(s, 'progres'); }
  suivreROI(s);
  if (sommeilScore > 85 && hiver && (s.possede.robinets ? s.pieces.chambre.consigneNuit : s.central.consigneNuit) <= 17) debloquer(s, 'sommeilFrais');
  if (globalThis.TRACE) globalThis.TRACE(s, { froid, chaud, confortJour, sommeilScore, dSante, sale, dctx: ctx.d.sante, pbe });
  const sm = s.sommes;
  sm.confort += confortJour; sm.sante += s.sante; sm.volonte += s.volonte; sm.hygiene += s.hygiene; sm.bienetre += s.bienetre;
  return confortJour;
}
