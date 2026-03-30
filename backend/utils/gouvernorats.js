export const ADJACENCY = {
  Tunis: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'],
  Ariana: ['Ariana', 'Tunis', 'Manouba', 'Ben Arous'],
  'Ben Arous': ['Ben Arous', 'Tunis', 'Ariana', 'Zaghouan'],
  Manouba: ['Manouba', 'Tunis', 'Ariana', 'Béja'],
  Nabeul: ['Nabeul', 'Zaghouan', 'Ben Arous'],
  Zaghouan: ['Zaghouan', 'Tunis', 'Ben Arous', 'Nabeul', 'Kairouan'],
  Bizerte: ['Bizerte', 'Ariana', 'Béja', 'Manouba'],
  Béja: ['Béja', 'Bizerte', 'Jendouba', 'Siliana', 'Manouba'],
  Jendouba: ['Jendouba', 'Béja', 'Kef'],
  Kef: ['Kef', 'Jendouba', 'Béja', 'Siliana', 'Kasserine'],
  Siliana: ['Siliana', 'Béja', 'Kef', 'Zaghouan', 'Sousse'],
  Sousse: ['Sousse', 'Monastir', 'Mahdia', 'Kairouan', 'Siliana'],
  Monastir: ['Monastir', 'Sousse', 'Mahdia'],
  Mahdia: ['Mahdia', 'Monastir', 'Sousse', 'Sfax'],
  Sfax: ['Sfax', 'Mahdia', 'Sidi Bouzid', 'Gabès'],
  Kairouan: ['Kairouan', 'Sousse', 'Zaghouan', 'Sidi Bouzid', 'Kasserine'],
  Kasserine: ['Kasserine', 'Kairouan', 'Kef', 'Sidi Bouzid', 'Gafsa'],
  'Sidi Bouzid': ['Sidi Bouzid', 'Kairouan', 'Kasserine', 'Sfax', 'Gafsa'],
  Gabès: ['Gabès', 'Sfax', 'Medenine', 'Gafsa'],
  Medenine: ['Medenine', 'Gabès', 'Tataouine'],
  Tataouine: ['Tataouine', 'Medenine', 'Kebili'],
  Gafsa: ['Gafsa', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Tozeur', 'Kebili'],
  Tozeur: ['Tozeur', 'Gafsa', 'Kebili'],
  Kebili: ['Kebili', 'Tozeur', 'Gafsa', 'Gabes', 'Tataouine'],
};

export function nearbyGouvernorats(gouvernorat) {
  return ADJACENCY[gouvernorat] ?? [gouvernorat];
}
