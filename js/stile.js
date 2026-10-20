/**
 * Carattere dell'avversario: due assi, entrambi in [-1, 1].
 *
 *   attacco: posizionale (-1) ... aggressivo (+1)
 *   rischio: conservativo (-1) ... spregiudicato (+1)
 *
 * Il sacrificio non e' un asse a parte: e' il quadrante aggressivo +
 * spregiudicato (cedere materiale con il re avversario a portata).
 *
 * Principio: il carattere cambia QUALI errori fa il bot, non QUANTO e' forte.
 * Ogni preset ha un moltiplicatore di temperatura `t`, tarato con
 * prova_stili.mjs perche' la perdita media per mossa (in probabilita' di
 * vittoria) resti quella dello stile neutro allo stesso Elo.
 *
 * I segnali si calcolano su una singola mossa con chess.js, senza motore.
 */
import { Chess } from "../vendor/chess.js";

export const STILI = {
  // t tarati con prova_stili.mjs (PESO 0,14, 866 posizioni, Elo 1100/1500/1900)
  neutro:       { nome: "Neutro",       attacco: 0,    rischio: 0,    t: 1 },
  posizionale:  { nome: "Posizionale",  attacco: -1,   rischio: -0.3, t: 0.91 },
  prudente:     { nome: "Prudente",     attacco: 0,    rischio: -1,   t: 1.09 },
  attaccante:   { nome: "Attaccante",   attacco: 1,    rischio: 0.3,  t: 1 },
  avventuriero: { nome: "Avventuriero", attacco: 1,    rischio: 1,    t: 0.84 },
};

// Peso dello stile sulla scala dell'utilita' (probabilita' di vittoria).
// Con 0,035 (come le penalita' dei punti ciechi) gli stili non si
// distinguevano: scacchi 5,8% -> 6,7%. Con 0,14 l'attaccante da' scacco
// il triplo del posizionale e l'avventuriero sacrifica quasi 4 volte il
// prudente, a parita' di perdita media. Oltre (0,2) per pareggiare la forza
// l'avventuriero va raffreddato troppo (t 0,67): diventerebbe un giocatore
// preciso che sacrifica, non uno del suo livello.
export const PESO = 0.14;
// Quanto peggio (cp, secondo il motore) puo' essere un sacrificio perche'
// l'avventuriero lo consideri comunque: e' qui che nascono i sacrifici
// scorretti tipici di chi attacca a tutti i costi.
export const TOLLERANZA_SACRIFICIO = 150;

let corrente = "neutro";

export function imposta(chiave) {
  if (STILI[chiave]) corrente = chiave;
}
export function chiave() {
  return corrente;
}
export function attuale() {
  return STILI[corrente];
}

const VALORE = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 0 };

function distanza(a, b) {
  return Math.max(
    Math.abs(a.charCodeAt(0) - b.charCodeAt(0)),
    Math.abs(+a[1] - +b[1]));
}

function zonaRe(sq) {
  const out = [];
  const f = sq.charCodeAt(0), r = +sq[1];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      const ff = f + df, rr = r + dr;
      if (ff >= 97 && ff <= 104 && rr >= 1 && rr <= 8) out.push(String.fromCharCode(ff) + rr);
    }
  }
  return out;
}

/**
 * Segnali di stile di una mossa: {attacco, rischio}, circa in [-1, 1].
 * `perdita` (facoltativa) = materiale che la mossa sembra regalare, in cp,
 * come lo calcola perditaVisibile() in avversario.js.
 */
const MEMO = new Map(); // l'albero e la linea tornano spesso sulle stesse mosse

export function segnali(fen, uci, perdita = 0) {
  const k = fen + " " + uci + " " + perdita;
  let r = MEMO.get(k);
  if (!r) {
    if (MEMO.size > 20000) MEMO.clear();
    r = calcola(fen, uci, perdita);
    MEMO.set(k, r);
  }
  return r;
}

