/**
 * Conteggio visite con GoatCounter (goatcounter.com): gratuito per uso non
 * commerciale, niente cookie, nessun dato personale salvato.
 *
 * Per attivarlo: crea un account su goatcounter.com, scegli un codice
 * (es. "albero-scacchi") e scrivilo qui sotto. Vuoto = conteggio spento.
 *
 * Le visite da localhost non vengono contate: GoatCounter le scarta da solo.
 */
const CODICE = "chessaism";

let pronto = false;
const inCoda = [];

export function avvia() {
  if (!CODICE || typeof document === "undefined") return;
  // nessuna visita automatica: la contiamo noi qui sotto, cosi' anche gli
  // eventi partono solo quando lo script e' davvero caricato
  window.goatcounter = { no_onload: true };
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${CODICE}.goatcounter.com/count`;
  s.onload = () => {
    pronto = true;
    window.goatcounter.count();   // la visita alla pagina
    while (inCoda.length) evento(inCoda.shift());
  };
  document.head.appendChild(s);
}

const giaContati = new Set();

/**
 * Un evento, contato al massimo una volta per visita: interessa quante
 * persone usano una funzione, non quante volte la cliccano.
 */
export function evento(nome) {
  if (!CODICE) return;
  if (!pronto) { inCoda.push(nome); return; }
  if (giaContati.has(nome)) return;
  giaContati.add(nome);
  try {
    window.goatcounter.count({ path: nome, title: nome, event: true });
  } catch (e) { /* il conteggio non deve mai rompere la pagina */ }
}
