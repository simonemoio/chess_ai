/**
 * Albero delle probabilita' e continuazione simulata.
 *
 * Due numeri per ogni mossa candidata:
 *   - oggettiva : quanto vale contro il gioco perfetto (Stockfish)
 *   - EV pratico: media delle valutazioni pesata sulle probabilita' delle
 *                 risposte dell'avversario a quel livello
 * La divergenza fra i due e' il contenuto didattico.
 */
import { Chess } from "../vendor/chess.js";
import { distribuzione } from "./avversario.js";
import { cerca as cercaApertura } from "./aperture.js";
import { analizza as analizzaStrutture } from "./strutture.js";

export const MATTO_PESO = 2000; // quanto vale un matto nell'aritmetica dell'EV

/** Valore numerico per la media pesata: il matto vale molto ma non infinito. */
export function peso(cp, matto) {
  if (matto !== null && matto !== undefined) {
    return matto > 0 ? MATTO_PESO : -MATTO_PESO;
  }
  return cp === null || cp === undefined ? 0 : cp;
}

/** Valutazione dal punto di vista di `pov` ('w'|'b'), non di chi muove. */
async function valPov(motore, fen, pov, depth) {
  const g = new Chess(fen);
  if (g.isCheckmate()) {
    // chi deve muovere e' matto
    const perde = g.turn();
    return { cp: null, matto: perde === pov ? 0 : 1 };
  }
  if (g.isGameOver()) return { cp: 0, matto: null };

  const s = await motore.score(fen, depth);
  const diChiMuove = g.turn() === pov;
  if (s.matto !== null) {
    return { cp: null, matto: diChiMuove ? s.matto : -s.matto };
  }
  return { cp: diChiMuove ? s.cp : -s.cp, matto: null };
}

const NOMI = { p: "Pedone", n: "Cavallo", b: "Alfiere", r: "Torre", q: "Donna", k: "Re" };
const GLIFI = { p: "\u265F", n: "\u265E", b: "\u265D", r: "\u265C", q: "\u265B", k: "\u265A" };

function descrivi(fen, uci) {
  const g = new Chess(fen);
  const m = g.moves({ verbose: true }).find(
    (x) => x.lan === uci || x.from + x.to === uci.slice(0, 4)
  );
  if (!m) return null;
  return { san: m.san, nome: NOMI[m.piece], glifo: GLIFI[m.piece] };
}

function chiaveApertura(fen) {
  return fen.split(" ").slice(0, 3).join(" ");
}

/**
 * Per ogni mossa candidata: risposte probabili, oggettiva, EV pratico.
 * `suRiga` viene chiamata appena una scheda e' pronta, per il rendering
 * progressivo: il primo risultato compare dopo ~1s invece che dopo 4.
 */
export async function albero(motore, fen, elo, opt = {}) {
  const { nCand = 4, nRisp = 3, depth = 12, suRiga = null } = opt;
  const base = new Chess(fen);
  const pov = base.turn();

  const cand = await motore.multipv(fen, nCand, depth);
  const righe = [];

  for (const c of cand) {
    const d = descrivi(fen, c.uci);
    if (!d) continue;

    const g = new Chess(fen);
    g.move(d.san);
    const fenDopo = g.fen();

    const ogg = await valPov(motore, fenDopo, pov, depth);
    const ap = cercaApertura(chiaveApertura(fenDopo));

    const risposte = await distribuzione(motore, fenDopo, elo, nRisp, Math.max(8, depth - 2));

    const dettaglio = [];
    let ev = 0, pContro = 0, pPro = 0;
    const totP = risposte.reduce((a, b) => a + b.p, 0) || 1;

    for (const r of risposte) {
      const dr = descrivi(fenDopo, r.uci);
      if (!dr) continue;
      const g2 = new Chess(fenDopo);
      g2.move(dr.san);
      const v = await valPov(motore, g2.fen(), pov, depth);
      const quota = r.p / totP;
      ev += quota * peso(v.cp, v.matto);
      if (v.matto !== null) {
        if (v.matto > 0) pPro += quota; else pContro += quota;
      }
      dettaglio.push({
        san: dr.san, nome: dr.nome, glifo: dr.glifo,
        p: Math.round(r.p * 1000) / 10, cp: v.cp, matto: v.matto,
      });
    }

    const riga = {
      san: d.san, uci: c.uci, nome: d.nome, glifo: d.glifo,
      ap: ap ? { eco: ap[0], nome: ap[1] } : null,
      oggettiva: ogg.cp, ogg_matto: ogg.matto,
      ev: Math.round(ev),
      divergenza: Math.round(ev - peso(ogg.cp, ogg.matto)),
      matto_contro: Math.round(pContro * 1000) / 10,
      matto_pro: Math.round(pPro * 1000) / 10,
      risposte: dettaglio,
    };
    righe.push(riga);
    if (suRiga) suRiga(riga, righe.length, cand.length);
  }

  righe.sort((a, b) => b.ev - a.ev);
  return righe;
}

