// Point d'entrée : relie l'état, la simulation et l'interface
import { nouvellePartie, sauvegarder, charger, aUneSauvegarde } from './state.js';
import { jourSuivant, acheter, acheterVetement, aererVetement, laverMain, repriser, planifierLessive, reparerMachine, resoudreDilemme } from './simulation.js';
import { rendreTout, rendreHorloge, rendreFin, toast, options } from './ui.js';
import { etatUI } from './onglets.js';
import { actions, prendreTemps, payer } from './simulation.js';
import { viderRegard, changerFiltre, reprendrePente } from './passif.js';
import { reparerVelo, verifierPression, vendreVoiture, calculerCoutReel } from './transport.js';
import { changerTarif, faireReleves, resilier, renegocier, revendre, degivrer, prendreMediatheque } from './systemes.js';

function regler(chemin, brut) {
  const v = brut === 'true' ? true : brut === 'false' ? false : (brut !== '' && !isNaN(Number(brut)) ? Number(brut) : brut);
  const k = chemin.split('.'); let o = s;
  for (const p of k.slice(0, -1)) o = o[p];
  o[k.at(-1)] = v;
}

const $ = (id) => document.getElementById(id);
let s = nouvellePartie(Number(new URLSearchParams(location.search).get('graine')) || 2026);
let occupe = false;

function rafraichir(nbAvant) {
  const nouveaux = s.messages.slice(0, Math.max(0, s.messages.length - nbAvant));
  nouveaux.slice(0, 3).filter(m => ['principe', 'habitude', 'decouverte', 'alerte'].includes(m.type)).forEach(m => toast(m.texte));
  rendreTout(s);
  if (s.fini) rendreFin(s);
}
function autoSauvegarde() { try { sauvegarder(s); } catch { /* stockage indisponible */ } }

