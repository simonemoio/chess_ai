/**
 * Dove porta ogni apertura: una linea tipica, dalla prima mossa fino alla
 * posizione di mediogioco a cui i due giocatori puntano, e cosa guardare li'.
 *
 * Testi originali, scritti per questo progetto. Le linee sono continuazioni
 * principali della teoria (mosse pubbliche, non protette); il commento e'
 * nostro. Chiave: lo stesso nome della scheda in teoria.js.
 *
 * Campi: linea (dalla mossa 1, notazione inglese), meta (cosa si vuole
 * ottenere nella posizione finale).
 */
export const LINEE = {
  "King's Pawn Game": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O O-O",
    meta: "Pezzi leggeri sviluppati, re al sicuro da entrambe le parti. Il pedone in c3 prepara d4: chi riesce a spingere il pedone centrale al momento giusto prende l'iniziativa.",
  },
  "Italian Game": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O a6 7.a4 Ba7 8.Re1 O-O 9.h3 h6 10.Nbd2",
    meta: "L'italiana lenta: nessuno ha fretta. Il bianco porta il cavallo in g3 via f1 e poi spinge d4; il vantaggio nasce da chi ha i pezzi meglio piazzati quando il centro si apre.",
  },
  "Italian Game: Giuoco Piano": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Bd2 Bxd2+ 8.Nbxd2 d5 9.exd5 Nxd5 10.Qb3",
    meta: "Il bianco ha un pedone isolato in d4 ma pezzi attivi: la donna in b3 attacca d5 e b7. Deve giocare in fretta, prima che il nero completi lo sviluppo e assedi d4.",
  },
  "Italian Game: Two Knights Defense": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Na5 6.Bb5+ c6 7.dxc6 bxc6 8.Be2 h6 9.Nf3 e4 10.Ne5",
    meta: "Il nero ha un pedone in meno ma molto più sviluppo, e i pezzi bianchi sono stati ricacciati indietro. Il compenso dura finché il nero tiene l'iniziativa: se si ferma, il pedone pesa.",
  },
  "Ruy Lopez": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O 9.h3 Na5 10.Bc2 c5 11.d4",
    meta: "La struttura classica della spagnola: il bianco ha il centro con d4 ed e4 e prepara la manovra del cavallo verso f1-g3; il nero guadagna spazio sul lato di donna. Lotta lunga, vince chi capisce dove aprire.",
  },
  "Ruy Lopez: Berlin Defense": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.O-O Nxe4 5.d4 Nd6 6.Bxc6 dxc6 7.dxe5 Nf5 8.Qxd8+ Kxd8",
    meta: "Il finale berlinese: donne fuori subito. Il bianco ha la maggioranza di pedoni sul lato di re, il nero la coppia degli alfieri e nessuna debolezza vera. Il re nero si mette al sicuro in c8.",
  },
  "Scotch Game": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Nf6 5.Nxc6 bxc6 6.e5 Qe7 7.Qe2 Nd5 8.c4 Ba6",
    meta: "Il pedone in e5 toglie case al nero e il cavallo in d5 viene scacciato; in cambio il nero ha pressione su c4 e pezzi attivi. I pedoni doppiati del nero sono un bersaglio di lungo periodo.",
  },
  "Petrov's Defense": {
    linea: "1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6 4.Nf3 Nxe4 5.d4 d5 6.Bd3 Nc6 7.O-O Be7 8.c4 Nb4 9.Be2 O-O 10.Nc3",
    meta: "Struttura simmetrica e solida. Il bianco cerca un piccolo vantaggio di spazio con c4; il nero punta a scambiare il cavallo in e4 e pareggiare. Vantaggio minimo, ma duraturo per chi è più preciso.",
  },
  "Four Knights Game": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.Bb5 Bb4 5.O-O O-O 6.d3 d6 7.Bg5 Bxc3 8.bxc3 Qe7 9.Re1 Nd8 10.d4 Ne6",
    meta: "Il bianco ha la coppia degli alfieri e il centro con d4, a costo di pedoni doppiati in c3. Il nero ha riorganizzato il cavallo in e6 per attaccare l'alfiere: classico duello alfieri contro cavalli.",
  },
  "Three Knights Opening": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.d4 exd4 5.Nxd4 Bb4 6.Nxc6 bxc6 7.Bd3 d5 8.exd5 cxd5 9.O-O O-O 10.Bg5 c6",
    meta: "Quasi sempre si torna ai quattro cavalli. Qui il nero ha il centro di pedoni c6-d5, il bianco lo sviluppo e l'inchiodatura in g5: il bianco gioca sui pezzi, il nero sulla solidità.",
  },
  "King's Gambit": {
    linea: "1.e4 e5 2.f4 exf4 3.Nf3 g5 4.h4 g4 5.Ne5 Nf6 6.Bc4 d5 7.exd5 Bd6 8.d4 Nh5 9.O-O",
    meta: "Gioco a tutto gas: il bianco ha dato un pedone e arroccato verso la colonna f aperta, il nero tiene il pedone in più ma ha il re al centro. Chi sbaglia il tempo di attacco perde subito.",
  },
  "Vienna Game": {
    linea: "1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3 Be7 6.d4 O-O 7.Bd3 f5 8.exf6 Bxf6 9.O-O",
    meta: "Il gambetto viennese risolto: colonne aperte, entrambi arroccati. Il bianco ha più spazio al centro, il nero pezzi attivi sulla colonna f. Si gioca contro il re avversario.",
  },
  "Bishop's Opening": {
    linea: "1.e4 e5 2.Bc4 Nf6 3.d3 Bc5 4.Nf3 d6 5.c3 O-O 6.O-O a6 7.Bb3 Ba7 8.Nbd2",
    meta: "Si arriva a una italiana lenta per altra strada. Il bianco tiene aperta la scelta tra f4 e d4; il nero ha messo gli alfieri al riparo da scambi. Posizione di manovra.",
  },
  "Philidor Defense": {
    linea: "1.e4 e5 2.Nf3 d6 3.d4 Nf6 4.Nc3 Nbd7 5.Bc4 Be7 6.O-O O-O 7.Re1 c6 8.a4",
    meta: "Il nero tiene e5 a tutti i costi, con una posizione stretta ma solida. Il bianco ha più spazio e a4 impedisce …b5: deve trovare una rottura prima che il nero si liberi con …d5 o …b5.",
  },
  "Center Game": {
    linea: "1.e4 e5 2.d4 exd4 3.Qxd4 Nc6 4.Qe3 Nf6 5.Nc3 Bb4 6.Bd2 O-O 7.O-O-O Re8 8.Bc4 d6 9.f3",
    meta: "Arrocchi opposti: il bianco ha arroccato lungo e vuole spingere i pedoni sul lato di re. Il nero, più sviluppato, attacca sul lato di donna. Corsa all'attacco.",
  },
  "Danish Gambit": {
    linea: "1.e4 e5 2.d4 exd4 3.c3 dxc3 4.Bc4 cxb2 5.Bxb2 d5 6.Bxd5 Nf6 7.Bxf7+ Kxf7 8.Qxd8 Bb4+ 9.Qd2 Bxd2+ 10.Nxd2",
    meta: "Il nero ha restituito il materiale al momento giusto e si va in un finale pari. È la difesa più semplice contro il danese: chi gioca il gambetto deve conoscerla.",
  },
  "Ponziani Opening": {
    linea: "1.e4 e5 2.Nf3 Nc6 3.c3 Nf6 4.d4 Nxe4 5.d5 Ne7 6.Nxe5 Ng6 7.Bd3 Nxe5 8.Bxe4 Bc5",
    meta: "Posizione aperta e già sbilanciata: il bianco ha un pedone avanzato in d5, il nero sviluppo rapido e l'alfiere che punta su f2. Il re bianco deve mettersi al sicuro in fretta.",
  },
  "Elephant Gambit": {
    linea: "1.e4 e5 2.Nf3 d5 3.exd5 e4 4.Qe2 Nf6 5.d3 Be7 6.dxe4 O-O 7.Nc3 Re8",
    meta: "Il bianco ha un pedone in più; il nero spera nello sviluppo e nella colonna e. Con gioco tranquillo il bianco finisce lo sviluppo e il pedone resta: per questo il gambetto è considerato dubbio.",
  },
  "Latvian Gambit": {
    linea: "1.e4 e5 2.Nf3 f5 3.Nxe5 Qf6 4.d4 d6 5.Nc4 fxe4 6.Nc3 Qg6 7.f3 exf3 8.Qxf3",
    meta: "Il bianco è molto più sviluppato e il re nero è esposto sulla diagonale e8-h5. È la posizione a cui punta chi affronta il lettone: aprire linee prima che il nero si riorganizzi.",
  },
  "Sicilian Defense": {
    linea: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Be2 e5 7.Nb3 Be7 8.O-O O-O 9.Be3 Be6",
    meta: "Struttura tipica della siciliana aperta: il nero ha un pedone centrale in più e la colonna c, il bianco controlla la casa d5. Chi vince la lotta per d5 ha il vantaggio.",
  },
  "Sicilian Defense: Najdorf Variation": {
    linea: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Be3 e5 7.Nb3 Be6 8.f3 Be7 9.Qd2 O-O 10.O-O-O Nbd7 11.g4 b5",
    meta: "L'attacco inglese: arrocchi opposti. Il bianco lancia g4-g5 contro il re nero, il nero risponde con …b5-b4 contro il re bianco. Vince chi arriva prima: ogni tempo perso pesa.",
  },
  "Sicilian Defense: Dragon Variation": {
    linea: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3 O-O 8.Qd2 Nc6 9.Bc4 Bd7 10.O-O-O Rc8 11.Bb3 Ne5 12.h4",
    meta: "L'attacco jugoslavo: il bianco spinge h4-h5 per aprire la colonna h e cambiare l'alfiere g7; il nero usa la colonna c e l'alfiere drago contro b2. Una delle corse più taglienti di tutti gli scacchi.",
  },
  "Sicilian Defense: Accelerated Dragon": {
    linea: "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6 5.c4 Bg7 6.Be3 Nf6 7.Nc3 O-O 8.Be2 d6 9.O-O Bd7",
    meta: "La morsa di Maroczy: con i pedoni in c4 ed e4 il bianco impedisce …d5 e …b5 e soffoca il nero. Il nero gioca sulle case scure e aspetta il momento per …a5 o …f5.",
  },
  "Sicilian Defense: Alapin Variation": {
    linea: "1.e4 c5 2.c3 Nf6 3.e5 Nd5 4.d4 cxd4 5.Nf3 Nc6 6.cxd4 d6 7.Bc4 Nb6 8.Bb5 dxe5 9.Nxe5 Bd7",
    meta: "Il bianco ha un pedone isolato in d4 ma gioco di pezzi facile. Se il nero scambia i pezzi giusti, il pedone isolato diventa una debolezza nel finale.",
  },
  "Sicilian Defense: Smith-Morra Gambit": {
    linea: "1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Nxc3 Nc6 5.Nf3 d6 6.Bc4 e6 7.O-O Nf6 8.Qe2 Be7 9.Rd1 e5",
    meta: "Per un pedone il bianco ha colonne c e d aperte e torri già in gioco. Il nero chiude con …e5 e cerca di completare lo sviluppo: se ci riesce senza danni, il pedone in più conta.",
  },
  "Sicilian Defense: Closed": {
    linea: "1.e4 c5 2.Nc3 Nc6 3.g3 g6 4.Bg2 Bg7 5.d3 d6 6.Be3 e6 7.Qd2 Rb8 8.Nge2 Nd4 9.O-O b5",
    meta: "Centro chiuso, i due giocano su ali diverse: il bianco prepara f4-f5 sul lato di re, il nero avanza con …b5-b4 sul lato di donna. Chi apre prima il proprio lato detta la partita.",
  },
  "French Defense": {
    linea: "1.e4 e6 2.d4 d5 3.Nc3 Nf6 4.e5 Nfd7 5.f4 c5 6.Nf3 Nc6 7.Be3 cxd4 8.Nxd4 Bc5 9.Qd2 O-O 10.O-O-O",
    meta: "La catena di pedoni bianca d4-e5-f4 dà spazio sul lato di re; il nero attacca la base con …c5 e …f6. Arrocchi opposti: il bianco cerca l'attacco, il nero contrattacca sulla colonna c.",
  },
  "French Defense: Advance Variation": {
    linea: "1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3 Qb6 6.a3 Nh6 7.b4 cxd4 8.cxd4 Nf5 9.Bb2 Be7",
    meta: "Tutto ruota attorno a d4: il nero lo attacca con donna, cavalli e alfiere, il bianco lo difende guadagnando spazio sul lato di donna. Se d4 cade, la catena bianca crolla.",
  },
  "Caro-Kann Defense": {
    linea: "1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7 8.h5 Bh7 9.Bd3 Bxd3 10.Qxd3 e6 11.Bd2 Ngf6 12.O-O-O",
    meta: "Il bianco ha più spazio e un pedone in h5 che blocca il lato di re nero; il nero ha una posizione senza debolezze e prepara …c5. Vantaggio piccolo per il bianco, ma il nero ha un gioco facile.",
  },
  "Caro-Kann Defense: Advance Variation": {
    linea: "1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 c5 6.Be3 Nd7 7.O-O Ne7 8.c4",
    meta: "A differenza della francese, l'alfiere camposcuro del nero è già fuori dalla catena. Il bianco attacca il centro con c4, il nero spinge …c5 per minare d4: lotta per le case chiare.",
  },
  "Scandinavian Defense": {
    linea: "1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.d4 Nf6 5.Nf3 c6 6.Bc4 Bf5 7.Bd2 e6 8.Qe2 Bb4 9.O-O-O",
    meta: "Il bianco ha un pedone in d4 contro nessuno: più spazio e sviluppo. Il nero ha una struttura tipo Caro-Kann, solida, e mette l'alfiere fuori prima di chiudere con …e6.",
  },
  "Alekhine Defense": {
    linea: "1.e4 Nf6 2.e5 Nd5 3.d4 d6 4.Nf3 Bg4 5.Be2 e6 6.O-O Be7 7.c4 Nb6 8.h3 Bh5 9.exd6 cxd6 10.Nc3",
    meta: "Il bianco ha preso spazio con c4 e d4, il nero ha aperto la colonna c e vuole attaccare il centro con …d5 o …Nc6. Se il centro bianco regge, il nero resta stretto.",
  },
  "Pirc Defense": {
    linea: "1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Be3 Bg7 5.Qd2 c6 6.f3 b5 7.Nge2 Nbd7 8.Bh6 Bxh6 9.Qxh6 Bb7",
    meta: "Il bianco ha cambiato l'alfiere g7 e può arroccare lungo e attaccare sul lato di re; il nero ha rinviato l'arrocco e si espande sul lato di donna con …b5. Posizione dinamica.",
  },
  "Modern Defense": {
    linea: "1.e4 g6 2.d4 Bg7 3.Nc3 d6 4.Be3 a6 5.Qd2 Nd7 6.f4 b5 7.Nf3 Bb7 8.Bd3 c5",
    meta: "Il bianco ha un centro di pedoni grande, il nero lo colpisce dai lati con …c5 e l'alfiere in g7. Se il centro bianco regge, il bianco attacca; se cede, l'alfiere nero domina.",
  },
  "Nimzowitsch Defense": {
    linea: "1.e4 Nc6 2.Nf3 d6 3.d4 Nf6 4.Nc3 Bg4 5.Be3 e6 6.Be2 Be7 7.O-O O-O",
    meta: "Il nero ha uno schema compatto che pressa d4. Il bianco ha più spazio e cerca d5 per scacciare il cavallo: se ci riesce, il nero resta senza gioco.",
  },
  "Owen Defense": {
    linea: "1.e4 b6 2.d4 Bb7 3.Bd3 e6 4.Nf3 c5 5.c3 Nf6 6.Qe2 Be7 7.O-O O-O",
    meta: "Il bianco ha il centro classico, il nero lo attacca con l'alfiere in b7 e con …c5. Il bianco deve tenere e4 solido; se il nero lo costringe ad avanzare in e5, prende le case libere.",
  },
  "Queen's Pawn Game": {
    linea: "1.d4 d5 2.Nf3 Nf6 3.e3 e6 4.Bd3 c5 5.c3 Nc6 6.Nbd2 Bd6 7.O-O O-O",
    meta: "Schemi tranquilli e simmetrici. Il bianco prepara e4 per aprire il centro con i pezzi pronti contro il lato di re; il nero cerca gioco sul lato di donna con …b6 e …Bb7.",
  },
  "Queen's Gambit": {
    linea: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 Nbd7 7.Rc1 c6 8.Bd3 dxc4 9.Bxc4 Nd5",
    meta: "La linea ortodossa: il nero libera la posizione con scambi (…Nd5 e poi …e5 o …c5). Il bianco ha un po' più di spazio; se il nero non libera il gioco in tempo resta passivo.",
  },
  "Queen's Gambit Declined": {
    linea: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 c6 6.e3 Be7 7.Bd3 Nbd7 8.Qc2 O-O 9.Nge2 Re8 10.O-O Nf8 11.Rab1",
    meta: "La variante di cambio: la torre in b1 prepara b4-b5, l'attacco di minoranza, per creare una debolezza in c6. Il nero cerca gioco sul lato di re o la casa e4.",
  },
  "Queen's Gambit Accepted": {
    linea: "1.d4 d5 2.c4 dxc4 3.Nf3 Nf6 4.e3 e6 5.Bxc4 c5 6.O-O a6 7.a4 Nc6 8.Qe2 cxd4 9.Rd1 Be7 10.exd4 O-O 11.Nc3",
    meta: "Il bianco ha il pedone di donna isolato: in cambio, pezzi attivi e le case e5 e c5. Deve attaccare finché ci sono pezzi; il nero vuole scambiarli e bloccare d4 in d5.",
  },
  "Slav Defense": {
    linea: "1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5 6.e3 e6 7.Bxc4 Bb4 8.O-O O-O 9.Qe2 Nbd7 10.e4 Bg6",
    meta: "Il bianco ha preso il centro con e4, il nero ha l'alfiere fuori dalla catena e pezzi pronti a colpire con …e5 o …c5. Tensione al centro: chi la risolve meglio ha il vantaggio.",
  },
  "Semi-Slav Defense": {
    linea: "1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.Nf3 e6 5.e3 Nbd7 6.Bd3 dxc4 7.Bxc4 b5 8.Bd3 Bb7 9.O-O a6 10.e4 c5 11.d5",
    meta: "La Merano: il bianco spinge d5 per spezzare la posizione nera, il nero ha spazio sul lato di donna e una maggioranza di pedoni. Posizione molto tattica, dove contano i tempi.",
  },
  "Tarrasch Defense": {
    linea: "1.d4 d5 2.c4 e6 3.Nc3 c5 4.cxd5 exd5 5.Nf3 Nc6 6.g3 Nf6 7.Bg2 Be7 8.O-O O-O 9.Bg5 cxd4 10.Nxd4 h6 11.Be3 Re8",
    meta: "Il nero accetta il pedone isolato in d5 in cambio di pezzi attivi. Il bianco lo blocca e lo attacca con l'alfiere in g2; il nero deve restare attivo, perché nel finale il pedone pesa.",
  },
  "Catalan Opening": {
    linea: "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 Be7 5.Nf3 O-O 6.O-O dxc4 7.Qc2 a6 8.Qxc4 b5 9.Qc2 Bb7 10.Bd2",
    meta: "Il bianco ha ripreso il pedone e l'alfiere in g2 preme sulla diagonale lunga. Il nero ha spazio sul lato di donna e deve liberare l'alfiere b7 con …c5: se non ci riesce, soffre a lungo.",
  },
  "London System": {
    linea: "1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 c5 5.c3 Nc6 6.Nbd2 Bd6 7.Bg3 O-O 8.Bd3 Qe7 9.Ne5",
    meta: "Lo schema completo: catena c3-d4-e3, alfieri fuori, cavallo in e5 come avamposto. Il piano è f4 e attacco sul lato di re; il nero cerca …e5 per liberarsi.",
  },
  "Colle System": {
    linea: "1.d4 d5 2.Nf3 Nf6 3.e3 e6 4.Bd3 c5 5.c3 Nc6 6.Nbd2 Bd6 7.O-O O-O 8.dxc5 Bxc5 9.e4",
    meta: "Il colpo tipico del Colle: e4 apre il centro quando il bianco ha già tutti i pezzi puntati verso il re nero, con l'alfiere in d3 sulla diagonale di h7.",
  },
  "Torre Attack": {
    linea: "1.d4 Nf6 2.Nf3 e6 3.Bg5 c5 4.e3 h6 5.Bh4 b6 6.Nbd2 Bb7 7.Bd3 Be7 8.c3 O-O",
    meta: "Il bianco tiene l'inchiodatura e prepara e4 per un centro mobile. Il nero ha messo l'alfiere in b7 per controllare proprio e4: tutta la partita gira su quella casa.",
  },
  "Blackmar-Diemer Gambit": {
    linea: "1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3 exf3 5.Nxf3 Bg4 6.h3 Bxf3 7.Qxf3 c6 8.Be3 e6 9.Bd3 Nbd7 10.O-O-O",
    meta: "Per il pedone il bianco ha la colonna f aperta, la coppia degli alfieri e arrocco lungo per attaccare. Il nero è solido: se resiste all'attacco iniziale, il pedone in più conta.",
  },
  "Richter-Veresov Attack": {
    linea: "1.d4 d5 2.Nc3 Nf6 3.Bg5 Nbd7 4.Nf3 g6 5.e3 Bg7 6.Bd3 O-O 7.O-O c5",
    meta: "Schema poco teorico: il bianco sviluppa in fretta e vuole e4. Il nero ha fianchettato e colpisce il centro con …c5: posizione equilibrata, vince chi capisce meglio la struttura.",
  },
  "Indian Defense": {
    linea: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O 6.Be2 e5",
    meta: "La filosofia indiana: il nero lascia il centro al bianco, si sviluppa e arrocca, poi lo attacca con …e5 o …c5. Il centro bianco è una forza se regge, un bersaglio se no.",
  },
  "King's Indian Defense": {
    linea: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O 6.Be2 e5 7.O-O Nc6 8.d5 Ne7 9.Ne1 Nd7 10.Nd3 f5",
    meta: "Centro chiuso, partita su due ali: il bianco sfonda sul lato di donna con c5, il nero attacca il re con …f5-f4 e …g5. Una corsa in cui il nero rischia tutto sul lato di re.",
  },
  "Nimzo-Indian Defense": {
    linea: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 O-O 5.Bd3 d5 6.Nf3 c5 7.O-O Nc6 8.a3 Bxc3 9.bxc3 dxc4 10.Bxc4 Qc7",
    meta: "Il bianco ha la coppia degli alfieri e pedoni doppiati in c3; prepara e4 per aprire il gioco. Il nero vuole tenere il centro chiuso e attaccare i pedoni deboli: alfieri contro struttura.",
  },
  "Queen's Indian Defense": {
    linea: "1.d4 Nf6 2.c4 e6 3.Nf3 b6 4.g3 Ba6 5.b3 Bb4+ 6.Bd2 Be7 7.Bg2 c6 8.Bc3 d5 9.Ne5 Nfd7 10.Nxd7 Nxd7 11.Nd2 O-O 12.O-O",
    meta: "Posizione solida e un po' chiusa: entrambi lottano per le case chiare al centro. Il bianco ha più spazio, il nero nessuna debolezza; vince la pazienza.",
  },
  "Bogo-Indian Defense": {
    linea: "1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+ 4.Bd2 Qe7 5.g3 Nc6 6.Nc3 Bxc3 7.Bxc3 Ne4 8.Rc1 O-O 9.Bg2 d6",
    meta: "Il nero ha ceduto la coppia degli alfieri per sviluppo rapido e il controllo di e4 ed e5. Il bianco vuole aprire il gioco per gli alfieri, il nero tenerlo chiuso.",
  },
  "Grünfeld Defense": {
    linea: "1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3 Bg7 7.Bc4 c5 8.Ne2 Nc6 9.Be3 O-O 10.O-O",
    meta: "Il bianco ha il centro grande c3-d4-e4, il nero lo bombarda con l'alfiere g7, …c5 e i pezzi su d4. Se il centro regge il bianco attacca; se cede, il nero ha un pedone passato sul lato di donna.",
  },
  "Benoni Defense": {
    linea: "1.d4 Nf6 2.c4 c5 3.d5 e6 4.Nc3 exd5 5.cxd5 d6 6.e4 g6 7.Nf3 Bg7 8.Be2 O-O 9.O-O Re8 10.Nd2",
    meta: "Struttura asimmetrica: il bianco ha la maggioranza al centro e vuole spingere e5; il nero ha la maggioranza sul lato di donna e vuole …b5. Vince chi realizza prima la propria spinta.",
  },
  "Benko Gambit": {
    linea: "1.d4 Nf6 2.c4 c5 3.d5 b5 4.cxb5 a6 5.bxa6 Bxa6 6.Nc3 d6 7.e4 Bxf1 8.Kxf1 g6 9.g3 Bg7 10.Kg2 O-O 11.Nf3",
    meta: "Il nero ha un pedone in meno ma le colonne a e b aperte contro il lato di donna bianco: le torri ci arrivano da sole. Compenso a lungo termine, valido anche nel finale.",
  },
  "Dutch Defense": {
    linea: "1.d4 f5 2.g3 Nf6 3.Bg2 e6 4.Nf3 Be7 5.O-O O-O 6.c4 d6 7.Nc3 Qe8 8.Re1 Qg6 9.e4",
    meta: "La olandese classica: il nero controlla e4 e porta la donna sul lato di re per attaccare. Il bianco rompe con e4 per aprire il centro prima che l'attacco nero prenda forma.",
  },
  "Old Indian Defense": {
    linea: "1.d4 Nf6 2.c4 d6 3.Nc3 Nbd7 4.e4 e5 5.Nf3 c6 6.Be2 Be7 7.O-O O-O 8.Re1",
    meta: "Il nero è solido ma un po' stretto, con l'alfiere in e7 meno attivo che nell'est-indiana. Il bianco ha più spazio e può scegliere quando aprire con d5 o dxe5.",
  },
  "Trompowsky Attack": {
    linea: "1.d4 Nf6 2.Bg5 Ne4 3.Bf4 c5 4.f3 Qa5+ 5.c3 Nf6 6.Nd2 cxd4 7.Nb3 Qb6 8.Qxd4",
    meta: "Gioco fuori dagli schemi: il bianco ha il centro con e4 in arrivo, il nero ha spinto la donna presto e deve fare attenzione ai tempi. Chi conosce meglio questa struttura ha il vantaggio.",
  },
  "Budapest Defense": {
    linea: "1.d4 Nf6 2.c4 e5 3.dxe5 Ng4 4.Bf4 Nc6 5.Nf3 Bb4+ 6.Nbd2 Qe7 7.e3 Ngxe5 8.Nxe5 Nxe5 9.Be2 O-O 10.O-O",
    meta: "Il nero ha recuperato il pedone e ha pezzi attivi, il bianco ha il vantaggio di spazio con c4. Il bianco gioca per una piccola pressione duratura, il nero per l'attività.",
  },
  "Englund Gambit": {
    linea: "1.d4 e5 2.dxe5 Nc6 3.Nf3 Qe7 4.Bf4 Qb4+ 5.Bd2 Qxb2 6.Nc3 Bb4 7.Rb1 Qa3 8.Rb3 Qa5",
    meta: "Il nero ha ripreso un pedone ma con la donna in giro per la scacchiera, e il bianco è molto più sviluppato. È la posizione a cui punta chi affronta il gambetto: sviluppo contro materiale.",
  },
  "English Opening": {
    linea: "1.c4 e5 2.Nc3 Nf6 3.Nf3 Nc6 4.g3 d5 5.cxd5 Nxd5 6.Bg2 Nb6 7.O-O Be7 8.d3 O-O 9.a3",
    meta: "Una siciliana con i colori invertiti e un tempo in più per il bianco. Il bianco prepara b4-b5 sul lato di donna, il nero ha il centro e cerca …f5 o …a5.",
  },
  "Réti Opening": {
    linea: "1.Nf3 d5 2.c4 e6 3.g3 Nf6 4.Bg2 Be7 5.O-O O-O 6.b3 c5 7.Bb2 Nc6 8.e3",
    meta: "Due alfieri in fianchetto che colpiscono il centro da lontano. Il nero ha i pedoni centrali, il bianco aspetta che si muovano per attaccarli: gioco ipermoderno.",
  },
  "Zukertort Opening": {
    linea: "1.Nf3 d5 2.g3 Nf6 3.Bg2 c6 4.O-O Bg4 5.d3 Nbd7 6.Nbd2 e5 7.e4",
    meta: "Il bianco ha uno schema flessibile e prepara e4 per contestare il centro, il nero ha i pedoni centrali e uno sviluppo naturale. Posizione di manovra, senza teoria forzata.",
  },
  "King's Indian Attack": {
    linea: "1.Nf3 d5 2.g3 Nf6 3.Bg2 c5 4.O-O Nc6 5.d3 e6 6.Nbd2 Be7 7.e4 O-O 8.Re1 b5 9.e5 Nd7 10.Nf1",
    meta: "Il pedone in e5 dà spazio sul lato di re: il bianco porta i pezzi lì (Nf1-h2-g4, h4) per attaccare il re. Il nero avanza sul lato di donna con …b4 e …a5. Corsa su due ali.",
  },
  "Bird Opening": {
    linea: "1.f4 d5 2.Nf3 Nf6 3.e3 g6 4.Be2 Bg7 5.O-O O-O 6.d3 c5 7.Qe1",
    meta: "Il bianco controlla e5 e prepara Qh4 per attaccare sul lato di re; il nero ha il centro e cerca la rottura …e5. Struttura tipo olandese a colori invertiti.",
  },
  "Nimzo-Larsen Attack": {
    linea: "1.b3 e5 2.Bb2 Nc6 3.e3 d5 4.Bb5 Bd6 5.f4 Qh4+ 6.g3 Qe7 7.Nf3",
    meta: "Il bianco attacca il centro nero dai lati, con l'alfiere in b2 contro e5 e la spinta f4. Il nero ha il centro: se lo tiene, ha più spazio; se cede, l'alfiere bianco domina.",
  },
};
