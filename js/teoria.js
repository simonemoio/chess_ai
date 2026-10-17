/**
 * Schede didattiche: aperture e strutture pedonali.
 *
 * Testi originali, scritti per questo progetto: niente e' copiato da libri,
 * Wikipedia o Wikibooks. I nomi delle aperture sono quelli di
 * lichess-org/chess-openings (CC0), che e' anche la chiave di ricerca.
 *
 * Una scheda per FAMIGLIA, piu' qualche variante che merita la sua. Per una
 * variante senza scheda propria si mostra quella della famiglia: la ricerca
 * va dal nome piu' specifico al piu' generico.
 *
 * Le mosse sono in notazione inglese, come nel resto della pagina.
 *
 * Campi: it (nome italiano), mosse, idea, bianco, nero, attenzione (l'errore
 * o il tranello tipico a livello di club).
 */

const A = {
  // ------------------------------------------------------------ 1.e4 e5
  "King's Pawn Game": {
    it: "Partita di pedone di re", mosse: "1.e4 e5",
    idea: "La posizione aperta per eccellenza: due pedoni al centro, linee che si aprono presto, sviluppo rapido. Quasi tutte le partite aperte classiche nascono da qui.",
    bianco: "Sviluppare i pezzi leggeri verso il centro, arroccare presto e preparare d4.",
    nero: "Tenere e5, sviluppare con lo stesso ritmo dell'avversario e non lasciarsi soffocare al centro.",
    attenzione: "Uscire con la donna troppo presto: viene inseguita e regala tempi di sviluppo.",
  },
  "Italian Game": {
    it: "Partita italiana", mosse: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
    idea: "L'alfiere in c4 punta su f7, la casa più debole del nero all'inizio della partita. Può diventare un attacco diretto o, nella versione moderna, una lunga manovra.",
    bianco: "Versione lenta: c3, d3, arrocco, Re1 e poi Nbd2-f1-g3, con a4 per guadagnare spazio. Versione aperta: c3 e d4 subito.",
    nero: "Sviluppo armonioso (…Bc5 o …Be7, …d6, …0-0), …h6 per evitare l'inchiodatura con Bg5, …a6 per dare una ritirata all'alfiere.",
    attenzione: "f7 resta delicata finché il nero non arrocca: occhio a Ng5 combinato con l'alfiere in c4.",
  },
  "Italian Game: Giuoco Piano": {
    it: "Giuoco piano", mosse: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5",
    idea: "La forma più classica dell'italiana: i due alfieri si guardano puntando su f7 e f2. Il nome dice tutto: si gioca con calma, costruendo prima di aprire.",
    bianco: "c3 per preparare d4 o per sostenere d3; arrocco e manovra del cavallo di donna verso g3.",
    nero: "…d6 e …Nf6, poi …a6 e …Ba7 per conservare l'alfiere. Pareggiare lo sviluppo prima di cercare iniziativa.",
    attenzione: "Con c3 e d4 il bianco minaccia d4-d5 o dxe5 con tempo sull'alfiere: tenere sempre una ritirata pronta.",
  },
  "Italian Game: Two Knights Defense": {
    it: "Difesa dei due cavalli", mosse: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6",
    idea: "Il nero contrattacca e4 invece di specchiare l'alfiere. È più combattiva del giuoco piano e porta a posizioni taglienti se il bianco attacca subito f7 con 4.Ng5.",
    bianco: "4.Ng5 attacca f7 e vince un pedone, a prezzo di tempi; 4.d3 è la scelta tranquilla e posizionale.",
    nero: "Dopo 4.Ng5 d5 5.exd5 la ripresa corretta è 5…Na5, con iniziativa in cambio del pedone.",
    attenzione: "5…Nxd5? consente 6.Nxf7! (il «fegato fritto»): il re nero finisce al centro sotto attacco.",
  },
  "Ruy Lopez": {
    it: "Partita spagnola", mosse: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
    idea: "L'alfiere attacca il cavallo che difende e5: la minaccia non è immediata, ma la pressione dura tutta la partita. È l'apertura più studiata di sempre, fatta di manovra lenta.",
    bianco: "Arrocco, Re1, c3 e d4 per un centro forte; il cavallo di donna viaggia d2-f1-g3 verso il lato di re.",
    nero: "…a6 per chiedere all'alfiere cosa vuole fare, …b5 per allontanarlo, poi …Na5 e …c5 per guadagnare spazio sul lato di donna.",
    attenzione: "Dopo …a6, …b5 e …c5-c4 l'alfiere bianco in b3 può restare intrappolato (la trappola dell'«arca di Noè»): va lasciata una ritirata in c2.",
  },
  "Ruy Lopez: Berlin Defense": {
    it: "Difesa berlinese", mosse: "1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6",
    idea: "Il nero contrattacca subito e4 e accetta presto il cambio delle donne. Ne esce un finale in cui il re nero resta al centro ma i pedoni sono solidissimi: famosa come «il muro di Berlino».",
    bianco: "Nel finale senza donne: maggioranza di pedoni sul lato di re da spingere, coppia di cavalli attivi.",
    nero: "Coppia degli alfieri e struttura compatta: pazienza, il tempo lavora per chi ha i due alfieri.",
    attenzione: "Non è un'apertura da attacco: chi la sceglie per vincere in fretta di solito si annoia e sbaglia.",
  },
  "Scotch Game": {
    it: "Partita scozzese", mosse: "1.e4 e5 2.Nf3 Nc6 3.d4",
    idea: "Il bianco apre il centro subito invece di manovrare come nella spagnola. Gioco aperto e diretto, con meno teoria lenta da conoscere.",
    bianco: "Dopo 3…exd4 4.Nxd4 il cavallo centrale è forte; spesso si accetta Nxc6 bxc6 seguito da e5, guadagnando spazio.",
    nero: "Sviluppo rapido con …Bc5 o …Nf6, attaccando il cavallo in d4 e il pedone e4.",
    attenzione: "4…Qh4 vince un pedone ma porta la donna in giro troppo presto: a livello di club è spesso un boomerang.",
  },
  "Petrov's Defense": {
    it: "Difesa Petrov (russa)", mosse: "1.e4 e5 2.Nf3 Nf6",
    idea: "Il nero non difende e5: contrattacca e4. Posizioni simmetriche e solide, una delle armi più sicure per pattare col nero.",
    bianco: "Cercare piccoli vantaggi di sviluppo: d4, Bd3, arrocco, c4 per mettere pressione al cavallo in e4.",
    nero: "Riprendere il pedone con l'ordine giusto e completare lo sviluppo senza concessioni.",
    attenzione: "Dopo 3.Nxe5 la mossa giusta è 3…d6; 3…Nxe4? costa almeno un pedone dopo 4.Qe2!, e se il cavallo si ritira Nc6+ di scoperta vince la donna.",
  },
  "Four Knights Game": {
    it: "Partita dei quattro cavalli", mosse: "1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6",
    idea: "Sviluppo simmetrico e naturale di tutti i cavalli. Posizioni tranquille, ideale per imparare i principi senza troppa teoria.",
    bianco: "Bb5 (variante spagnola) o d4 (variante scozzese) per creare uno squilibrio.",
    nero: "…Bb4 o …Nd4 (difesa Rubinstein) per prendere l'iniziativa invece di copiare.",
    attenzione: "Copiare le mosse dell'avversario troppo a lungo: arriva il momento in cui la mossa simmetrica è un errore.",
  },
  "Three Knights Opening": {
    it: "Partita dei tre cavalli", mosse: "1.e4 e5 2.Nf3 Nc6 3.Nc3",
    idea: "Il bianco sviluppa il secondo cavallo e lascia al nero la scelta: con …Nf6 si entra nei quattro cavalli.",
    bianco: "Sviluppo rapido e flessibile, d4 al momento buono.",
    nero: "…Nf6 è la risposta più naturale; …g6 e …Bb4 sono alternative valide.",
    attenzione: "Nessun tranello particolare: conta rispettare i principi di sviluppo.",
  },
  "King's Gambit": {
    it: "Gambetto di re", mosse: "1.e4 e5 2.f4",
    idea: "Il bianco sacrifica il pedone f per deviare e5, aprire la colonna f e attaccare f7. È l'apertura romantica dell'Ottocento: tutto o niente.",
    bianco: "Sviluppo velocissimo, Bc4 e arrocco, poi pressione sulla colonna f; il pedone sacrificato si recupera spesso più tardi.",
    nero: "Accettare e tenere il pedone con …g5, oppure restituirlo con …d5 per sviluppare tranquillo.",
    attenzione: "La diagonale e1-h4 è aperta: occhio a …Qh4+, che a volte costringe il re bianco a muoversi.",
  },
  "Vienna Game": {
    it: "Partita viennese", mosse: "1.e4 e5 2.Nc3",
    idea: "Il cavallo sviluppato in c3 prepara f4 in condizioni migliori del gambetto di re. Apertura flessibile, che può essere tranquilla o molto aggressiva.",
    bianco: "f4 per aprire la colonna, oppure g3 e Bg2 per una versione posizionale.",
    nero: "…Nf6 e …d5: liberare il centro è la risposta più sana.",
    attenzione: "Dopo 2…Nf6 3.Bc4 Nxe4 4.Qh5 si entra in complicazioni violente: va conosciuta, non improvvisata.",
  },
  "Bishop's Opening": {
    it: "Apertura d'alfiere", mosse: "1.e4 e5 2.Bc4",
    idea: "L'alfiere punta subito su f7 e il cavallo resta libero di non andare in f3, per esempio per preparare f4. Spesso si trasforma in italiana o viennese.",
    bianco: "d3, Nf3 o Nc3 a seconda della risposta; tenere aperta l'opzione f4.",
    nero: "2…Nf6 attacca e4 e costringe il bianco a decidere subito.",
    attenzione: "Il matto del barbiere usa proprio questo alfiere, con Qh5 o Qf3 e Qxf7: col nero, mai trascurare f7.",
  },
  "Philidor Defense": {
    it: "Difesa Philidor", mosse: "1.e4 e5 2.Nf3 d6",
    idea: "Il nero difende e5 col pedone invece che col cavallo. Solida ma passiva: l'alfiere in e7 ha poco spazio e il bianco prende il centro con d4.",
    bianco: "d4, Nc3, Bc4: sviluppo veloce e pressione su e5 e f7.",
    nero: "Il sistema Hanham: …Nd7, …Be7, …c6, tenendo e5 a ogni costo.",
    attenzione: "Il matto di Légal: se il nero inchioda con …Bg4 e poi prende la donna dopo Nxe5, Bxf7+ e Nd5 danno matto.",
  },
  "Center Game": {
    it: "Partita del centro", mosse: "1.e4 e5 2.d4 exd4 3.Qxd4",
    idea: "Il bianco riprende in d4 con la donna. Centro aperto subito, ma la donna esce presto ed è un bersaglio.",
    bianco: "Qe3 dopo …Nc6, poi Nc3, Bd2 e arrocco lungo per un attacco.",
    nero: "…Nc6 con tempo sulla donna, poi …Nf6 e sviluppo rapido: il nero guadagna i tempi persi dal bianco.",
    attenzione: "Col bianco, contare i tempi: ogni mossa di donna è un pezzo in meno sviluppato.",
  },
  "Danish Gambit": {
    it: "Gambetto danese", mosse: "1.e4 e5 2.d4 exd4 3.c3",
    idea: "Il bianco offre due pedoni per avere i due alfieri puntati su f7 e g7 e un enorme vantaggio di sviluppo.",
    bianco: "Bc4 e Bb2 su due diagonali aperte, arrocco rapido, attacco.",
    nero: "Accettare e restituire materiale al momento giusto con …d5, oppure rifiutare subito con …d5.",
    attenzione: "Prendere tutto e restare indietro di sviluppo: il materiale in più non serve se il re è sotto attacco.",
  },
  "Ponziani Opening": {
    it: "Apertura Ponziani", mosse: "1.e4 e5 2.Nf3 Nc6 3.c3",
    idea: "Il bianco prepara d4 per costruire un grande centro, ma toglie la casa c3 al proprio cavallo.",
    bianco: "d4 per un centro di pedoni; Qa4 in certe varianti.",
    nero: "Contrattaccare subito e4 con …Nf6 o …d5: la mossa c3 non lo difende.",
    attenzione: "Col bianco, non perdere tempo: se il nero apre il centro, lo sviluppo lento si paga.",
  },
  "Elephant Gambit": {
    it: "Gambetto dell'elefante", mosse: "1.e4 e5 2.Nf3 d5",
    idea: "Controgambetto dubbio: il nero apre il centro subito ma lascia e5 debole.",
    bianco: "exd5 e poi attaccare e5: il bianco ottiene un vantaggio sano.",
    nero: "Giocare velocemente per l'iniziativa: in partite rapide sorprende.",
    attenzione: "Col bianco, non spaventarsi: basta sviluppare e prendere quello che viene lasciato.",
  },
  "Latvian Gambit": {
    it: "Gambetto lettone", mosse: "1.e4 e5 2.Nf3 f5",
    idea: "Un gambetto di re giocato col nero, con un tempo in meno. Rischiosissimo: lo scopo è trascinare l'avversario in un caos che non conosce.",
    bianco: "3.Nxe5 e sviluppo rapido: le linee aperte favoriscono chi è più avanti.",
    nero: "Attaccare comunque, sperando nell'errore: obiettivamente è una scommessa.",
    attenzione: "Col nero, il re resta esposto sulla diagonale e8-h5: Qh5+ arriva presto.",
  },

  // ------------------------------------------------------------ 1.e4 altre
  "Sicilian Defense": {
    it: "Difesa siciliana", mosse: "1.e4 c5",
    idea: "Il nero combatte per d4 dal lato, con un pedone non centrale. La posizione diventa asimmetrica: il bianco ha più spazio e attacca sul lato di re, il nero contrattacca sul lato di donna e sulla colonna c.",
    bianco: "Nella siciliana aperta (Nf3, d4, Nxd4) sviluppo rapido e attacco; alternative più tranquille sono c3 (Alapin) e le chiuse con Nc3 e g3.",
    nero: "Usare la colonna c semiaperta e la maggioranza centrale di pedoni; spesso …a6 e …b5 per espandersi.",
    attenzione: "Nelle varianti aperte il ritmo è tutto: chi perde un tempo nella corsa all'attacco spesso perde la partita.",
  },
  "Sicilian Defense: Najdorf Variation": {
    it: "Siciliana Najdorf", mosse: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6",
    idea: "La mossa …a6 controlla b5, prepara …e5 o …e6 e l'espansione con …b5. È la variante più profonda e studiata della siciliana.",
    bianco: "L'attacco inglese (Be3, f3, Qd2, g4, arrocco lungo) per una corsa sul lato di re; oppure Bg5 per un gioco più tattico.",
    nero: "…e5 per guadagnare spazio al centro, …b5-b4 per scacciare il cavallo in c3 e aprire linee verso il re bianco.",
    attenzione: "Con arrocchi opposti, una mossa di difesa in più spesso è una mossa d'attacco in meno: conta i tempi.",
  },
  "Sicilian Defense: Dragon Variation": {
    it: "Siciliana del dragone", mosse: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6",
    idea: "L'alfiere in g7 sulla grande diagonale è il «dragone»: punta al lato di donna e al re bianco. Variante tagliente, spesso con arrocchi opposti.",
    bianco: "Attacco jugoslavo: Be3, f3, Qd2, arrocco lungo, h4-h5 per aprire la colonna h e Bh6 per cambiare l'alfiere in g7.",
    nero: "Colonna c, …Rc8, …Ne5-c4 e il classico sacrificio di qualità in c3 per aprire il re bianco.",
    attenzione: "Se l'alfiere in g7 viene cambiato e la colonna h si apre, il re nero è nudo: rispondere prima che succeda.",
  },
  "Sicilian Defense: Accelerated Dragon": {
    it: "Dragone accelerato", mosse: "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6",
    idea: "Il nero fianchetta senza …d6: risparmia un tempo per poter spingere …d5 in un colpo solo.",
    bianco: "La legatura Maróczy con c4 ed e4, che toglie al nero le spinte liberatorie.",
    nero: "Se il bianco non gioca c4, …d5 subito libera il gioco.",
    attenzione: "Contro la Maróczy il nero ha poco spazio: scambiare pezzi aiuta, attaccare a vuoto no.",
  },
  "Sicilian Defense: Alapin Variation": {
    it: "Siciliana Alapin", mosse: "1.e4 c5 2.c3",
    idea: "Il bianco prepara d4 per riprendere col pedone e costruire un centro classico, evitando la teoria delle siciliane aperte.",
    bianco: "d4 alla prima occasione; se il nero cambia in d4, riprendere col pedone c.",
    nero: "2…Nf6 attacca e4 subito; 2…d5 apre il centro prima che il bianco lo costruisca.",
    attenzione: "Col nero, lasciare al bianco il centro ideale con e4 e d4 senza reagire.",
  },
  "Sicilian Defense: Smith-Morra Gambit": {
    it: "Gambetto Smith-Morra", mosse: "1.e4 c5 2.d4 cxd4 3.c3",
    idea: "Il bianco sacrifica un pedone per uno sviluppo velocissimo e le colonne c e d aperte contro il re nero ancora al centro.",
    bianco: "Nc3, Nf3, Bc4, arrocco, Re1 e Qd2-Rd1: tutti i pezzi in gioco prima del nero.",
    nero: "Accettare e sviluppare con precisione, oppure rifiutare con 3…d5 o 3…Nf6.",
    attenzione: "Molti tranelli sulla colonna d e su f7: col nero si sviluppa prima, si arrocca, poi si pensa al pedone.",
  },
  "Sicilian Defense: Closed": {
    it: "Siciliana chiusa", mosse: "1.e4 c5 2.Nc3",
    idea: "Il bianco rinuncia ad aprire il centro con d4: fianchetto in g2 e attacco lento sul lato di re con f4.",
    bianco: "g3, Bg2, d3, f4 e Nf3, poi spinte sul lato di re.",
    nero: "Spazio sul lato di donna con …b5 e la colonna b; il fianchetto in g7 contrasta l'alfiere bianco.",
    attenzione: "Le due parti giocano su ali opposte: chi arriva tardi non fa in tempo a difendersi.",
  },
  "French Defense": {
    it: "Difesa francese", mosse: "1.e4 e6 2.d4 d5",
    idea: "Il nero contesta subito il centro con una catena di pedoni solida. Il prezzo è l'alfiere in c8, chiuso dietro e6: il «cattivo alfiere» della francese.",
    bianco: "Spingere e5 per guadagnare spazio sul lato di re e attaccare; oppure tenere la tensione con Nc3 o Nd2.",
    nero: "Colpire la base della catena con …c5, poi …f6; liberare o scambiare l'alfiere campochiaro.",
    attenzione: "Dopo e5 il re nero arroccato corto può diventare un bersaglio: l'alfiere in d3 su h7 è il motivo classico.",
  },
  "French Defense: Advance Variation": {
    it: "Francese, variante di spinta", mosse: "1.e4 e6 2.d4 d5 3.e5",
    idea: "Il bianco chiude subito il centro con e5 e la catena d4-e5. La lotta è tutta intorno a d4, base della catena.",
    bianco: "c3 per sostenere d4, Nf3, Bd3; spazio e attacco sul lato di re.",
    nero: "…c5, …Nc6, …Qb6: tre pezzi contro d4. Poi …f6 per colpire anche la testa della catena.",
    attenzione: "Col bianco, perdere il controllo di d4 fa crollare tutta la struttura.",
  },
  "Caro-Kann Defense": {
    it: "Difesa Caro-Kann", mosse: "1.e4 c6 2.d4 d5",
    idea: "Come la francese contesta il centro con …d5, ma prima di chiudere l'alfiere lo fa uscire (…Bf5 o …Bg4). Solida, con pochi punti deboli.",
    bianco: "Variante di spinta con e5 per lo spazio, oppure Nc3 e sviluppo classico.",
    nero: "Alfiere fuori prima di …e6, poi …c5 o …e5 per liberare il gioco; finali spesso favorevoli.",
    attenzione: "Lo sviluppo del nero è un po' lento: col bianco conviene aprire la partita prima che si sistemi.",
  },
  "Caro-Kann Defense: Advance Variation": {
    it: "Caro-Kann, variante di spinta", mosse: "1.e4 c6 2.d4 d5 3.e5",
    idea: "Il bianco guadagna spazio; il nero sviluppa l'alfiere in f5 fuori dalla catena e poi attacca d4 con …c5.",
    bianco: "Nf3, Be2, arrocco e c3; oppure l'attacco con g4 per cacciare l'alfiere in f5.",
    nero: "…Bf5, …e6, …c5: lo stesso piano della francese, ma con l'alfiere già attivo.",
    attenzione: "Se il bianco gioca g4-h4 presto, l'alfiere in f5 rischia di restare intrappolato: tenergli una ritirata.",
  },
  "Scandinavian Defense": {
    it: "Difesa scandinava", mosse: "1.e4 d5",
    idea: "Il nero attacca subito e4 e dopo il cambio riprende spesso con la donna. Si perde un tempo, ma la struttura che ne nasce è sana e facile da giocare.",
    bianco: "Nc3 con tempo sulla donna, poi d4 e sviluppo rapido: sfruttare il vantaggio di tempo.",
    nero: "Donna in a5 o d6, alfiere in f5 o g4, …c6 e …e6: una struttura simile alla Caro-Kann.",
    attenzione: "La donna presa di mira in a5 può finire in trappola: prevedere sempre …c6 come via di fuga.",
  },
  "Alekhine Defense": {
    it: "Difesa Alekhine", mosse: "1.e4 Nf6",
    idea: "Provocazione ipermoderna: il cavallo invita i pedoni bianchi ad avanzare, per poi attaccarli quando sono troppo esposti.",
    bianco: "Prendere spazio senza esagerare; la variante moderna con Nf3 è più sicura dell'attacco dei quattro pedoni.",
    nero: "…d6 per minare il centro, …g6 o …Bg4, colpendo i pedoni avanzati dal dietro.",
    attenzione: "Col bianco, inseguire il cavallo con tutti i pedoni: un centro troppo avanzato crolla facilmente.",
  },
  "Pirc Defense": {
    it: "Difesa Pirc", mosse: "1.e4 d6 2.d4 Nf6 3.Nc3 g6",
    idea: "Il nero lascia al bianco il centro e lo colpisce più tardi da lontano, con l'alfiere in g7 e le spinte …e5 o …c5.",
    bianco: "Attacco con Be3, Qd2 e Bh6 per cambiare l'alfiere in g7; oppure l'attacco austriaco con f4.",
    nero: "Arroccare e rompere il centro con …e5 o …c5 prima che il bianco attacchi.",
    attenzione: "Col nero, aspettare troppo: senza una rottura al centro il bianco attacca indisturbato.",
  },
  "Modern Defense": {
    it: "Difesa moderna", mosse: "1.e4 g6",
    idea: "Parente della Pirc, ma ancora più flessibile: il nero rimanda …Nf6 e può scegliere fra …d6, …c6 e anche …b5.",
    bianco: "Prendere il centro con d4, Nc3 e Be3; spesso f4 o f3 per rinforzarlo.",
    nero: "Attaccare il centro bianco da lontano, scegliendo la rottura giusta in base a come il bianco si schiera.",
    attenzione: "Più flessibilità vuol dire anche più rischio di restare senza piano: scegliere presto una struttura.",
  },
  "Nimzowitsch Defense": {
    it: "Difesa Nimzowitsch", mosse: "1.e4 Nc6",
    idea: "Apertura poco comune: il cavallo attacca d4 e il nero sceglie poi fra …e5 e …d5.",
    bianco: "d4 per prendere il centro; d5 per scacciare il cavallo se serve.",
    nero: "…d5 o …e5 a seconda della risposta, sviluppando con pressione su d4.",
    attenzione: "Il pedone c resta dietro al cavallo: il nero deve trovare un altro modo per lottare al centro.",
  },
  "Owen Defense": {
    it: "Difesa Owen", mosse: "1.e4 b6",
    idea: "Il nero fianchetta subito l'alfiere di donna per colpire e4 da lontano.",
    bianco: "d4 e Bd3 per sostenere e4, poi sviluppo naturale.",
    nero: "…Bb7, …e6, …c5: pressione su e4 e d4.",
    attenzione: "Lascia molte case al bianco: col nero bisogna sapere bene cosa si cerca.",
  },

  // ------------------------------------------------------------ 1.d4 d5
  "Queen's Pawn Game": {
    it: "Partita di pedone di donna", mosse: "1.d4",
    idea: "Il pedone in d4 è difeso dalla donna fin dall'inizio: le partite di donna sono in genere più lente e posizionali di quelle di re.",
    bianco: "c4 (gambetto di donna) o sistemi come Londra e Colle, che si giocano quasi contro tutto.",
    nero: "…d5 o …Nf6 per contendere e4; le spinte …c5 ed …e5 sono le rotture centrali.",
    attenzione: "Senza c4 il bianco ha meno pressione: col nero si pareggia facilmente con uno sviluppo naturale.",
  },
  "Queen's Gambit": {
    it: "Gambetto di donna", mosse: "1.d4 d5 2.c4",
    idea: "Non è un vero gambetto: il pedone c4 si recupera quasi sempre. Il bianco attacca d5 dal lato per ottenere il controllo del centro.",
    bianco: "Nc3, Nf3, Bg5 o Bf4: pressione su d5.",
    nero: "Difendere d5 con …e6 (rifiutato) o …c6 (slava), oppure prendere in c4 (accettato) e sviluppare.",
    attenzione: "Accettare e voler tenere il pedone a tutti i costi indebolisce il lato di donna nero.",
  },
  "Queen's Gambit Declined": {
    it: "Gambetto di donna rifiutato", mosse: "1.d4 d5 2.c4 e6",
    idea: "Il nero tiene d5 con …e6, la difesa più classica e solida. Il problema è l'alfiere in c8, chiuso dietro e6.",
    bianco: "Inchiodare il cavallo con Bg5, pressione su d5; nella variante di cambio l'attacco di minoranza con b4-b5.",
    nero: "Completare lo sviluppo, poi liberarsi con …c5 o …e5 e attivare l'alfiere in c8 (spesso via b7).",
    attenzione: "La trappola dell'elefante: con Bg5 e il cavallo in d7, Nxd5? perde un pezzo dopo …Nxd5! Bxd8 Bb4+.",
  },
  "Queen's Gambit Accepted": {
    it: "Gambetto di donna accettato", mosse: "1.d4 d5 2.c4 dxc4",
    idea: "Il nero cede momentaneamente il centro per sviluppare liberamente. Non cerca di tenere il pedone: lo restituisce in cambio di tempo.",
    bianco: "e3 o e4 e riprendere con Bxc4: spesso si arriva a un pedone di donna isolato.",
    nero: "…Nf6, …e6, …c5 e …a6: colpire subito il centro bianco.",
    attenzione: "Difendere il pedone con …b5 di solito lascia debolezze dopo a4: meglio restituirlo.",
  },
  "Slav Defense": {
    it: "Difesa slava", mosse: "1.d4 d5 2.c4 c6",
    idea: "Il nero difende d5 col pedone c, lasciando libera la diagonale dell'alfiere in c8. Solidità del rifiutato senza il suo alfiere chiuso.",
    bianco: "Nc3, Nf3, e3; spesso a4 per impedire …b5 quando il nero prende in c4.",
    nero: "Uscire con l'alfiere (…Bf5 o …Bg4) prima di chiudere con …e6.",
    attenzione: "Dopo …dxc4 voler tenere il pedone con …b5 crea debolezze sul lato di donna.",
  },
  "Semi-Slav Defense": {
    it: "Semi-slava", mosse: "1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.Nf3 e6",
    idea: "Il nero unisce …c6 ed …e6: un triangolo di pedoni solidissimo. L'alfiere in c8 si sviluppa dopo, spesso in b7 dopo …dxc4 e …b5.",
    bianco: "e3 e Bd3 (variante Merano) o Bg5 per varianti molto taglienti.",
    nero: "…dxc4, …b5, …Bb7 e la rottura …c5 per liberare il gioco.",
    attenzione: "Solida ma con varianti tattiche profonde: le linee principali vanno conosciute.",
  },
  "Tarrasch Defense": {
    it: "Difesa Tarrasch", mosse: "1.d4 d5 2.c4 e6 3.Nc3 c5",
    idea: "Il nero accetta volentieri il pedone di donna isolato in cambio di pezzi attivi e linee aperte.",
    bianco: "Fianchetto in g2 per mettere pressione su d5, poi cambiare i pezzi e attaccare il pedone isolato.",
    nero: "Pezzi attivi e iniziativa: il pedone isolato è forte finché ci sono pezzi sulla scacchiera.",
    attenzione: "Nel finale il pedone isolato diventa solo una debolezza: col nero evitare cambi passivi.",
  },
  "Catalan Opening": {
    it: "Apertura catalana", mosse: "1.d4 Nf6 2.c4 e6 3.g3",
    idea: "Gambetto di donna con l'alfiere in g2: dalla grande diagonale esercita una pressione lunga sul lato di donna nero.",
    bianco: "Bg2, arrocco, recuperare in c4 con calma: l'alfiere lavora da solo.",
    nero: "Prendere in c4 e sviluppare con …a6 e …b5, oppure restare solidi con …c6.",
    attenzione: "Col nero, l'alfiere in c8 è difficile da sviluppare: se resta chiuso, il bianco è meglio a lungo.",
  },
  "London System": {
    it: "Sistema Londra", mosse: "1.d4, Bf4, e3, c3, Nf3",
    idea: "Un sistema, più che un'apertura: d4, Bf4, e3, c3, Nf3, Bd3 e Nbd2 quasi contro qualunque risposta. Solido, poca teoria.",
    bianco: "Il cavallo in e5 e un attacco sul lato di re, oppure una lenta pressione al centro.",
    nero: "…c5 e …Qb6: con l'alfiere in f4 il pedone b2 è senza difesa naturale.",
    attenzione: "Col bianco, l'automatismo: giocare le stesse mosse senza guardare cosa fa l'avversario.",
  },
  "Colle System": {
    it: "Sistema Colle", mosse: "1.d4 d5 2.Nf3 Nf6 3.e3",
    idea: "Il bianco chiude l'alfiere in c1 ma prepara la spinta e4 con i pezzi già schierati: Bd3, c3, Nbd2 e arrocco.",
    bianco: "Preparare e4 e attaccare sul lato di re; nella versione Zukertort l'alfiere va in b2.",
    nero: "Sviluppo solido e …c5; l'alfiere in c8 deve uscire prima di …e6.",
    attenzione: "Senza la spinta e4 il piano del bianco si esaurisce: va preparata bene.",
  },
  "Torre Attack": {
    it: "Attacco Torre", mosse: "1.d4 Nf6 2.Nf3 e6 3.Bg5",
    idea: "L'alfiere inchioda il cavallo in f6; il bianco gioca e3, c3 e Nbd2 e prepara e4.",
    bianco: "Spinta e4 dopo aver completato lo sviluppo.",
    nero: "…c5 e …Qb6 contro b2, o …h6 per chiarire la situazione dell'alfiere.",
    attenzione: "Come nel Londra, il pedone b2 è il punto debole.",
  },
  "Blackmar-Diemer Gambit": {
    it: "Gambetto Blackmar-Diemer", mosse: "1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3",
    idea: "Il bianco offre un pedone per aprire la colonna f e uno sviluppo velocissimo verso il re nero.",
    bianco: "Nxf3 dopo …exf3, Bd3, arrocco e attacco con tutti i pezzi.",
    nero: "Accettare e consolidare con calma, oppure rifiutare con …e5 o …Bf5.",
    attenzione: "Obiettivamente dubbio, ma praticamente insidioso: col nero non si deve aver fretta di attaccare.",
  },
  "Richter-Veresov Attack": {
    it: "Attacco Richter-Veresov", mosse: "1.d4 d5 2.Nc3 Nf6 3.Bg5",
    idea: "Il bianco sviluppa i pezzi prima dei pedoni e prepara e4 o un arrocco lungo con attacco.",
    bianco: "f3 ed e4, oppure Qd2 e arrocco lungo.",
    nero: "…c5 o …Nbd7 per contestare il centro prima che il bianco lo apra.",
    attenzione: "Il cavallo in c3 blocca il pedone c: il bianco ha meno pressione su d5.",
  },

  // ------------------------------------------------------------ 1.d4 Nf6
  "Indian Defense": {
    it: "Difesa indiana", mosse: "1.d4 Nf6",
    idea: "Il nero controlla e4 col cavallo invece di occupare d5. È la porta d'ingresso di tutte le difese indiane: est-indiana, nimzo, ovest-indiana, Grünfeld.",
    bianco: "c4 per il massimo spazio, oppure sistemi come Londra e Torre.",
    nero: "Scegliere la struttura in base alla risposta: …g6, …e6 o …c5.",
    attenzione: "Il nome copre posizioni molto diverse: conta la struttura che si sceglie dopo.",
  },
  "King's Indian Defense": {
    it: "Difesa est-indiana", mosse: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6",
    idea: "Il nero lascia al bianco un grande centro, arrocca e lo attacca con …e5. Quando il bianco chiude con d5 inizia una corsa: il bianco sul lato di donna, il nero sul re.",
    bianco: "Chiudere con d5 e attaccare sul lato di donna con c5, b4 e la colonna c.",
    nero: "…Ne8 o …Ne7, …f5, …f4, …g5: attacco a pedoni contro il re bianco.",
    attenzione: "Una corsa d'attacco: chi spreca tempi difendendo senza necessità arriva secondo.",
  },
  "Nimzo-Indian Defense": {
    it: "Difesa nimzo-indiana", mosse: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4",
    idea: "L'alfiere inchioda il cavallo in c3 e controlla e4. Spesso il nero cede la coppia degli alfieri per raddoppiare i pedoni bianchi in c.",
    bianco: "La coppia degli alfieri e il centro con e4: aprire la posizione per gli alfieri.",
    nero: "Bloccare la posizione, attaccare i pedoni doppiati e c4 con …b6, …Ba6 e …c5.",
    attenzione: "Col nero, aprire la posizione dà forza agli alfieri bianchi: meglio tenerla chiusa.",
  },
  "Queen's Indian Defense": {
    it: "Difesa ovest-indiana", mosse: "1.d4 Nf6 2.c4 e6 3.Nf3 b6",
    idea: "Il fianchetto in b7 controlla e4 da lontano. Apertura solida, scelta quando il bianco evita la nimzo con Nf3.",
    bianco: "g3 e Bg2 per contrastare l'alfiere in b7 sulla stessa diagonale.",
    nero: "Controllo di e4, …d5 o …c5 al momento buono.",
    attenzione: "Lotta tutta sulla diagonale h1-a8: chi la perde perde il controllo del centro.",
  },
  "Bogo-Indian Defense": {
    it: "Difesa bogo-indiana", mosse: "1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+",
    idea: "Scacco d'alfiere quando il bianco ha evitato la nimzo: il nero sviluppa in fretta e spesso cambia l'alfiere.",
    bianco: "Bd2 o Nbd2, poi g3 e sviluppo normale.",
    nero: "…Qe7 per difendere l'alfiere o cambiarlo in d2, poi …d6 ed …e5 o …d5.",
    attenzione: "Posizioni tranquille: conta la manovra, non la tattica.",
  },
  "Grünfeld Defense": {
    it: "Difesa Grünfeld", mosse: "1.d4 Nf6 2.c4 g6 3.Nc3 d5",
    idea: "Il nero lascia costruire al bianco un centro grande per poi bombardarlo da lontano con l'alfiere in g7, …c5 e i pezzi.",
    bianco: "Tenere il centro e4-d4 con Be3, Rc1 e Ne2; se regge, è un vantaggio duraturo.",
    nero: "…c5, …Nc6, …Bg4: pressione costante su d4.",
    attenzione: "Molto teorica: un'imprecisione col nero e il centro bianco schiaccia tutto.",
  },
  "Benoni Defense": {
    it: "Difesa Benoni", mosse: "1.d4 Nf6 2.c4 c5 3.d5 e6",
    idea: "Struttura asimmetrica: il bianco ha la maggioranza al centro, il nero sul lato di donna. Posizioni dinamiche, adatte a chi gioca per vincere.",
    bianco: "e4-e5 per sfondare al centro, oppure f4 e attacco.",
    nero: "…a6 e …b5 per sfruttare la maggioranza, pressione sulla colonna e semiaperta.",
    attenzione: "Il pedone d6 del nero è debole: se il bianco lo blocca e lo attacca, la posizione nera soffre.",
  },
  "Benko Gambit": {
    it: "Gambetto Benko (Volga)", mosse: "1.d4 Nf6 2.c4 c5 3.d5 b5",
    idea: "Il nero sacrifica un pedone per avere le colonne a e b aperte e una pressione che dura fino al finale.",
    bianco: "Tenere il pedone, consolidare con e4 e arrocco, poi neutralizzare la pressione.",
    nero: "Torri in a e b, alfiere in g7 sulla grande diagonale, pressione su a2 e b2.",
    attenzione: "Il compenso non sparisce col cambio dei pezzi: anche nel finale il nero preme.",
  },
  "Dutch Defense": {
    it: "Difesa olandese", mosse: "1.d4 f5",
    idea: "Il nero controlla e4 col pedone f e prepara un attacco sul lato di re. Il prezzo è un re meno protetto.",
    bianco: "g3 e Bg2 per contrastare il controllo di e4, poi la spinta e4.",
    nero: "Tre schieramenti: Stonewall (…d5, …e6, …c6), Leningrado (…g6) o classico (…e6, …Be7).",
    attenzione: "La diagonale e8-h5 è indebolita: occhio a Qh5+ e ai sacrifici in e6.",
  },
  "Old Indian Defense": {
    it: "Difesa vecchia indiana", mosse: "1.d4 Nf6 2.c4 d6",
    idea: "Simile all'est-indiana ma con l'alfiere in e7 invece che in g7: più solida e più passiva.",
    bianco: "Spazio al centro e sviluppo naturale.",
    nero: "…Nbd7, …e5, …c6: tenere e5 e cercare spazio.",
    attenzione: "Il nero ha poco spazio: senza rotture rischia di soffocare.",
  },
  "Trompowsky Attack": {
    it: "Attacco Trompowsky", mosse: "1.d4 Nf6 2.Bg5",
    idea: "Il bianco minaccia di cambiare in f6 e rovinare la struttura nera, e intanto evita tutta la teoria delle indiane.",
    bianco: "Bxf6 se il nero lo permette, oppure e3 e d4 con uno sviluppo rapido.",
    nero: "…Ne4 per attaccare l'alfiere, …e6 o …d5 per uno sviluppo tranquillo.",
    attenzione: "Dopo …Ne4 il bianco deve decidere subito dove mettere l'alfiere.",
  },
  "Budapest Defense": {
    it: "Gambetto di Budapest", mosse: "1.d4 Nf6 2.c4 e5",
    idea: "Controgambetto: il nero offre e5 per sviluppare in fretta e spesso riprende il pedone con …Ng4.",
    bianco: "Tenere il pedone e5 con Bf4 e Nf3, oppure restituirlo per uno sviluppo sano.",
    nero: "…Ng4, …Nc6 e …Bb4+: attaccare il pedone e5 con tutto.",
    attenzione: "Insidiosa: molti tranelli su e5 e sulla diagonale e1-a5.",
  },
  "Englund Gambit": {
    it: "Gambetto Englund", mosse: "1.d4 e5",
    idea: "Gambetto dubbio: il nero offre e5 sperando in tranelli. Obiettivamente il bianco è meglio.",
    bianco: "dxe5 e sviluppo normale; non c'è bisogno di tenere il pedone a ogni costo.",
    nero: "…Nc6 e …Qe7 per riprendere e5, puntando sui tranelli.",
    attenzione: "Il tranello classico: 2.dxe5 Nc6 3.Nf3 Qe7 4.Bf4? Qb4+ e la donna arriva in b2, con matto in c1 se il bianco non sta attento.",
  },

  // ------------------------------------------------------------ fianchetti
  "English Opening": {
    it: "Apertura inglese", mosse: "1.c4",
    idea: "Apertura di fianco: il pedone c controlla d5 senza impegnare il centro. Spesso è una siciliana a colori invertiti con un tempo in più per il bianco.",
    bianco: "g3, Bg2, Nc3: controllo delle case chiare centrali e pressione sulla grande diagonale.",
    nero: "…e5 (siciliana invertita), …c5 (simmetrica) o …Nf6 con passaggio alle indiane.",
    attenzione: "Molte trasposizioni: chi gioca col pilota automatico finisce in aperture che non conosce.",
  },
  "Réti Opening": {
    it: "Apertura Réti", mosse: "1.Nf3 d5 2.c4",
    idea: "Ipermoderna: il bianco attacca d5 dal lato con c4 e fianchetta, senza occupare il centro con i pedoni.",
    bianco: "g3, Bg2, b3, Bb2: alfieri sulle grandi diagonali.",
    nero: "Tenere d5 con …c6 o …e6, oppure spingere …d4 e prendere spazio.",
    attenzione: "Col nero, …d4 guadagna spazio ma crea un pedone da difendere.",
  },
  "Zukertort Opening": {
    it: "Apertura Zukertort", mosse: "1.Nf3",
    idea: "Una prima mossa flessibile: controlla e5 e d4 e lascia aperte tutte le strade. Spesso traspone in partite di donna o in Réti.",
    bianco: "Scegliere la struttura in base al nero: d4, c4 o g3.",
    nero: "…d5 o …Nf6: risposte naturali che non concedono nulla.",
    attenzione: "Nessun tranello: conta capire in quale apertura si è finiti.",
  },
  "King's Indian Attack": {
    it: "Attacco est-indiano", mosse: "Nf3, g3, Bg2, 0-0, d3, Nbd2, e4",
    idea: "Un'est-indiana col bianco e un tempo in più. Si gioca soprattutto contro francese e siciliana, con lo stesso schieramento quasi contro tutto.",
    bianco: "e4-e5 per guadagnare spazio, poi attacco sul re con h4, Nf1-h2-g4.",
    nero: "Espansione sul lato di donna con …b5-b4 e …a5-a4, aprendo linee.",
    attenzione: "Come nell'est-indiana è una corsa: il tempo in più del bianco conta, ma solo se lo usa.",
  },
  "Bird Opening": {
    it: "Apertura Bird", mosse: "1.f4",
    idea: "Il bianco controlla e5 col pedone f: è una difesa olandese a colori invertiti.",
    bianco: "Nf3, e3, Be2 o il fianchetto in g2; controllo di e5 e attacco sul re.",
    nero: "…d5 e sviluppo classico, oppure il gambetto From con …e5.",
    attenzione: "Dopo 1…e5 (gambetto From) la diagonale e1-h4 si apre: col bianco va conosciuto.",
  },
  "Nimzo-Larsen Attack": {
    it: "Attacco Nimzo-Larsen", mosse: "1.b3",
    idea: "Il bianco fianchetta subito l'alfiere di donna verso e5 e il re nero.",
    bianco: "Bb2, e3, Nf3: controllo delle case nere centrali.",
    nero: "…e5 o …d5: occupare il centro che il bianco lascia libero.",
    attenzione: "Lascia molto spazio al nero: va giocata con le idee chiare.",
  },
};

