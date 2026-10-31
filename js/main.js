// Point d'entrée : relie l'état, la simulation et l'interface
import { ignorer } from './arbitre.js';
import { VERSION } from './version.js';
import { nouvellePartie, sauvegarder, charger, aUneSauvegarde, MESSAGES_MIGRATION } from './state.js';
import { jourSuivant, acheter, acheterVetement, aererVetement, laverMain, repriser, planifierLessive, reparerMachine, resoudreDilemme } from './simulation.js';
import { rendreTout, rendreHorloge, rendreFin, toast, options } from './ui.js';
import { etatUI } from './onglets.js';
import { recommandations, suivreConseil, conseillerDispo, ACTIVATION } from './tableau.js';
import { prefs, sauverPrefs, ouvrir, ouvrirSection, apercuAchat, effetAchat, apercuConsigne, demarrerTutoriel, arreterTutoriel, etapeSuivante, coachActif, majCoach, objectifsAtteints, filtrerGlossaire, choisirVue } from './guide.js';
import { icone } from './icones.js';
import { ACHATS, SCENARIOS, SCENARIO_DEFAUT } from './data.js';
import { eur } from './simulation.js';
import { chapitreDuJour } from './meteo.js';
import { CAMPAGNE } from './data.js';
import { etatFin } from './ui-finance.js';
import { changerProfil, deposer, retirer, ouvrirAV, projection } from './finance.js';
import { actions, prendreTemps, payer } from './simulation.js';
import { viderRegard, changerFiltre, reprendrePente } from './passif.js';
import { actionAutonomie } from './autonomie.js';
import { reparerVelo, verifierPression, vendreVoiture, calculerCoutReel } from './transport.js';
import { changerTarif, faireReleves, resilier, reabonner, renegocier, revendre, degivrer, prendreMediatheque } from './systemes.js';

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
let scenario = SCENARIO_DEFAUT;
// v1.3 : choix du logement de départ sur l'écran d'accueil
const PITCH = { standard: 'dans une petite maison ancienne de 45 m², chauffée au gaz', 'appartement-elec': 'dans un appartement de 30 m² tout électrique (convecteurs)',
  'famille-4': 'avec ta famille (2 adultes, 2 enfants) dans une maison de 80 m² au gaz', 'maison-isolee-credit': 'dans une maison de 45 m² rénovée (DPE C), achetée à crédit' };
function rendreScenarios() {
  const l = $('scenariosListe'); if (!l) return;
  // v1.5.6 (passe UX 7) : groupe de boutons radio (aria-checked, un seul arrêt Tab, flèches) et coche ✓ visible, pas seulement la couleur
  const focus = l.contains(document.activeElement);
  l.innerHTML = Object.entries(SCENARIOS).map(([id, x]) => `<button type="button" class="btn scenario${id === scenario ? ' actif-btn' : ''}" data-scenario="${id}" role="radio" aria-checked="${id === scenario}" tabindex="${id === scenario ? 0 : -1}">
    <span class="sc-coche" aria-hidden="true">✓</span><span class="sc-ico" aria-hidden="true">${x.icone}</span><span class="sc-txt"><b>${x.nom}</b><small class="sc-desc">${x.desc}</small><small class="sc-court">${x.court}</small></span></button>`).join('');
  if (focus) l.querySelector('[aria-checked="true"]')?.focus();
  if ($('pitchLogement')) $('pitchLogement').textContent = PITCH[scenario] || PITCH.standard;
}
rendreScenarios();
$('scenariosListe')?.addEventListener('keydown', (e) => {
  const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; const ids = Object.keys(SCENARIOS);
  let j = null; if (k) j = (ids.indexOf(scenario) + k + ids.length) % ids.length; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = ids.length - 1;
  if (j === null) return; e.preventDefault(); scenario = ids[j]; rendreScenarios();
});

