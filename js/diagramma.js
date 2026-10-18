/**
 * Diagramma dell'apertura per la scheda didattica.
 *
 * Dalle mosse della scheda ("1.e4 e5 2.Nf3 Nc6 3.Bc4") ricostruisce ogni
 * posizione e disegna la scacchiera in SVG: posizione finale, pezzi gia'
 * mossi in evidenza, freccia sull'ultima mossa. Si puo' scorrere mossa per
 * mossa per vedere come ci si arriva.
 *
 * Alcune schede descrivono uno SCHEMA del bianco, non una sequenza
 * ("1.d4, Bf4, e3, c3, Nf3"): il nero li' non ha mosse fisse. In quel caso si
 * giocano solo le mosse del bianco, lasciando il nero com'e'.
 */
import { Chess } from "../vendor/chess.js";

const pulisciToken = (t) => t.replace(/^\d+\.+/, "").replace(/[,;]+$/, "").replace(/0-0-0/g, "O-O-O").replace(/0-0/g, "O-O");

function token(testo) {
  return testo.replace(/…/g, " ").split(/\s+/).map(pulisciToken).filter(Boolean);
}

/** Passa il tratto al bianco senza muovere: niente en passant pendente. */
function tocca_al_bianco(fen) {
  const p = fen.split(" ");
  p[1] = "w"; p[3] = "-";
  return p.join(" ");
}

/**
 * @returns {fens, mosse, soloBianco} oppure null se non c'e' niente da disegnare.
 *   fens[0] e' la posizione iniziale, fens[i] quella dopo la mossa i.
 *   mosse[i-1] e' la mossa (verbose di chess.js) che porta a fens[i].
 */
export function ricostruisci(testo) {
  const tk = token(testo || "");
  if (!tk.length) return null;

  // 1) sequenza normale, bianco e nero alternati
  let g = new Chess();
  const fens = [g.fen()], mosse = [];
  for (const t of tk) {
    let m = null;
    try { m = g.move(t); } catch (e) { m = null; }
    if (!m) break;
    mosse.push(m); fens.push(g.fen());
  }
  if (mosse.length === tk.length) return { fens, mosse, soloBianco: false };

  // 2) schema del solo bianco
  g = new Chess();
  const fens2 = [g.fen()], mosse2 = [];
  for (const t of tk) {
    let m = null;
    try { g.load(tocca_al_bianco(g.fen())); m = g.move(t); } catch (e) { m = null; }
    if (!m) break;
    mosse2.push(m); fens2.push(g.fen());
  }
  if (mosse2.length > mosse.length) return { fens: fens2, mosse: mosse2, soloBianco: true };
  return mosse.length ? { fens, mosse, soloBianco: false } : null;
}

/** Etichetta della mossa i (1-based): "3.Bc4", "2…Nc6", o "4.Nf3" nello schema. */
export function etichetta(r, i) {
  const m = r.mosse[i - 1];
  if (r.soloBianco) return `${i}.${m.san}`;
  const n = Math.ceil(i / 2);
  return m.color === "w" ? `${n}.${m.san}` : `${n}…${m.san}`;
}

/** Case che a fine apertura contengono un pezzo diverso da quello iniziale. */
export function caseCambiate(fenA, fenB) {
  const a = new Chess(fenA), b = new Chess(fenB);
  const out = [];
  for (const f of "abcdefgh") for (let r = 1; r <= 8; r++) {
    const sq = f + r;
    const pb = b.get(sq);
    if (!pb) continue;
    const pa = a.get(sq);
    if (!pa || pa.type !== pb.type || pa.color !== pb.color) out.push(sq);
  }
  return out;
}

const GLIFI = { k: "\u265A\uFE0E", q: "\u265B\uFE0E", r: "\u265C\uFE0E",
                b: "\u265D\uFE0E", n: "\u265E\uFE0E", p: "\u265F\uFE0E" };

/**
 * SVG della posizione (bianco in basso, come la scacchiera della pagina).
 * @param o.ultima     {from, to} da evidenziare con una freccia
 * @param o.evidenza   case da colorare (pezzi gia' mossi)
 * @param o.sprite     true se lo sprite dei pezzi e' nella pagina
 * @param o.freccia    funzione (da, a, colore, spessore, opacita) -> stringa SVG
 */
export function svg(fen, o = {}) {
  const g = new Chess(fen);
  let h = `<svg class="sk-tav" viewBox="-0.32 0 8.32 8.32" role="img" aria-label="Scacchiera">`;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const sq = "abcdefgh"[f] + (8 - r);
    const chiara = (r + f) % 2 === 0;
    h += `<rect x="${f}" y="${r}" width="1" height="1" style="fill:var(${chiara ? "--lt" : "--dk"})"/>`;
    if (o.evidenza && o.evidenza.includes(sq)) {
      h += `<rect x="${f}" y="${r}" width="1" height="1" style="fill:var(--c1)" opacity="0.28"/>`;
    }
  }
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = g.get("abcdefgh"[f] + (8 - r));
    if (!p) continue;
    if (o.sprite) {
      h += `<use href="#${p.color}${p.type}" transform="translate(${f} ${r}) scale(0.025)"/>`;
    } else {
      h += `<text x="${f + 0.5}" y="${r + 0.8}" text-anchor="middle" font-size="0.85" `
        + `style="fill:${p.color === "w" ? "#FFFFFF" : "#16150F"};stroke:#16150F;stroke-width:0.02">${GLIFI[p.type]}</text>`;
    }
  }
  if (o.ultima && o.freccia) h += o.freccia(o.ultima.from, o.ultima.to, "var(--fr-mv)", 0.13, 0.75);
  // coordinate fuori dalla scacchiera, a sinistra e sotto
  for (let i = 0; i < 8; i++) {
    h += `<text x="-0.16" y="${i + 0.6}" text-anchor="middle" font-size="0.24" style="fill:var(--mut)">${8 - i}</text>`;
    h += `<text x="${i + 0.5}" y="8.25" text-anchor="middle" font-size="0.24" style="fill:var(--mut)">${"abcdefgh"[i]}</text>`;
  }
  return h + "</svg>";
}
