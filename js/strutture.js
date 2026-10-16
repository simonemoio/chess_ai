/**
 * Riconoscimento delle strutture pedonali di mediogioco.
 *
 * Regole deterministiche sulla posizione dei pedoni: niente ML, niente
 * dataset. Ogni struttura nota porta con se' il piano tipico di entrambi i
 * lati, che e' la parte che serve davvero.
 *
 * La terminologia e i piani sono quelli standard della letteratura sulle
 * strutture pedonali (il riferimento classico e' Soltis, "Pawn Structure
 * Chess"); non sono citati capitoli perche' non verificati.
 */

/** Pedoni di un colore, alle loro case REALI. */
function pedoni(fen, colore) {
  const righe = fen.split(" ")[0].split("/");
  const out = new Set();
  righe.forEach((riga, r) => {
    let f = 0;
    for (const ch of riga) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      const eBianco = ch === ch.toUpperCase();
      if (ch.toLowerCase() === "p" && (eBianco === (colore === "w"))) {
        out.add("abcdefgh"[f] + (8 - r));
      }
      f += 1;
    }
  });
  return out;
}

/** d4 -> d5: la stessa casa vista dall'altro lato. */
function specchia(set) {
  const out = new Set();
  for (const c of set) out.add(c[0] + (9 - +c[1]));
  return out;
}

function colonne(set) {
  const d = {};
  for (const casa of set) {
    const f = casa.charCodeAt(0) - 97;
    (d[f] = d[f] || []).push(+casa[1]);
  }
  return d;
}

const ha = (set, casa) => set.has(casa);
const vuota = (col, f) => !col[f] || col[f].length === 0;

// ---------------------------------------------------------------- strutture
// I test sono scritti dal punto di vista del bianco e applicati anche al nero
// specchiando le case.

const NOTE = [
  { chiave: "carlsbad", nome: "Struttura di Carlsbad",
    test: (m, s, cm, cs) => ha(m, "d4") && vuota(cm, 2) && ha(s, "d5") && ha(s, "c6") && vuota(cs, 4),
    mio: "Attacco di minoranza: b4-b5 per creare una debolezza in c6.",
    suo: "Contrattacco al centro o sul re, tipicamente con f5 ed e5." },

  { chiave: "maroczy", nome: "Legatura Mar\u00f3czy",
    test: (m, s, cm, cs) => ha(m, "c4") && ha(m, "e4") && vuota(cm, 3) && vuota(cs, 2),
    mio: "Soffocare il gioco avversario: niente rotture, scambiare i pezzi attivi.",
    suo: "Liberarsi con b5 o f5, altrimenti si resta senza spazio." },

  { chiave: "catena_est", nome: "Catena est-indiana",
    test: (m, s) => ha(m, "d5") && ha(m, "e4") && ha(s, "e5") && ha(s, "d6"),
    mio: "Gioco sul lato di donna: c5 e apertura della colonna c.",
    suo: "Gioco sul lato di re: f5, f4 e attacco. Corsa opposta, conta il tempo." },

  { chiave: "catena_francese", nome: "Catena francese",
    test: (m, s) => ha(m, "e5") && ha(m, "d4") && ha(s, "e6") && ha(s, "d5"),
    mio: "Spazio e attacco sul lato di re; la catena indica la direzione.",
    suo: "Colpire la base della catena con c5, poi pressione su d4." },

  { chiave: "stonewall", nome: "Stonewall",
    test: (m) => ["d4", "e3", "f4", "c3"].every((c) => ha(m, c)),
    mio: "Avamposto in e5 e attacco sul re; l'alfiere campochiaro va attivato.",
    suo: "Occupare la casa debole e4 e sfruttare l'alfiere cattivo avversario." },

  { chiave: "sospesi", nome: "Pedoni sospesi",
    test: (m, s, cm) => ha(m, "c4") && ha(m, "d4") && vuota(cm, 1) && vuota(cm, 4),
    mio: "Tenere la tensione e cercare la rottura d5 o c5 al momento giusto.",
    suo: "Bloccarli e attaccarli: da forti diventano deboli se si fermano." },

  { chiave: "benoni", nome: "Struttura Benoni",
    test: (m, s, cm, cs) => ha(m, "d5") && vuota(cm, 2) && ha(s, "c5") && ha(s, "d6") && vuota(cs, 4),
    mio: "Avanzare al centro con e4-e5, oppure f4-f5 sul lato di re.",
    suo: "Maggioranza sul lato di donna: b5 e pressione sulla colonna e semiaperta." },

  { chiave: "riccio", nome: "Riccio",
    test: (m, s) => ha(m, "c4") && ha(m, "e4") && ["a6", "b6", "d6", "e6"].every((c) => ha(s, c)),
    mio: "Spazio e controllo; evitare che l'avversario scatti con b5 o d5.",
    suo: "Aspettare e scattare al momento giusto con b5 o d5." },
];

