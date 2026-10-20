/**
 * Interfaccia: scacchiera, pannello, orchestrazione.
 *
 * Lo stato vive nel browser: niente server, quindi ogni persona che apre la
 * pagina ha la sua partita e non interferisce con le altre.
 */
import { Chess } from "../vendor/chess.js";
import { Motore } from "./motore.js";
import { albero, linea, peso } from "./analisi.js";
import { distribuzione, campiona, casaRipresa } from "./avversario.js";
import { carica as caricaAperture, corrente as aperturaCorrente } from "./aperture.js";
import { analizza as analizzaStrutture } from "./strutture.js";
import { valutaMossa, CLASSI, uciDi } from "./revisione.js";
import { fatti, perche } from "./spiega.js";
import { avvia as avviaConteggio, evento } from "./conteggio.js";
import { schedaApertura, schedaStruttura } from "./teoria.js";
import { pgn, nomeFile, invia } from "./partita.js";
import * as Diag from "./diagramma.js";
import { LINEE } from "./linee.js";
import { minacce } from "./minacce.js";

// U+FE0E forza la resa testuale: senza, sui telefoni il pedone U+265F diventa
// un'emoji, che ignora il colore CSS ed e' piu' grande degli altri pezzi.
const GLIFI = { k: "\u265A\uFE0E", q: "\u265B\uFE0E", r: "\u265C\uFE0E",
                b: "\u265D\uFE0E", n: "\u265E\uFE0E", p: "\u265F\uFE0E" };
const SVGNS = "http://www.w3.org/2000/svg";
let PEZZI_SVG = false;   // true se lo sprite e' stato caricato
const PROFONDITA = 12;
const PLIES = 10;

const el = (id) => document.getElementById(id);

const S = {
  gioco: new Chess(),
  motore: null,
  sel: null,
  bersagli: [],
  occupato: false,
  auto: true,
  mio: "w",
  lui: "nero",
  chiavi: [],   // chiavi apertura di ogni posizione attraversata
  ultimaAnalisi: null,   // {fen, righe}: le schede della posizione corrente
  revisione: new Map(),  // indice semimossa -> esito di valutaMossa
  sceltaBot: new Map(),  // indice semimossa -> {p, elo}: con che probabilita' il bot l'ha scelta
  frecceCand: [],        // frecce delle candidate sulla posizione corrente
  frecce: "sempre",      // "sempre" | "richiesta" (solo la scheda indicata) | "mai"
  evidenza: null,        // uci della candidata sotto il mouse o toccata
  fissata: false,        // evidenza bloccata da un tocco: resta finche' non si ritocca
  vista: null,           // {p, frecce, testo}: si sta guardando una posizione passata
  minacce: false,        // opzione: case colorate sotto i tuoi pezzi attaccati
  caseMinacciate: { rosse: [], arancio: [] },   // calcolate a ogni disegno
};

// Un colore per candidata, nell'ordine del motore (stabile anche quando le
// schede vengono riordinate per EV). Scelti per staccare su case chiare e scure.
// I colori veri stanno nei temi (variabili CSS), qui solo i riferimenti.
const COLORI_CAND = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"];
const VERDE = "var(--fr-ok)", ROSSO = "var(--fr-ko)", GRIGIO = "var(--fr-mv)";

const elo = () => +el("elo").value;
const chiave = (fen) => fen.split(" ").slice(0, 3).join(" ");

// ------------------------------------------------------------ scacchiera

/** FEN della posizione dopo `p` semimosse della partita. */
function fenDopo(p) {
  if (p <= 0) return new Chess().fen();
  const h = S.gioco.history({ verbose: true });
  return h[Math.min(p, h.length) - 1].after;
}

function disegna() {
  const fen = S.vista ? fenDopo(S.vista.p) : S.gioco.fen();
  const righe = fen.split(" ")[0].split("/");
  S.caseMinacciate = S.minacce ? minacce(fen, S.mio) : { rosse: [], arancio: [] };
  const bd = el("board");
  bd.innerHTML = "";
  righe.forEach((riga, r) => {
    let f = 0;
    for (const ch of riga) {
      if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++) casa(bd, r, f++, ""); }
      else casa(bd, r, f++, ch);
    }
  });
  disegnaFrecce();
  disegnaVista();
  disegnaMosse();
}

// ------------------------------------------------------------ frecce

/** Centro della casa nel sistema 0..8 dello SVG (bianco in basso). */
function centro(sq) {
  return ["abcdefgh".indexOf(sq[0]) + 0.5, 8 - +sq[1] + 0.5];
}

/**
 * Una freccia da `da` ad `a`. Per il cavallo fa la L, cosi' si capisce che
 * pezzo muove senza guardare la casa di partenza.
 */
function frecciaSvg(da, a, colore, spessore = 0.17, opacita = 0.85) {
  const [x1, y1] = centro(da);
  const [x2, y2] = centro(a);
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const punti = [[x1, y1]];
  if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
    // prima il lato lungo, poi il corto
    punti.push(dy > dx ? [x1, y2] : [x2, y1]);
  }
  // l'ultimo tratto si accorcia della punta
  const [px, py] = punti[punti.length - 1];
  const lx = x2 - px, ly = y2 - py;
  const L = Math.hypot(lx, ly) || 1;
  const ux = lx / L, uy = ly / L;
  const testa = 0.42, largh = spessore * 2.7;
  const bx = x2 - ux * testa, by = y2 - uy * testa;
  punti.push([bx, by]);

  const d = punti.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(3) + " " + y.toFixed(3)).join(" ");
  const nx = -uy, ny = ux;
  const tri = [[x2 - ux * 0.08, y2 - uy * 0.08],
               [bx + nx * largh / 2, by + ny * largh / 2],
               [bx - nx * largh / 2, by - ny * largh / 2]]
    .map(([x, y]) => x.toFixed(3) + "," + y.toFixed(3)).join(" ");
  return `<g opacity="${opacita}">`
    // style e non attributi: le variabili CSS funzionano solo nello style
    + `<path d="${d}" style="fill:none;stroke:${colore}" stroke-width="${spessore}" `
    + `stroke-linecap="round" stroke-linejoin="round"/>`
    + `<polygon points="${tri}" style="fill:${colore}"/></g>`;
}

