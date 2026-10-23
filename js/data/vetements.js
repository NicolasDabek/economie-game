// Données de jeu : Vêtements (prix France 2026, sources en commentaire ; détail dans docs/prix.md)

// ---------- Vêtements ----------
// iso : °C ressentis ; poids : unités de linge ; enc : encombrement ;
// eco / durable : prix (relevés Decathlon, Kiabi, Action, Ikea, magasins de laine, 2026) et usure par jour porté.
export const VETEMENTS = {
  tshirt:     { nom: 'T-shirt', icone: '👕', iso: 0, poids: 0.3, enc: 0, sal: 30, peau: true,
                eco: { prix: 0, usure: 0.8 }, durable: null, depart: true },
  souscouche: { nom: 'Sous-couche manches longues', icone: '🩱', iso: 1.0, poids: 0.3, enc: 0, sal: 30, peau: true, protege: true,
                eco: { prix: 9, usure: 1.0 },  durable: { prix: 39, usure: 0.15, label: 'mérinos' } },
  chaussettes:{ nom: 'Chaussettes épaisses', icone: '🧦', iso: 0.8, poids: 0.2, enc: 0, sal: 35, peau: true,
                eco: { prix: 4, usure: 1.6 },  durable: { prix: 15, usure: 0.15, label: 'laine' } },
  sweat:      { nom: 'Sweat', icone: '🧥', iso: 1.5, poids: 0.8, enc: 0.5, sal: 12,
                eco: { prix: 13, usure: 0.9 }, durable: { prix: 40, usure: 0.15, label: 'molleton épais' } },
  polaire:    { nom: 'Pantalon polaire', icone: '👖', iso: 1.2, poids: 0.6, enc: 0.5, sal: 12,
                eco: { prix: 12, usure: 0.9 }, durable: { prix: 30, usure: 0.15, label: 'polaire épaisse' } },
  pilou:      { nom: 'Peignoir polaire', icone: '🥋', iso: 2.5, poids: 1.2, enc: 1.0, sal: 8,
                eco: { prix: 22, usure: 1.0 }, durable: { prix: 45, usure: 0.15, label: 'polaire épaisse' } },
  doudoune:   { nom: 'Doudoune d\'intérieur', icone: '🧣', iso: 3.0, poids: 1.0, enc: 1.5, sal: 5,
                eco: { prix: 25, usure: 1.1 }, durable: { prix: 70, usure: 0.15, label: 'duvet' } },
  plaid:      { nom: 'Plaid portable', icone: '🛋️', iso: 2.5, poids: 1.5, enc: 0, sal: 6, assis: true,
                eco: { prix: 12, usure: 0.6 }, durable: { prix: 35, usure: 0.15, label: 'laine' } },
};
export const SEUIL_ENCOMBREMENT = 2;   // au-delà, on bouge mal : pénalité de confort
export const KIT_COUTURE = 6;          // aiguilles, fil, boutons : 5-8 €
export const TEMPS_REPRISER = 1;
export const TEMPS_AERER_VET = 0.05;

