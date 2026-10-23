// Étape du jour : moral, rechute, gestes faits et apprentissage des habitudes
import { JOURS_HABITUDE, GESTES } from '../data.js';
import { coutRechute } from '../moral.js';
import { palierMoral, EFFETS_PALIERS as EP } from '../paliers.js';
import { makeRng } from '../rng.js';
import { debloquer, gestesActifs, msg, oublierGestes, payer } from '../simulation.js';

export function gestesDuJour(s, v) {
  
  // --- moral et rechute ---
  let rechute = false;
  if (s.volonte <= 0) {
    rechute = true; s.rechutes++;
    const binge = coutRechute(s); payer(s, binge, 'imprevus'); s.volonte = 30; s.bienetre = Math.min(100, s.bienetre + 4);
    msg(s, `😩 Plus de moral : rechute ! Livraisons, achats pour se consoler (−${binge} €), fenêtre entrouverte et aucun nouveau geste aujourd'hui.`, 'alerte');
  }
  const actifs = gestesActifs(s);
  const faits = {};
  const pm = palierMoral(s.volonte).id, deprime = pm === 'deprime' || pm === 'crise';
  const rP = makeRng(s.seed * 211 + s.jour * 37 + 5);
  // déprime (v0.8.1) : les gestes pas encore automatiques sautent souvent
  for (const [g, on] of Object.entries(actifs)) faits[g] = on && (!rechute || s.gestes[g].habitude) && (!deprime || s.gestes[g].habitude || rP() >= EP.sauteGeste);
  // apprentissage : les deux gestes les plus durs coûtent plein tarif, les suivants moins (on les enchaîne)
  const enCours = [];
  for (const [g, fait] of Object.entries(faits)) {
    if (!fait) continue;
    const st = s.gestes[g];
    if (st.habitude) continue;
    if (deprime) continue;   // en déprime, on fait le geste machinalement mais on ne construit rien de neuf
    enCours.push(GESTES[g].cout); st.pratique++;
    if (st.pratique >= JOURS_HABITUDE) { st.habitude = true; msg(s, `✅ « ${GESTES[g].nom} » est devenu une habitude : plus d'effort, moitié moins de temps.`, 'habitude'); debloquer(s, 'habitude'); s.volonte += 2; }
  }
  oublierGestes(s, actifs);
  const POIDS = [1, 1, 0.7, 0.5];
  const coutVolonte = enCours.sort((a, b) => b - a).reduce((t, c, i) => t + c * (POIDS[i] ?? 0.4), 0) * (EP.coutVolonte[pm] ?? 1);
  if (enCours.length >= 4) debloquer(s, 'unAlaFois');
  return { rechute, faits, deprime, coutVolonte };
}