function disegnaFrecce() {
  const svg = el("frecce");
  if (!svg) return;
  let lista;
  if (S.vista) lista = S.vista.frecce || [];
  else if (S.frecce === "richiesta") {
    // niente suggerimenti finche' non li chiedi: prima pensi, poi guardi
    lista = S.frecceCand.filter((f) => f.uci === S.evidenza)
      .map((f) => ({ ...f, spessore: 0.22, opacita: 0.95 }));
  } else if (S.frecce === "sempre") {
    lista = S.frecceCand.map((f) => {
      if (!S.evidenza) return f;
      return f.uci === S.evidenza
        ? { ...f, spessore: 0.22, opacita: 0.95 }
        : { ...f, opacita: 0.18 };
    });
  } else lista = [];
  // le piu' importanti per ultime, cosi' stanno sopra
  svg.innerHTML = [...lista].reverse()
    .map((f) => frecciaSvg(f.da, f.a, f.colore, f.spessore, f.opacita)).join("")
    + bollini(lista);
}

// Angoli della casa d'arrivo dove mettere il numero: se piu' frecce finiscono
// nella stessa casa, ognuna prende un angolo diverso.
const ANGOLI = [[0.27, -0.27], [-0.27, -0.27], [0.27, 0.27], [-0.27, 0.27]];

/** Il numero d'ordine (1 = migliore oggettivamente) vicino alla punta. */
function bollini(lista) {
  const usati = {};
  return lista.filter((f) => f.rango).map((f) => {
    const k = usati[f.a] = (usati[f.a] || 0) + 1;
    const [cx, cy] = centro(f.a);
    const [ox, oy] = ANGOLI[(k - 1) % 4];
    const x = (cx + ox).toFixed(3), y = (cy + oy).toFixed(3);
    const op = f.opacita < 0.5 ? 0.35 : 1;
    return `<g opacity="${op}" class="bollo"><circle cx="${x}" cy="${y}" r="0.19" `
      + `style="fill:${f.colore};stroke:var(--bollo)" stroke-width="0.035"/>`
      + `<text x="${x}" y="${y}" dy="0.085" text-anchor="middle" font-size="0.25" font-weight="700" `
      + `style="fill:#FFFFFF;font-family:var(--f-txt)">${f.rango}</text></g>`;
  }).join("");
}

/** Ordine per valutazione oggettiva: 1 = la migliore contro il gioco perfetto. */
function ordina(righe) {
  const val = (r) => peso(r.oggettiva, r.ogg_matto);
  const ord = [...righe].sort((a, b) => val(b) - val(a));
  for (const r of righe) r.rango = ord.indexOf(r) + 1;
}

function frecceDaRighe(righe) {
  ordina(righe);
  return righe.map((r) => ({
    rango: r.rango,
    uci: r.uci, da: r.uci.slice(0, 2), a: r.uci.slice(2, 4), colore: r.colore,
    // la prima del motore un filo piu' spessa
    spessore: r.colore === COLORI_CAND[0] ? 0.19 : 0.15,
    opacita: 0.82,
  })).sort((x, y) => COLORI_CAND.indexOf(x.colore) - COLORI_CAND.indexOf(y.colore));
}

// ------------------------------------------------------------ vista di una posizione passata

function disegnaVista() {
  const box = el("vista");
  if (!S.vista) { box.className = "vista"; box.innerHTML = ""; return; }
  const n = S.gioco.history().length;
  box.className = "vista on";
  box.innerHTML = `<div class="vtxt">${S.vista.testo || testoPosizione(S.vista.p)}</div>`
    + `<div class="vbtn">`
    + `<button id="vPrima" ${S.vista.p <= 0 ? "disabled" : ""} aria-label="Mossa precedente">&#9664;</button>`
    + `<button id="vDopo" ${S.vista.p >= n ? "disabled" : ""} aria-label="Mossa successiva">&#9654;</button>`
    + `<button id="vTorna">Torna alla partita</button></div>`;
  el("vPrima").onclick = () => passo(-1);
  el("vDopo").onclick = () => passo(1);
  el("vTorna").onclick = () => esciVista();
}

function etichettaMossa(i, san) {
  const n = Math.floor(i / 2) + 1;
  return i % 2 === 0 ? `${n}. ${san}` : `${n}… ${san}`;
}

function testoPosizione(p) {
  if (p <= 0) return "Posizione iniziale";
  const h = S.gioco.history();
  return `Dopo <b>${etichettaMossa(p - 1, h[p - 1])}</b>`
    + ` <span class="vmut">&middot; semimossa ${p} di ${h.length}</span>`;
}

/** Guarda la posizione dopo `p` semimosse; con p = fine si torna alla partita. */
function vediPosizione(p) {
  const h = S.gioco.history({ verbose: true });
  p = Math.max(0, Math.min(p, h.length));
  if (p === h.length) { esciVista(); return; }
  const m = p > 0 ? h[p - 1] : null;
  S.sel = null; S.bersagli = [];
  S.vista = { p, frecce: m ? [{ da: m.from, a: m.to, colore: GRIGIO, spessore: 0.15, opacita: 0.55 }] : [] };
  disegna();
}

function passo(d) {
  const n = S.gioco.history().length;
  const p = S.vista ? S.vista.p : n;
  vediPosizione(p + d);
}

function esciVista() {
  if (!S.vista) return;
  S.vista = null;
  disegna();
}

