/**
 * Revisione delle mosse: quanto ti e' costata ogni mossa rispetto alla migliore.
 *
 * Il costo non si misura in centipawn ma in "probabilita' di vittoria": perdere
 * un pedone a +0,3 pesa molto, perderlo a +6 quasi niente. E' la stessa curva
 * che usa Lichess (chances in [-1, 1]), con le stesse soglie:
 *   imprecisione >= 0,1   errore >= 0,2   errore grave >= 0,3
 *
 * Con la sola curva, pero', a partita gia' decisa non si vede piu' niente:
 * a -5 regalare una torre sposta la probabilita' di pochissimo, e a -10 nulla.
 * Per un allenamento serve vederlo lo stesso, quindi classificaMossa() aggiunge
 * due regole (vedi li').
 */
import { Chess } from "../vendor/chess.js";
import { peso, valPov } from "./analisi.js";
import { minacce } from "./minacce.js";

const VALORE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Materiale che resta esposto dopo la mossa, in pedoni: il piu' grosso dei
 * pezzi propri in presa (indifeso, o attaccato da un pezzo che vale meno),
 * al netto di quello che la mossa ha catturato. E' quello che un giocatore
 * vede "a occhio", anche quando il motore, a partita decisa, non lo distingue.
 */
export function esposto(fen, uci) {
  const g = new Chess(fen);
  const m = g.moves({ verbose: true }).find((x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
  if (!m) return 0;
  const lato = g.turn(), altro = lato === "w" ? "b" : "w";
  g.move(m.san);
  if (g.isCheckmate()) return 0;
  let max = 0;
  for (const sq of minacce(g.fen(), lato).rosse) {
    const p = g.get(sq);
    if (!p || p.type === "k") continue;
    const att = g.attackers(sq, altro);
    const difeso = g.attackers(sq, lato).length > 0;
    const minimo = Math.min(...att.map((x) => VALORE[g.get(x).type]));
    max = Math.max(max, difeso ? Math.max(0, VALORE[p.type] - minimo) : VALORE[p.type]);
  }
  return Math.max(0, max - (m.captured ? VALORE[m.captured] : 0));
}

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

const TETTO = 1500;   // oltre +-15 le differenze di valutazione sono rumore
const taglia = (v) => Math.max(-TETTO, Math.min(TETTO, v));
const ORDINE = [null, "imprecisione", "errore", "grave"];
const piuGrave = (a, b) => (ORDINE.indexOf(a) >= ORDINE.indexOf(b) ? a : b);

/**
 * Classe di una mossa: la curva di Lichess, piu' due regole per le partite
 * gia' decise.
 *  - Matto: permettere un matto che non c'era e' sempre un errore grave;
 *    perdere un matto forzato e' un errore.
 *  - Materiale: perdere 3 pedoni o piu' rispetto alla migliore e' un errore
 *    grave, 2 un errore, anche se la probabilita' di vittoria non cambia
 *    quasi. Non vale se dopo la mossa si resta nettamente avanti (+3): li'
 *    e' vincere piu' lentamente, e basta la curva.
 *  - Pezzo esposto: lasciare in presa 3 pedoni di materiale in piu' della
 *    migliore e' un errore grave, 2 un errore, purche' il motore confermi
 *    che la mossa e' peggio di almeno un pedone. A partita decisa le
 *    valutazioni si comprimono (regalare cavallo e torre a -7 puo' valere
 *    "solo" due pedoni), mentre il pezzo in presa si vede sempre.
 */
export function classificaMossa(migliore, giocata, perdita, piuEsposto = 0) {
  let c = classifica(perdita);
  const mm = migliore.matto ?? null, mg = giocata.matto ?? null;
  if (mg !== null && mg < 0 && !(mm !== null && mm < 0)) return "grave";
  // matto mancato: errore, ma solo imprecisione se si resta a +5 o piu'
  if (mm !== null && mm > 0 && !(mg !== null && mg > 0)) {
    c = piuGrave(c, mg === null && giocata.cp >= 500 ? "imprecisione" : "errore");
  }
  // le regole sul materiale valgono per chi non e' gia' nettamente avanti:
  // da +12 a +7 e' vincere piu' lentamente, non un errore da segnalare
  if (mm === null && mg === null && giocata.cp < 300) {
    const d = taglia(migliore.cp) - taglia(giocata.cp);
    c = piuGrave(c, d >= 300 ? "grave" : d >= 200 ? "errore" : null);
    if (d >= 100) c = piuGrave(c, piuEsposto >= 3 ? "grave" : piuEsposto >= 2 ? "errore" : null);
  }
  return c;
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
    classe: giocata.uci === migliore.uci ? null
      : classificaMossa(migliore, giocata, perdita, esposto(fen, giocata.uci) - esposto(fen, migliore.uci)),
  };
}

export { uciDi };
