// Ventilation passive (v0.4) : cheminée solaire, puits canadien et leur combinaison sans ventilateur.
// Modèle et sources : docs/cheminee-solaire-puits-canadien.md (section 5, « Modèle proposé pour le jeu »).
import { PASSIF, ORDRE_PIECES } from './data.js';
import { tExt, soleil } from './meteo.js';

export const wSat = (T) => 4.85 * Math.exp(0.0645 * T);          // g/m³, saturation
export const hasCheminee = (s) => (s.possede.chemineeDIY || s.possede.chemineePro) && !chantierEnCours(s, ['chemineeDIY', 'chemineePro']);
export const typePuits = (s) => (['puitsPro', 'puitsDIY', 'puitsHydro'].find(k => s.possede[k] && !chantierEnCours(s, [k])) || null);
export function chantierEnCours(s, ids) { return (s.passif?.chantiers || []).some(c => (!ids || ids.includes(c.id)) && c.reste > 0); }

export function nouvelEtatPassif(seed) {
  return {
    mode: 'ferme', clapetNuit: 'ferme', puitsMode: 'auto', debit: 'normal', cave: false,
    chantiers: [], zoneRadon: seed % 2 === 0, penteRatee: false, stagnant: 0, regard: 0, filtreJours: 0,
    masse: 0, hHumide: { salon: 0, chambre: 0, cuisine: 0 }, j: null, contreTirage: 0, autoJours: 0, clapetNuits: 0,
    serreJours: 0, radonJours: 0, condensTotal: 0,
  };
}

// jour de l'année du jour de jeu (hiver = décembre-janvier, printemps = avril, été = juillet-août)
export function jourAn(chap) {
  const d0 = { hiver: 335, printemps: 96, ete: 182 }[chap.id];
  return (d0 + chap.index) % 365;
}
export const tSol = (doy) => PASSIF.solMoy + PASSIF.solAmp * Math.cos(2 * Math.PI * (doy - PASSIF.solPic) / 365);

// humidité extérieure absolue (g/m³) ; jour lourd = point de rosée > 20 °C
export function jourLourd(jm, chap) { return chap.id === 'ete' && jm.tMoy > 22.5 && (jm.canicule ? chap.index >= 18 : jm.nuage > 0.2); }
export function wExterieur(jm, chap) {
  if (jourLourd(jm, chap)) return PASSIF.wLourd;
  return PASSIF.hrExt[chap.id] * wSat(jm.tMoy);
}

