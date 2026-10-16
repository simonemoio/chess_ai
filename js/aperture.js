/**
 * Nomi e codici ECO delle aperture, da lichess-org/chess-openings (CC0).
 *
 * Indicizzate per "pezzi tratto arrocchi" — i primi tre campi della FEN.
 * L'en passant e' escluso di proposito: librerie diverse lo scrivono in modo
 * diverso e basterebbe quello a far fallire la corrispondenza.
 */
let IDX = null;

export async function carica(url = "data/aperture.json") {
  if (IDX) return IDX;
  const r = await fetch(url);
  if (!r.ok) throw new Error("aperture.json non trovato");
  IDX = await r.json();
  return IDX;
}

/** [eco, nome] se la posizione e' un'apertura nota, altrimenti null. */
export function cerca(chiave) {
  if (!IDX) return null;
  return IDX[chiave] || null;
}

/** L'apertura piu' profonda raggiunta, ripercorrendo le mosse della partita. */
export function corrente(chiavi) {
  let trovata = null, ultimo = 0;
  chiavi.forEach((k, i) => {
    const v = IDX && IDX[k];
    if (v) { trovata = v; ultimo = i + 1; }
  });
  if (!trovata) return null;
  return { eco: trovata[0], nome: trovata[1], ply: ultimo,
           in_libro: ultimo === chiavi.length };
}
