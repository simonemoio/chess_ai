/**
 * Taratura dei caratteri dell'avversario, in node, col motore WASM vero.
 *
 *     node prova_stili.mjs            # usa le posizioni in cache se ci sono
 *     node prova_stili.mjs --nuove    # rigenera le posizioni (qualche minuto)
 *
 * 1. Genera posizioni di mediogioco/finale facendo giocare il bot neutro
 *    contro se stesso (libro + surrogato) e salva le candidate del motore
 *    in .dev/posizioni_stili.json.
 * 2. Per ogni carattere e livello misura sulle stesse posizioni:
 *      - perdita media per mossa, in probabilita' di vittoria (la "forza");
 *      - quanto spesso gioca scacchi, catture, cambi, sacrifici (lo "stile").
 * 3. Trova per ogni carattere il moltiplicatore di temperatura `t` che
 *    riporta la perdita media a quella del neutro. Va copiato in js/stile.js.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import initEngine from "./.dev/package/index.js";
import { leggiMultiPv } from "./js/motore.js";
import { Chess } from "./vendor/chess.js";
import { distribuzione, campiona, utilita, perditaVisibile, difficolta, temperatura, vittoria } from "./js/avversario.js";
import { STILI, imposta, segnali, PESO, TOLLERANZA_SACRIFICIO } from "./js/stile.js";

const CACHE = "./.dev/posizioni_stili.json";
const PARTITE = 14;
const PLY_MAX = 80;
const ELO = [1100, 1500, 1900];

const fetchFinta = async (u) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync("./data/" + u.split("?")[0].split("/").pop(), "utf8")),
});
globalThis.fetch = fetchFinta;

// ------------------------------------------------------------- posizioni
let posizioni = existsSync(CACHE) && !process.argv.includes("--nuove")
  ? JSON.parse(readFileSync(CACHE, "utf8")) : null;

if (!posizioni) {
  const righe = [];
  const log = console.log;
  console.log = (...a) => righe.push(String(a[0]));
  const sf = await initEngine("./.dev/package/bin/stockfish-18-lite-single.js");
  globalThis.fetch = fetchFinta; // stockfish la azzera
  const attendi = (cmd) => new Promise((r) => {
    const n = righe.length;
    sf.sendCommand(cmd);
    const iv = setInterval(() => {
      const nu = righe.slice(n);
      if (nu.some((l) => /^(bestmove|readyok|uciok)/.test(l))) { clearInterval(iv); r(nu); }
    }, 5);
  });
  await attendi("uci");
  sf.sendCommand("setoption name MultiPV value 8");
  await attendi("isready");

  posizioni = {};
  const motore = {
    async multipv(fen, n, depth) {
      if (posizioni[fen]) return posizioni[fen].slice(0, n);
      sf.sendCommand("position fen " + fen);
      const r = leggiMultiPv(await attendi("go depth " + depth), 8);
      return r.slice(0, n);
    },
  };
  imposta("neutro");
  const t0 = Date.now();
  for (let p = 0; p < PARTITE; p++) {
    const g = new Chess();
    const elo = ELO[p % ELO.length];
    while (!g.isGameOver() && g.history().length < PLY_MAX) {
      const fen = g.fen();
      const dist = await distribuzione(motore, fen, elo, 8, 10);
      if (!dist.length) break;
      if (!dist[0].libro && g.history().length >= 12) {
        // fuori libro: salvo le candidate per la taratura
        posizioni[fen] = await motore.multipv(fen, 8, 10);
      }
      g.move(campiona(dist).uci, { strict: false });
    }
    log(`  partita ${p + 1}/${PARTITE}: ${g.history().length} semimosse, `
      + `${Object.keys(posizioni).length} posizioni, ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  console.log = log;
  mkdirSync("./.dev", { recursive: true });
  writeFileSync(CACHE, JSON.stringify(posizioni));
}

const fens = Object.keys(posizioni);
console.log(`${fens.length} posizioni\n`);
const cache = { async multipv(fen, n) { return posizioni[fen].slice(0, n); } };

// ------------------------------------------------------------- misura
// Tutto cio' che non dipende dal carattere si calcola una volta per
// candidata (lento: chess.js) e si salva in .dev/info_stili.json, a blocchi:
// BUDGET_S limita i secondi per esecuzione, rilanciando si riprende.
// Poi la distribuzione di ogni carattere e' solo aritmetica, con la stessa
// formula di distribuzione() in js/avversario.js; la verifico sotto contro
// la funzione vera.
const INFO = "./.dev/info_stili.json";
const info = existsSync(INFO) ? JSON.parse(readFileSync(INFO, "utf8")) : {};
const tInfo = Date.now();
const BUDGET = +(process.env.BUDGET_S || 1e9) * 1000;
for (const fen of fens) {
  if (info[fen]) continue;
  if (Date.now() - tInfo > BUDGET) break;
  const cand = posizioni[fen];
  const senza = cand.filter((c) => c.matto === null || c.matto === undefined);
  const rif = senza.length ? Math.max(...senza.map((c) => c.cp ?? 0)) : null;
  const vis = cand.map((c) => perditaVisibile(fen, c.uci));
  const inev = Math.min(...vis);
  const ub = Math.max(...cand.map((c) => utilita(c, rif)));
  info[fen] = cand.map((c, i) => {
    const m = new Chess(fen).move(c.uci, { strict: false });
    const s = segnali(fen, c.uci, vis[i]);
    const s0 = segnali(fen, c.uci, 0);
    return {
      uci: c.uci, cp: c.cp ?? 0, matto: c.matto ?? null, rif,
      u: utilita(c, rif), apparente: vis[i] - inev, diff: difficolta(fen, c.uci),
      sa: s.attacco, sr: s.rischio, sa0: s0.attacco, sr0: s0.rischio,
      perdita: Math.max(0, ub - utilita(c, rif)),
      scacco: m.san.includes("+") || m.san.includes("#"),
      cattura: !!m.captured,
      cambio: s.rischio <= -0.3,
      sacrificio: vis[i] > 0 && (c.cp ?? 0) >= (rif ?? 0) - 200,
    };
  });
}
writeFileSync(INFO, JSON.stringify(info));
{
  const fatte = fens.filter((f) => info[f]).length;
  if (fatte < fens.length) {
    console.log(`precalcolo: ${fatte}/${fens.length}, rilancia per continuare`);
    process.exit(0);
  }
}

const PESO_X = +(process.env.PESO || PESO);
function dist(fen, k, elo) {
  const st = STILI[k];
  const t = temperatura(elo) * st.t;
  const toll = TOLLERANZA_SACRIFICIO * Math.max(0, st.rischio) * Math.max(0, st.attacco);
  const sc = info[fen].map((x) => {
    const uMax = Math.max(...info[fen].map((y) => y.u));
    let u = x.u;
    const sacr = x.rif !== null && x.cp >= x.rif - 50 - toll && x.cp > -300;
    if (x.apparente > 0 && x.matto === null && !sacr) u = Math.min(u, vittoria(-x.apparente));
    const sa = sacr ? x.sa : x.sa0, sr = sacr ? x.sr : x.sr0;
    const w = Math.max(0, 1 - (uMax - x.u) / 0.25);
    const b = (st.attacco || st.rischio) ? w * PESO_X * (st.attacco * sa + st.rischio * sr) : 0;
    return (u - x.diff + b) / t;
  });
  const mx = Math.max(...sc);
  const e = sc.map((v) => Math.exp(v - mx));
  const tot = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / tot);
}

if (process.argv.includes("--verifica")) {
  for (const k of Object.keys(STILI)) {
    imposta(k);
    for (const fen of fens.slice(0, 25)) {
      const vera = await distribuzione(cache, fen, 1500, 8, 10);
      const mia = dist(fen, k, 1500);
      for (const d of vera) {
        const i = info[fen].findIndex((x) => x.uci === d.uci);
        if (Math.abs(mia[i] - d.p) > 1e-9) throw new Error(`formula diversa da distribuzione(): ${k} ${fen} ${d.uci}`);
      }
    }
  }
  console.log("formula identica a distribuzione() su 25 posizioni x 5 caratteri");
}

function misura(k, elo) {
  const tot = { perdita: 0, gravi: 0, scacco: 0, cattura: 0, cambio: 0, sacrificio: 0, attacco: 0 };
  for (const fen of fens) {
    const p = dist(fen, k, elo);
    info[fen].forEach((x, i) => {
      tot.perdita += p[i] * x.perdita;
      tot.gravi += p[i] * (x.perdita >= 0.15 ? 1 : 0); // soglia "errore grave" Lichess
      for (const c of ["scacco", "cattura", "cambio", "sacrificio"]) tot[c] += p[i] * (x[c] ? 1 : 0);
      tot.attacco += p[i] * x.sa;
    });
  }
  for (const c in tot) tot[c] /= fens.length;
  return tot;
}

const perditaMedia = (k) => ELO.reduce((a, e) => a + misura(k, e).perdita, 0) / ELO.length;

// ------------------------------------------------------------- taratura
const obiettivo = perditaMedia("neutro");
for (const k of Object.keys(STILI)) {
  if (k === "neutro") continue;
  let lo = 0.3, hi = 2;
  for (let i = 0; i < 20; i++) {
    STILI[k].t = (lo + hi) / 2;
    if (perditaMedia(k) > obiettivo) hi = STILI[k].t; else lo = STILI[k].t;
  }
  STILI[k].t = Math.round(((lo + hi) / 2) * 100) / 100;
}

const pct = (x) => (x * 100).toFixed(1).padStart(5) + "%";
console.log("stile          t     Elo  perdita  gravi  scacchi catture  cambi  sacrif.  attacco");
for (const k of Object.keys(STILI)) {
  for (const e of ELO) {
    const m = misura(k, e);
    console.log(`${k.padEnd(13)} ${STILI[k].t.toFixed(2)}  ${e}  ${(m.perdita * 100).toFixed(2).padStart(6)} ${pct(m.gravi)}  `
      + `${pct(m.scacco)}  ${pct(m.cattura)} ${pct(m.cambio)} ${pct(m.sacrificio)}  ${m.attacco.toFixed(3).padStart(6)}`);
  }
}
console.log("\nDa copiare in js/stile.js:");
for (const k of Object.keys(STILI)) console.log(`  ${k}: t = ${STILI[k].t}`);
process.exit(0);
