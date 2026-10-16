# Albero delle probabilità

Un motore di scacchi ti dice qual era la mossa migliore. Raramente è
l'informazione che ti serve.

Se giochi a 1400, sapere che esisteva un sacrificio di qualità a sette mosse
non ti fa migliorare: non l'avresti trovato, e il tuo avversario non l'avrebbe
confutato. Quello che conta davvero è un'altra domanda, che nessun motore sa
porsi — **contro la persona che hai di fronte, questa mossa quanto rende?**

## L'idea

Accanto a Stockfish c'è un modello che prevede cosa farebbe un *umano* di un
certo livello. Prima di ogni tua mossa, l'app mostra le candidate e, per
ciascuna, le risposte probabili dell'avversario con le relative percentuali.

Da lì esce un numero che un motore da solo non può calcolare: la media delle
valutazioni pesata su quelle probabilità. Non "quanto vale la mossa contro il
gioco perfetto", ma **quanto rende contro questo avversario**.

I due numeri stanno sempre affiancati, e le mosse dove divergono sono le più
istruttive:

| Mossa | Oggettiva | Contro 1500 |
|---|---|---|
| d4 | +0,4 | +0,4 |
| **Ag5** | +0,1 | **+0,9** |
| **Db3** | +0,5 | **−0,2** |

`Ag5` è oggettivamente inferiore, ma più della metà dei 1500 risponde male e
peggiora la propria posizione. `Db3` è la mossa corretta, e però porta a
posizioni dove sei tu a sbagliare.

È quello che i giocatori forti chiamano *chances pratiche*. Finora nessuno
l'aveva quantificato, perché serve un modello di come sbagliano gli umani.

## Cosa si vede

Giochi contro un avversario tarato su un livello, che risponde da solo. Prima
di ogni tua mossa:

- le quattro candidate, con le risposte probabili dell'avversario;
- i due numeri affiancati, e un'etichetta quando divergono molto;
- l'apertura in corso con il codice ECO, e il punto in cui esci dalla teoria;
- la struttura pedonale di mediogioco, con il piano tipico di entrambi i lati;
- **Come continua**: cinque mosse per parte in cui tu giochi sempre la migliore
  e l'avversario la più probabile — e dove compaiono matti che Stockfish non
  mostra mai, perché lui presuppone che l'altro si difenda alla perfezione.

Lo slider cambia il livello dell'avversario. Muoverlo e guardare le percentuali
ridisegnarsi è il modo più diretto per capire di cosa si tratta.

## Il limite, detto chiaro

**L'avversario non è ancora vero.** Il modello definitivo è
[Maia](https://maiachess.com), una rete addestrata su milioni di partite reali
fascia per fascia. Qui al suo posto c'è un surrogato costruito su Stockfish:
rumore tarato sull'Elo più una penalità per le mosse che gli umani faticano a
vedere — all'indietro, silenziose, lunghe.

Funziona abbastanza da far capire l'idea, ma le distribuzioni restano più
piatte di quelle di un giocatore reale, e la differenza fra 1100 e 1900 si
sente meno di quanto dovrebbe. Un giocatore forte se ne accorge subito.

Manca anche tutto il resto del prodotto immaginato: analisi delle proprie
partite, categorie d'errore, puzzle generati dai propri sbagli, ripetizione
spaziata. Questo prototipo serve a validare una cosa sola, ed è l'idea qui
sopra.

## Come provarlo

Gira interamente nel browser: nessun server, nessun account, niente che esca
dal dispositivo. Serve solo aprire il link.

Per farlo girare in locale, vedi [SVILUPPO.md](SVILUPPO.md).

---

Stockfish è GPL-3.0, quindi lo è anche questo repository. I dati delle aperture
vengono da [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0).
