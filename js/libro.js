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
import { pesoLibro } from "./stile.js";

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
        const d = await r.json();
        // formato 1: [n, uci, conteggio, ...]; formato 2 aggiunge esiti e durata
        d.pos.passo = d.meta && d.meta.formato >= 2 ? 6 : 2;
        return d.pos;
      } catch {
        return null;
      }
    })());
  }
  return LIBRI.get(e);
}

/**
 * Mosse giocate in questa posizione dai giocatori della fascia.
 * @returns [{uci, p, n, esiti?}] ordinate per frequenza, oppure null se la posizione
 * non e' nel libro (o e' stata raggiunta da troppo poche partite).
 * p e' la quota sul totale delle partite: le mosse rare scartate da libro.py
 * mancano, quindi la somma puo' stare un po' sotto 1, come nel surrogato.
 * esiti (formato 2): quote di vittorie/patte/sconfitte per chi gioca la mossa
 * e durata media della partita in semimosse. Serviranno agli stili.
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
  const passo = pos.passo || 2;
  for (let i = 1; i < riga.length; i += passo) {
    if (!legali.has(riga[i])) continue;
    const c = riga[i + 1];
    const m = { uci: riga[i], p: c / n, n: c, libro: true };
    if (passo >= 6) {
      m.esiti = { vinte: riga[i + 2] / c, patte: riga[i + 3] / c, perse: riga[i + 4] / c, durata: riga[i + 5] };
    }
    out.push(m);
  }
  if (!out.length) return null;

  // Carattere: chi attacca e rischia preferisce le linee piu' decisive e piu'
  // corte. Si ripesa solo fra mosse con abbastanza partite per fidarsi degli
  // esiti, e la massa totale resta quella osservata.
  const affid = out.filter((m) => m.esiti && m.n >= 30);
  if (affid.length >= 2) {
    const tot = affid.reduce((a, m) => a + m.n, 0);
    const media = {
      patte: affid.reduce((a, m) => a + m.esiti.patte * m.n, 0) / tot,
      durata: affid.reduce((a, m) => a + m.esiti.durata * m.n, 0) / tot,
    };
    const massa = affid.reduce((a, m) => a + m.p, 0);
    for (const m of affid) m.p *= pesoLibro(m.esiti, media);
    const nuova = affid.reduce((a, m) => a + m.p, 0);
    if (nuova > 0) for (const m of affid) m.p *= massa / nuova;
    out.sort((a, b) => b.p - a.p);
  }
  return out.slice(0, top);
}
