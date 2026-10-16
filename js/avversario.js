/**
 * Modello giocattolo del giocatore umano, costruito sopra Stockfish.
 *
 * NON e' Maia. Serve a far girare il prototipo senza una rete addestrata.
 * L'idea: piu' l'Elo e' basso, piu' la distribuzione e' piatta; e certe mosse
 * sono meno probabili non perche' siano cattive ma perche' sono difficili da
 * VEDERE — all'indietro, silenziose, lunghe.
 *
 * Conseguenza nota: le distribuzioni restano piu' piatte e piu' sparse di
 * quelle di un umano vero, e la differenza fra 1100 e 1900 si sente meno di
 * quanto dovrebbe.
 */
import { Chess } from "../vendor/chess.js";

export function temperatura(elo) {
  // 1100 -> ~140 cp di rumore; 1900 -> ~55
  return Math.max(40, 260 - 0.108 * elo);
}

/** Penalita' in centipawn: quanto e' difficile che un umano NOTI questa mossa. */
export function difficolta(fen, uci) {
  const g = new Chess(fen);
  const mosse = g.moves({ verbose: true });
  const m = mosse.find((x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
  if (!m) return 0;

  let pen = 0;
  const cattura = m.flags.includes("c") || m.flags.includes("e");
  const bianco = g.turn() === "w";

  if (!cattura) {
    const dopo = new Chess(fen);
    dopo.move(m.san);
    if (!dopo.inCheck()) pen += 35; // mossa silenziosa
  }

  const rDa = parseInt(m.from[1], 10);
  const rA = parseInt(m.to[1], 10);
  const indietro = bianco ? rA < rDa : rA > rDa;
  if (indietro) pen += 55; // blind spot noto sotto i 2000

  if ("brq".includes(m.piece)) {
    const df = Math.abs(m.to.charCodeAt(0) - m.from.charCodeAt(0));
    const dr = Math.abs(rA - rDa);
    if (Math.max(df, dr) >= 4) pen += 20; // mossa lunga
  }
  return pen;
}

/**
 * Distribuzione delle risposte plausibili.
 * @returns [{uci, p}] con p normalizzata sulle mosse restituite.
 */
export async function distribuzione(motore, fen, elo, top = 4, depth = 10) {
  const cand = await motore.multipv(fen, 8, depth);
  if (!cand.length) return [];

  const t = temperatura(elo);
  const punteggi = cand.map((c) => {
    const base = c.matto !== null ? (c.matto > 0 ? 2000 : -2000) : c.cp;
    return { uci: c.uci, s: (base - difficolta(fen, c.uci)) / t };
  });

  const max = Math.max(...punteggi.map((x) => x.s));
  const esp = punteggi.map((x) => ({ uci: x.uci, e: Math.exp(x.s - max) }));
  const tot = esp.reduce((a, b) => a + b.e, 0);

  return esp
    .map((x) => ({ uci: x.uci, p: x.e / tot }))
    .sort((a, b) => b.p - a.p)
    .slice(0, top);
}

/** Campiona una mossa dalla distribuzione: il bot non gioca sempre la prima. */
export function campiona(dist) {
  const tot = dist.reduce((a, b) => a + b.p, 0);
  let r = Math.random() * tot;
  for (const d of dist) {
    r -= d.p;
    if (r <= 0) return d;
  }
  return dist[dist.length - 1];
}