/** Clic su un errore: la posizione prima dell'errore, con la mossa giusta. */
function vediErrore(i) {
  const r = S.revisione.get(i);
  if (!r) return;
  evento("revisione-errore");
  const c = CLASSI[r.classe];
  S.sel = null; S.bersagli = [];
  S.vista = {
    p: i,
    errore: true,
    frecce: [
      { da: r.migliore.uci.slice(0, 2), a: r.migliore.uci.slice(2, 4), colore: VERDE, spessore: 0.2, opacita: 0.9 },
      { da: r.giocata.uci.slice(0, 2), a: r.giocata.uci.slice(2, 4), colore: ROSSO, spessore: 0.14, opacita: 0.7 },
    ],
    testo: `Prima di <b>${etichettaMossa(i, r.giocata.san)}${c.simbolo}</b>`
      + `<div class="vleg"><span><i style="background:${VERDE}"></i>meglio <b>${r.migliore.san}</b> `
      + `(${fmt(r.migliore.cp, r.migliore.matto)})</span>`
      + `<span><i style="background:${ROSSO}"></i>hai giocato ${r.giocata.san} `
      + `(${fmt(r.giocata.cp, r.giocata.matto)})</span></div>`
      + `<p class="vwhy">${r.perche || "Sto cercando il perché…"}</p>`,
  };
  disegna();
  el("board").scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// ------------------------------------------------------------ lista mosse e revisione

function disegnaMosse() {
  const box = el("mosse");
  const h = S.gioco.history();
  if (!h.length) {
    box.innerHTML = '<span class="vuoto">Nessuna mossa ancora.</span>';
    disegnaRevisione();
    return;
  }
  const attiva = S.vista ? S.vista.p - 1 : h.length - 1;
  let out = "";
  h.forEach((san, i) => {
    if (i % 2 === 0) out += `<span class="mnum">${i / 2 + 1}.</span>`;
    const r = S.revisione.get(i);
    const cls = "mv1" + (i === attiva ? " att" : "") + (r && r.classe ? " " + r.classe : "");
    out += `<span class="${cls}" data-p="${i + 1}">${san}`
      + (r && r.classe ? `<sup>${CLASSI[r.classe].simbolo}</sup>` : "") + "</span>";
  });
  box.innerHTML = out;
  for (const s of box.querySelectorAll(".mv1")) {
    s.onclick = () => { evento("lista-mosse"); vediPosizione(+s.dataset.p); };
  }
  // segui l'ultima mossa senza spostare la pagina
  const a = box.querySelector(".att");
  if (a) box.scrollTop = Math.max(0, a.offsetTop - box.offsetTop - box.clientHeight + a.offsetHeight + 8);
  disegnaRevisione();
}

const plur = (n, uno, molti) => `${n} ${n === 1 ? uno : molti}`;

function disegnaRevisione() {
  const box = el("revisione");
  const voci = [...S.revisione.entries()].sort((a, b) => a[0] - b[0]);
  if (!voci.length) {
    box.innerHTML = '<span class="vuoto">Le tue mosse vengono controllate mentre giochi.</span>';
    return;
  }
  const err = voci.filter(([, r]) => r.classe);
  const conta = (k) => err.filter(([, r]) => r.classe === k).length;
  let out = `<div class="rsum">`
    + `<span class="imprecisione">${plur(conta("imprecisione"), "imprecisione", "imprecisioni")}</span>`
    + `<span class="errore">${plur(conta("errore"), "errore", "errori")}</span>`
    + `<span class="grave">${plur(conta("grave"), "grave", "gravi")}</span>`
    + `<span class="ok">${voci.length - err.length} di ${voci.length} senza errori</span></div>`;
  if (!err.length) out += '<div class="vuoto">Finora nessun errore.</div>';
  for (const [i, r] of err) {
    const c = CLASSI[r.classe];
    out += `<button class="rvoce ${r.classe}" data-i="${i}">`
      + `<span class="rmv">${etichettaMossa(i, r.giocata.san)}<sup>${c.simbolo}</sup></span>`
      + `<span class="rcl">${c.nome}</span>`
      + `<span class="rdet">da ${fmt(r.migliore.cp, r.migliore.matto)} a ${fmt(r.giocata.cp, r.giocata.matto)}`
      + ` &middot; meglio <b>${r.migliore.san}</b></span>`
      + `<span class="rwhy">${r.perche || "Sto cercando il perché…"}</span></button>`;
  }
  box.innerHTML = out;
  for (const b of box.querySelectorAll(".rvoce")) b.onclick = () => vediErrore(+b.dataset.i);
}

/**
 * Valuta in background la mossa appena giocata. Non blocca: il motore e' in
 * coda, quindi questa valutazione passa prima della risposta dell'avversario.
 */
function rivedi(mossa, i) {
  const fen = mossa.before;
  const an = S.ultimaAnalisi && S.ultimaAnalisi.fen === fen ? S.ultimaAnalisi.righe : null;
  valutaMossa(S.motore, fen, uciDi(mossa), an, PROFONDITA).then((r) => {
    const h = S.gioco.history({ verbose: true });
    // nel frattempo l'utente puo' essere tornato indietro
    if (!r || !h[i] || h[i].before !== fen) return;
    S.revisione.set(i, r);
    disegnaMosse();
    if (r.classe) spiegaErrore(mossa, i, r);
  }).catch((e) => console.warn("revisione:", e));
}

/**
 * Il perche' di un errore (js/spiega.js): linee brevi del motore, materiale,
 * pezzi in presa, forchette. Gira dopo la valutazione, in coda al motore.
 */
function spiegaErrore(mossa, i, r) {
  const h = S.gioco.history({ verbose: true });
  fatti(S.motore, mossa.before, uciDi(mossa), 10, r, i > 0 ? h[i - 1] : null).then((f) => {
    const ora = S.gioco.history({ verbose: true });
    if (!f || !ora[i] || ora[i].before !== mossa.before || S.revisione.get(i) !== r) return;
    r.perche = perche(f);
    disegnaMosse();
    // riquadro dell'errore gia' aperto: aggiorno il testo senza spostare la pagina
    if (S.vista && S.vista.p === i && S.vista.errore) {
      S.vista.testo = S.vista.testo.replace("Sto cercando il perché…", r.perche);
      disegna();
    }
  }).catch((e) => console.warn("spiegazione:", e));
}

function potaRevisione() {
  const n = S.gioco.history().length;
  for (const k of [...S.revisione.keys()]) if (k >= n) S.revisione.delete(k);
  for (const k of [...S.sceltaBot.keys()]) if (k >= n) S.sceltaBot.delete(k);
}

function casa(bd, r, f, ch) {
  const d = document.createElement("div");
  const nome = "abcdefgh"[f] + (8 - r);
  const chiara = (r + f) % 2 === 0;
  d.className = (chiara ? "lt" : "dk")
    + (S.sel === nome ? " sel" : "")
    + (S.bersagli.includes(nome) ? " trg" : "")
    + (S.caseMinacciate.rosse.includes(nome) ? " mn"
      : S.caseMinacciate.arancio.includes(nome) ? " mn-sc" : "");
  if (ch) d.appendChild(pezzo(ch));
  const col = chiara ? "var(--co-lt)" : "var(--co-dk)";
  if (r === 7) d.appendChild(etichetta("co cf", "abcdefgh"[f], col));
  if (f === 0) d.appendChild(etichetta("co cr", String(8 - r), col));
  d.addEventListener("click", () => clicca(nome));
  bd.appendChild(d);
}

/**
 * Icona di un pezzo dentro il testo (schede, ultima mossa), nel colore vero di
 * chi muove. Prima si usavano i glifi pieni U+265x: sul telefono il pedone
 * diventava un'emoji nera e gli altri restavano sempre scuri.
 */
function icona(colore, tipo) {
  if (!colore || !tipo) return "";
  if (PEZZI_SVG) {
    return `<svg class="ico" viewBox="0 0 40 40" aria-hidden="true"><use href="#${colore}${tipo}"/></svg>`;
  }
  return `<span class="ico pc ${colore}">${GLIFI[tipo]}</span>`;
}

/** Un pezzo: SVG se lo sprite c'e', altrimenti il glifo tipografico. */
function pezzo(ch) {
  const colore = ch === ch.toUpperCase() ? "w" : "b";
  const tipo = ch.toLowerCase();

  if (PEZZI_SVG) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("class", "pz");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVGNS, "use");
    // href e xlink:href: il secondo serve ai browser piu' vecchi
    use.setAttribute("href", "#" + colore + tipo);
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + colore + tipo);
    svg.appendChild(use);
    return svg;
  }

  const s = document.createElement("span");
  s.className = "pc " + colore;
  s.textContent = GLIFI[tipo];
  return s;
}