function rafraichir(nbAvant) {
  const nouveaux = s.messages.slice(0, Math.max(0, s.messages.length - nbAvant));
  nouveaux.slice(0, 3).filter(m => ['principe', 'habitude', 'decouverte', 'alerte'].includes(m.type)).forEach(m => toast(m.texte, { type: m.type === 'alerte' ? 'alerte' : 'ok' }));
  for (const o of objectifsAtteints(s)) toast(`🎯 Objectif atteint : ${o}`, { type: 'ok' });
  rendreTout(s);
  if (s.fini) rendreFin(s);
  majAnnuler();
}
// annuler (v0.9) : les réglages du jour peuvent être défaits (pas les achats ni le temps qui passe)
const pile = [];
const cliche = () => { const { meteo, ...r } = s; return JSON.stringify(r); };
function empiler(avant, lib) { pile.push({ avant, lib, jour: s.jour }); if (pile.length > 15) pile.shift(); majAnnuler(); }
function majAnnuler() { const b = $('btnAnnuler'); if (!b) return; while (pile.length && pile.at(-1).jour !== s.jour) pile.pop(); b.disabled = !pile.length; b.dataset.tip = pile.length ? `Annuler : ${pile.at(-1).lib} (Ctrl+Z)` : 'Rien à annuler aujourd\'hui'; }
function annuler() {
  majAnnuler(); const x = pile.pop(); if (!x) { toast('Rien à annuler : seuls les réglages d\'aujourd\'hui peuvent l\'être.'); return; }
  const m = s.meteo; s = Object.assign(JSON.parse(x.avant), { meteo: m });
  toast(`↩️ Annulé : ${x.lib}`, { type: 'ok' }); rafraichir(s.messages.length); autoSauvegarde(); majAnnuler();
}
// préférences d'affichage (v0.9)
const VITESSES = { lente: 2, normale: 1, rapide: 0.3 };
function appliquerPrefs() {
  const h = document.documentElement;
  h.dataset.anim = prefs.anim === 'non' ? 'non' : 'oui';
  h.dataset.texte = prefs.texte || 'normal';
  for (const b of document.querySelectorAll('[data-pref]')) { const on = (prefs[b.dataset.pref] || { vitesse: 'normale', anim: 'oui', texte: 'normal', pauses: 'toutes' }[b.dataset.pref]) === b.dataset.v; b.classList.toggle('actif', on); b.setAttribute('aria-pressed', String(on)); }
}
const ouvrirReglages = () => { appliquerPrefs(); $('reglages').classList.remove('cache'); setTimeout(() => $('reglagesFermer')?.focus(), 30); };
function autoSauvegarde() { try { sauvegarder(s); } catch { /* stockage indisponible */ } }

// Avance rapide : sans animation horaire, on s'arrête sur un choix, une alerte, un changement de saison ou un bilan.
async function avancerVite(nbJours, jusquEvenement) {
  if (occupe || s.fini) return;
  occupe = true;
  const n0 = s.messages.length, saison0 = chapitreDuJour(s.jour).saison;
  const deja = new Set(s.messages.slice(0, 40).map(m => m.texte));
  for (let d = 0; d < nbJours && !s.fini && !s.dilemme; d++) {
    const tete = s.messages[0];
    jourSuivant(s);
    const k = tete ? s.messages.indexOf(tete) : s.messages.length;   // robuste au plafond de 150 messages
    const nouveaux = s.messages.slice(0, k < 0 ? s.messages.length : k);
    // v0.9 : une alerte déjà vue récemment (linge sale, ballon vide…) n'interrompt plus l'avance rapide
    const neuf = (m) => !deja.has(m.texte);
    if (nouveaux.some(m => m.type === 'alerte' && (!jusquEvenement || neuf(m)))) break;
    if (jusquEvenement && (chapitreDuJour(s.jour).saison !== saison0 || nouveaux.some(m => neuf(m) && (prefs.pauses === 'importantes' ? ['annonce'] : ['annonce', 'principe', 'decouverte']).includes(m.type)))) break;
    for (const m of nouveaux) deja.add(m.texte);
    if (d % 7 === 6) { rendreTout(s); await new Promise(r => setTimeout(r, 0)); }
  }
  rendreHorloge(7, s?.jour || 0);
  rafraichir(n0);
  autoSauvegarde();
  occupe = false;
}

