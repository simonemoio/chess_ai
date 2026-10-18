/**
 * Esportazione della partita in PGN, e invio senza backend.
 *
 * Il PGN e' il formato che apre qualsiasi programma di scacchi (Lichess,
 * Chess.com, ChessBase). Nei commenti finiscono le cose che servono a capire
 * cosa e' successo: per ogni mossa dell'avversario il livello e la probabilita'
 * con cui il modello l'ha scelta, per le tue la classe della revisione.
 * Chi riceve il file puo' incollarlo su lichess.org/paste e rivederlo.
 *
 * L'invio passa dal foglio di condivisione del telefono (WhatsApp, Mail,
 * Telegram…): nessun server. Dove non c'e' (quasi tutti i desktop), il file
 * si scarica.
 */

const pad = (n) => String(n).padStart(2, "0");

/** Le sette intestazioni obbligatorie del PGN piu' quelle utili qui. */
function intestazioni(o) {
  const d = o.data || new Date();
  const h = [
    ["Event", "Prova albero delle probabilità"],
    ["Site", o.sito || "?"],
    ["Date", `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`],
    ["Round", "-"],
    ["White", o.bianco],
    ["Black", o.nero],
    ["Result", o.risultato],
  ];
  if (o.versione) h.push(["Annotator", "prototipo v" + o.versione]);
  h.push(["Time", `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`]);
  // i commenti PGN non possono contenere graffe; le virgolette vanno protette
  return h.map(([k, v]) => `[${k} "${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`).join("\n");
}

const pulisci = (t) => String(t).replace(/[{}]/g, "");

/**
 * @param o.mosse     SAN di tutte le semimosse, dalla posizione iniziale
 * @param o.note      Map indice semimossa -> testo del commento
 * @param o.risultato "1-0" | "0-1" | "1/2-1/2" | "*"
 * @param o.finale    commento dopo l'ultima mossa (motivo della fine)
 */
export function pgn(o) {
  const parti = [];
  let dopoCommento = false;
  o.mosse.forEach((san, i) => {
    if (i % 2 === 0) parti.push(`${i / 2 + 1}.`);
    // dopo un commento sulla mossa del bianco lo standard ripete il numero: "2..."
    else if (dopoCommento) parti.push(`${(i + 1) / 2}...`);
    parti.push(san);
    dopoCommento = false;
    const c = o.note && o.note.get(i);
    if (c) { parti.push(`{${pulisci(c)}}`); dopoCommento = true; }
  });
  if (o.finale) parti.push(`{${pulisci(o.finale)}}`);
  parti.push(o.risultato);

  // righe da 80 caratteri al massimo, come chiede lo standard
  const righe = [];
  let r = "";
  for (const p of parti) {
    if (r && r.length + 1 + p.length > 80) { righe.push(r); r = p; }
    else r = r ? r + " " + p : p;
  }
  if (r) righe.push(r);
  return intestazioni(o) + "\n\n" + righe.join("\n") + "\n";
}

export function nomeFile(d = new Date()) {
  return `partita-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
    + `-${pad(d.getHours())}${pad(d.getMinutes())}.pgn`;
}

/**
 * Condivide il PGN col foglio di sistema; se non c'e', lo scarica.
 * @returns "condivisa" | "annullata" | "scaricata"
 */
export async function invia(testo, nome) {
  const titolo = "Partita col prototipo";
  if (navigator.share) {
    // text/plain: con il tipo PGN alcuni telefoni rifiutano il file
    const file = new File([testo], nome, { type: "text/plain" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: titolo });
        return "condivisa";
      }
      await navigator.share({ title: titolo, text: testo });
      return "condivisa";
    } catch (e) {
      if (e && e.name === "AbortError") return "annullata";
      // altri errori (permessi, tipo rifiutato): si ripiega sul download
    }
  }
  const url = URL.createObjectURL(new Blob([testo], { type: "application/x-chess-pgn" }));
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "scaricata";
}
