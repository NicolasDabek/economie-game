// État initial de la partie
import { ARGENT_DEPART, ORDRE_PIECES, VETEMENTS, GESTES } from './data.js';
import { genererMeteo } from './meteo.js';

export function nouvellePartie(seed = 2026) {
  const pieces = {};
  for (const p of ORDRE_PIECES) pieces[p] = { t: 19, consigneJour: 20, consigneNuit: 18, kwhTotal: 0, kwhSemaine: 0 };
  const vetements = {};
  for (const [id, v] of Object.entries(VETEMENTS)) vetements[id] = { possede: v.prix === 0, porte: id === 'tshirt', salete: 0, usure: 0 };
  const gestes = {};
  for (const id of Object.keys(GESTES)) gestes[id] = { pratique: 0, habitude: false };
  return {
    seed, jour: 0, fini: false,
    meteo: genererMeteo(seed),
    argent: ARGENT_DEPART,
    confort: 70, sante: 90, volonte: 70,
    pieces,
    portes: 'ouvertes',          // 'ouvertes' | 'fermees'
    rideaux: 'ouverts',          // 'ouverts' | 'nuit' | 'fermes'
    utiliserBouillotte: false,
    possede: { calfeutrage: false, bouillotte: false, housse: false, thermometre: false },
    vetements, gestes,
    usureMachine: 0,
    lessiveDemandee: false,
    depenses: { chauffage: 0, lessive: 0, achats: 0, imprevus: 0 },
    factureSemaine: 0, factures: [],
    historique: [],              // par jour : { heures:[...], ... }
    principes: [],               // ids débloqués
    messages: [],                // journal
    sommeConfort: 0, nbJours: 0,
    rechutes: 0,
    baseline: { pieces: Object.fromEntries(ORDRE_PIECES.map(p => [p, { t: 19 }])), cout: 0 },
  };
}