/**
 * Inietta lo sprite dei pezzi nella pagina.
 *
 * Va iniettato, non referenziato dall'esterno: <use href="file.svg#id"> non e'
 * supportato ovunque, mentre <use href="#id"> nello stesso documento si'.
 */
async function caricaPezzi() {
  try {
    const r = await fetch("vendor/pezzi.svg");
    if (!r.ok) throw new Error("pezzi.svg non trovato");
    const testo = await r.text();
    const cont = document.createElement("div");
    cont.innerHTML = testo;
    const svg = cont.querySelector("svg");
    if (!svg) throw new Error("pezzi.svg illeggibile");
    svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
    svg.setAttribute("aria-hidden", "true");
    document.body.insertBefore(svg, document.body.firstChild);
    PEZZI_SVG = true;
  } catch (e) {
    console.warn("pezzi SVG non disponibili, uso i glifi:", e.message);
    PEZZI_SVG = false;
  }
}

function etichetta(cls, testo, colore) {
  const s = document.createElement("span");
  s.className = cls; s.textContent = testo; s.style.color = colore;
  return s;
}

async function clicca(sq) {
  if (S.occupato) return;
  if (S.vista) return;   // posizione passata: solo da guardare
  if (S.sel) {
    const da = S.sel;
    S.sel = null; S.bersagli = [];
    let fatta = null;
    try { fatta = S.gioco.move({ from: da, to: sq, promotion: "q" }); } catch (e) { fatta = null; }
    if (fatta) {
      S.chiavi.push(chiave(S.gioco.fen()));
      S.frecceCand = []; S.evidenza = null; S.fissata = false;
      rivedi(fatta, S.gioco.history().length - 1);
      evento("mossa-giocata");
      disegna();
      await dopoMossa();
    } else disegna();
  } else {
    const m = S.gioco.moves({ square: sq, verbose: true });
    if (m.length) { S.sel = sq; S.bersagli = m.map((x) => x.to); }
    disegna();
  }
}

// ------------------------------------------------------------ partita

async function dopoMossa() {
  mostraRisposta(null);
  if (S.auto && !S.gioco.isGameOver() && S.gioco.turn() !== S.mio) {
    S.occupato = true;
    el("out").innerHTML = '<p class="busy">L’avversario pensa…</p>';
    const dist = await distribuzione(S.motore, S.gioco.fen(), elo(), 4, 10,
      casaRipresa(S.gioco.history({ verbose: true }).at(-1)));
    if (dist.length) {
      const scelta = campiona(dist);
      const v = S.gioco.moves({ verbose: true }).find(
        (x) => x.lan === scelta.uci || x.from + x.to === scelta.uci.slice(0, 4));
      if (v) {
        S.gioco.move(v.san);
        S.sceltaBot.set(S.gioco.history().length - 1, { p: scelta.p, elo: elo() });
        S.chiavi.push(chiave(S.gioco.fen()));
        S.vista = null;
        disegna();
        mostraRisposta({ san: v.san, p: Math.round(scelta.p * 1000) / 10,
          nome: nomePezzo(v.piece), lato: v.color, tipo: v.piece, libro: !!scelta.libro });
      }
    }
    S.occupato = false;
  }
  await analizza();
}

const NOMI = { p: "Pedone", n: "Cavallo", b: "Alfiere", r: "Torre", q: "Donna", k: "Re" };
const nomePezzo = (p) => NOMI[p] || "";

function mostraRisposta(r) {
  const d = el("ultima");
  if (!r) { d.className = "ultima vuota"; d.textContent = "Tocca a te."; return; }
  d.className = "ultima";
  d.innerHTML = `Ha giocato <b>${icona(r.lato, r.tipo)}${r.san}</b>`
    + `<span class="pc2">${r.nome}, probabilità ${r.p}%`
    + (r.libro ? " · da partite reali di questo livello" : "") + `</span>`;
}

// ------------------------------------------------------------ pannello

function fmt(cp, matto) {
  if (matto !== undefined && matto !== null) {
    if (matto === 0) return "matto";
    return (matto > 0 ? "M" : "\u2212M") + Math.abs(matto);
  }
  if (cp === null || cp === undefined) return "?";
  const v = Math.abs(cp / 100).toFixed(1);
  return (cp > 0 ? "+" : cp < 0 ? "\u2212" : "") + v;
}

function fmtEv(ev) {
  if (ev <= -1900) return "ti fa matto";
  if (ev >= 1900) return "gli dai matto";
  return fmt(ev);
}

// ------------------------------------------------------------ schede didattiche

const attr = (t) => encodeURIComponent(t);

/** Nome d'apertura cliccabile se c'e' una scheda, testo semplice altrimenti. */
function nomeApertura(nome, eco) {
  if (!schedaApertura(nome)) return nome;
  return `<button class="lnk" data-ap="${attr(nome)}" data-eco="${attr(eco || "")}" `
    + `title="Leggi la scheda">${nome}</button>`;
}

function nomeStruttura(chiave, nome) {
  if (!schedaStruttura(chiave)) return nome;
  return `<button class="lnk" data-st="${chiave}" data-nome="${attr(nome)}" `
    + `title="Leggi la scheda">${nome}</button>`;
}

function piani(bianco, nero) {
  return `<div class="pl"><span class="q b">bianco</span><span>${bianco}</span></div>`
    + `<div class="pl"><span class="q n">nero</span><span>${nero}</span></div>`;
}

function apriScheda(html) {
  const d = el("scheda");
  el("schedaCorpo").innerHTML = html;
  if (typeof d.showModal === "function") { if (!d.open) d.showModal(); }
  else d.setAttribute("open", "");
  el("schedaCorpo").scrollTop = 0;
}

