// Étape du jour : découvertes de principes
import { debloquer, isolationVetements } from '../simulation.js';

export function decouvertesDuJour(s, v) {
  const { jm, hiver, ete, faits, jour, confortJour } = v;
  // --- découvertes ---
  const ref = s.possede.robinets ? s.pieces.salon : s.central;
  if (hiver) {
    if (ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'ecart');
    if (s.jour >= 3 && ref.consigneJour - ref.consigneNuit >= 3) debloquer(s, 'masse');
    if (isolationVetements(s) >= 2.5 && ref.consigneJour <= 19 && confortJour > 70) debloquer(s, 'gens');
    if (faits.portes && s.possede.robinets && Math.min(s.pieces.cuisine.consigneJour, s.pieces.chambre.consigneJour) <= 16) debloquer(s, 'zones');
    if (faits.rideaux) debloquer(s, 'rideau');
    if (jm.nuage < 0.3 && s.rideaux !== 'fermes') debloquer(s, 'soleil');
    if (faits.bouillotte && (s.possede.robinets ? s.pieces.chambre.consigneNuit : s.central.consigneNuit) <= 16) debloquer(s, 'lit');
    if (s.possede.housse && faits.bouillotte) debloquer(s, 'prolonger');
  }
  if (ete && (faits.voletsJour || faits.ventNuit)) debloquer(s, 'inverse');
  if (ete && faits.ventNuit && faits.voletsJour) debloquer(s, 'fraicheur');
  if (jour.climKwh > 0) debloquer(s, 'clim');
  if (s.moisissure >= 3) debloquer(s, 'humidite');
  if (faits.couvercle || s.possede.autocuiseur || s.possede.marmite) debloquer(s, 'pression');
  if (faits.liste || (s.sys.regime === 'batch' && s.possede.boites)) debloquer(s, 'gaspillage');
  if (faits.prixKilo) debloquer(s, 'prixKilo');
  if (faits.multiprise && s.possede.wattmetre) debloquer(s, 'veilles');
  if (s.possede.led && s.possede.wattmetre) debloquer(s, 'lumiere');
  if (faits.frigo && s.sys.frigo.reglage >= 4) debloquer(s, 'frigo');
  if (s.sys.plaisirs > 0 && s.sys.plaisirs <= 20 && s.jour > 20 && s.volonte > 50) debloquer(s, 'plaisir');
  return undefined;
}
