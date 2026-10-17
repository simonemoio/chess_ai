/**
 * Revisione delle mosse: quanto ti e' costata ogni mossa rispetto alla migliore.
 *
 * Il costo non si misura in centipawn ma in "probabilita' di vittoria": perdere
 * un pedone a +0,3 pesa molto, perderlo a +6 quasi niente. E' la stessa curva
 * che usa Lichess (chances in [-1, 1]), con le stesse soglie:
 *   imprecisione >= 0,1   errore >= 0,2   errore grave >= 0,3
 */
import { Chess } from "../vendor/chess.js";
import { peso, valPov } from "./analisi.js";

/** Chances di vittoria in [-1, 1] dal punto di vista di chi muove. */
export function chances(cp, matto) {
  const v = Math.max(-1000, Math.min(1000, peso(cp, matto)));
  return 2 / (1 + Math.exp(-0.00368208 * v)) - 1;
}

export const CLASSI = {
  imprecisione: { simbolo: "?!", nome: "Imprecisione" },
  errore:       { simbolo: "?",  nome: "Errore" },
  grave:        { simbolo: "??", nome: "Errore grave" },
};

export function classifica(perdita) {
  if (perdita >= 0.3) return "grave";
  if (perdita >= 0.2) return "errore";
  if (perdita >= 0.1) return "imprecisione";
  return null;
}

const uciDi = (m) => m.from + m.to + (m.promotion || "");

/**
 * Valuta una mossa giocata.
 *
 * `analisi` e' l'albero gia' calcolato per la posizione `fen` (le schede del
 * pannello): se la mossa giocata e' fra le candidate non serve chiamare il
 * motore. Altrimenti una sola valutazione in piu'.
 *
 * @returns {migliore:{uci,san,cp,matto}, giocata:{uci,san,cp,matto}, perdita, classe}
 */
export async function valutaMossa(motore, fen, uciGiocata, analisi = null, depth = 12) {
  const g = new Chess(fen);
  const pov = g.turn();
  const sanDi = (uci) => {
    const m = new Chess(fen).moves({ verbose: true }).find(
      (x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
    return m ? m.san : uci;
  };

  let candidate = analisi && analisi.length
    ? analisi.map((r) => ({ uci: r.uci, san: r.san, cp: r.oggettiva, matto: r.ogg_matto }))
    : null;

  if (!candidate) {
    const r = await motore.multipv(fen, 1, depth);
    if (!r.length) return null;
    const dopo = new Chess(fen);
    dopo.move(sanDi(r[0].uci));
    const v = await valPov(motore, dopo.fen(), pov, depth);
    candidate = [{ uci: r[0].uci, san: sanDi(r[0].uci), cp: v.cp, matto: v.matto }];
  }

  const migliore = candidate.reduce((a, b) =>
    peso(b.cp, b.matto) > peso(a.cp, a.matto) ? b : a);

  let giocata = candidate.find((c) => c.uci === uciGiocata);
  if (!giocata) {
    const dopo = new Chess(fen);
    dopo.move(sanDi(uciGiocata));
    const v = await valPov(motore, dopo.fen(), pov, depth);
    giocata = { uci: uciGiocata, san: sanDi(uciGiocata), cp: v.cp, matto: v.matto };
  }

  const perdita = giocata.uci === migliore.uci ? 0
    : Math.max(0, chances(migliore.cp, migliore.matto) - chances(giocata.cp, giocata.matto));

  return {
    migliore, giocata,
    perdita: Math.round(perdita * 1000) / 1000,
    cpPerso: Math.max(0, peso(migliore.cp, migliore.matto) - peso(giocata.cp, giocata.matto)),
    classe: classifica(perdita),
  };
}

export { uciDi };
