// Point d'entrée : relie l'état, la simulation et l'interface
import { nouvellePartie } from './state.js';
import { jourSuivant, acheter, acheterVetement } from './simulation.js';
import { rendreTout, rendreHorloge, rendreFin, toast } from './ui.js';

let s = nouvellePartie(Number(new URLSearchParams(location.search).get('graine')) || 2026);
let occupe = false;
const $ = (id) => document.getElementById(id);

function rafraichir(nbAvant) {
  const nouveaux = s.messages.length - nbAvant;
  s.messages.slice(0, Math.min(nouveaux, 3)).filter(m => m.type === 'principe' || m.type === 'habitude' || m.type === 'decouverte').forEach(m => toast(m.texte));
  rendreTout(s);
  if (s.fini) rendreFin(s);
}

async function avancer(nbJours) {
  if (occupe || s.fini) return;
  occupe = true;
  for (let d = 0; d < nbJours && !s.fini; d++) {
    // petite animation du cycle jour/nuit
    const pas = nbJours > 1 ? 4 : 2;
    for (let k = 0; k < 24; k += pas) { rendreHorloge((7 + k) % 24); await new Promise(r => setTimeout(r, nbJours > 1 ? 15 : 35)); }
    const n = s.messages.length;
    jourSuivant(s);
    rendreHorloge(7);
    rafraichir(n);
  }
  occupe = false;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.piece) { s.pieces[t.dataset.piece][t.dataset.k] = Number(t.value); t.nextElementSibling.textContent = t.value <= 8 ? 'Hors-gel' : t.value + ' °C'; }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const n = s.messages.length;
  if (b.dataset.choix) {
    const v = b.dataset.v;
    if (b.dataset.choix === 'portes') s.portes = v;
    if (b.dataset.choix === 'rideaux') s.rideaux = v;
    if (b.dataset.choix === 'bouillotte') s.utiliserBouillotte = v === 'oui';
  } else if (b.dataset.acheter) acheter(s, b.dataset.acheter);
  else if (b.dataset.acheterVet) acheterVetement(s, b.dataset.acheterVet);
  else if (b.dataset.porter) { const v = s.vetements[b.dataset.porter]; v.porte = !v.porte; }
  else if (b.id === 'btnLessive') s.lessiveDemandee = !s.lessiveDemandee;
  else if (b.id === 'btnJour') return avancer(1);
  else if (b.id === 'btnSemaine') return avancer(7);
  else if (b.id === 'btnCommencer') { $('intro').classList.add('cache'); return; }
  else if (b.id === 'btnRejouer') { s = nouvellePartie(Math.floor(Math.random() * 1e6)); $('fin').classList.add('cache'); }
  else return;
  rafraichir(n);
});

rendreHorloge(7);
rendreTout(s);
window.__jeu = () => s; // pour le débogage
