/**
 * Spiegazioni delle mosse: i fatti li produce il codice, il modello scrive.
 *
 * Un modello linguistico piccolo non sa giocare a scacchi: inventa mosse e
 * minacce. Qui fa solo il redattore. Riceve i fatti gia' calcolati con
 * Stockfish (valutazioni, mossa migliore, linea, pezzi in presa) e li mette in
 * frasi. All'uscita controllo() verifica che ogni mossa o casa citata stia fra
 * i fatti: se no la risposta si scarta e si usa riserva(), un testo a modello
 * fisso costruito dagli stessi fatti.
 *
 * Il modulo non dipende dal modello: serve anche senza (riserva) e potra'
 * servire con qualunque altro.
 *
 * perche() e' la spiegazione a regole usata dalla revisione dell'app; il
 * modello linguistico (repository chess_llm) la riceve come uno dei fatti.
 */
import { Chess } from "../vendor/chess.js";
import { valutaMossa, CLASSI } from "./revisione.js";
import { minacce } from "./minacce.js";

const NOMI = { p: "pedone", n: "cavallo", b: "alfiere", r: "torre", q: "donna", k: "re" };
const VALORE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function sanDi(fen, uci) {
  const m = new Chess(fen).moves({ verbose: true }).find(
    (x) => x.lan === uci || x.from + x.to === uci.slice(0, 4));
  return m || null;
}

/** Linea del motore da fen: fino a `n` semimosse, in SAN. */
async function linea(motore, fen, n, depth) {
  const g = new Chess(fen);
  const out = [];
  for (let i = 0; i < n && !g.isGameOver(); i++) {
    const r = await motore.multipv(g.fen(), 1, depth);
    if (!r.length) break;
    const m = sanDi(g.fen(), r[0].uci);
    if (!m) break;
    g.move(m.san);
    out.push(m);
  }
  return out;
}

/** Materiale di `lato` meno quello dell'avversario, in pedoni. */
function bilancio(g, lato) {
  let t = 0;
  for (const x of g.board().flat()) if (x) t += (x.color === lato ? 1 : -1) * VALORE[x.type];
  return t;
}

/**
 * Bilancio alla fine di una linea giocata da fen: [ultimo, penultimo].
 * Una linea corta puo' fermarsi a meta' di uno scambio, quindi chi la usa
 * prende il piu' prudente dei due.
 */
function bilancioDopo(fen, mosse, lato) {
  const g = new Chess(fen);
  let prima = bilancio(g, lato);
  for (const m of mosse) { prima = bilancio(g, lato); g.move(m.san); }
  return [bilancio(g, lato), prima];
}

/** Pezzi di `colore` in presa (rossi) nella posizione, senza il re. */
function rossi(fen, colore) {
  const g = new Chess(fen);
  return minacce(fen, colore).rosse
    .map((sq) => ({ sq, p: g.get(sq) }))
    .filter((x) => x.p && x.p.type !== "k");
}

const MATERIALE = { 1: "un pedone", 2: "due pedoni", 3: "un pezzo", 4: "un pezzo e un pedone",
  5: "una torre", 6: "una torre e un pedone", 7: "una torre e un pedone" };
function quanto(n) {
  return n >= 8 ? "la donna o quasi" : MATERIALE[n] || `${n} pedoni`;
}
/** "l'equivalente di ..." */
function equivalente(n) {
  return n >= 8 ? "l'equivalente della donna" : "l'equivalente di " + (MATERIALE[n] || `${n} pedoni`);
}

/**
 * Guadagno immediato di una cattura, a occhio: il pezzo preso meno quello
 * che si rischia di perdere sulla casa d'arrivo. In pedoni.
 */
function guadagnoCattura(fen, m) {
  if (!m.captured) return 0;
  const g = new Chess(fen);
  g.move(m.san);
  const lato = m.color, altro = lato === "w" ? "b" : "w";
  const att = g.attackers(m.to, altro);
  let rischio = 0;
  if (att.length) {
    const difeso = g.attackers(m.to, lato).length > 0;
    const minimo = Math.min(...att.map((sq) => VALORE[g.get(sq).type] || 0));
    rischio = difeso ? Math.max(0, VALORE[m.promotion || m.piece] - minimo) : VALORE[m.promotion || m.piece];
  }
  return VALORE[m.captured] - rischio;
}