function schedaAperturaHtml(nome, eco) {
  const r = schedaApertura(nome);
  if (!r) return null;
  const x = r.scheda;
  return `<div class="sk-sopra">Apertura${eco ? `<span class="eco">${eco}</span>` : ""}</div>`
    + `<h2 class="sk-tit">${x.it}</h2>`
    + `<div class="sk-orig">${r.chiave}</div>`
    + (r.esatta ? "" : `<div class="sk-nota">Sei in <b>${nome}</b>: qui sotto la scheda della famiglia.</div>`)
    + `<div class="sk-mosse">${x.mosse}</div>`
    + `<figure class="sk-diag" data-mosse="${encodeURIComponent(x.mosse)}"></figure>`
    + `<p class="sk-idea">${x.idea}</p>`
    + doveporta(r.chiave, x.mosse)
    + `<div class="sk-piani">${piani(x.bianco, x.nero)}</div>`
    + `<div class="sk-att"><b>Attenzione.</b> ${x.attenzione}</div>`;
}

function schedaStrutturaHtml(chiave, nome) {
  const x = schedaStruttura(chiave);
  if (!x) return null;
  return `<div class="sk-sopra">Struttura pedonale</div>`
    + `<h2 class="sk-tit">${nome}</h2>`
    + `<p class="sk-idea">${x.spiegazione}</p>`
    + `<div class="sk-piani">${piani(x.bianco, x.nero)}</div>`
    + `<div class="sk-att ric"><b>Da ricordare.</b> ${x.ricorda}</div>`;
}

/** "Dove porta": la linea tipica dell'apertura fino al mediogioco. */
function doveporta(chiave, mosse) {
  const L = LINEE[chiave];
  if (!L) return "";
  const da = Diag.prefisso(Diag.ricostruisci(mosse), Diag.ricostruisci(L.linea));
  return `<h3 class="sk-sez">Dove porta</h3>`
    + `<div class="sk-mosse sk-lin">${L.linea}</div>`
    + `<figure class="sk-diag" data-tipo="meta" data-da="${da}" data-mosse="${encodeURIComponent(L.linea)}"></figure>`
    + `<p class="sk-meta">${L.meta}</p>`;
}

/**
 * Scacchiere dentro un riquadro (scheda dell'apertura, "Come continua").
 * Ogni <figure class="sk-diag"> porta le mosse in data-mosse e, facoltativi,
 * data-fen0 (posizione di partenza), data-da (prima mossa da mostrare) e
 * data-tipo ("apertura", "meta", "linea") che decide le didascalie.
 * Si parte dalla posizione finale, con in evidenza i pezzi che si sono mossi;
 * i pulsanti scorrono mossa per mossa.
 */
function montaDiagramma(box) {
  for (const fig of box.querySelectorAll(".sk-diag")) montaUno(fig);
}

function montaUno(fig) {
  const tipo = fig.dataset.tipo || "apertura";
  const r = Diag.ricostruisci(decodeURIComponent(fig.dataset.mosse || ""), fig.dataset.fen0 || undefined);
  if (!r) { fig.remove(); return; }
  const n = r.mosse.length;
  const da = Math.min(+fig.dataset.da || 0, n);
  const evidenza = Diag.caseCambiate(r.fens[da], r.fens[n]);
  let i = n;

  const didascalia = () => {
    if (i === da) {
      return tipo === "meta" ? "La posizione dell’apertura: da qui parte la linea"
        : tipo === "linea" ? "La posizione di adesso"
        : "Posizione di partenza";
    }
    if (i < n) return `Dopo ${Diag.etichetta(r, i)}`;
    if (tipo === "meta") return `Dopo ${Diag.etichetta(r, n)}: la posizione a cui si punta. In evidenza cosa è cambiato rispetto all’apertura.`;
    if (tipo === "linea") return `Dopo ${Diag.etichetta(r, n)}: dove arriva la linea. In evidenza cosa cambia rispetto a ora.`;
    return r.soloBianco ? "Lo schema completo del bianco. In evidenza i pezzi sviluppati."
      : `Dopo ${Diag.etichetta(r, n)}: la posizione tipica. In evidenza i pezzi già mossi.`;
  };

  const disegnaQui = () => {
    const m = i > da ? r.mosse[i - 1] : null;
    const tav = Diag.svg(r.fens[i], {
      sprite: PEZZI_SVG, freccia: frecciaSvg,
      ultima: m ? { from: m.from, to: m.to } : null,
      evidenza: i === n ? evidenza : null,
    });
    fig.innerHTML = tav
      + `<figcaption>`
      + `<button class="sk-pas" data-d="-1" ${i === da ? "disabled" : ""} aria-label="Mossa precedente">&#9664;</button>`
      + `<span>${didascalia()}${r.soloBianco && i === n
        ? `<small>Le mosse del nero qui non sono fisse: cambiano da partita a partita.</small>` : ""}</span>`
      + `<button class="sk-pas" data-d="1" ${i === n ? "disabled" : ""} aria-label="Mossa successiva">&#9654;</button>`
      + `</figcaption>`;
    for (const b of fig.querySelectorAll(".sk-pas")) {
      b.onclick = (ev) => {
        ev.stopPropagation();
        i = Math.max(da, Math.min(n, i + +b.dataset.d));
        if (i !== n) evento("diagramma-passo-" + tipo);
        disegnaQui();
      };
    }
  };
  disegnaQui();
}

// un solo ascoltatore per tutta la pagina: i nomi vengono ridisegnati spesso
document.addEventListener("click", (ev) => {
  if (ev.target && ev.target.id === "scheda") { ev.target.close(); return; }   // clic sullo sfondo
  const b = ev.target.closest && ev.target.closest("[data-ap],[data-st]");
  if (!b) return;
  ev.preventDefault();
  ev.stopPropagation();
  let h = null;
  if (b.dataset.ap) {
    h = schedaAperturaHtml(decodeURIComponent(b.dataset.ap), decodeURIComponent(b.dataset.eco || ""));
    evento("scheda-apertura");
  } else {
    h = schedaStrutturaHtml(b.dataset.st, decodeURIComponent(b.dataset.nome || ""));
    evento("scheda-struttura");
  }
  if (h) { apriScheda(h); montaDiagramma(el("schedaCorpo")); }
});

