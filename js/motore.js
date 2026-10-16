/**
 * Stockfish WASM dentro un Worker, con interfaccia a promesse.
 *
 * Il motore e' monothread (build lite-single): non serve SharedArrayBuffer,
 * quindi funziona su hosting statico senza header COOP/COEP.
 *
 * I comandi sono serializzati: un solo `go` alla volta, gli altri in coda.
 */
export class Motore {
  constructor(url = "vendor/stockfish-18-lite-single.js") {
    this.url = url;
    this.errore = null;
    this.debug = typeof location !== "undefined" && /[?&]debug/.test(location.search);
    this.worker = null;
    this.righe = [];
    this.inAscolto = null;
    this.coda = Promise.resolve();
    this.multiPvCorrente = null;
  }

  async avvia(suStato = null) {
    const passo = (t) => { if (suStato) suStato(t); };

    passo("creo il worker…");
    try {
      this.worker = new Worker(this.url);
    } catch (e) {
      throw new Error(
        `non riesco a creare il Worker da ${this.url} — ${e.message}. ` +
        "Di solito significa che il file non c'è o non viene servito via http.");
    }

    // Senza questo, un errore dentro il worker lascia tutto appeso in silenzio.
    this.worker.onerror = (e) => {
      this.errore = new Error(
        "errore dentro il motore" +
        (e.message ? ": " + e.message : "") +
        (e.filename ? ` (${e.filename}:${e.lineno})` : ""));
      if (this.inAscolto) this.inAscolto("__errore__");
    };
    this.worker.onmessageerror = () => {
      this.errore = new Error("messaggio illeggibile dal motore");
      if (this.inAscolto) this.inAscolto("__errore__");
    };

    this.worker.onmessage = (e) => {
      const l = typeof e.data === "string" ? e.data : String(e.data);
      this.righe.push(l);
      if (this.debug) console.log("[motore]", l);
      if (this.inAscolto) this.inAscolto(l);
    };

    passo("carico il motore (7 MB)…");
    await this._fino("uci", (l) => l.startsWith("uciok"), 60000);
    passo("preparo il motore…");
    await this._fino("isready", (l) => l.startsWith("readyok"), 60000);
    passo(null);
    return this;
  }

  /** Manda un comando e raccoglie le righe finche' `fine` non e' vera. */
  _fino(cmd, fine, timeout = 30000) {
    return new Promise((risolvi, rifiuta) => {
      const raccolte = [];
      const t = setTimeout(() => {
        this.inAscolto = null;
        rifiuta(new Error(
          `il motore non ha risposto a "${cmd}" entro ${timeout / 1000}s. ` +
          (this.righe.length
            ? "Ultima riga ricevuta: " + this.righe[this.righe.length - 1]
            : "Non ha detto proprio nulla: controlla che " +
              "vendor/stockfish-18-lite-single.wasm sia servito come application/wasm.")));
      }, timeout);
      this.inAscolto = (l) => {
        if (l === "__errore__") {
          clearTimeout(t);
          this.inAscolto = null;
          rifiuta(this.errore);
          return;
        }
        raccolte.push(l);
        if (fine(l)) {
          clearTimeout(t);
          this.inAscolto = null;
          risolvi(raccolte);
        }
      };
      this.worker.postMessage(cmd);
    });
  }

  /** Accoda: il motore UCI non sopporta due ricerche sovrapposte. */
  _accoda(fn) {
    const prossimo = this.coda.then(fn, fn);
    this.coda = prossimo.catch(() => {});
    return prossimo;
  }

  async _setMultiPv(n) {
    if (this.multiPvCorrente === n) return;
    this.worker.postMessage("setoption name MultiPV value " + n);
    await this._fino("isready", (l) => l.startsWith("readyok"));
    this.multiPvCorrente = n;
  }

  /**
   * Migliori mosse nella posizione.
   * @returns [{uci, cp, matto}] dal punto di vista di CHI MUOVE, in ordine.
   */
  multipv(fen, n = 4, depth = 12) {
    return this._accoda(async () => {
      await this._setMultiPv(n);
      this.worker.postMessage("position fen " + fen);
      const out = await this._fino("go depth " + depth, (l) =>
        l.startsWith("bestmove")
      );
      return leggiMultiPv(out, n);
    });
  }

  /**
   * Valutazione secca della posizione.
   * @returns {cp, matto} dal punto di vista di CHI MUOVE; uno dei due e' null.
   */
  async score(fen, depth = 12) {
    const r = await this.multipv(fen, 1, depth);
    if (!r.length) return { cp: 0, matto: null };
    return { cp: r[0].cp, matto: r[0].matto };
  }

  termina() {
    if (this.worker) this.worker.terminate();
  }
}

/** Estrae le righe `info ... multipv K ... score ... pv MOSSA` dell'ultima profondita'. */
export function leggiMultiPv(righe, n) {
  const per = new Map();
  for (const l of righe) {
    if (!l.startsWith("info ") || l.indexOf(" pv ") === -1) continue;
    const mpv = /\bmultipv (\d+)/.exec(l);
    const k = mpv ? parseInt(mpv[1], 10) : 1;
    if (k > n) continue;

    const sc = /\bscore (cp|mate) (-?\d+)/.exec(l);
    if (!sc) continue;
    const pv = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(l);
    if (!pv) continue;
    const prof = /\bdepth (\d+)/.exec(l);

    const voce = {
      uci: pv[1],
      cp: sc[1] === "cp" ? parseInt(sc[2], 10) : null,
      matto: sc[1] === "mate" ? parseInt(sc[2], 10) : null,
      depth: prof ? parseInt(prof[1], 10) : 0,
    };
    const prec = per.get(k);
    // tieni l'ultima profondita' raggiunta per quella linea
    if (!prec || voce.depth >= prec.depth) per.set(k, voce);
  }
  return [...per.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({ uci: v.uci, cp: v.cp, matto: v.matto }));
}
