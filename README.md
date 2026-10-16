# Albero delle probabilità

Prototipo web. Gira interamente nel browser: nessun server, nessun account,
nessun dato che esce dal dispositivo.

Per ogni tua mossa candidata mostra come risponderebbe un giocatore di un
certo livello, con le probabilità, e affianca due numeri: quanto vale la mossa
contro il gioco perfetto e quanto rende contro *quell'* avversario.

---

## Pubblicarlo su GitHub Pages

### 1. Un comando solo

Metti tutti i file scaricati in una cartella — anche tutti insieme, senza
sottocartelle — e lancia:

```
python prepara.py
```

Fa tre cose: sposta i file in `js/` e `data/`, scarica in `vendor/` il motore
Stockfish (WebAssembly) e `chess.js` (circa 7 MB), e verifica che non manchi
niente. Se manca qualcosa te lo dice per nome.

Si può rilanciare quante volte vuoi. I file di `vendor/` devono finire nel
repository: GitHub Pages serve solo ciò che c'è dentro.

### 2. Provalo in locale

```
python serve.py
```

Si apre su `http://localhost:8000`.

**Aprire `index.html` dal disco non funziona**: i browser bloccano
WebAssembly, i moduli ES e i Worker sotto `file://`. Serve sempre un
indirizzo `http`, in locale o su Pages.

### 3. Crea il repository

Su github.com, nuovo repository pubblico — per esempio `albero-scacchi`.
Deve essere **pubblico**: Pages gratuito non funziona sui repository privati.

### 4. Push

```
git init
git add .
git commit -m "Prototipo albero delle probabilità"
git branch -M main
git remote add origin https://github.com/TUONOME/albero-scacchi.git
git push -u origin main
```

### 5. Attiva Pages

Nel repository: **Settings → Pages**. Alla voce *Source* scegli
**Deploy from a branch**, poi ramo `main` e cartella `/ (root)`. Salva.

Dopo un paio di minuti il sito è su:

```
https://TUONOME.github.io/albero-scacchi/
```

Quel link è quello da mandare al tuo amico. Da lì in poi, ogni `git push`
aggiorna il sito da solo.

---

## Com'è fatto

```
index.html              pagina e stili
js/motore.js            Stockfish WASM dentro un Worker, interfaccia a promesse
js/avversario.js        modello approssimato del giocatore umano
js/analisi.js           albero delle probabilità e continuazione simulata
js/strutture.js         strutture pedonali di mediogioco
js/aperture.js          nomi e codici ECO
js/app.js               interfaccia e orchestrazione
data/aperture.json      3864 aperture (lichess-org/chess-openings, CC0)
vendor/                 scaricato da prepara.py, non scritto a mano
```

Lo stato vive nel browser: chiunque apra la pagina ha la sua partita e non
interferisce con gli altri. È il motivo principale per cui la versione web è
preferibile a quella Python per far provare il prototipo a più persone.

### Prestazioni misurate

Stockfish WASM monothread, `depth 12`:

| | |
|---|---|
| MultiPV 4 su una posizione | ~250 ms |
| Albero completo, 4 candidate | ~2,4 s |
| Continuazione, 10 semimosse | ~0,9 s |

Le schede compaiono una alla volta mentre vengono calcolate, quindi la prima
si vede dopo meno di un secondo.

---

## Cosa NON è

**L'avversario non è vero.** Il modello umano definitivo (Maia, una rete
addestrata su milioni di partite reali per fascia Elo) non è collegato. Al suo
posto c'è un surrogato costruito su Stockfish: softmax sulle valutazioni con
temperatura legata all'Elo, più una penalità per le mosse che gli umani
faticano a vedere — all'indietro, silenziose, lunghe.

Le distribuzioni restano più piatte e più sparse di quelle di un giocatore
reale, e la differenza fra 1100 e 1900 si sente meno di quanto dovrebbe. Un
giocatore forte se ne accorge subito. L'avviso è scritto anche nella pagina.

Manca anche tutto il ciclo di allenamento: analisi delle proprie partite,
categorie d'errore, puzzle, ripetizione spaziata, Elo stimato. È il valore del
prodotto finale, ma non è ciò che questo prototipo serve a validare.

---

## Verifica

```
node prova_logica.mjs
```

Esegue albero e continuazione in node col motore WASM vero, compresa una
posizione con matto forzato. Richiede prima `python prepara.py --con-dev`.

---

## Licenze

| | |
|---|---|
| Stockfish | **GPL-3.0** |
| chess.js | BSD-2-Clause |
| Aperture (lichess-org/chess-openings) | CC0 |
| Font (Fraunces, Public Sans) | OFL |

Pubblicare una pagina che consegna Stockfish WASM al browser **è
distribuzione**: questo repository va quindi sotto GPL-3.0, con il sorgente
pubblico. Per un prototipo è la scelta più semplice.

Per un prodotto commerciale la questione è aperta e va decisa prima di
scrivere l'app vera: le opzioni sono nel documento di specifiche.