function calcola(fen, uci, perdita) {
  const g = new Chess(fen);
  const m = g.moves({ verbose: true }).find((x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
  if (!m) return { attacco: 0, rischio: 0 };
  const io = g.turn();
  const lui = io === "w" ? "b" : "w";
  const reLui = g.board().flat().find((x) => x && x.type === "k" && x.color === lui);
  const cattura = !!m.captured;

  const dopo = new Chess(fen);
  dopo.move(m.san);

  // ---------------------------------------------------------------- attacco
  let att = 0;
  if (dopo.inCheck()) att += 0.5;
  if (cattura) att += 0.15;
  if (reLui && m.piece !== "k") {
    const prima = distanza(m.from, reLui.square);
    const poi = distanza(m.to, reLui.square);
    if (poi <= 2) att += 0.25;
    else if (poi < prima - 1) att += 0.15;
    // caselle intorno al re avversario che il pezzo mosso ora attacca
    let n = 0;
    for (const sq of zonaRe(reLui.square)) {
      if (dopo.attackers(sq, io).includes(m.to)) n++;
    }
    att += Math.min(0.3, 0.1 * n);
    // spinta di pedone sulle colonne del re avversario (assalto di pedoni)
    if (m.piece === "p" && !cattura &&
        Math.abs(m.to.charCodeAt(0) - reLui.square.charCodeAt(0)) <= 1) att += 0.2;
  }
  // ritirata che non scappa da niente: segno di gioco di manovra
  const rDa = +m.from[1], rA = +m.to[1];
  const indietro = io === "w" ? rA < rDa : rA > rDa;
  if (indietro && !cattura && m.piece !== "k") att -= 0.2;

  // ---------------------------------------------------------------- rischio
  let risk = 0;
  // tensione: quante catture lascio disponibili all'avversario
  const catture = dopo.moves({ verbose: true }).filter((x) => x.captured).length;
  risk += Math.min(0.4, 0.08 * catture);
  // cambio: catturo un pezzo che vale almeno quanto il mio su una casa difesa
  // (mi riprenderanno): semplifica la posizione
  if (cattura && m.piece !== "k" && VALORE[m.captured] >= VALORE[m.piece] &&
      dopo.attackers(m.to, lui).length > 0) {
    risk -= m.captured === "q" && m.piece === "q" ? 0.8 : 0.4;
  }
  // materiale lasciato a occhio: e' un sacrificio, o una scommessa
  if (perdita > 0) {
    risk += Math.min(0.8, 0.3 + perdita / 1000);
    if (reLui && distanza(m.to, reLui.square) <= 3) att += 0.3;
  }

  return { attacco: Math.max(-1, Math.min(1, att)), rischio: Math.max(-1, Math.min(1, risk)) };
}

/** Bonus di stile sulla scala dell'utilita'. 0 per lo stile neutro. */
export function bonus(fen, uci, perdita = 0, stile = attuale()) {
  if (!stile.attacco && !stile.rischio) return 0;
  const s = segnali(fen, uci, perdita);
  return PESO * (stile.attacco * s.attacco + stile.rischio * s.rischio);
}

/**
 * Peso di stile di una mossa del libro, dagli esiti delle partite reali:
 * chi attacca e rischia sceglie linee con meno patte e partite piu' corte.
 * `media` = esiti medi delle mosse della posizione. Fattore in [0,5; 2].
 */
export function pesoLibro(esiti, media, stile = attuale()) {
  if (!esiti || (!stile.attacco && !stile.rischio)) return 1;
  const zPatte = Math.max(-1, Math.min(1, (media.patte - esiti.patte) / 0.03));
  const zCorta = Math.max(-1, Math.min(1, (media.durata - esiti.durata) / 8));
  const x = 0.35 * (stile.rischio * zPatte + stile.attacco * zCorta);
  return Math.max(0.5, Math.min(2, Math.exp(x)));
}