async function avancer(nbJours) {
  if (occupe || s.fini) return;
  occupe = true;
  for (let d = 0; d < nbJours && !s.fini && !s.dilemme; d++) {
    const pas = nbJours > 1 ? 4 : 2;
    for (let k = 0; k < 24; k += pas) { rendreHorloge((7 + k) % 24, s.jour); await new Promise(r => setTimeout(r, (nbJours > 1 ? 15 : 35) * (VITESSES[prefs.vitesse] ?? 1))); }
    const n = s.messages.length, v0 = s.coutVoisinCumul || 0;
    jourSuivant(s);
    if (nbJours === 1 && s.dernierJour) { const vj = (s.coutVoisinCumul || 0) - v0, mj = s.dernierJour.cout || 0; toast(`Journée terminée : ${eur(mj)} dépensés${vj > 0 ? ` (voisin : ${eur(vj)})` : ''}.`, { effet: vj > 0 ? (mj <= vj ? `Tu as économisé ${eur(vj - mj)} aujourd'hui.` : `Tu as dépensé ${eur(mj - vj)} de plus que lui.`) : '', duree: 4000 }); }
    rendreHorloge(7, s?.jour || 0);
    rafraichir(n);
    autoSauvegarde();
  }
  occupe = false;
}

let avantCurseur = null;
document.addEventListener('pointerdown', (e) => { if (e.target.type === 'range') avantCurseur = cliche(); });
document.addEventListener('focusin', (e) => { if (e.target.type === 'range') avantCurseur = cliche(); });
document.addEventListener('change', (e) => { const t = e.target; if (t.dataset.setSelect) { const av = cliche(); regler(t.dataset.setSelect, t.value); empiler(av, `${t.getAttribute('aria-label')} → ${t.selectedOptions[0].textContent}`); rafraichir(s.messages.length); return; } if (t.type === 'range' && avantCurseur && avantCurseur !== cliche()) { empiler(avantCurseur, `${t.getAttribute('aria-label') || 'Curseur'} → ${t.value} °C`); avantCurseur = cliche(); } });
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
  const annulable = !!(d.choix || d.set || d.appliquer !== undefined || d.routine || d.porter);
  const avant = annulable ? cliche() : null, libAnnul = (b.closest('.ligne')?.querySelector('label')?.textContent || '').trim() + (b.textContent.trim() ? ` → ${b.textContent.trim()}` : '');
  if (annulable) queueMicrotask(() => { if (cliche() !== avant) empiler(avant, libAnnul.replace(/^ → /, '')); });
  if (b.closest('.menu-liste')) $('menuPartie').open = false;   // v1.2.1 : le menu se referme après un choix
  if (b.id === 'btnAnnuler') { annuler(); return; }
  if (b.id === 'btnReglages') { ouvrirReglages(); return; }
  if (b.id === 'reglagesFermer') { $('reglages').classList.add('cache'); return; }
  if (d.pref) { prefs[d.pref] = d.v; sauverPrefs(); appliquerPrefs(); return; }
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
  else if (d.ignorer !== undefined) {
    const r = recommandations(s)[Number(d.ignorer)];
    if (r) { ignorer(s, r); toast(`Conseil masqué 30 jours : ${r.titre}`); rafraichir(s.messages.length); }
  }
  else if (d.appliquer !== undefined) {
    const r = recommandations(s)[Number(d.appliquer)], t = r && suivreConseil(s, r);
    toast(t ? `✅ ${t}` : conseillerDispo(s).reste ? 'Rien à appliquer automatiquement : ouvre le réglage avec « Y aller ».' : `Le conseiller revient dans ${conseillerDispo(s).retour} j (3 conseils par semaine).`, { type: t ? 'ok' : 'info' });
    if (t) autoSauvegarde();
  }
  else if (d.vue) { choisirVue(d.vue); rendreTout(s); }
  else if (d.aller) { ouvrir(d.aller); document.querySelector('.lateral')?.scrollIntoView({ block: 'start' }); }
  else if (d.conseilSuivant) etatUI.conseil = (etatUI.conseil || 0) + 1;
  else if (d.confirmerAchat) { const occ = d.occasion === '1'; if (acheter(s, d.confirmerAchat, occ)) toast(`✅ ${ACHATS[d.confirmerAchat].nom} acheté${ACTIVATION[d.confirmerAchat] ? ` · ${ACTIVATION[d.confirmerAchat].texte}` : ''}`, { type: 'ok', effet: effetAchat(s, d.confirmerAchat, occ), duree: ACTIVATION[d.confirmerAchat] ? 7000 : undefined }); $('confirmation').classList.add('cache'); autoSauvegarde(); }
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
  else if (d.autonomie) { const c = actions(s); if (actionAutonomie(s, d.autonomie, d.v, { prendreTemps, payer, msg: c.msg, debloquer: c.debloquer })) autoSauvegarde(); else if (s.messages.length === n) toast('Pas possible maintenant (temps libre, argent ou saison).'); }
  else if (d.action) {
    const c = actions(s);
    ({ tarif: () => changerTarif(s, d.v, c), releves: () => faireReleves(s, c), resilier: () => resilier(s, d.v, c), reabonner: () => reabonner(s, d.v, c), renegocier: () => renegocier(s, c),
      revendre: () => revendre(s, d.v, c), degivrer: () => degivrer(s, c), mediatheque: () => prendreMediatheque(s, c),
      reparerVelo: () => reparerVelo(s, d.v, c), pression: () => verifierPression(s, c), vendreVoiture: () => { if (confirm('Vendre la voiture ? Tu ne pourras plus l\'utiliser.')) vendreVoiture(s, c); }, coutReel: () => calculerCoutReel(s, c),
      regard: () => viderRegard(s, prendreTemps), filtre: () => changerFiltre(s, prendreTemps, payer), pente: () => { if (confirm('Faire reprendre la pente par un pro ?')) reprendrePente(s, payer); } })[d.action]?.();
  } else if (d.acheter) {
    const occ = d.occasion === '1', a = ACHATS[d.acheter], prix = occ ? a.occasion : a.prix;
    if (prix >= 50 || a.temps || occ) { $('confContenu').innerHTML = apercuAchat(s, d.acheter, occ); $('confirmation').classList.remove('cache'); setTimeout(() => $('confOui')?.focus(), 30); return; }
    if (acheter(s, d.acheter, occ)) toast(`✅ ${a.nom} acheté${ACTIVATION[d.acheter] ? ` · ${ACTIVATION[d.acheter].texte}` : ''}`, { type: 'ok', effet: effetAchat(s, d.acheter, occ), duree: ACTIVATION[d.acheter] ? 7000 : undefined });
  }
  else if (d.acheterVet) acheterVetement(s, d.acheterVet, d.q);
  else if (d.porter) { const v = s.vetements[d.porter]; v.porte = !v.porte; }
  else if (d.aererVet) aererVetement(s, d.aererVet);
  else if (d.laverMain) laverMain(s, d.laverMain);
  else if (d.repriser) repriser(s, d.repriser);
  else if (d.reparer) reparerMachine(s, d.reparer);
  else if (d.dilemme) { resoudreDilemme(s, d.dilemme); autoSauvegarde(); }
  else if (b.id === 'btnLessive') planifierLessive(s, options.lessive);
  else if (b.id === 'btnPlusTemps') { const t = b.closest('.temps'); t.classList.toggle('ouvert'); b.setAttribute('aria-expanded', t.classList.contains('ouvert')); return; }
  else if (b.id === 'btnJour') return avancer(1);
  else if (b.id === 'btnSemaine') return avancer(7);
  else if (b.id === 'btnMois') return avancerVite(30, false);
  else if (b.id === 'btnEvenement') return avancerVite(400, true);
  else if (d.routine) { s.auto ??= {}; s.auto[d.routine] = !s.auto[d.routine]; autoSauvegarde(); }
  // v1.5.5 (passe UX 6) : accueil en 2 étapes (point de départ, puis durée)
  else if (b.id === 'introSuivant' || b.id === 'introRetour') { const e = b.id === 'introSuivant' ? 2 : 1, m = $('intro'); m.dataset.etape = String(e);
    $('introNum').textContent = e; $('introNomEtape').textContent = e === 2 ? 'durée de la campagne' : 'ton point de départ';
    m.querySelectorAll('.intro-pas i').forEach((x, i) => x.classList.toggle('actif', i < e)); m.querySelector('.modal-contenu').scrollTop = 0;
    (e === 2 ? m.querySelector('[data-duree][aria-pressed="true"]') : $('introSuivant'))?.focus(); return; }
  else if (d.scenario) { scenario = d.scenario; rendreScenarios(); return; }
  else if (d.duree) { duree = Number(d.duree); dureeChoisie = true; document.querySelectorAll('[data-duree]').forEach(x => { x.classList.toggle('actif-btn', x === b); x.setAttribute('aria-pressed', x === b); }); return; }
  else if (b.id === 'btnJouer' || b.id === 'btnTutoriel' || b.id === 'btnCommencer') {
    if (dureeChoisie || duree !== Math.round(s.joursTotal / 365) || scenario !== (s.scenario || SCENARIO_DEFAUT)) { s = nouvellePartie(s.seed, duree, scenario); autoSauvegarde(); }
    $('intro').classList.add('cache'); rafraichir(n);
    if (b.id === 'btnTutoriel') demarrerTutoriel(s); else { prefs.tutoFait = true; sauverPrefs(); }
    return;
  }
  else if (b.id === 'btnReprendre') {
    const c = charger();
    if (c && typeof c === 'object') { s = c; if (s.migre) { toast(MESSAGES_MIGRATION[s.migre] || 'Sauvegarde mise à jour.'); delete s.migre; } }
    else signalerChargement(c);
    $('intro').classList.add('cache');
  }
  else if (b.id === 'btnAideTutoriel') { demarrerTutoriel(s); return; }
  else if (b.id === 'btnSauver') { autoSauvegarde(); toast('💾 Partie sauvegardée dans ce navigateur.'); return; }
  else if (b.id === 'btnCharger') { const c = charger(); if (c && typeof c === 'object') { s = c; if (s.migre) { toast(MESSAGES_MIGRATION[s.migre] || 'Sauvegarde mise à jour.'); delete s.migre; } $('fin').classList.add('cache'); toast('📂 Partie chargée.'); } else signalerChargement(c); }
  else if (b.id === 'btnNouvelle' || b.id === 'btnRejouer') {
    if (b.id === 'btnNouvelle' && !confirm('Recommencer une nouvelle partie ? La partie en cours sera perdue si elle n\'est pas sauvegardée. Cette action est irréversible.')) return;
    s = nouvellePartie(Math.floor(Math.random() * 1e6), Math.round(s.joursTotal / 365) || duree, s.scenario || scenario); $('fin').classList.add('cache'); autoSauvegarde();
  } else return;
  rafraichir(n);
});