function strutHtml(St) {
  if (!St) return "";
  let h = "";
  for (const x of St.strutture || []) {
    h += `<div class="strut"><div class="tit">${nomeStruttura(x.chiave, x.nome)}</div>`
      + `<div class="meta">centro ${St.centro} &middot; ${St.fase}</div>`
      + `<div class="pl"><span class="q b">bianco</span><span>${x.piano_bianco}</span></div>`
      + `<div class="pl"><span class="q n">nero</span><span>${x.piano_nero}</span></div></div>`;
  }
  const t = St.tratti || [];
  if (t.length) h += `<div class="trat">${t.map((y) => /^Pedone di donna isolato/.test(y.nome)
    ? `<span>${nomeStruttura("isolato", y.nome)}</span>` : `<span>${y.nome}</span>`).join("")}</div>`;
  return h;
}

function intestazione(io, lui, ap, St, e) {
  el("phead").innerHTML =
    `<div class="ph1"><span class="dot ${io === "bianco" ? "wq" : "bq"}"></span>`
    + `Muove il ${io} &mdash; sei tu</div>`
    + `<div class="ph2">Le mosse che potresti giocare. Per ognuna, come risponderebbe `
    + `il ${lui} se fosse un giocatore di ${e}.</div>`
    + (ap ? `<div class="apbig">Apertura: <b>${nomeApertura(ap.nome, ap.eco)}</b>`
        + `<span class="eco">${ap.eco}</span>`
        + (ap.in_libro ? "" : " &mdash; sei già fuori dal libro") + "</div>" : "")
    + strutHtml(St)
    + `<div class="legend">`
    + `<div><span class="sw g"></span><span><b>Oggettiva</b> &mdash; quanto vale la mossa contro il gioco perfetto</span></div>`
    + `<div><span class="sw a"></span><span><b>Contro ${e}</b> &mdash; quanto rende davvero contro questo avversario</span></div>`
    + `<div style="opacity:.75">In pedoni, dal punto di vista del ${io}. Più alto = meglio per te.</div>`
    + `<div><span class="cnum" style="background:var(--mut)">1</span><span>Il numero sulle frecce è l’ordine `
    + `per valutazione oggettiva: 1 = la migliore. Le schede invece sono ordinate per quanto rendono contro ${e}.</span></div>`
    + `</div>`;
}

const PAL = ["var(--p1)", "var(--p2)", "var(--p3)"];

function cardHtml(x, lui, e) {
  const big = Math.abs(x.divergenza) >= 40;
  const tag = big
    ? `<span class="tag">${x.divergenza > 0 ? "pratica, non corretta" : "corretta, ma ti espone"}</span>`
    : "";
  const tot = x.risposte.reduce((s, y) => s + y.p, 0) || 1;
  const bars = x.risposte.map((y, i) =>
    `<div style="width:${(y.p / tot) * 100}%;background:${PAL[i % 3]}"></div>`).join("");
  const reps = x.risposte.map((y) => {
    const m = y.matto !== null && y.matto !== undefined;
    const et = m ? (y.matto === 0 ? " &middot; matto"
      : y.matto < 0 ? ` &middot; matto in ${Math.abs(y.matto)}`
      : ` &middot; gli dai matto in ${y.matto}`) : "";
    return `<span${m && y.matto <= 0 ? ' class="mat"' : ""}>${icona(y.lato, y.tipo)}`
      + `${y.nome} ${y.san} <b>${y.p}%</b>${et}</span>`;
  }).join("");

  return `<div class="card${big ? " div" : ""}${x.matto_contro > 0 ? " pericolo" : ""}" data-uci="${x.uci}"`
    + ` style="border-left:4px solid ${x.colore}">`
    + (x.matto_contro > 0 ? `<div class="allarme">Ti fa matto nel ${x.matto_contro}% delle risposte</div>` : "")
    + (x.matto_forzato
      ? `<div class="occasione">${x.matto_forzato === 1 ? "Matto in una mossa" : `Matto forzato in ${x.matto_forzato}`}: è l’unica mossa da guardare</div>`
      : x.matto_pro > 0 ? `<div class="occasione">Gli dai matto nel ${x.matto_pro}% delle risposte</div>` : "")
    + `<div class="top"><span><span class="pre">Se giochi</span>`
    + `<span class="cnum" style="background:${x.colore}" title="${x.rango}ª per valutazione oggettiva">${x.rango || ""}</span>`
    + `<span class="mv">${icona(x.lato, x.tipo)}${x.san}</span>${tag}</span>`
    + `<span class="nums">`
    + `<span class="nbox"><span class="nlab">oggettiva</span>`
    + `<span class="obj">${fmt(x.oggettiva, x.ogg_matto)}</span></span>`
    + `<span class="nbox"><span class="nlab">contro ${e}</span>`
    + `<span class="ev" style="color:${x.ev >= 0 ? "var(--acc)" : "var(--cool)"}">${fmtEv(x.ev)}</span></span>`
    + `</span></div>`
    + (x.ap ? `<div class="apchip">porta in <b>${nomeApertura(x.ap.nome, x.ap.eco)}</b><span class="eco">${x.ap.eco}</span></div>` : "")
    + (x.risposte.length
      ? `<div class="replab">Il ${lui} risponde</div>`
        + `<div class="pbar">${bars}</div><div class="rep">${reps}</div>`
        + `<button class="linbtn" data-uci="${x.uci}">Come continua</button>`
      : `<div class="replab">${x.ogg_matto ? "Scacco matto: la partita finisce qui." : "Il " + lui + " non ha mosse."}</div>`)
    + `<div class="lin" id="lin_${x.uci}"></div></div>`;
}

