// Point d'entrée : relie l'état, la simulation et l'interface
import { nouvellePartie, sauvegarder, charger, aUneSauvegarde } from './state.js';
import { jourSuivant, acheter, acheterVetement, aererVetement, laverMain, repriser, planifierLessive, reparerMachine, resoudreDilemme } from './simulation.js';
import { rendreTout, rendreHorloge, rendreFin, toast, options } from './ui.js';
import { etatUI } from './onglets.js';
import { prefs, sauverPrefs, ouvrir, ouvrirSection, apercuAchat, effetAchat, apercuConsigne, demarrerTutoriel, arreterTutoriel, etapeSuivante, coachActif, majCoach, objectifsAtteints, filtrerGlossaire } from './guide.js';
import { icone } from './icones.js';
import { ACHATS } from './data.js';
import { eur } from './simulation.js';
import { chapitreDuJour } from './meteo.js';
import { CAMPAGNE } from './data.js';
import { etatFin } from './ui-finance.js';
import { changerProfil, deposer, retirer, ouvrirAV, projection } from './finance.js';
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
let duree = CAMPAGNE.anneesDefaut, dureeChoisie = false;

function rafraichir(nbAvant) {
  const nouveaux = s.messages.slice(0, Math.max(0, s.messages.length - nbAvant));
  nouveaux.slice(0, 3).filter(m => ['principe', 'habitude', 'decouverte', 'alerte'].includes(m.type)).forEach(m => toast(m.texte, { type: m.type === 'alerte' ? 'alerte' : 'ok' }));
  for (const o of objectifsAtteints(s)) toast(`🎯 Objectif atteint : ${o}`, { type: 'ok' });
  rendreTout(s);
  if (s.fini) rendreFin(s);
}
function autoSauvegarde() { try { sauvegarder(s); } catch { /* stockage indisponible */ } }

// Avance rapide : sans animation horaire, on s'arrête sur un choix, une alerte, un changement de saison ou un bilan.
async function avancerVite(nbJours, jusquEvenement) {
  if (occupe || s.fini) return;
  occupe = true;
  const n0 = s.messages.length, saison0 = chapitreDuJour(s.jour).saison;
  for (let d = 0; d < nbJours && !s.fini && !s.dilemme; d++) {
    const n = s.messages.length;
    jourSuivant(s);
    const nouveaux = s.messages.slice(0, Math.max(0, s.messages.length - n));
    if (nouveaux.some(m => m.type === 'alerte')) break;
    if (jusquEvenement && (chapitreDuJour(s.jour).saison !== saison0 || nouveaux.some(m => ['annonce', 'principe', 'decouverte'].includes(m.type)))) break;
    if (d % 7 === 6) { rendreTout(s); await new Promise(r => setTimeout(r, 0)); }
  }
  rendreHorloge(7);
  rafraichir(n0);
  autoSauvegarde();
  occupe = false;
}

