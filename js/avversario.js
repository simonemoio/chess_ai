/**
 * Modello giocattolo del giocatore umano, costruito sopra Stockfish.
 *
 * NON e' il modello addestrato definitivo. Serve a far girare il prototipo
 * finche' quella rete non c'e'.
 *
 * L'errore di una mossa si misura in PROBABILITA' DI VITTORIA, non in
 * centipawn: perdere 300 cp a +0,5 e' un disastro, a +12 quasi niente. Prima
 * il modello ragionava in centipawn e i matti valevano tutti uguale, e verso
 * la fine della partita il bot sembrava un altro giocatore:
 *   - in vantaggio non convertiva (matto in 3 e matto in 9 per lui pari);
 *   - in svantaggio andava a farsi dare matto in 1 come se niente fosse.
 * Ora lo stesso livello sbaglia "quanto" in apertura, in mediogioco e in
 * finale: e' la stessa temperatura applicata alla stessa scala.
 *
 * La curva pero' si appiattisce nelle posizioni gia' decise: a -5 perdere un
 * altro pezzo cambia la probabilita' di vittoria di pochi centesimi, e il bot
 * sotto di materiale giocava quasi a caso (torri lasciate in presa, pezzi non
 * ripresi). Un umano invece conta il materiale anche quando sta perdendo.
 * Per questo le mosse si confrontano con la MIGLIORE candidata: la curva si
 * applica alla differenza di cp, come se la posizione fosse pari. Lasciare un
 * pezzo costa lo stesso a 0, a -5 e a +12; la valutazione assoluta conta solo
 * per i matti.
 *
 * Piu' l'Elo e' basso, piu' la distribuzione e' piatta; e certe mosse sono
 * meno probabili non perche' siano cattive ma perche' sono difficili da
 * VEDERE — all'indietro, silenziose, lunghe.
 */
import { Chess } from "../vendor/chess.js";
import { minacciate } from "./minacce.js";

/** Probabilita' di vittoria in [0, 1] di chi muove (curva Lichess). */
export function vittoria(cp) {
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

// Scala dei matti, sopra/sotto la curva dei centipawn.
// Il matto in 1 ha un premio a parte: un umano lo vede quasi sempre, e
// mancarlo e' l'errore che fa sembrare stupido un bot.
const PASSO_MATTO = 0.03;   // ogni mossa in piu' per dare matto costa questo
const PREMIO_MATTO_1 = 0.3; // = il doppio della soglia di "errore grave" Lichess (0,3 su [-1,1] = 0,15 qui)

/**
 * Utilita' di una candidata per chi muove. Stessa scala per tutte le fasi:
 * [0, 1] per le posizioni senza matto, sopra 1 se dai matto, sotto 0 se lo
 * subisci. Matti piu' corti valgono di piu' (per chi li da') e di meno (per
 * chi li subisce).
 */
export function utilita(c, rif = null) {
  const matto = c.matto !== null && c.matto !== undefined;
  if (rif !== null && rif !== undefined) {
    // relativa alla migliore candidata senza matto: quella vale 0,5
    return matto ? utilita(c) - vittoria(rif) + 0.5 : vittoria((c.cp ?? 0) - rif);
  }
  if (matto) {
    const n = Math.min(Math.abs(c.matto), 12);
    const distanza = PASSO_MATTO * (12 - n);
    if (c.matto > 0) return 1 + distanza + (c.matto === 1 ? PREMIO_MATTO_1 : 0);
    // matto contro: -1 = l'avversario matta alla mossa dopo
    return 0 - distanza - (c.matto === -1 ? PREMIO_MATTO_1 : 0);
  }
  return vittoria(c.cp ?? 0);
}

/**
 * Rumore del livello, sulla scala della probabilita' di vittoria in [0, 1].
 * Attenzione: Lichess misura le "winning chances" in [-1, 1], quindi la sua
 * soglia di errore grave (0,3) qui vale 0,15. Con questa temperatura una
 * mossa che perde 0,15 ha peso relativo ~0,3 a 1100, ~0,2 a 1500, ~0,1 a
 * 1900. Tarata in autoplay sui tassi di errore, non derivata dalla soglia.
 */
export function temperatura(elo) {
  return Math.max(0.04, 0.13 - 0.0000813 * (elo - 1100));
}

/** Penalita' (stessa scala): quanto e' difficile che un umano NOTI questa mossa. */
export function difficolta(fen, uci) {
  const g = new Chess(fen);
  const mosse = g.moves({ verbose: true });
  const m = mosse.find((x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
  if (!m) return 0;

  const dopo = new Chess(fen);
  dopo.move(m.san);
  if (dopo.isCheckmate()) return 0;   // un matto si vede

  // Un pezzo minacciato che si mette in salvo non e' un punto cieco: quando un
  // pezzo e' in presa e' la prima cosa che si guarda. Senza questa eccezione
  // le ritirate pagavano la penalita' "indietro + silenziosa" e il bot
  // preferiva prendere il pezzo offerto, cadendo negli attacchi di scoperta.
  if (minacciate(fen, g.turn()).includes(m.from)) return 0;

  // Sotto scacco, "posso mangiare chi mi attacca?" e' la prima domanda che ci
  // si fa: la cattura del pezzo che da' scacco non e' mai un punto cieco,
  // nemmeno se e' all'indietro.
  if (g.inCheck()) {
    const re = g.board().flat().find((x) => x && x.type === "k" && x.color === g.turn());
    if (re && g.attackers(re.square, g.turn() === "w" ? "b" : "w").includes(m.to)) return 0;
  }

  let pen = 0;
  const cattura = m.flags.includes("c") || m.flags.includes("e");
  const bianco = g.turn() === "w";

  if (!cattura && !dopo.inCheck()) pen += 0.025; // mossa silenziosa

  const rDa = parseInt(m.from[1], 10);
  const rA = parseInt(m.to[1], 10);
  const indietro = bianco ? rA < rDa : rA > rDa;
  // il re che torna indietro in finale e' normale, non un punto cieco
  if (indietro && m.piece !== "k") pen += 0.04; // blind spot noto sotto i 2000

  if ("brq".includes(m.piece)) {
    const df = Math.abs(m.to.charCodeAt(0) - m.from.charCodeAt(0));
    const dr = Math.abs(rA - rDa);
    if (Math.max(df, dr) >= 4) pen += 0.015; // mossa lunga
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
  // riferimento: la migliore candidata senza matto (se sono tutti matti, scala assoluta)
  const senzaMatto = cand.filter((c) => c.matto === null || c.matto === undefined);
  const rif = senzaMatto.length ? Math.max(...senzaMatto.map((c) => c.cp ?? 0)) : null;
  const punteggi = cand.map((c) => ({
    uci: c.uci,
    s: (utilita(c, rif) - difficolta(fen, c.uci)) / t,
  }));

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