if (aUneSauvegarde()) $('btnReprendre').classList.remove('cache');
else { try { if (localStorage.getItem('economie-game-sauvegarde')) signalerChargement(charger()); } catch { /* stockage indisponible */ } }
function signalerChargement(c) {
  if (c === 'ancienne') toast('Ancienne sauvegarde (v0.2) incompatible avec cette version : elle a été effacée.');
  else if (c === 'corrompue') toast('⚠️ Sauvegarde illisible : elle a été mise de côté et une nouvelle partie commence.', { type: 'alerte' });
  else toast('Aucune sauvegarde trouvée.');
}
// thème, icônes, clavier
document.documentElement.dataset.theme = prefs.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair');
for (const [id, ic] of [['btnAnnuler', 'annuler'], ['btnReglages', 'reglages'], ['btnAide', 'aide'], ['btnTheme', 'theme'], ['btnSauver', 'sauver'], ['btnCharger', 'charger'], ['btnNouvelle', 'nouvelle']]) $(id).querySelector('.m-ico').innerHTML = icone(ic, 18);
for (const [id, ic] of [['btnJour', 'jour'], ['btnSemaine', 'semaine'], ['btnMois', 'mois'], ['btnEvenement', 'evenement']]) $(id).querySelector('.t-ico').innerHTML = icone(ic, 18);
document.addEventListener('guide-rendre', () => rendreTout(s));
document.addEventListener('keydown', (e) => {
  const g = e.target.closest?.('[data-piece-clic]');
  if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  if (e.key === 'Escape') { if (!$('reglages').classList.contains('cache')) $('reglages').classList.add('cache'); else if (!$('confirmation').classList.contains('cache')) $('confirmation').classList.add('cache'); else if (coachActif()) arreterTutoriel(); return; }
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); annuler(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const libre = $('intro').classList.contains('cache') && !s.dilemme && $('reglages').classList.contains('cache') && $('confirmation').classList.contains('cache');
  if (e.key === '?') { ouvrirReglages(); return; }
  if (!libre) return;
  const k = e.key.toLowerCase();
  if (k === 'j') avancer(1); else if (k === 's') avancer(7); else if (k === 'm') avancerVite(30, false); else if (k === 'e') avancerVite(400, true);
  else if (k === 't') { choisirVue(prefs.vue === 'maison' ? 'tableau' : 'maison'); rendreTout(s); }
  else if ('12345'.includes(k) && k) { ouvrirSection(s, ['accueil', 'maison', 'achats', 'argent', 'bilan'][Number(k) - 1]); rendreTout(s); }
});
document.addEventListener('click', (e) => {
  const g = e.target.closest?.('[data-piece-clic]'); if (!g) return;
  ouvrir('maison'); rendreTout(s);
  const cible = document.querySelector(`[data-piece="${g.dataset.pieceClic}"]`) || document.querySelector('[data-central]');
  cible?.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => cible?.focus(), 300);
  if (!cible) toast('Un seul thermostat pour toute la maison : des robinets thermostatiques (Achats) permettent de régler chaque pièce.');
});
addEventListener('resize', () => majCoach(s));
for (const e of document.querySelectorAll('.version-jeu')) e.textContent = 'v' + VERSION;
appliquerPrefs();
rendreHorloge(7, s?.jour || 0);
rendreTout(s);
window.__jeu = () => s; // débogage