/**
 * Forchetta: dopo la mossa `m` dell'avversario, il pezzo mosso attacca due o
 * piu' pezzi di `lato` che non puo' prendere in pari (il re, pezzi che valgono
 * di piu', pezzi indifesi). @returns [nomi con casa] oppure null
 */
function forchetta(g, m, lato) {
  const altro = lato === "w" ? "b" : "w";
  const colpiti = [];
  for (const x of g.board().flat()) {
    if (!x || x.color !== lato) continue;
    if (!g.attackers(x.square, altro).includes(m.to)) continue;
    const difeso = g.attackers(x.square, lato).length > 0;
    if (x.type === "k" || VALORE[x.type] > VALORE[m.piece] || !difeso) {
      colpiti.push(`${x.type === "k" ? "il re" : NOMI[x.type] + " in " + x.square}`);
    }
  }
  return colpiti.length >= 2 ? colpiti : null;
}

/** Valutazione leggibile dal punto di vista di chi ha mosso. */
function testoValore(cp, matto) {
  if (matto !== null && matto !== undefined) {
    return matto > 0 ? `matto in ${matto} a favore` : `matto in ${-matto} contro`;
  }
  const p = cp / 100;
  return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p).toFixed(1);
}

/**
 * Fatti di una mossa giocata.
 * @returns oggetto serializzabile; `mosse` e `case` sono gli insiemi ammessi
 * nella spiegazione.
 */