/** Une heure du système passif. Retourne la puissance (W) et l'air entrant par pièce. */
export function passifHeure(s, jm, h, chap, tInt) {
  const P = s.passif, X = PASSIF;
  const ch = hasCheminee(s), pt = typePuits(s);
  if (!ch && !pt) return null;
  const te = tExt(jm, h), irr = soleil(jm, h);
  const nuit = h >= 20 || h < 8, hiverish = chap.id !== 'ete';
  const pro = s.possede.chemineePro;
  const res = { te, Q: 0, tIn: te, wIn: 0, P: 0, Pch: 0, Ppuits: 0, fanW: 0, cond: 0, tube: false, contre: 0, Qch: 0 };
  // --- tirage de la cheminée ---
  let Qch = 0, dTch = 0;
  if (ch) {
    const k = 1 - 0.65 * jm.nuage;
    dTch = k * irr / 600 * X.dTmax;
    if (irr > 100) P.masse = X.dTmasse; else P.masse *= Math.pow(0.5, 1 / X.demiVieMasse);
    const dT = dTch + P.masse;
    Qch = 0.5 * X.A * Math.sqrt(2 * 9.81 * X.H * Math.max(0, dT) / 300) * 3600 * (pro ? X.facteurPro : 1);
    res.Qch = Qch;
  }
  const purge = ch && (P.mode === 'purge' || (P.mode === 'purgeNuit' && nuit));
  // --- mode Trombe : l'air de la pièce est chauffé dans le capteur et réinjecté ---
  if (ch && P.mode === 'trombe') {
    if (dTch > 0.2) res.Pch += Math.min(0.34 * Qch * dTch * X.gainTrombe, X.rendementCapteur * irr * X.surfaceCapteur * (pro ? X.facteurPro : 1));
    else if (nuit && P.clapetNuit === 'ouvert' && !pro && tInt > te) {
      // contre-tirage : le capteur froid aspire la chaleur de la maison et la rejette
      const Qr = 0.5 * X.A * Math.sqrt(2 * 9.81 * X.H * (tInt - te) / 300) * 3600 * X.facteurContre;
      res.contre = -0.34 * Qr * (tInt - te); res.Pch += res.contre;
    }
  }
  // --- débit d'air neuf entrant ---
  let Q = 0, fan = false;
  const ts0 = tSol(jourAn(chap));
  const utilePuits = pt && (P.puitsMode === 'on' || (P.puitsMode === 'auto' && ((te < X.bypassBas && ts0 > te) || (te > X.bypassHaut && ts0 < te))));
  if (purge) Q = Qch;
  else if (utilePuits) { Q = X.debitVentilo; fan = true; }
  if (utilePuits && Q > 0) Q = Math.min(Q, X.qTubeMax);
  if (utilePuits && (P.debit === 'reduit' || (P.debit === 'hygro' && s.possede.hygrometre && jourLourd(jm, chap)))) Q *= 0.5;
  if (P.filtreJours > 180 && utilePuits) Q *= 0.7;
  const wExt = wExterieur(jm, chap);
  let tIn = te, wIn = wExt;
  if (utilePuits && Q > 0) {
    const L0 = X.L0 * Math.pow(Q / 150, 0.8);
    const ts = tSol(jourAn(chap));
    let tOut = ts + (te - ts) * Math.exp(-X.L / L0);
    if (pt === 'puitsHydro') tOut = te + X.efficaciteHydro * (tOut - te);
    tIn = tOut; wIn = Math.min(wExt, wSat(tOut));
    res.cond = Math.max(0, wExt - wIn) * Q;    // g/h
    res.tube = true;
  }
  if (fan) res.fanW = X.ventiloW;
  // --- chaleur : la part qui remplace l'infiltration compte par rapport à l'air extérieur ---
  const qb = Math.min(Q, X.Qhyg), qx = Math.max(0, Q - X.Qhyg);
  const Pvent = 0.34 * qb * (tIn - te) + 0.34 * qx * (tIn - tInt);
  res.Ppuits = res.tube ? 0.34 * Q * (tIn - te) : 0;
  res.Pch += Pvent - res.Ppuits;
  res.P = res.Pch + res.Ppuits;
  res.Q = Q; res.tIn = tIn; res.wIn = wIn;
  // répartition par pièce et renouvellement d'air humide (fraction de l'air de la pièce remplacée en 1 h)
  res.W = {}; res.k = {};
  for (const id of ORDRE_PIECES) { res.W[id] = res.P * X.part[id]; res.k[id] = Math.min(0.6, Q * X.part[id] / X.volume[id]); }
  res.idxIn = 100 * wIn / wSat(18);   // indice d'humidité du jeu (% à 18 °C)
  return res;
}

// cumuls horaires (appelé après pasHoraire)
export function passifCumul(s, r, heure, hrPieces) {
  const j = s.passif.j;
  if (!r) return;
  j.Pch += r.Pch / 1000; j.Ppuits += r.Ppuits / 1000; j.cond += r.cond / 1000;
  if (r.tube) { j.heuresTube++; j.tOutMin = Math.min(j.tOutMin, r.tIn); j.ecartMax = Math.max(j.ecartMax, Math.abs(r.tIn - r.te)); if (r.Q > 200) j.fortDebit = true; }
  if (r.tube && r.Q > 0 && !r.fanW) j.heuresCombo++;
  if (r.Qch > 150) j.tirage = true;
  if (r.Qch > 50 && s.passif.mode !== 'ferme') j.heuresCheminee++;
  if (r.contre < 0) j.contre += -r.contre / 1000;
  j.Q = Math.max(j.Q, r.Q);
  for (const [p, hr] of Object.entries(hrPieces)) {
    j.hrMax = Math.max(j.hrMax, hr);
    const c = s.passif.hHumide;
    c[p] = hr > 70 ? c[p] + 1 : 0;
    if (c[p] >= 48) j.moisi = p;
  }
}

export function debutJourPassif(s) {
  s.passif ||= nouvelEtatPassif(s.seed);
  s.passif.j = { Pch: 0, Ppuits: 0, cond: 0, heuresTube: 0, heuresCombo: 0, heuresCheminee: 0, tOutMin: 99, ecartMax: 0, contre: 0, Q: 0, hrMax: 0, moisi: null, tirage: false, fortDebit: false, gazEco: 0, climEco: 0 };
}

const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };

/** Fin de journée : chantiers, condensats, radon, moisissures, principes. */
export function passifJour(s, ctx, chap) {
  const P = s.passif, j = P.j, X = PASSIF;
  // chantiers en cours (temps libre entièrement pris)
  for (const c of P.chantiers) if (c.reste > 0) {
    c.reste--; ctx.d.bienetre -= 1;
    if (c.reste === 0) {
      if (c.id === 'puitsDIY' && P.penteRatee === null) P.penteRatee = false;
      if (c.id === 'puitsDIY' && c.risque) {
        P.penteRatee = hash(s.seed, s.jour) < X.risquePente;
        if (P.penteRatee) { ctx.msg('🕳️ Puits terminé… mais la pente est ratée par endroits : l\'eau de condensation va stagner dans le tube.', 'alerte'); ctx.debloquer('etancheite'); }
      }
      ctx.msg(`🏗️ Chantier terminé : ${X.noms[c.id]} est en service.`, 'achat');
      if (c.id.startsWith('cheminee')) ctx.debloquer('tirage');
    }
  }
  const pt = typePuits(s);
  if (!hasCheminee(s) && !pt) return;
  P.filtreJours++;
  // condensats : vers le regard (pente correcte) ou stagnants (pente ratée)
  P.condensTotal += j.cond;
  if (pt === 'puitsDIY' && P.penteRatee) P.stagnant += j.cond; else if (pt && pt !== 'puitsHydro') P.regard += j.cond;
  if (P.stagnant > X.seuilStagnant && j.heuresTube > 0) {
    ctx.d.hygiene -= 1.2; ctx.d.sante -= 0.5; s.moisissure = Math.max(s.moisissure, 2);
    if (!P.alerteStagnant) { P.alerteStagnant = true; ctx.msg('🦠 Odeur de moisi à la bouche du puits : l\'eau stagne dans le tube (pente ratée). Faire reprendre la pente.', 'alerte'); }
  }
  if (P.regard > X.seuilRegard && j.heuresTube > 0) {
    ctx.d.hygiene -= 0.3;
    if (!P.alerteRegard) { P.alerteRegard = true; ctx.msg('💧 Le regard du puits est plein : vide-le et nettoie le siphon (30 min).', 'alerte'); }
  }
  // radon
  if (P.zoneRadon && (pt === 'puitsDIY' || pt === 'puitsPro') && !s.possede.kitRadon && j.heuresTube > 0) {
    ctx.d.sante -= X.radonSante; P.radonJours++;
    if (P.radonJours === 1) ctx.msg('☢️ Zone à radon : sans joints étanches, le tube aspire du radon du sol. Le kit étanchéité est indispensable ici.', 'alerte');
    if (P.radonJours >= 3) ctx.debloquer('etancheite');
  }
  // moisissures : HR > 70 % pendant 48 h dans une pièce
  if (j.moisi) {
    s.moisissure = Math.max(s.moisissure, 3);
    if (!P.alerteMoisi || s.jour - P.alerteMoisi > 7) { P.alerteMoisi = s.jour; ctx.msg(`🍄 ${j.moisi} au-dessus de 70 % d'humidité depuis 48 h : les moisissures s'installent.`, 'alerte'); }
  }
  if (j.hrMax < 30) ctx.d.confort -= 2;
  // contre-tirage
  if (j.contre > 0.3) {
    P.contreTirage++;
    if (P.contreTirage === 1) ctx.msg(`🌬️ Cette nuit, le clapet bas de la cheminée est resté ouvert : le tirage s'est inversé et a vidé ${(j.contre).toFixed(1).replace('.', ',')} kWh de chaleur dehors.`, 'alerte');
    if (P.contreTirage >= 2) ctx.debloquer('clapet');
  }
  if (chap.id === 'hiver' && P.mode === 'trombe' && P.clapetNuit === 'ferme' && hasCheminee(s) && ++P.clapetNuits >= 5) ctx.debloquer('clapet');
  // principes
  if (j.tirage) ctx.debloquer('tirage');
  if (j.ecartMax > 8) ctx.debloquer('inertieSol');
  if (j.fortDebit) ctx.debloquer('tempsContact');
  if (j.cond > 0.2) ctx.debloquer('pointRosee');
  if (pt && P.puitsMode === 'auto' && ++P.autoJours >= 7) ctx.debloquer('bypass');
  if (s.possede.kitRadon) ctx.debloquer('etancheite');
}

// --- actions du joueur ---
export function viderRegard(s, prendreTemps) {
  if (!typePuits(s) || !prendreTemps(s, 0.5)) return false;
  s.passif.regard = 0; s.passif.alerteRegard = false; return true;
}
export function changerFiltre(s, prendreTemps, payer) {
  if (!typePuits(s) || s.argent < 15 || !prendreTemps(s, 0.5)) return false;
  payer(s, 15, 'entretien'); s.passif.filtreJours = 0; return true;
}
export function reprendrePente(s, payer) {
  const X = PASSIF;
  if (!s.passif.penteRatee || s.argent < X.reprisePente) return false;
  payer(s, X.reprisePente, 'equipement');
  s.passif.penteRatee = false; s.passif.stagnant = 0; s.passif.alerteStagnant = false;
  s.passif.chantiers.push({ id: 'puitsDIY', reste: 1 });
  return true;
}
