/**
 * Prova end-to-end della logica, in node, col motore WASM vero.
 *
 *     node prova_logica.mjs
 *
 * Nel browser il motore gira in un Worker; in node si pilota con sendCommand.
 * Cambia solo l'adattatore: albero(), linea(), strutture e aperture sono
 * esattamente il codice che finisce nella pagina.
 */
import { readFileSync } from "fs";
import initEngine from "./.dev/package/index.js";
import { leggiMultiPv } from "./js/motore.js";
import { albero, linea } from "./js/analisi.js";
import { carica } from "./js/aperture.js";
import { Chess } from "./vendor/chess.js";
import { distribuzione } from "./js/avversario.js";

// fetch finta per data/aperture.json
globalThis.fetch = async (u) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync("./data/" + u.split("/").pop(), "utf8")),
});

const righe = [];
const vero = console.log;
console.log = (...a) => righe.push(String(a[0]));

const sf = await initEngine("./.dev/package/bin/stockfish-18-lite-single.js");

const attendi = (cmd) => new Promise((r) => {
  const n = righe.length;
  sf.sendCommand(cmd);
  const iv = setInterval(() => {
    const nu = righe.slice(n);
    if (nu.some((l) => l.startsWith("bestmove") || l.startsWith("readyok") || l.startsWith("uciok"))) {
      clearInterval(iv); r(nu);
    }
  }, 15);
});

await attendi("uci");

let mpv = null;
const motore = {
  async multipv(fen, n, depth) {
    if (mpv !== n) {
      sf.sendCommand("setoption name MultiPV value " + n);
      await attendi("isready");
      mpv = n;
    }
    sf.sendCommand("position fen " + fen);
    return leggiMultiPv(await attendi("go depth " + depth), n);
  },
  async score(fen, depth) {
    const r = await this.multipv(fen, 1, depth);
    return r.length ? { cp: r[0].cp, matto: r[0].matto } : { cp: 0, matto: null };
  },
};

// stockfish azzera fetch in node: la rimetto dopo averlo avviato
globalThis.fetch = async (u) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync("./data/" + u.split("/").pop(), "utf8")),
});
await carica("data/aperture.json");

const g = new Chess();
for (const m of ["e4", "e5", "Nf3", "Nc6", "Bc4"]) g.move(m);

let t = Date.now();
const R = await albero(motore, g.fen(), 1400, { depth: 12 });
const tA = Date.now() - t;

t = Date.now();
const L = await linea(motore, g.fen(), 1400, R[0].uci, { plies: 10, depth: 8 });
const tL = Date.now() - t;

// posizione di matto: il caso che era sbagliato nella versione Python
const mate = "3rk3/Q4R2/1p2ppr1/1P5p/5p2/6P1/5PP1/5BK1 b - - 0 1";
const M = await albero(motore, mate, 1200, { depth: 10, nCand: 2 });

console.log = vero;
console.log(`ALBERO  ${tA} ms`);
for (const x of R) {
  console.log("  " + x.glifo + " " + x.san.padEnd(6)
    + " ogg=" + (x.ogg_matto !== null ? "M" + x.ogg_matto : x.oggettiva)
    + " ev=" + String(x.ev).padStart(5)
    + "  ap=" + (x.ap ? x.ap.eco : "-")
    + "  -> " + x.risposte.map((y) => y.san + " " + y.p + "%").join("  "));
}
console.log(`\nLINEA   ${tL} ms`);
console.log("  " + L.mosse.map((m) => m.san + (m.p ? `(${m.p}%)` : "")).join(" "));
console.log("  saldo " + L.saldo + " | esito " + (L.esito ? L.esito.testo : "-")
  + " | struttura " + (L.struttura.strutture.map((s) => s.nome).join(", ") || "-"));

console.log("\nPOSIZIONE DI MATTO");
for (const x of M) {
  console.log("  " + x.san.padEnd(6) + " ogg=" + (x.ogg_matto !== null ? "M" + x.ogg_matto : x.oggettiva)
    + " ev=" + x.ev + " matto_contro=" + x.matto_contro + "%"
    + "  -> " + x.risposte.map((y) => y.san + (y.matto !== null ? "(M" + y.matto + ")" : "")).join(" "));
}
// Regressione dell'avversario: un pezzo gratis si riprende anche quando si
// sta perdendo. Prima della correzione, sotto donna e torre, a 1500 lo
// prendeva solo il 35% delle volte.
console.log("\nPEZZO GRATIS (cavallo in e5, a 1500 si chiede almeno il 50%)");
const GRATIS = [
  ["pari", "r1bqkb1r/ppp2ppp/2np1n2/4N3/4P3/2N5/PPPP1PPP/R1BQKB1R b KQkq - 0 6"],
  ["sotto una torre", "r1bqkb2/ppp2ppp/2np1n2/4N3/4P3/2N5/PPPP1PPP/R1BQKB1R b KQq - 0 6"],
  ["sotto donna e torre", "r1b1kb2/ppp2ppp/2np1n2/4N3/4P3/2N5/PPPP1PPP/R1BQKB1R b KQq - 0 6"],
];
let falliti = 0;
console.log = (...a) => righe.push(String(a[0]));   // il motore torna a scrivere nel buffer
for (const [nome, fen] of GRATIS) {
  const d = await distribuzione(motore, fen, 1500, 8, 10);
  const p = d.filter((x) => x.uci.slice(2, 4) === "e5").reduce((a, x) => a + x.p, 0);
  const ok = p >= 0.5;
  if (!ok) falliti++;
  vero(`  ${ok ? "ok" : "KO"}  ${Math.round(p * 100)}%  ${nome}`);
}
process.exit(falliti ? 1 : 0);