export async function fatti(motore, fen, uci, depth = 12, gia = null, precedente = null) {
  const g = new Chess(fen);
  const lato = g.turn();
  const n = g.moveNumber();
  const giocataM = sanDi(fen, uci);
  if (!giocataM) return null;

  // `gia`: l'esito di valutaMossa se la revisione l'ha gia' calcolato
  const v = gia || await valutaMossa(motore, fen, uci, null, depth);
  if (!v) return null;
  const miglioreM = sanDi(fen, v.migliore.uci);

  // cosa succede dopo la mossa giocata: la risposta migliore dell'avversario
  const dopo = new Chess(fen);
  dopo.move(giocataM.san);
  // 4 semimosse: abbastanza per chiudere quasi tutti gli scambi
  const risposta = dopo.isGameOver() ? [] : await linea(motore, dopo.fen(), 4, depth - 2);

  // cosa succedeva con la mossa migliore
  const conMigliore = new Chess(fen);
  conMigliore.move(miglioreM.san);
  const seguito = conMigliore.isGameOver() ? [] : await linea(motore, conMigliore.fen(), 3, depth - 2);

  // pezzi propri in presa dopo la mossa giocata
  // (non il pezzo che ha appena catturato qualcosa di pari valore: e' uno scambio)
  const mn = minacce(dopo.fen(), lato);
  const presi = mn.rosse
    .map((sq) => ({ sq, p: dopo.get(sq) }))
    .filter((x) => x.p && x.p.type !== "k")
    .filter((x) => !(x.sq === giocataM.to && giocataM.captured &&
                     VALORE[giocataM.captured] >= VALORE[x.p.type]));
  const inPresa = presi.map((x) => `${NOMI[x.p.type]} in ${x.sq}`);
  // le catture che l'avversario puo' fare su quei pezzi: il modello le
  // nominera' quasi sempre, quindi devono essere citabili
  const catture = dopo.isGameOver() ? [] : dopo.moves({ verbose: true })
    .filter((m) => presi.some((x) => x.sq === m.to));

  // materiale: adesso, alla fine della linea dopo la mossa giocata, e alla
  // fine della linea dopo la mossa migliore
  const ora = bilancio(g, lato);
  const bg = bilancioDopo(fen, [giocataM, ...risposta], lato);
  const bm = bilancioDopo(fen, [miglioreM, ...seguito], lato);
  const conGiocata = Math.max(...bg);       // prudente: non esagerare le perdite
  const conLaMigliore = Math.min(...bm);    // ne' i guadagni mancati
  const altro = lato === "w" ? "b" : "w";

  // con la mossa migliore: pezzi avversari che diventano attaccati
  const primaRossi = new Set(rossi(fen, altro).map((x) => x.sq));
  const minacciaMigliore = rossi(conMigliore.fen(), altro)
    .filter((x) => !primaRossi.has(x.sq) && VALORE[x.p.type] >= 3)
    .map((x) => ({ pezzo: NOMI[x.p.type], casa: x.sq }));

  // dopo la risposta dell'avversario: pezzi miei che diventano attaccati
  let minacciaSubita = [];
  if (risposta.length) {
    const g3 = new Chess(dopo.fen());
    g3.move(risposta[0].san);
    const giaRossi = new Set(rossi(dopo.fen(), lato).map((x) => x.sq));
    minacciaSubita = rossi(g3.fen(), lato)
      .filter((x) => !giaRossi.has(x.sq))
      .map((x) => ({ pezzo: NOMI[x.p.type], casa: x.sq }));
  }
  // la migliore riprendeva sulla casa dove l'avversario aveva appena preso?
  const ripresa = !!(precedente && precedente.captured && miglioreM.captured && miglioreM.to === precedente.to);

  // forchetta subita con la risposta dell'avversario
  let fork = null;
  if (risposta.length) {
    const g2 = new Chess(dopo.fen());
    g2.move(risposta[0].san);
    fork = forchetta(g2, risposta[0], lato);
  }

  const mosse = [giocataM, miglioreM, ...risposta, ...seguito, ...catture];
  const case_ = new Set();
  for (const m of mosse) { case_.add(m.from); case_.add(m.to); }
  for (const x of [...minacciaMigliore, ...minacciaSubita]) case_.add(x.casa);

  return {
    numero: n,
    lato: lato === "w" ? "Bianco" : "Nero",
    mossa: (lato === "w" ? `${n}.` : `${n}...`) + giocataM.san,
    giocata: giocataM.san,
    pezzo: NOMI[giocataM.piece],
    cattura: giocataM.captured ? NOMI[giocataM.captured] : null,
    migliore: miglioreM.san,
    uguale: v.giocata.uci === v.migliore.uci,
    valoreMigliore: testoValore(v.migliore.cp, v.migliore.matto),
    valoreGiocata: testoValore(v.giocata.cp, v.giocata.matto),
    classe: v.classe ? CLASSI[v.classe].nome.toLowerCase() : null,
    perdita: v.perdita,
    risposta: risposta.map((m) => m.san),
    rispostaCattura: risposta.length && risposta[0].captured
      ? { pezzo: NOMI[risposta[0].captured], casa: risposta[0].to } : null,
    rispostaScacco: risposta.length ? /[+#]$/.test(risposta[0].san) : false,
    miglioreCattura: miglioreM.captured
      ? { pezzo: NOMI[miglioreM.captured], casa: miglioreM.to, guadagno: guadagnoCattura(fen, miglioreM) } : null,
    miglioreScacco: /[+#]$/.test(miglioreM.san),
    mattoContro: v.giocata.matto !== null && v.giocata.matto !== undefined && v.giocata.matto < 0
      ? -v.giocata.matto : null,
    mattoPerso: v.migliore.matto !== null && v.migliore.matto !== undefined && v.migliore.matto > 0
      && !(v.giocata.matto > 0) ? v.migliore.matto : null,
    materiale: { ora, conGiocata, conLaMigliore },
    forchetta: fork,
    minacciaMigliore,
    minacciaSubita,
    ripresa,
    seguito: [miglioreM.san, ...seguito.map((m) => m.san)],
    inPresa,
    catture: [...new Set(catture.map((m) => m.san))],
    // il pezzo appena mosso e' finito in presa?
    mossoInPresa: presi.some((x) => x.sq === giocataM.to)
      ? { pezzo: NOMI[giocataM.promotion || giocataM.piece], casa: giocataM.to,
          da: catture.filter((m) => m.to === giocataM.to).map((m) => m.san) }
      : null,
    mosse: [...new Set(mosse.map((m) => m.san))],
    case: [...case_].sort(),
  };
}

// ------------------------------------------------------------------ prompt

export const ISTRUZIONI = [
  "Sei un istruttore di scacchi che spiega una mossa a un giocatore di club.",
  "Usa SOLO i fatti forniti. Non inventare mosse, case, pezzi o minacce.",
  "Puoi citare solo le mosse elencate in MOSSE CITABILI, scritte esattamente così.",
  "Scrivi in italiano, 2 o 3 frasi, senza elenchi e senza titoli.",
  "Spiega perché la mossa giocata è buona o cattiva e cosa era meglio.",
].join("\n");

export function prompt(f) {
  const r = [
    `Mossa: ${f.mossa} del ${f.lato} (${f.pezzo}${f.cattura ? ", cattura " + f.cattura : ""}).`,
    f.uguale
      ? `È la mossa migliore secondo il motore. Valutazione dopo la mossa: ${f.valoreGiocata}.`
      : `Mossa migliore secondo il motore: ${f.migliore} (valutazione ${f.valoreMigliore}). ` +
        `Dopo ${f.giocata} la valutazione è ${f.valoreGiocata}.`,
    f.classe ? `Giudizio: ${f.classe}.` : "Giudizio: nessun errore.",
    f.risposta.length ? `Dopo ${f.giocata} la continuazione migliore è: ${f.risposta.join(" ")}.` : "",
    !f.uguale && f.seguito.length > 1 ? `Con ${f.migliore} la continuazione era: ${f.seguito.join(" ")}.` : "",
    f.inPresa.length ? `Dopo ${f.giocata} restano in presa: ${f.inPresa.join(", ")}` +
      (f.catture.length ? ` (l'avversario può prendere con ${f.catture.join(" o ")}).` : ".") : "",
    `Motivo calcolato: ${perche(f)}`,
    `Le valutazioni sono in pedoni dal punto di vista del ${f.lato}.`,
    `MOSSE CITABILI: ${f.mosse.join(", ")}`,
  ];
  return r.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------- controllo

// Mosse e case nel testo: notazione inglese (NBRQK) e italiana (CATDR).
const RE_MOSSA = /\b(O-O-O|O-O|0-0-0|0-0|[KQRBNCATD]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBNDTAC])?[+#]?)(?![a-z0-9])/g;
const IT_EN = { C: "N", A: "B", T: "R", D: "Q" };

function varianti(tok) {
  const t = tok.replace(/[+#]/g, "").replace(/0/g, "O");
  const out = new Set([t]);
  const it = t.replace(/^[CATD]/, (c) => IT_EN[c]).replace(/=?([CATD])$/, (_, c) => "=" + IT_EN[c]);
  out.add(it);
  if (t.startsWith("R")) out.add("K" + t.slice(1));   // in italiano R e' il re
  return out;
}

/**
 * Controlla che il testo citi solo mosse e case dei fatti.
 * Una mossa inventata boccia la risposta. Una casa fuori dai fatti ("debolezza
 * in e6") e' solo segnalata: puo' essere giusta, ma non e' verificata.
 * @returns {ok, mosse: [token estranei], case: [case estranee]}
 */
export function controllo(testo, f) {
  const ammesse = new Set(f.mosse.map((s) => s.replace(/[+#]/g, "")));
  const caseAmmesse = new Set(f.case);
  const mosse = new Set(), case_ = new Set();
  for (const m of testo.matchAll(RE_MOSSA)) {
    const tok = m[1];
    if (/^[a-h][1-8]$/.test(tok)) {
      if (!caseAmmesse.has(tok)) case_.add(tok);
    } else if (![...varianti(tok)].some((v) => ammesse.has(v))) {
      mosse.add(tok);
    }
  }
  return { ok: mosse.size === 0, mosse: [...mosse], case: [...case_] };
}

// ------------------------------------------------------------------- perche

/**
 * Il perche' di una mossa, a regole, dai fatti. Una o due frasi.
 * Ordine: matto, materiale (pezzo in presa, forchetta, occasione persa,
 * sequenza), e solo se il materiale non cambia la spiegazione posizionale.
 */
export function perche(f) {
  if (f.uguale) return "È la mossa migliore.";
  const m = f.materiale;
  const perso = m.ora - m.conGiocata;            // quanto perdi davvero
  const mancato = m.conLaMigliore - m.conGiocata; // differenza con la migliore
  const r = f.risposta[0];

  if (f.mattoContro) return `Permetti un matto in ${f.mattoContro}: ${f.risposta.join(" ")}.`;
  if (f.mattoPerso) return `C'era il matto in ${f.mattoPerso}, a partire da ${f.migliore}.`;

  // 0. il pezzo appena mosso va in una casa dove puo' essere preso
  if (f.mossoInPresa && VALORE_NOME[f.mossoInPresa.pezzo] >= 3 && perso >= 1) {
    const x = f.mossoInPresa;
    return `Metti ${articolo(x.pezzo)} in ${x.casa}, dove può essere ${FEMMINILE.has(x.pezzo) ? "presa" : "preso"}` +
      (x.da.length ? ` (${x.da.join(" o ")})` : "") + `: in tutto perdi ${equivalente(perso)}.`;
  }
  // 1. il pezzo lasciato in presa viene preso subito
  if (f.rispostaCattura && f.inPresa.some((x) => x.endsWith(" " + f.rispostaCattura.casa))) {
    const p = f.rispostaCattura.pezzo;
    return `Lasci ${articolo(p)} in ${f.rispostaCattura.casa} senza difesa sufficiente: ` +
      `l'avversario ${FEMMINILE.has(p) ? "la" : "lo"} prende con ${r}` +
      (perso >= 1 ? `, e in tutto perdi ${equivalente(perso)}.` : ".");
  }
  // 2. forchetta
  if (f.forchetta && perso >= 1) {
    return `Dopo ${r} l'avversario attacca insieme ${f.forchetta.slice(0, 2).join(" e ")}: ` +
      `è una forchetta e perdi ${quanto(perso)}.`;
  }
  // 3. la migliore prendeva qualcosa
  // (il guadagno "a occhio" conta anche se la linea del motore e' rumorosa)
  if (f.miglioreCattura && (mancato >= 1 || f.miglioreCattura.guadagno >= 1)) {
    return f.ripresa
      ? `Non riprendi ${articolo(f.miglioreCattura.pezzo)} in ${f.miglioreCattura.casa}: andava ripreso con ${f.migliore}.`
      : `Ti lasci sfuggire ${articolo(f.miglioreCattura.pezzo)} in ${f.miglioreCattura.casa}: con ${f.migliore} lo vincevi.`;
  }
  // 4. la migliore attaccava un pezzo che non poteva salvarsi bene
  if (f.minacciaMigliore.length) {
    const x = f.minacciaMigliore[0];
    return `Con ${f.migliore} attaccavi ${articolo(x.pezzo)} in ${x.casa}` +
      (mancato >= 1 ? ` e vincevi ${quanto(mancato)}.`
        : f.classe === "errore grave" ? ", con un vantaggio netto." : ".");
  }
  // 5. la risposta dell'avversario attacca un mio pezzo
  // (solo se il pezzo attaccato vale circa quanto si perde: altrimenti si
  // salva e la perdita viene da altro)
  const subito = f.minacciaSubita.find((x) => VALORE_NOME[x.pezzo] <= perso + 1);
  if (subito && perso >= 1) {
    return `Dopo ${r} ${articolo(subito.pezzo)} in ${subito.casa} è ` +
      `${FEMMINILE.has(subito.pezzo) ? "attaccata" : "attaccato"} e non si salva: perdi ${quanto(perso)}.`;
  }
  // 6. materiale lungo la sequenza
  if (perso >= 1) return `Nella sequenza ${f.risposta.join(" ")} perdi ${quanto(perso)}.`;
  if (mancato >= 1) return `Con ${f.seguito.join(" ")} vincevi ${quanto(mancato)}.`;

  // 7. il materiale non cambia: e' una questione di posizione
  let t = `Non perdi materiale, ma la posizione peggiora (da ${f.valoreMigliore} a ${f.valoreGiocata})`;
  if (f.rispostaScacco) t += `: l'avversario prende l'iniziativa con ${r}`;
  else if (f.miglioreScacco) t += `: con ${f.migliore} avevi tu l'iniziativa`;
  return t + ".";
}

const ARTICOLI = { pedone: "il pedone", cavallo: "il cavallo", alfiere: "l'alfiere",
  torre: "la torre", donna: "la donna", re: "il re" };
const articolo = (p) => ARTICOLI[p] || p;
const FEMMINILE = new Set(["torre", "donna"]);
const VALORE_NOME = { pedone: 1, cavallo: 3, alfiere: 3, torre: 5, donna: 9, re: 0 };

// ------------------------------------------------------------------ riserva

/** Testo a modello fisso, dagli stessi fatti. Sempre corretto, mai brillante. */
export function riserva(f) {
  if (f.uguale) return `${f.mossa} è la mossa migliore: valutazione ${f.valoreGiocata}.`;
  return `${perche(f)} Era meglio ${f.migliore}.`;
}