async function avancer(nbJours) {
  if (occupe || s.fini) return;
  occupe = true;
  for (let d = 0; d < nbJours && !s.fini && !s.dilemme; d++) {
    const pas = nbJours > 1 ? 4 : 2;
    for (let k = 0; k < 24; k += pas) { rendreHorloge((7 + k) % 24); await new Promise(r => setTimeout(r, nbJours > 1 ? 15 : 35)); }
    const n = s.messages.length, v0 = s.coutVoisinCumul || 0;
    jourSuivant(s);
    if (nbJours === 1 && s.dernierJour) { const vj = (s.coutVoisinCumul || 0) - v0, mj = s.dernierJour.cout || 0; toast(`Journée terminée : ${eur(mj)} dépensés${vj > 0 ? ` (voisin : ${eur(vj)})` : ''}.`, { effet: vj > 0 ? (mj <= vj ? `Tu as économisé ${eur(vj - mj)} aujourd'hui.` : `Tu as dépensé ${eur(mj - vj)} de plus que lui.`) : '', duree: 4000 }); }
    rendreHorloge(7);
    rafraichir(n);
    autoSauvegarde();
  }
  occupe = false;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  const lab = (v) => (v <= 8 ? 'Arrêt' : v + ' °C');
  if (t.id === 'rechercheGlossaire') { filtrerGlossaire(t.value); return; }
  if ((t.dataset.piece || t.dataset.central) && $('apercuChauffage')) $('apercuChauffage').textContent = apercuConsigne(s, t.dataset.piece || null, Number(t.dataset.depart), Number(t.value));
  if (t.type === 'range') t.setAttribute('aria-valuetext', Number(t.value) <= 8 ? 'Arrêt (hors-gel)' : t.value + ' degrés');
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
  } else if (d.onglet) ouvrir(d.onglet);
  else if (d.section) ouvrirSection(s, d.section);
  else if (d.aller) { ouvrir(d.aller); document.querySelector('.lateral')?.scrollIntoView({ block: 'start' }); }
  else if (d.conseilSuivant) etatUI.conseil = (etatUI.conseil || 0) + 1;
  else if (d.confirmerAchat) { const occ = d.occasion === '1'; if (acheter(s, d.confirmerAchat, occ)) toast(`✅ ${ACHATS[d.confirmerAchat].nom} acheté`, { type: 'ok', effet: effetAchat(s, d.confirmerAchat, occ) }); $('confirmation').classList.add('cache'); autoSauvegarde(); }
  else if (b.id === 'confNon') { $('confirmation').classList.add('cache'); return; }
  else if (b.id === 'coachPasser') { arreterTutoriel(); return; }
  else if (b.id === 'coachSuiv') { etapeSuivante(s, 1); }
  else if (b.id === 'coachPrec') { etapeSuivante(s, -1); }
  else if (b.id === 'btnAide') { $('intro').classList.add('cache'); demarrerTutoriel(s); }
  else if (b.id === 'btnTheme') { prefs.theme = document.documentElement.dataset.theme === 'sombre' ? 'clair' : 'sombre'; document.documentElement.dataset.theme = prefs.theme; sauverPrefs(); return; }
  else if (d.tri) { if (etatUI.roiTri === d.tri) etatUI.roiSens *= -1; else { etatUI.roiTri = d.tri; etatUI.roiSens = d.tri === 'nom' || d.tri === 'payback' ? 1 : -1; } }
  else if (d.filtre) etatUI.filtrePrincipes = d.filtre;
  else if (d.principe) etatUI.principeOuvert = etatUI.principeOuvert === d.principe ? null : d.principe;
  else if (d.fin) {
    const c = actions(s), f = d.fin, montant = () => Number(document.getElementById('m-' + d.v)?.value || 0);
    let r = null;
    if (f === 'profil') changerProfil(s, d.v);
    else if (f === 'auto') s.fin.autoLivret = d.v === '1';
    else if (f === 'dep') r = deposer(s, d.v, montant(), c);
    else if (f === 'ret') { if (d.v !== 'pel' && d.v !== 'pea' || confirm(d.v === 'pel' ? 'Clôturer le PEL ?' : 'Vendre tout le PEA ? Avant 5 ans, il sera clôturé.')) r = retirer(s, d.v, d.v === 'pea' || d.v === 'pel' ? Infinity : montant(), c); }
    else if (f === 'av') r = ouvrirAV(s, d.v);
    else if (f === 'alloc') etatFin.proj.alloc = d.v;
    else if (f === 'ans') etatFin.proj.ans = Number(d.v);
    else if (f === 'vers') etatFin.proj.versement = Number(d.v);
    else if (f === 'projeter') { const p = etatFin.proj; p.res = { ...projection(s.seed, p.versement, p.ans, p.alloc), alloc: p.alloc, ans: p.ans, versement: p.versement }; c.debloquer('horizon'); c.debloquer('interetsComposes'); }
    if (r) toast((r.ok ? '' : '⚠️ ') + r.msg);
    autoSauvegarde();
  }
  else if (d.set) regler(d.set, d.v);
  else if (d.action) {
    const c = actions(s);
    ({ tarif: () => changerTarif(s, d.v, c), releves: () => faireReleves(s, c), resilier: () => resilier(s, d.v, c), renegocier: () => renegocier(s, c),
      revendre: () => revendre(s, d.v, c), degivrer: () => degivrer(s, c), mediatheque: () => prendreMediatheque(s, c),
      reparerVelo: () => reparerVelo(s, d.v, c), pression: () => verifierPression(s, c), vendreVoiture: () => { if (confirm('Vendre la voiture ? Tu ne pourras plus l\'utiliser.')) vendreVoiture(s, c); }, coutReel: () => calculerCoutReel(s, c),
      regard: () => viderRegard(s, prendreTemps), filtre: () => changerFiltre(s, prendreTemps, payer), pente: () => { if (confirm('Faire reprendre la pente par un pro ?')) reprendrePente(s, payer); } })[d.action]?.();
  } else if (d.acheter) {
    const occ = d.occasion === '1', a = ACHATS[d.acheter], prix = occ ? a.occasion : a.prix;
    if (prix >= 50 || a.temps || occ) { $('confContenu').innerHTML = apercuAchat(s, d.acheter, occ); $('confirmation').classList.remove('cache'); setTimeout(() => $('confOui')?.focus(), 30); return; }
    if (acheter(s, d.acheter, occ)) toast(`✅ ${a.nom} acheté`, { type: 'ok', effet: effetAchat(s, d.acheter, occ) });
  }
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
  else if (b.id === 'btnMois') return avancerVite(30, false);
  else if (b.id === 'btnEvenement') return avancerVite(400, true);
  else if (d.routine) { s.auto ??= {}; s.auto[d.routine] = !s.auto[d.routine]; autoSauvegarde(); }
  else if (d.duree) { duree = Number(d.duree); dureeChoisie = true; document.querySelectorAll('[data-duree]').forEach(x => { x.classList.toggle('actif-btn', x === b); x.setAttribute('aria-pressed', x === b); }); return; }
  else if (b.id === 'btnJouer' || b.id === 'btnTutoriel' || b.id === 'btnCommencer') {
    if (dureeChoisie || duree !== Math.round(s.joursTotal / 365)) { s = nouvellePartie(s.seed, duree); autoSauvegarde(); }
    $('intro').classList.add('cache'); rafraichir(n);
    if (b.id === 'btnTutoriel') demarrerTutoriel(s); else { prefs.tutoFait = true; sauverPrefs(); }
    return;
  }
  else if (b.id === 'btnReprendre') { const c = charger(); if (c && c !== 'ancienne') { s = c; if (s.migre === 3) { toast('Sauvegarde v0.3 mise à jour : le transport, la rentabilité et la banque démarrent aujourd\'hui.'); delete s.migre; } else if (s.migre === 4) { toast('Sauvegarde v0.4 mise à jour : ta banque démarre aujourd\'hui (profil médian, 4 000 € sur le Livret A).'); delete s.migre; } else if (s.migre === 6) { toast('Sauvegarde v0.6 mise à jour : le moral évolue maintenant sur la durée et la santé a un coût.'); delete s.migre; } else if (s.migre === 5) { toast('Sauvegarde v0.5 mise à jour : ta partie continue en campagne de 5 ans (salaire, inflation, pannes, bilans annuels).'); delete s.migre; } else if (s.migre === 6) { toast('Sauvegarde v0.6 mise à jour : le moral évolue maintenant sur la durée et la santé a un coût.'); delete s.migre; } else if (s.migre === 5) { toast('Sauvegarde v0.5 mise à jour : ta partie continue en campagne de 5 ans (salaire, inflation, pannes, bilans annuels).'); delete s.migre; } } else if (c === 'ancienne') toast('Ancienne sauvegarde (v0.2) incompatible : nouvelle partie.'); $('intro').classList.add('cache'); }
  else if (b.id === 'btnSauver') { autoSauvegarde(); toast('💾 Partie sauvegardée dans ce navigateur.'); return; }
  else if (b.id === 'btnCharger') { const c = charger(); if (c === 'ancienne') toast('Ancienne sauvegarde (v0.2) incompatible avec cette version : elle a été effacée.'); else if (c) { s = c; $('fin').classList.add('cache'); toast('📂 Partie chargée.'); } else toast('Aucune sauvegarde trouvée.'); }
  else if (b.id === 'btnNouvelle' || b.id === 'btnRejouer') {
    if (b.id === 'btnNouvelle' && !confirm('Commencer une nouvelle partie ? La partie en cours sera perdue si elle n\'est pas sauvegardée.')) return;
    s = nouvellePartie(Math.floor(Math.random() * 1e6), Math.round(s.joursTotal / 365) || duree); $('fin').classList.add('cache'); autoSauvegarde();
  } else return;
  rafraichir(n);
});