// Nomi Lichess diversi che rimandano alla stessa scheda.
const ALIAS = {
  "King's Gambit Accepted": "King's Gambit",
  "King's Gambit Declined": "King's Gambit",
  "Queen's Pawn Game: London System": "London System",
  "Queen's Pawn Game: Accelerated London System": "London System",
  "Indian Defense: London System": "London System",
  "Indian Defense: Accelerated London System": "London System",
  "London System, with Be2": "London System",
  "London System, with Bd3": "London System",
  "Queen's Pawn Game: Colle System": "Colle System",
  "Indian Defense: Colle System": "Colle System",
  "Queen's Pawn Game: Torre Attack": "Torre Attack",
  "Indian Defense: Budapest Gambit": "Budapest Defense",
  "Indian Defense: Budapest Gambit Accepted": "Budapest Defense",
  "Queen's Pawn Game: Veresov Attack": "Richter-Veresov Attack",
  "Queen's Pawn Game: Veresov": "Richter-Veresov Attack",
  "Danish Gambit Accepted": "Danish Gambit",
  "Danish Gambit Declined": "Danish Gambit",
  "Center Game Accepted": "Center Game",
  "Benko Gambit Accepted": "Benko Gambit",
  "Benko Gambit Declined": "Benko Gambit",
  "Blackmar-Diemer Gambit Accepted": "Blackmar-Diemer Gambit",
  "Blackmar-Diemer Gambit Declined": "Blackmar-Diemer Gambit",
  "Latvian Gambit Accepted": "Latvian Gambit",
  "Englund Gambit Declined": "Englund Gambit",
  "Semi-Slav Defense Accepted": "Semi-Slav Defense",
  "Queen's Indian Defense, with e3": "Queen's Indian Defense",
  "Queen's Indian Accelerated": "Queen's Indian Defense",
  "King's Indian Attack, with Bf5": "King's Indian Attack",
  "King's Indian Attack, with e6": "King's Indian Attack",
  "Vienna Gambit, with Max Lange Defense": "Vienna Game",
  "King's Knight Opening": "King's Pawn Game",
  "King's Pawn Opening": "King's Pawn Game",
  "Robatsch Defense": "Modern Defense",
};