/**
 * Continuazione plausibile: TU giochi sempre la migliore secondo Stockfish,
 * l'AVVERSARIO la piu' probabile secondo il modello umano.
 *
 * Non e' la PV di Stockfish, che assume difesa perfetta — ed e' proprio per
 * questo che qui compaiono matti che la PV non mostra mai.
 */
export async function linea(motore, fen, elo, primaUci, opt = {}) {
  const { plies = 10, depth = 8 } = opt;
  const g = new Chess(fen);
  const pov = g.turn();

  const v0 = await valPov(motore, fen, pov, depth);
  const cp0 = peso(v0.cp, v0.matto);

  const mosse = [];
  let prob = 1;

  const d0 = descrivi(fen, primaUci);
  if (!d0) throw new Error("mossa non valida");
  const voce0 = { san: d0.san, nome: d0.nome, glifo: d0.glifo, mio: true, p: null, n: g.moveNumber() };
  g.move(d0.san);
  const v1 = await valPov(motore, g.fen(), pov, depth);
  voce0.cp = v1.cp; voce0.matto = v1.matto;
  const a0 = cercaApertura(chiaveApertura(g.fen()));
  voce0.ap = a0 ? { eco: a0[0], nome: a0[1] } : null;
  mosse.push(voce0);

  for (let i = 0; i < plies - 1; i++) {
    if (g.isGameOver()) break;
    const mio = g.turn() === pov;
    const n = g.moveNumber();
    let uci = null, p = null;

    if (mio) {
      const r = await motore.multipv(g.fen(), 1, depth);
      if (!r.length) break;
      uci = r[0].uci;
    } else {
      const dist = await distribuzione(motore, g.fen(), elo, 1, depth);
      if (!dist.length) break;
      uci = dist[0].uci;
      prob *= dist[0].p;
      p = Math.round(dist[0].p * 1000) / 10;
    }

    const d = descrivi(g.fen(), uci);
    if (!d) break;
    const voce = { san: d.san, nome: d.nome, glifo: d.glifo, mio, p, n };
    g.move(d.san);
    const v = await valPov(motore, g.fen(), pov, depth);
    voce.cp = v.cp; voce.matto = v.matto;
    const a = cercaApertura(chiaveApertura(g.fen()));
    voce.ap = a ? { eco: a[0], nome: a[1] } : null;
    mosse.push(voce);
  }

  // verdetto
  let esito = null;
  if (g.isCheckmate()) {
    const mioMatto = g.turn() !== pov;
    esito = { tipo: "matto", mio: mioMatto, in: null,
      testo: mioMatto ? "Matto. Vinci tu." : "Matto. Perdi tu." };
  } else if (g.isStalemate()) {
    esito = { tipo: "patta", mio: null, in: null, testo: "Stallo: patta." };
  } else if (g.isInsufficientMaterial()) {
    esito = { tipo: "patta", mio: null, in: null, testo: "Materiale insufficiente: patta." };
  } else {
    const v = await valPov(motore, g.fen(), pov, depth);
    if (v.matto !== null && v.matto !== 0) {
      const mioMatto = v.matto > 0;
      esito = { tipo: "matto_forzato", mio: mioMatto, in: Math.abs(v.matto),
        testo: mioMatto ? `Matto forzato in ${Math.abs(v.matto)}: vinci tu.`
                        : `Matto forzato in ${Math.abs(v.matto)}: perdi tu.` };
    }
  }

  const ultima = mosse[mosse.length - 1];
  const cpFin = ultima ? peso(ultima.cp, ultima.matto) : cp0;
  const ultimaAp = [...mosse].reverse().find((m) => m.ap);
  const fuori = mosse.findIndex((m) => !m.ap);

  return {
    mosse,
    prob: Math.round(prob * 1000) / 10,
    esito,
    cp0,
    cp_fin: cpFin,
    saldo: cpFin - cp0,
    apertura: ultimaAp ? ultimaAp.ap : null,
    fuori_libro: fuori === -1 ? null : fuori + 1,
    struttura: analizzaStrutture(g.fen()),
  };
}