if (aUneSauvegarde()) $('btnReprendre').classList.remove('cache');
else { try { if (localStorage.getItem('economie-game-sauvegarde')) { charger(); toast('Ta sauvegarde d\'une ancienne version a été réinitialisée : le jeu couvre maintenant hiver, printemps et été.'); } } catch { /* stockage indisponible */ } }
// thème, icônes, clavier
document.documentElement.dataset.theme = prefs.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair');
for (const [id, ic] of [['btnAide', 'aide'], ['btnTheme', 'theme'], ['btnSauver', 'sauver'], ['btnCharger', 'charger'], ['btnNouvelle', 'nouvelle']]) $(id).innerHTML = icone(ic, 18);
for (const [id, ic] of [['btnJour', 'jour'], ['btnSemaine', 'semaine'], ['btnMois', 'mois'], ['btnEvenement', 'evenement']]) $(id).querySelector('.t-ico').innerHTML = icone(ic, 18);
document.addEventListener('guide-rendre', () => rendreTout(s));
document.addEventListener('keydown', (e) => {
  const g = e.target.closest?.('[data-piece-clic]');
  if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  if (e.key === 'Escape') { if (!$('confirmation').classList.contains('cache')) $('confirmation').classList.add('cache'); else if (coachActif()) arreterTutoriel(); return; }
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.key === 'j' || e.key === 'J') && $('intro').classList.contains('cache') && !s.dilemme) avancer(1);
});
document.addEventListener('click', (e) => {
  const g = e.target.closest?.('[data-piece-clic]'); if (!g) return;
  ouvrir('maison'); rendreTout(s);
  const cible = document.querySelector(`[data-piece="${g.dataset.pieceClic}"]`) || document.querySelector('[data-central]');
  cible?.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => cible?.focus(), 300);
  if (!cible) toast('Un seul thermostat pour toute la maison : des robinets thermostatiques (Achats) permettent de régler chaque pièce.');
});
addEventListener('resize', () => majCoach(s));
rendreHorloge(7);
rendreTout(s);
window.__jeu = () => s; // débogage