async function analizza() {
  if (S.gioco.isGameOver()) {
    evento("partita-finita");
    el("phead").innerHTML = "";
    el("out").innerHTML = `<p class="busy">Partita finita: ${motivoFine()}.</p>`
      + `<button id="bInviaFine" class="primario">Invia la partita</button>`;
    el("bInviaFine").onclick = inviaPartita;
    return;
  }
  S.occupato = true;
  const e = elo();
  const io = S.gioco.turn() === "w" ? "bianco" : "nero";
  S.lui = io === "bianco" ? "nero" : "bianco";

  intestazione(io, S.lui, aperturaCorrente(S.chiavi), analizzaStrutture(S.gioco.fen()), e);
  el("out").innerHTML = '<p class="busy">Calcolo…</p>';

  const fen = S.gioco.fen();
  S.frecceCand = []; S.evidenza = null; S.fissata = false;
  disegnaFrecce();
  const parziali = [];
  const righe = await albero(S.motore, fen, e, {
    depth: PROFONDITA,
    suRiga: (r, fatte, totali) => {
      r.colore = COLORI_CAND[parziali.length % COLORI_CAND.length];
      parziali.push(r);
      S.frecceCand = frecceDaRighe(parziali);
      disegnaFrecce();
      // rendering progressivo: la prima scheda compare subito
      el("out").innerHTML = parziali.map((y) => cardHtml(y, S.lui, e)).join("")
        + `<p class="busy">${fatte} di ${totali}…</p>`;
      aggancia();
    },
  });

  const forzato = righe.length === 1 && righe[0].matto_forzato;
  el("out").innerHTML = righe.map((y) => cardHtml(y, S.lui, e)).join("")
    + (forzato
      ? `<p class="note">Il motore ha trovato un matto forzato: qualunque cosa risponda il ${S.lui}, `
        + `questa linea chiude la partita. Le alternative non contano.</p>`
      : `<p class="note">Le righe evidenziate sono quelle dove i due numeri divergono: `
        + `la mossa vale una cosa in assoluto e una cosa diversa contro questo avversario.</p>`);
  aggancia();
  S.ultimaAnalisi = { fen, righe };
  S.frecceCand = frecceDaRighe(righe);
  disegnaFrecce();
  S.occupato = false;
}

function aggancia() {
  for (const b of document.querySelectorAll(".linbtn")) {
    b.onclick = () => vediLinea(b.dataset.uci);
  }
  // passando sopra una scheda, la sua freccia resta in primo piano
  for (const c of document.querySelectorAll("#out .card[data-uci]")) {
    c.onmouseenter = () => { if (!S.fissata) { S.evidenza = c.dataset.uci; disegnaFrecce(); } };
    c.onmouseleave = () => { if (!S.fissata) { S.evidenza = null; disegnaFrecce(); } };
    // sul telefono non c'e' il mouse: un tocco sulla scheda accende la sua freccia,
    // un secondo tocco la spegne
    c.onclick = (ev) => {
      if (ev.target.closest("button, a")) return;
      const u = c.dataset.uci;
      if (S.fissata && S.evidenza === u) { S.fissata = false; S.evidenza = null; }
      else { S.fissata = true; S.evidenza = u; }
      disegnaFrecce();
    };
  }
}

async function vediLinea(uci) {
  const box = el("lin_" + uci);
  if (!box) return;
  if (box.classList.contains("on")) { box.classList.remove("on"); return; }
  evento("come-continua");
  box.classList.add("on");
  box.innerHTML = '<p class="busy">Simulo…</p>';

  const fenLinea = S.gioco.fen();
  const L = await linea(S.motore, fenLinea, elo(), uci, { plies: PLIES, depth: 8 });

  let h = '<div class="linrow">';
  L.mosse.forEach((m, i) => {
    if ((m.mio && i % 2 === 0) || i === 0) h += `<span class="num">${m.n}.</span>`;
    h += `<span class="${m.mio ? "me" : "op"}">${m.san}`
      + (m.p !== null ? `<sup>${m.p}%</sup>` : "") + "</span>";
  });
  h += "</div>";

  h += `<div class="traj">` + L.mosse.map((m) =>
    `<span>${m.san} <b style="color:${(m.matto !== null && m.matto !== undefined)
      ? (m.matto > 0 ? "var(--acc)" : "var(--fr-ko)")
      : (m.cp >= 0 ? "var(--acc)" : "var(--cool)")}">${fmt(m.cp, m.matto)}</b></span>`).join("")
    + "</div>";

  h += `<div class="saldo"><span class="lab">Saldo sulle ${Math.ceil(L.mosse.length / 2)} mosse<br>`
    + `da ${fmt(L.cp0)} a ${fmt(L.cp_fin)}</span>`
    + `<span class="val" style="color:${L.saldo >= 0 ? "var(--acc)" : "var(--cool)"}">${fmt(L.saldo)}</span></div>`;

  if (L.esito) {
    const cls = L.esito.tipo === "patta" ? "draw" : (L.esito.mio ? "win" : "lose");
    h += `<div class="verd ${cls}">${L.esito.testo}</div>`;
  }
  if (L.struttura && L.struttura.strutture && L.struttura.strutture.length) {
    h += `<div class="apchip">porta a <b>${L.struttura.strutture.map((z) => nomeStruttura(z.chiave, z.nome)).join(", ")}</b></div>`;
  }
  if (L.apertura) {
    h += `<div class="apchip">arriva a <b>${nomeApertura(L.apertura.nome, L.apertura.eco)}</b><span class="eco">${L.apertura.eco}</span>`
      + (L.fuori_libro ? " &mdash; poi fuori dal libro" : "") + "</div>";
  }
  const p = L.prob < 0.1 ? "meno dello 0,1%" : L.prob + "%";
  h += `<div class="linnote">Tu giochi sempre la migliore, il ${S.lui} la più probabile. `
    + `Che risponda esattamente così per tutta la linea: ${p}. Più si va avanti, meno la `
    + `sequenza esatta conta: guarda il motivo, non le mosse.</div>`;
  h += `<figure class="sk-diag" data-tipo="linea" data-fen0="${fenLinea}" `
    + `data-mosse="${encodeURIComponent(L.mosse.map((m) => m.san).join(" "))}"></figure>`;
  box.innerHTML = h;
  montaDiagramma(box);
}

// ------------------------------------------------------------ comandi

function aggiornaLato() {
  el("bLato").textContent = S.mio === "w" ? "Gioca col nero" : "Gioca col bianco";
}

async function reset() {
  S.gioco = new Chess();
  S.sel = null; S.bersagli = []; S.chiavi = [];
  S.revisione = new Map(); S.sceltaBot = new Map(); S.vista = null; S.frecceCand = []; S.ultimaAnalisi = null;
  disegna(); mostraRisposta(null);
  if (S.auto && S.gioco.turn() !== S.mio) await dopoMossa();
  else await analizza();
}

async function indietro() {
  if (S.occupato) return;
  const passi = S.auto && S.gioco.history().length >= 2 ? 2 : 1;
  for (let i = 0; i < passi; i++) { S.gioco.undo(); S.chiavi.pop(); }
  S.sel = null; S.bersagli = [];
  S.vista = null; S.frecceCand = [];
  potaRevisione();
  disegna(); mostraRisposta(null);
  await analizza();
}

// ------------------------------------------------------------ frecce: sempre, a richiesta, mai

