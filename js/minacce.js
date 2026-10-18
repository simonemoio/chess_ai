/**
 * Pezzi minacciati: quali pezzi di un colore rischiano di essere presi.
 *
 * Non basta "attaccato", altrimenti in mediogioco mezza scacchiera sarebbe
 * rossa (due pedoni che si guardano, un pezzo attaccato ma ben difeso).
 * Un pezzo e' minacciato se:
 *   - e' attaccato e nessuno lo difende, oppure
 *   - e' attaccato da un pezzo che vale meno di lui (prenderlo conviene
 *     anche se poi si viene ripresi).
 * Il re e' minacciato quando e' sotto scacco.
 */
import { Chess } from "../vendor/chess.js";

const VALORE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

export function minacciate(fen, colore) {
  let g;
  try { g = new Chess(fen); } catch (e) { return []; }
  const altro = colore === "w" ? "b" : "w";
  const out = [];
  for (const f of "abcdefgh") for (let r = 1; r <= 8; r++) {
    const sq = f + r;
    const p = g.get(sq);
    if (!p || p.color !== colore) continue;
    const att = g.attackers(sq, altro);
    if (!att.length) continue;
    if (p.type === "k") { out.push(sq); continue; }
    const difeso = g.attackers(sq, colore).length > 0;
    const minimo = Math.min(...att.map((a) => VALORE[g.get(a).type]));
    if (!difeso || minimo < VALORE[p.type]) out.push(sq);
  }
  return out;
}