function cercaNote(fen) {
  const out = [];
  const visti = new Set();
  const pw = pedoni(fen, "w"), pb = pedoni(fen, "b");
  for (const colore of ["w", "b"]) {
    // dal lato del nero si specchiano ENTRAMBI gli insiemi, cosi' i test
    // valgono per tutti e due i colori senza riscriverli
    const m = colore === "w" ? pw : specchia(pb);
    const s = colore === "w" ? pb : specchia(pw);
    const cm = colonne(m), cs = colonne(s);

    for (const N of NOTE) {
      if (visti.has(N.chiave)) continue;
      if (N.test(m, s, cm, cs)) {
        visti.add(N.chiave);
        // i piani sono scritti per chi soddisfa il test: assegnali ai colori veri
        out.push({
          chiave: N.chiave, nome: N.nome,
          piano_bianco: colore === "w" ? N.mio : N.suo,
          piano_nero: colore === "w" ? N.suo : N.mio,
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- tratti

function isolati(set) {
  const col = colonne(set);
  const out = [];
  for (const f in col) {
    const n = +f;
    if (vuota(col, n - 1) && vuota(col, n + 1)) {
      for (const r of col[n]) out.push("abcdefgh"[n] + r);
    }
  }
  return out;
}

function doppiati(set) {
  const col = colonne(set);
  return Object.keys(col).filter((f) => col[f].length > 1).map((f) => "abcdefgh"[+f]);
}

function passati(mio, suo, colore) {
  const cs = colonne(suo);
  const out = [];
  for (const casa of mio) {
    const f = casa.charCodeAt(0) - 97, r = +casa[1];
    let libero = true;
    for (const ff of [f - 1, f, f + 1]) {
      for (const rr of cs[ff] || []) {
        const davanti = colore === "bianco" ? rr > r : rr < r;
        if (davanti) libero = false;
      }
    }
    if (libero) out.push(casa);
  }
  return out;
}

function centro(fen) {
  const b = pedoni(fen, "w"), n = pedoni(fen, "b");
  const centrali = [...b, ...n].filter((c) => "cdef".includes(c[0]));
  if (centrali.length <= 2) return "aperto";
  let bloccati = 0;
  for (const c of b) {
    if (!"de".includes(c[0])) continue;
    if (n.has(c[0] + (+c[1] + 1))) bloccati += 1;
  }
  if (bloccati >= 2) return "chiuso";
  if (bloccati === 1) return "semichiuso";
  return "semiaperto";
}

function fase(fen) {
  const campo = fen.split(" ")[0];
  const pezzi = (campo.match(/[nbrqNBRQ]/g) || []).length;
  const numero = +(fen.split(" ")[5] || 1);
  if (numero <= 10) return "apertura";
  if (pezzi <= 4) return "finale";
  return "mediogioco";
}

/** Quadro strutturale della posizione. */
export function analizza(fen) {
  const tratti = [];
  const pb = pedoni(fen, "w"), pn = pedoni(fen, "b");

  for (const [colore, mio, suo] of [["bianco", pb, pn], ["nero", pn, pb]]) {
    const q = colore === "bianco";
    for (const casa of isolati(mio)) {
      const iqp = casa[0] === "d";
      const a = iqp ? "Gioco attivo dei pezzi e rottura al centro al momento buono."
                    : "Compensare con l'attivit\u00e0: pesa soprattutto nel finale.";
      const d = iqp ? "Scambiare i pezzi, bloccare il pedone davanti e attaccarlo."
                    : "Bloccarlo davanti e accumulare pressione.";
      tratti.push({
        nome: iqp ? `Pedone di donna isolato (${colore})`
                  : `Pedone isolato in ${casa} (${colore})`,
        piano_bianco: q ? a : d, piano_nero: q ? d : a,
      });
    }
    for (const c of doppiati(mio)) {
      tratti.push({
        nome: `Pedoni doppiati sulla colonna ${c} (${colore})`,
        piano_bianco: q ? "Usare la colonna semiaperta che lo scambio ha creato."
                        : "Puntare al finale, dove il difetto pesa.",
        piano_nero: q ? "Puntare al finale, dove il difetto pesa."
                      : "Usare la colonna semiaperta che lo scambio ha creato.",
      });
    }
    for (const casa of passati(mio, suo, colore)) {
      tratti.push({
        nome: `Pedone passato in ${casa} (${colore})`,
        piano_bianco: q ? "Sostenerlo e spingerlo: vale di pi\u00f9 quanto pi\u00f9 avanza."
                        : "Bloccarlo con un pezzo, meglio se un cavallo.",
        piano_nero: q ? "Bloccarlo con un pezzo, meglio se un cavallo."
                      : "Sostenerlo e spingerlo: vale di pi\u00f9 quanto pi\u00f9 avanza.",
      });
    }
  }

  // maggioranze d'ala
  const conta = (set, da, a) =>
    [...set].filter((c) => c.charCodeAt(0) - 97 >= da && c.charCodeAt(0) - 97 <= a).length;
  for (const [ala, da, a] of [["donna", 0, 3], ["re", 4, 7]]) {
    const b = conta(pb, da, a), n = conta(pn, da, a);
    if (b === n) continue;
    const chi = b > n ? "bianco" : "nero";
    const av = `Avanzare i pedoni sul lato di ${ala} per creare un passato.`;
    const fr = "Frenare l'avanzata e giocare sull'ala opposta.";
    tratti.push({
      nome: `Maggioranza sul lato di ${ala} (${chi}, ${Math.max(b, n)} contro ${Math.min(b, n)})`,
      piano_bianco: chi === "bianco" ? av : fr,
      piano_nero: chi === "nero" ? av : fr,
    });
  }

  return {
    fase: fase(fen),
    centro: centro(fen),
    strutture: cercaNote(fen),
    tratti: tratti.slice(0, 6),
  };
}