async function avancer(nbJours) {
  if (occupe || s.fini) return;
  occupe = true;
  for (let d = 0; d < nbJours && !s.fini && !s.dilemme; d++) {
    const pas = nbJours > 1 ? 4 : 2;
    for (let k = 0; k < 24; k += pas) { rendreHorloge((7 + k) % 24); await new Promise(r => setTimeout(r, nbJours > 1 ? 15 : 35)); }
    const n = s.messages.length;
    jourSuivant(s);
    rendreHorloge(7);
    rafraichir(n);
    autoSauvegarde();
  }
  occupe = false;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  const lab = (v) => (v <= 8 ? 'Arrêt' : v + ' °C');
  if (t.dataset.piece) s.pieces[t.dataset.piece][t.dataset.k] = Number(t.value);
  else if (t.dataset.central) s.central[t.dataset.central] = Number(t.value);
  else if (t.dataset.appoint) s.appoint.consigne = Number(t.value);
  else return;
  t.nextElementSibling.textContent = lab(Number(t.value));
});

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  const n = s.messages.length;
  const d = b.dataset;
  if (d.choix) {
    const v = d.v;
    switch (d.choix) {
      case 'portes': s.portes = v; break;
      case 'rideaux': s.rideaux = v; break;
      case 'aeration': s.aeration = v; break;
      case 'cuisson': s.recupCuisson = v === 'oui'; break;
      case 'bouillotte': s.utiliserBouillotte = v === 'oui'; break;
      case 'appoint': s.appoint.actif = v === 'oui'; break;
      case 'ltemp': options.lessive.temp = Number(v); break;
      case 'lsechage': options.lessive.sechage = v; break;
      case 'lheure': options.lessive.midi = v === 'midi'; options.lessive.hc = v === 'hc'; break;
    }
  } else if (d.onglet) etatUI.onglet = d.onglet;
  else if (d.tri) { if (etatUI.roiTri === d.tri) etatUI.roiSens *= -1; else { etatUI.roiTri = d.tri; etatUI.roiSens = d.tri === 'nom' || d.tri === 'payback' ? 1 : -1; } }
  else if (d.filtre) etatUI.filtrePrincipes = d.filtre;
  else if (d.principe) etatUI.principeOuvert = etatUI.principeOuvert === d.principe ? null : d.principe;
  else if (d.set) regler(d.set, d.v);
  else if (d.action) {
    const c = actions(s);
    ({ tarif: () => changerTarif(s, d.v, c), releves: () => faireReleves(s, c), resilier: () => resilier(s, d.v, c), renegocier: () => renegocier(s, c),
      revendre: () => revendre(s, d.v, c), degivrer: () => degivrer(s, c), mediatheque: () => prendreMediatheque(s, c),
      reparerVelo: () => reparerVelo(s, d.v, c), pression: () => verifierPression(s, c), vendreVoiture: () => { if (confirm('Vendre la voiture ? Tu ne pourras plus l\'utiliser.')) vendreVoiture(s, c); }, coutReel: () => calculerCoutReel(s, c),
      regard: () => viderRegard(s, prendreTemps), filtre: () => changerFiltre(s, prendreTemps, payer), pente: () => { if (confirm('Faire reprendre la pente par un pro ?')) reprendrePente(s, payer); } })[d.action]?.();
  } else if (d.acheter) acheter(s, d.acheter, d.occasion === '1');
  else if (d.acheterVet) acheterVetement(s, d.acheterVet, d.q);
  else if (d.porter) { const v = s.vetements[d.porter]; v.porte = !v.porte; }
  else if (d.aererVet) aererVetement(s, d.aererVet);
  else if (d.laverMain) laverMain(s, d.laverMain);
  else if (d.repriser) repriser(s, d.repriser);
  else if (d.reparer) reparerMachine(s, d.reparer);
  else if (d.dilemme) { resoudreDilemme(s, d.dilemme); autoSauvegarde(); }
  else if (b.id === 'btnLessive') planifierLessive(s, options.lessive);
  else if (b.id === 'btnJour') return avancer(1);
  else if (b.id === 'btnSemaine') return avancer(7);
  else if (b.id === 'btnCommencer') { $('intro').classList.add('cache'); return; }
  else if (b.id === 'btnReprendre') { const c = charger(); if (c && c !== 'ancienne') { s = c; if (s.migre === 3) { toast('Sauvegarde v0.3 mise à jour : le transport et la rentabilité démarrent aujourd\'hui.'); delete s.migre; } } else if (c === 'ancienne') toast('Ancienne sauvegarde (v0.2) incompatible : nouvelle partie.'); $('intro').classList.add('cache'); }
  else if (b.id === 'btnSauver') { autoSauvegarde(); toast('💾 Partie sauvegardée dans ce navigateur.'); return; }
  else if (b.id === 'btnCharger') { const c = charger(); if (c === 'ancienne') toast('Ancienne sauvegarde (v0.2) incompatible avec cette version : elle a été effacée.'); else if (c) { s = c; $('fin').classList.add('cache'); toast('📂 Partie chargée.'); } else toast('Aucune sauvegarde trouvée.'); }
  else if (b.id === 'btnNouvelle' || b.id === 'btnRejouer') {
    if (b.id === 'btnNouvelle' && !confirm('Commencer une nouvelle partie ? La partie en cours sera perdue si elle n\'est pas sauvegardée.')) return;
    s = nouvellePartie(Math.floor(Math.random() * 1e6)); $('fin').classList.add('cache'); autoSauvegarde();
  } else return;
  rafraichir(n);
});

if (aUneSauvegarde()) $('btnReprendre').classList.remove('cache');
else { try { if (localStorage.getItem('economie-game-sauvegarde')) { charger(); toast('Ta sauvegarde d\'une ancienne version a été réinitialisée : le jeu couvre maintenant hiver, printemps et été.'); } } catch { /* stockage indisponible */ } }
rendreHorloge(7);
rendreTout(s);
window.__jeu = () => s; // débogage