// fenêtres modales : Tab et Maj+Tab restent dans la fenêtre ouverte (accueil, choix, réglages, confirmation, fin)
const MODALES = ['confirmation', 'reglages', 'dilemme', 'fin', 'intro'];
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const m = MODALES.map($).find(x => x && !x.classList.contains('cache'));
  if (!m) return;
  const f = [...m.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
});

// v1.5.4 (passe UI/UX 5) : onglets role=tab au clavier (motif WAI-ARIA « tabs ») : un seul arrêt Tab par liste (tabindex mobile),
// ← / → (↑ / ↓ si la liste est verticale) passent à l'onglet voisin et l'activent, Début / Fin au premier / dernier
{
  const onglets = (l) => [...l.querySelectorAll('[role="tab"]')].filter(b => b.offsetParent !== null && !b.disabled);
  const roving = () => { for (const l of document.querySelectorAll('[role="tablist"]')) { const t = [...l.querySelectorAll('[role="tab"]')]; const sel = t.find(b => b.getAttribute('aria-selected') === 'true') || t[0];
    for (const b of t) { const v = b === sel ? '0' : '-1'; if (b.getAttribute('tabindex') !== v) b.setAttribute('tabindex', v); } } };
  let attente = false; new MutationObserver(() => { if (attente) return; attente = true; requestAnimationFrame(() => { attente = false; roving(); }); }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected'] }); roving();
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest?.('[role="tab"]'), l = b?.closest('[role="tablist"]'); if (!l || e.altKey || e.ctrlKey || e.metaKey) return;
    const vert = l.getAttribute('aria-orientation') === 'vertical', t = onglets(l), i = t.indexOf(b); if (i < 0) return;
    const k = { ArrowRight: vert ? null : 1, ArrowLeft: vert ? null : -1, ArrowDown: vert ? 1 : null, ArrowUp: vert ? -1 : null }[e.key];
    let j = null; if (k) j = (i + k + t.length) % t.length; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = t.length - 1;
    if (j === null) return; e.preventDefault();
    const cible = t[j], cle = Object.entries(cible.dataset)[0], idL = l.id;
    cible.click();
    // le rendu peut remplacer les boutons : on remet le focus sur le nouvel onglet actif
    requestAnimationFrame(() => { const l2 = idL ? document.getElementById(idL) : l; const n = cle ? l2?.querySelector(`[role="tab"][data-${cle[0].replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${CSS.escape(cle[1])}"]`) : cible; (n || cible).focus(); roving(); });
  });
}

// v1.3.1 : réserve sous le contenu la hauteur réelle des commandes du temps (fixes), du haut du bloc jusqu'au bas de l'écran
{
  const t = document.querySelector('.temps');
  const reserver = () => { if (!t) return; const r = t.getBoundingClientRect(); document.documentElement.style.setProperty('--reserve-temps', `${Math.ceil(innerHeight - r.top + 16)}px`); };
  if (t && 'ResizeObserver' in window) new ResizeObserver(reserver).observe(t);
  addEventListener('resize', reserver); reserver();
}
