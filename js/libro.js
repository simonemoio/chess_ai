/**
 * Libro d'aperture per fascia Elo, da partite vere di Lichess (CC0).
 *
 * I file data/libro-<elo>.json li genera libro.py. Finche' non ci sono il
 * libro e' semplicemente vuoto e l'avversario usa il surrogato su Stockfish
 * fin dalla prima mossa, come prima.
 *
 * Nelle prime semimosse un giocatore da 1200 non calcola: ripete quello che
 * ha visto e giocato. Quindi qui la distribuzione non e' una stima, e' la
 * frequenza osservata a quel livello, comprese le linee teoricamente
 * scorrette ma tipiche della fascia.
 */
import { Chess } from "../vendor/chess.js";

const FASCE = [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
const LIBRI = new Map(); // elo -> Promise<pos | null>

function versione() {
  const m = typeof document !== "undefined" && document.querySelector('meta[name="versione"]');
  return m ? "?v=" + m.content : "";
}

/** Primi tre campi della FEN, come aperture.js e libro.py. */
function chiave(fen) {
  return fen.split(" ").slice(0, 3).join(" ");
}

function fascia(elo) {
  return FASCE.reduce((a, b) => (Math.abs(b - elo) < Math.abs(a - elo) ? b : a));
}

/** Carica (una volta sola) il libro della fascia. null se il file non c'e'. */
export function carica(elo) {
  const e = fascia(elo);
  if (!LIBRI.has(e)) {
    LIBRI.set(e, (async () => {
      try {
        const r = await fetch(`data/libro-${e}.json` + versione());
        if (!r.ok) return null;
        return (await r.json()).pos;
      } catch {
        return null;
      }
    })());
  }
  return LIBRI.get(e);
}

/**
 * Mosse giocate in questa posizione dai giocatori della fascia.
 * @returns [{uci, p, n}] ordinate per frequenza, oppure null se la posizione
 * non e' nel libro (o e' stata raggiunta da troppo poche partite).
 * p e' la quota sul totale delle partite: le mosse rare scartate da libro.py
 * mancano, quindi la somma puo' stare un po' sotto 1, come nel surrogato.
 */
export async function mosse(fen, elo, top = 4) {
  const pos = await carica(elo);
  const riga = pos && pos[chiave(fen)];
  if (!riga) return null;

  // Difesa: la chiave ignora l'en passant, quindi controllo che ogni mossa
  // sia davvero legale qui prima di proporla.
  const legali = new Set(new Chess(fen).moves({ verbose: true }).map((m) => m.lan));
  const n = riga[0];
  const out = [];
  for (let i = 1; i < riga.length; i += 2) {
    if (legali.has(riga[i])) out.push({ uci: riga[i], p: riga[i + 1] / n, n: riga[i + 1], libro: true });
  }
  return out.length ? out.slice(0, top) : null;
}