/**
 * La scheda piu' specifica disponibile per un nome Lichess:
 * "Famiglia: Variante, Sottovariante" -> "Famiglia: Variante" -> "Famiglia".
 * @returns {chiave, scheda, esatta} oppure null
 */
export function schedaApertura(nome) {
  if (!nome) return null;
  const [fam, resto] = nome.split(/:\s*/, 2);
  const varr = resto ? resto.split(",")[0].trim() : null;
  const prove = [nome];
  if (varr) prove.push(`${fam}: ${varr}`);
  prove.push(fam);
  for (const p of prove) {
    const k = A[p] ? p : (ALIAS[p] && A[ALIAS[p]] ? ALIAS[p] : null);
    if (k) return { chiave: k, scheda: A[k], esatta: p === nome };
  }
  return null;
}

// ------------------------------------------------------------ strutture

const S = {
  carlsbad: {
    spiegazione: "Nasce dalla variante di cambio del gambetto di donna rifiutato: il bianco ha i pedoni a2-b2-d4, il nero a7-b7-c6-d5. Il bianco ha una minoranza sul lato di donna (due pedoni contro tre) ed è proprio quella che usa per attaccare.",
    bianco: "L'attacco di minoranza: b4-b5 e bxc6 per lasciare al nero un pedone debole in c6, o isolato in d5. In alternativa, f3 ed e4 per un gioco al centro.",
    nero: "Non subire: attivare i pezzi sul lato di re, cavallo in e4, …f5 o un attacco al re mentre il bianco è impegnato sull'altra ala.",
    ricorda: "Il bianco gioca dove ha meno pedoni: è controintuitivo, ed è il motivo per cui questa struttura insegna tanto.",
  },
  maroczy: {
    spiegazione: "I pedoni bianchi in c4 ed e4 contro una siciliana con …g6 o …d6: il bianco controlla d5 e toglie al nero le spinte liberatorie …b5 e …d5.",
    bianco: "Soffocare: niente fretta, controllo dello spazio, evitare cambi che liberano il nero.",
    nero: "Scambiare pezzi per avere più spazio, poi liberarsi con …b5 o …f5 al momento giusto.",
    ricorda: "Chi ha meno spazio vuole cambiare i pezzi; chi ne ha di più vuole tenerli.",
  },
  catena_est: {
    spiegazione: "La struttura tipica dell'est-indiana chiusa: pedoni bianchi d5-e4, neri d6-e5. Il centro è bloccato e ognuno gioca sull'ala dove la propria catena punta.",
    bianco: "Lato di donna: c4-c5, b4, apertura della colonna c e penetrazione in c7.",
    nero: "Lato di re: …f5, …f4, …g5-g4 e attacco a pedoni contro il re.",
    ricorda: "Si attacca nella direzione in cui punta la propria catena di pedoni. È una corsa: conta ogni tempo.",
  },
  catena_francese: {
    spiegazione: "Pedoni bianchi d4-e5, neri d5-e6: la catena tipica della difesa francese. Il bianco ha spazio sul lato di re; la base della catena, d4, è il bersaglio del nero.",
    bianco: "Attacco sul lato di re, dove i pedoni gli danno spazio; tenere d4 a ogni costo.",
    nero: "Colpire la base con …c5, poi la testa con …f6. Liberare il cattivo alfiere in c8.",
    ricorda: "Una catena si attacca alla base: se cade d4, e5 resta sospeso nel vuoto.",
  },
  stonewall: {
    spiegazione: "Pedoni in c3-d4-e3-f4 (o al nero in c6-d5-e6-f5): un muro che controlla e5 e prepara un attacco sul re. In cambio la casa e4 diventa debole e l'alfiere campochiaro resta chiuso.",
    bianco: "Cavallo in e5, poi attacco sul re con Bd3, Qf3 o la spinta g4.",
    nero: "Occupare e4 con un cavallo, cambiare l'alfiere buono del bianco e lasciargli quello cattivo.",
    ricorda: "Ogni muro ha una casa debole davanti: chi la occupa per primo comanda.",
  },
  sospesi: {
    spiegazione: "Due pedoni affiancati in c4 e d4 senza pedoni sulle colonne vicine. Controllano tante case al centro ma nessun pedone li difende.",
    bianco: "Tenerli in tensione e spingere d5 o c5 al momento giusto per aprire linee; i pezzi devono restare attivi.",
    nero: "Fermarli con un pezzo davanti, poi attaccarli: quando uno avanza, l'altro resta debole.",
    ricorda: "I pedoni sospesi sono forti finché si muovono e deboli appena si fermano.",
  },
  benoni: {
    spiegazione: "Pedone bianco in d5 contro neri in c5 e d6: il bianco ha la maggioranza al centro, il nero sul lato di donna. È una delle strutture più squilibrate.",
    bianco: "Spingere e4-e5 per sfondare al centro, o f4-f5 sul lato di re; bloccare d6 e attaccarlo.",
    nero: "…a6, …b5 e la maggioranza sul lato di donna; torre sulla colonna e semiaperta.",
    ricorda: "Chi riesce a muovere per primo la propria maggioranza prende l'iniziativa.",
  },
  riccio: {
    spiegazione: "Pedoni neri in a6-b6-d6-e6 contro c4 ed e4 bianchi: il nero accetta poco spazio, si chiude dietro la terza traversa e aspetta. Come un riccio, pare passivo ma punge.",
    bianco: "Tenere lo spazio, impedire …b5 e …d5, non lasciarsi trascinare in un attacco prematuro.",
    nero: "Pazienza, poi scattare con …b5 o …d5 quando i pezzi bianchi sono mal piazzati.",
    ricorda: "La posizione chiusa non è passiva se ogni pezzo aspetta il momento della rottura.",
  },
  isolato: {
    spiegazione: "Un pedone in d4 (o d5) senza pedoni sulle colonne c ed e. Dà spazio e case forti in e5 e c5, ma non può essere difeso da altri pedoni e la casa davanti a lui è perfetta per un pezzo avversario.",
    bianco: "Con il pedone isolato: tenere i pezzi, attaccare sul lato di re, preparare la spinta d5 che apre il gioco.",
    nero: "Contro il pedone isolato: bloccarlo con un cavallo davanti, scambiare i pezzi, portarlo in un finale e attaccarlo.",
    ricorda: "Pedone isolato: forte in mediogioco, debole in finale. Il numero di pezzi decide chi sta meglio.",
  },
};

export function schedaStruttura(chiave) {
  return S[chiave] || null;
}

/** Solo per i test: elenco delle chiavi d'apertura descritte. */
export const _aperture = A;
export const _alias = ALIAS;