function impostaFrecce() {
  try {
    const v = localStorage.getItem("frecce");
    if (v === "sempre" || v === "richiesta" || v === "mai") S.frecce = v;
  } catch (e) { /* si resta su "sempre" */ }
  const bottoni = document.querySelectorAll("#modoFrecce [data-f]");
  const segna = () => bottoni.forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.f === S.frecce)));
  bottoni.forEach((b) => {
    b.onclick = () => {
      S.frecce = b.dataset.f;
      S.fissata = false; S.evidenza = null;
      try { localStorage.setItem("frecce", S.frecce); } catch (e) { /* va bene lo stesso */ }
      segna(); disegnaFrecce();
      evento("frecce-" + S.frecce);
    };
  });
  segna();
}

// ------------------------------------------------------------ temi grafici

function temaAttivo() { return document.documentElement.dataset.tema || "classico"; }

function impostaTemi() {
  const bottoni = document.querySelectorAll("#temi [data-t]");
  const segna = () => bottoni.forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.t === temaAttivo())));
  bottoni.forEach((b) => {
    b.onclick = () => {
      const t = b.dataset.t;
      if (t === "classico") delete document.documentElement.dataset.tema;
      else document.documentElement.dataset.tema = t;
      try { localStorage.setItem("tema", t === "classico" ? "" : t); } catch (e) { /* va bene lo stesso */ }
      segna();
      evento("tema-" + t);
    };
  });
  segna();
}

// ------------------------------------------------------------ esporta la partita

function motivoFine() {
  const g = S.gioco;
  if (g.isCheckmate()) return g.turn() === S.mio ? "matto, ha vinto l’avversario" : "matto, hai vinto tu";
  if (g.isStalemate()) return "stallo";
  if (g.isThreefoldRepetition()) return "patta per ripetizione";
  if (g.isInsufficientMaterial()) return "patta per materiale insufficiente";
  if (g.isDraw()) return "patta (regola delle 50 mosse)";
  return "in corso";
}

function risultato() {
  const g = S.gioco;
  if (g.isCheckmate()) return g.turn() === "w" ? "0-1" : "1-0";
  if (g.isDraw()) return "1/2-1/2";
  return "*";
}

function testoPgn() {
  const note = new Map();
  for (const [i, b] of S.sceltaBot) {
    note.set(i, `avversario ${b.elo}, probabilità ${Math.round(b.p * 1000) / 10}%`);
  }
  for (const [i, r] of S.revisione) {
    if (!r || !r.classe) continue;
    const prima = note.get(i);
    const t = `${CLASSI[r.classe].nome.toLowerCase()}, meglio ${r.migliore.san} `
      + `(${fmt(r.migliore.cp, r.migliore.matto)} invece di ${fmt(r.giocata.cp, r.giocata.matto)})`
      + (r.perche ? ". " + r.perche : "");
    note.set(i, prima ? prima + "; " + t : t);
  }
  const avv = `Avversario simulato ${elo()}`;
  const meta = document.querySelector('meta[name="versione"]');
  return pgn({
    mosse: S.gioco.history(),
    note,
    risultato: risultato(),
    finale: S.gioco.isGameOver() ? motivoFine() : null,
    bianco: S.mio === "w" ? "Tu" : avv,
    nero: S.mio === "b" ? "Tu" : avv,
    sito: location.origin + location.pathname,
    versione: meta ? meta.content : null,
  });
}

async function inviaPartita() {
  if (!S.gioco.history().length) { avviso("Non c’è ancora nessuna mossa da inviare."); return; }
  evento("invia-partita");
  const esito = await invia(testoPgn(), nomeFile());
  if (esito === "scaricata") avviso("Partita scaricata (file .pgn).");
}

function avviso(t) {
  const d = el("ultima");
  d.className = "ultima"; d.textContent = t;
}

async function avvia() {
  window.__avviato = true;   // spegne la diagnostica in index.html
  avviaConteggio();
  await caricaPezzi();
  disegna();
  await caricaAperture();
  S.motore = await new Motore().avvia((t) => {
    if (t) el("out").innerHTML = `<p class="busy">${t}</p>`;
  });
  el("mode").textContent = "Avversario simulato su Stockfish 18 (WebAssembly)";

  el("bUndo").onclick = indietro;
  el("bReset").onclick = reset;
  el("bInvia").onclick = inviaPartita;
  el("bLato").onclick = async () => {
    if (S.occupato) return;
    S.mio = S.mio === "w" ? "b" : "w";
    evento("cambio-colore");
    aggiornaLato();
    await reset();
  };
  try { S.minacce = localStorage.getItem("minacce") === "1"; } catch (e) { /* resta spenta */ }
  el("minacce").checked = S.minacce;
  el("minacce").onchange = () => {
    S.minacce = el("minacce").checked;
    try { localStorage.setItem("minacce", S.minacce ? "1" : ""); } catch (e) { /* va bene lo stesso */ }
    evento(S.minacce ? "minacce-on" : "minacce-off");
    disegna();
  };
  el("auto").onchange = async () => {
    S.auto = el("auto").checked;
    if (S.auto && S.gioco.turn() !== S.mio) await dopoMossa();
  };
  impostaTemi();
  impostaFrecce();
  // frecce della tastiera: scorrono le mosse della partita
  document.addEventListener("keydown", (ev) => {
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.key === "ArrowLeft") { passo(-1); ev.preventDefault(); }
    else if (ev.key === "ArrowRight") { passo(1); ev.preventDefault(); }
    else if (ev.key === "Escape") esciVista();
  });
  el("elo").oninput = () => { el("elov").textContent = elo(); };
  el("elo").onchange = async () => {
    evento("cambio-elo");
    if (!S.occupato) await analizza();
  };

  aggiornaLato();
  await analizza();
}

avvia().catch((e) => {
  console.error(e);
  el("mode").textContent = "Avvio fallito";
  el("out").innerHTML =
    `<div class="allarme" style="font-weight:400"><b>Errore all’avvio</b><br><br>${e.message}`
    + `<br><br>Se il sito è stato aggiornato da poco, quasi sempre è il browser che mescola `
    + `file vecchi e nuovi: ricarica con <b>Ctrl+Shift+R</b> (sul telefono chiudi la scheda `
    + `e riaprila, o prova in navigazione privata).`
    + `<br><br>Se non basta, apri la console (F12) per il dettaglio. Puoi anche ricaricare con `
    + `<code>?debug</code> in fondo all’indirizzo: stampa in console tutto quello che `
    + `dice il motore.</div>`;
});
