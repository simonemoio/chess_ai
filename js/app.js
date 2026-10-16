/**
 * Interfaccia: scacchiera, pannello, orchestrazione.
 *
 * Lo stato vive nel browser: niente server, quindi ogni persona che apre la
 * pagina ha la sua partita e non interferisce con le altre.
 */
import { Chess } from "../vendor/chess.js";
import { Motore } from "./motore.js";
import { albero, linea } from "./analisi.js";
import { distribuzione, campiona } from "./avversario.js";
import { carica as caricaAperture, corrente as aperturaCorrente } from "./aperture.js";
import { analizza as analizzaStrutture } from "./strutture.js";

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
};

const elo = () => +el("elo").value;
const chiave = (fen) => fen.split(" ").slice(0, 3).join(" ");

// ------------------------------------------------------------ scacchiera

function disegna() {
  const righe = S.gioco.fen().split(" ")[0].split("/");
  const bd = el("board");
  bd.innerHTML = "";
  righe.forEach((riga, r) => {
    let f = 0;
    for (const ch of riga) {
      if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++) casa(bd, r, f++, ""); }
      else casa(bd, r, f++, ch);
    }
  });
}

function casa(bd, r, f, ch) {
  const d = document.createElement("div");
  const nome = "abcdefgh"[f] + (8 - r);
  const chiara = (r + f) % 2 === 0;
  d.className = (chiara ? "lt" : "dk")
    + (S.sel === nome ? " sel" : "")
    + (S.bersagli.includes(nome) ? " trg" : "");
  if (ch) d.appendChild(pezzo(ch));
  const col = chiara ? "#8C7444" : "#EFE7D6";
  if (r === 7) d.appendChild(etichetta("co cf", "abcdefgh"[f], col));
  if (f === 0) d.appendChild(etichetta("co cr", String(8 - r), col));
  d.addEventListener("click", () => clicca(nome));
  bd.appendChild(d);
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
  if (S.sel) {
    const da = S.sel;
    S.sel = null; S.bersagli = [];
    let fatta = null;
    try { fatta = S.gioco.move({ from: da, to: sq, promotion: "q" }); } catch (e) { fatta = null; }
    if (fatta) {
      S.chiavi.push(chiave(S.gioco.fen()));
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
    const dist = await distribuzione(S.motore, S.gioco.fen(), elo(), 4, 10);
    if (dist.length) {
      const scelta = campiona(dist);
      const v = S.gioco.moves({ verbose: true }).find(
        (x) => x.lan === scelta.uci || x.from + x.to === scelta.uci.slice(0, 4));
      if (v) {
        S.gioco.move(v.san);
        S.chiavi.push(chiave(S.gioco.fen()));
        disegna();
        mostraRisposta({ san: v.san, p: Math.round(scelta.p * 1000) / 10,
          nome: nomePezzo(v.piece), glifo: GLIFI[v.piece] });
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
  d.innerHTML = `Ha giocato <b>${r.glifo} ${r.san}</b>`
    + `<span class="pc2">${r.nome}, probabilità ${r.p}%</span>`;
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

function strutHtml(St) {
  if (!St) return "";
  let h = "";
  for (const x of St.strutture || []) {
    h += `<div class="strut"><div class="tit">${x.nome}</div>`
      + `<div class="meta">centro ${St.centro} &middot; ${St.fase}</div>`
      + `<div class="pl"><span class="q b">bianco</span><span>${x.piano_bianco}</span></div>`
      + `<div class="pl"><span class="q n">nero</span><span>${x.piano_nero}</span></div></div>`;
  }
  const t = St.tratti || [];
  if (t.length) h += `<div class="trat">${t.map((y) => `<span>${y.nome}</span>`).join("")}</div>`;
  return h;
}

function intestazione(io, lui, ap, St, e) {
  el("phead").innerHTML =
    `<div class="ph1"><span class="dot ${io === "bianco" ? "wq" : "bq"}"></span>`
    + `Muove il ${io} &mdash; sei tu</div>`
    + `<div class="ph2">Le mosse che potresti giocare. Per ognuna, come risponderebbe `
    + `il ${lui} se fosse un giocatore di ${e}.</div>`
    + (ap ? `<div class="apbig">Apertura: <b>${ap.nome}</b>`
        + `<span class="eco">${ap.eco}</span>`
        + (ap.in_libro ? "" : " &mdash; sei già fuori dal libro") + "</div>" : "")
    + strutHtml(St)
    + `<div class="legend">`
    + `<div><span class="sw g"></span><span><b>Oggettiva</b> &mdash; quanto vale la mossa contro il gioco perfetto</span></div>`
    + `<div><span class="sw a"></span><span><b>Contro ${e}</b> &mdash; quanto rende davvero contro questo avversario</span></div>`
    + `<div style="opacity:.75">In pedoni, dal punto di vista del ${io}. Più alto = meglio per te.</div>`
    + `</div>`;
}

const PAL = ["#A8482A", "#C6795F", "#DCAF9D"];

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
    return `<span${m && y.matto <= 0 ? ' class="mat"' : ""}><i>${y.glifo}</i>`
      + `${y.nome} ${y.san} <b>${y.p}%</b>${et}</span>`;
  }).join("");

  return `<div class="card${big ? " div" : ""}${x.matto_contro > 0 ? " pericolo" : ""}">`
    + (x.matto_contro > 0 ? `<div class="allarme">Ti fa matto nel ${x.matto_contro}% delle risposte</div>` : "")
    + (x.matto_pro > 0 ? `<div class="occasione">Gli dai matto nel ${x.matto_pro}% delle risposte</div>` : "")
    + `<div class="top"><span><span class="pre">Se giochi</span>`
    + `<span class="mv"><i>${x.glifo}</i>${x.san}</span>${tag}</span>`
    + `<span class="nums">`
    + `<span class="nbox"><span class="nlab">oggettiva</span>`
    + `<span class="obj">${fmt(x.oggettiva, x.ogg_matto)}</span></span>`
    + `<span class="nbox"><span class="nlab">contro ${e}</span>`
    + `<span class="ev" style="color:${x.ev >= 0 ? "var(--acc)" : "var(--cool)"}">${fmtEv(x.ev)}</span></span>`
    + `</span></div>`
    + (x.ap ? `<div class="apchip">porta in <b>${x.ap.nome}</b><span class="eco">${x.ap.eco}</span></div>` : "")
    + `<div class="replab">Il ${lui} risponde</div>`
    + `<div class="pbar">${bars}</div><div class="rep">${reps}</div>`
    + `<button class="linbtn" data-uci="${x.uci}">Come continua</button>`
    + `<div class="lin" id="lin_${x.uci}"></div></div>`;
}

async function analizza() {
  if (S.gioco.isGameOver()) {
    el("phead").innerHTML = "";
    el("out").innerHTML = '<p class="busy">Partita finita.</p>';
    return;
  }
  S.occupato = true;
  const e = elo();
  const io = S.gioco.turn() === "w" ? "bianco" : "nero";
  S.lui = io === "bianco" ? "nero" : "bianco";

  intestazione(io, S.lui, aperturaCorrente(S.chiavi), analizzaStrutture(S.gioco.fen()), e);
  el("out").innerHTML = '<p class="busy">Calcolo…</p>';

  const parziali = [];
  const righe = await albero(S.motore, S.gioco.fen(), e, {
    depth: PROFONDITA,
    suRiga: (r, fatte, totali) => {
      parziali.push(r);
      // rendering progressivo: la prima scheda compare subito
      el("out").innerHTML = parziali.map((y) => cardHtml(y, S.lui, e)).join("")
        + `<p class="busy">${fatte} di ${totali}…</p>`;
      aggancia();
    },
  });

  el("out").innerHTML = righe.map((y) => cardHtml(y, S.lui, e)).join("")
    + `<p class="note">Le righe evidenziate sono quelle dove i due numeri divergono: `
    + `la mossa vale una cosa in assoluto e una cosa diversa contro questo avversario.</p>`;
  aggancia();
  S.occupato = false;
}

function aggancia() {
  for (const b of document.querySelectorAll(".linbtn")) {
    b.onclick = () => vediLinea(b.dataset.uci);
  }
}

async function vediLinea(uci) {
  const box = el("lin_" + uci);
  if (!box) return;
  if (box.classList.contains("on")) { box.classList.remove("on"); return; }
  box.classList.add("on");
  box.innerHTML = '<p class="busy">Simulo…</p>';

  const L = await linea(S.motore, S.gioco.fen(), elo(), uci, { plies: PLIES, depth: 8 });

  let h = '<div class="linrow">';
  L.mosse.forEach((m, i) => {
    if ((m.mio && i % 2 === 0) || i === 0) h += `<span class="num">${m.n}.</span>`;
    h += `<span class="${m.mio ? "me" : "op"}">${m.san}`
      + (m.p !== null ? `<sup>${m.p}%</sup>` : "") + "</span>";
  });
  h += "</div>";

  h += `<div class="traj">` + L.mosse.map((m) =>
    `<span>${m.san} <b style="color:${(m.matto !== null && m.matto !== undefined)
      ? (m.matto > 0 ? "var(--acc)" : "#C06048")
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
    h += `<div class="apchip">porta a <b>${L.struttura.strutture.map((z) => z.nome).join(", ")}</b></div>`;
  }
  if (L.apertura) {
    h += `<div class="apchip">arriva a <b>${L.apertura.nome}</b><span class="eco">${L.apertura.eco}</span>`
      + (L.fuori_libro ? " &mdash; poi fuori dal libro" : "") + "</div>";
  }
  const p = L.prob < 0.1 ? "meno dello 0,1%" : L.prob + "%";
  h += `<div class="linnote">Tu giochi sempre la migliore, il ${S.lui} la più probabile. `
    + `Che risponda esattamente così per tutta la linea: ${p}. Più si va avanti, meno la `
    + `sequenza esatta conta: guarda il motivo, non le mosse.</div>`;
  box.innerHTML = h;
}

// ------------------------------------------------------------ comandi

function aggiornaLato() {
  el("bLato").textContent = S.mio === "w" ? "Gioca col nero" : "Gioca col bianco";
}

async function reset() {
  S.gioco = new Chess();
  S.sel = null; S.bersagli = []; S.chiavi = [];
  disegna(); mostraRisposta(null);
  if (S.auto && S.gioco.turn() !== S.mio) await dopoMossa();
  else await analizza();
}

async function indietro() {
  if (S.occupato) return;
  const passi = S.auto && S.gioco.history().length >= 2 ? 2 : 1;
  for (let i = 0; i < passi; i++) { S.gioco.undo(); S.chiavi.pop(); }
  S.sel = null; S.bersagli = [];
  disegna(); mostraRisposta(null);
  await analizza();
}

async function avvia() {
  window.__avviato = true;   // spegne la diagnostica in index.html
  await caricaPezzi();
  disegna();
  await caricaAperture();
  S.motore = await new Motore().avvia((t) => {
    if (t) el("out").innerHTML = `<p class="busy">${t}</p>`;
  });
  el("mode").textContent = "Avversario simulato su Stockfish 18 (WebAssembly)";

  el("bUndo").onclick = indietro;
  el("bReset").onclick = reset;
  el("bLato").onclick = async () => {
    if (S.occupato) return;
    S.mio = S.mio === "w" ? "b" : "w";
    aggiornaLato();
    await reset();
  };
  el("auto").onchange = async () => {
    S.auto = el("auto").checked;
    if (S.auto && S.gioco.turn() !== S.mio) await dopoMossa();
  };
  el("elo").oninput = () => { el("elov").textContent = elo(); };
  el("elo").onchange = async () => { if (!S.occupato) await analizza(); };

  aggiornaLato();
  await analizza();
}

avvia().catch((e) => {
  console.error(e);
  el("mode").textContent = "Avvio fallito";
  el("out").innerHTML =
    `<div class="allarme" style="font-weight:400"><b>Errore all’avvio</b><br><br>${e.message}`
    + `<br><br>Apri la console (F12) per il dettaglio. Puoi anche ricaricare con `
    + `<code>?debug</code> in fondo all’indirizzo: stampa in console tutto quello che `
    + `dice il motore.</div>`;
});
