// Étape du jour : dépenses du voisin
import { PRIX, INDICES, LESSIVE, SC } from '../data.js';
import { voisinJour } from '../systemes.js';
import { voisinTransport } from '../transport.js';
import { linge, prixGaz } from '../simulation.js';

export function voisinDuJour(s, v) {
  const { jm, chap, gazBase, radBaseKwh, climBase, aboJour } = v;
  // --- voisin ---
  const vz = voisinJour(s, jm, chap);
  s.base.gaz += gazBase * prixGaz(s) + radBaseKwh * PRIX.elecKwh;
  s.base.elec += vz.elec + climBase * PRIX.elecKwh;
  s.base.clim = (s.base.clim || 0) + climBase * PRIX.elecKwh;
  s.base.eauChaude = (s.base.eauChaude || 0) + vz.eauChaude;
  s.base.eau += vz.eau;
  s.base.nourriture = (s.base.nourriture || 0) + vz.nourriture * 1.06 * INDICES.alim;   // courses 4 fois par semaine : achats d'impulsion
  s.base.services = (s.base.services || 0) + vz.services * INDICES.services;
  s.base.plaisirs = (s.base.plaisirs || 0) + vz.plaisirs * INDICES.general;
  s.base.transport = (s.base.transport || 0) + voisinTransport(s) * INDICES.carburant;
  s.base.abonnements += aboJour;
  if (s.jour % 3 === 2) {
    const kL = SC.linge || 1;
    const l = kL * ((LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh + LESSIVE.litres / 1000 * PRIX.eauM3 + PRIX.doseLessive);
    s.base.elec += kL * (LESSIVE.kwh[40] + LESSIVE.secheLingeKwh) * PRIX.elecKwh;
    s.base.eau += kL * LESSIVE.litres / 1000 * PRIX.eauM3; s.base.produits += kL * PRIX.doseLessive;
    s.base.linge = (s.base.linge || 0) + l;
  }
  return undefined;
}
