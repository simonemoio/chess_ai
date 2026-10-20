#!/usr/bin/env python3
"""
Quante mosse umane cadono fuori dalle candidate di Stockfish, per fascia Elo.

Il nostro avversario sceglie solo fra le 8 mosse migliori di Stockfish a
profondita' 10 (MultiPV 8). Se un giocatore vero di quel livello gioca spesso
mosse fuori da quella lista, il bot e' "troppo pulito" in un modo che si nota.
Questo script lo misura sulle partite Lichess, con gli stessi filtri di
libro.py, e sullo stesso file.

    pip install python-chess zstandard
    python copertura.py --file lichess-2026-09.pgn.zst --stockfish C:\\percorso\\stockfish.exe

Per ogni fascia (1100 ... 1900) prende una posizione a caso per partita, dopo
l'apertura, e guarda dove sta la mossa giocata davvero nella lista del motore:
prima, fra le prime 4, fra le prime 8, oppure fuori. Per quelle fuori misura
anche quanto costano, sulla stessa scala di probabilita' di vittoria usata
dall'avversario (js/avversario.js).

Scrive data/copertura.json e stampa una tabella. Si puo' interrompere con
Ctrl+C: salva quello che ha misurato fino a quel momento.
"""
import argparse
import json
import math
import multiprocessing as mp
import os
import random
import re
import sys
import time
from collections import defaultdict

try:
    import chess
    import chess.engine
    import zstandard
except ImportError:
    sys.exit("Mancano le dipendenze:  pip install python-chess zstandard")

import libro  # stessi filtri e stessa lettura del file

QUI = os.path.dirname(os.path.abspath(__file__))
FASCE = libro.FASCE
MULTIPV = 8          # come motore.multipv(fen, 8, ...) in avversario.js
PROFONDITA = 10      # come la mossa del bot in app.js
PLY_MIN = 16         # dopo l'apertura: li' decide il libro, non il surrogato
TIPI_EVENTO = ("Rated",)


def vittoria(cp):
    """Stessa curva di js/avversario.js (Lichess), su [0, 1]."""
    return 1 / (1 + math.exp(-0.00368208 * cp))


def tutte_le_mosse(testo):
    """Come libro.mosse_san, ma senza limite di semimosse."""
    testo = libro.RE_GRAFFE.sub(" ", testo)
    out = []
    for t in testo.split():
        if libro.RE_NUMERO.match(t) or t in libro.RISULTATI:
            continue
        if t[0].isdigit():
            t = re.sub(r"^\d+\.+", "", t)
            if not t:
                continue
        out.append(t.rstrip("?!"))
    return out


def campioni(args, rng):
    """Genera (fascia, fen, uci giocata) finche' ogni fascia ha i suoi."""
    presi = defaultdict(int)
    lette = 0
    for tag, testo in libro.partite(libro.apri(args)):
        lette += 1
        if lette % 200000 == 0:
            stato = " ".join(f"{e}:{presi[e]}" for e in FASCE)
            print(f"  {lette // 1000}k partite lette  campioni {stato}", flush=True)
        if "Rated" not in tag.get("Event", "") or tag.get("Variant", "Standard") != "Standard":
            continue
        if not libro.ritmo_ok(tag.get("TimeControl")):
            continue
        try:
            we, be = int(tag["WhiteElo"]), int(tag["BlackElo"])
        except (KeyError, ValueError):
            continue
        fasce = [e for e in libro.fasce_di(we, be) if presi[e] < args.posizioni]
        if not fasce:
            if all(presi[e] >= args.posizioni for e in FASCE):
                return
            continue
        mosse = tutte_le_mosse(testo)
        if len(mosse) <= PLY_MIN + 1:
            continue
        # una posizione sola per partita: posizioni della stessa partita si
        # somigliano e gonfierebbero il campione
        ply = rng.randrange(PLY_MIN, len(mosse) - 1)
        b = chess.Board()
        try:
            for san in mosse[:ply]:
                b.push_san(san)
            giocata = b.parse_san(mosse[ply])
        except ValueError:
            continue
        if b.legal_moves.count() < 3:
            continue  # mosse quasi forzate: non dicono niente
        e = rng.choice(fasce)  # la partita conta per una sola fascia
        presi[e] += 1
        yield e, b.fen(), giocata.uci()


# --------------------------------------------------------------- lavoratori

_motore = None


def _avvia(percorso, hash_mb):
    global _motore
    _motore = chess.engine.SimpleEngine.popen_uci(percorso)
    _motore.configure({"Threads": 1, "Hash": hash_mb})


def _cp(score, turno):
    s = score.pov(turno)
    if s.is_mate():
        m = s.mate()
        return 10000 - abs(m) if m > 0 else -10000 + abs(m)
    return s.score()


def _misura(lavoro):
    fascia, fen, uci = lavoro
    b = chess.Board(fen)
    lim = chess.engine.Limit(depth=PROFONDITA)
    info = _motore.analyse(b, lim, multipv=MULTIPV)
    lista = [i["pv"][0].uci() for i in info if i.get("pv")]
    migliore = _cp(info[0]["score"], b.turn)
    if uci in lista:
        rango = lista.index(uci) + 1
        cp = _cp(info[rango - 1]["score"], b.turn)
    else:
        rango = 0
        m = chess.Move.from_uci(uci)
        cp = _cp(_motore.analyse(b, lim, root_moves=[m])["score"], b.turn)
    # costo relativo alla migliore, come fa l'avversario (scala relativa)
    costo = 0.5 - vittoria(cp - migliore) if abs(migliore) < 9000 and abs(cp) < 9000 else None
    return fascia, rango, costo


# --------------------------------------------------------------- riepilogo

def riepilogo(ris, args, durata):
    out = {
        "meta": {
            "fonte": args.file or libro.URL.format(mese=args.mese),
            "multipv": MULTIPV, "profondita": PROFONDITA, "ply_min": PLY_MIN,
            "durata_s": round(durata),
        },
        "fasce": {},
    }
    print(f"\n{'fascia':>6} {'pos':>5} {'1a':>6} {'top4':>6} {'top8':>6} {'fuori':>6}  costo fuori (mediana / grave)")
    for e in FASCE:
        r = ris.get(e, [])
        n = len(r)
        if not n:
            continue
        primi = sum(1 for x in r if x[0] == 1) / n
        top4 = sum(1 for x in r if 1 <= x[0] <= 4) / n
        top8 = sum(1 for x in r if x[0] >= 1) / n
        costi = sorted(x[1] for x in r if x[0] == 0 and x[1] is not None)
        mediana = costi[len(costi) // 2] if costi else None
        # 0,15 sulla nostra scala = soglia "errore grave" di Lichess (0,3 su [-1,1])
        gravi = sum(1 for c in costi if c >= 0.15) / len(costi) if costi else None
        out["fasce"][str(e)] = {
            "posizioni": n, "prima": round(primi, 4), "top4": round(top4, 4),
            "top8": round(top8, 4), "fuori": round(1 - top8, 4),
            "costo_fuori_mediana": None if mediana is None else round(mediana, 4),
            "fuori_gravi": None if gravi is None else round(gravi, 4),
            "ranghi": {str(k): sum(1 for x in r if x[0] == k) for k in range(0, MULTIPV + 1)},
        }
        f = lambda v: "   -  " if v is None else f"{v * 100:5.1f}%"
        print(f"{e:>6} {n:>5} {f(primi)} {f(top4)} {f(top8)} {f(1 - top8)}  "
              f"{'-' if mediana is None else f'{mediana:.3f}'} / {f(gravi)}")
    os.makedirs(os.path.dirname(args.uscita), exist_ok=True)
    with open(args.uscita, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)
    print(f"\nScritto {args.uscita}")
    print("Lettura: 'fuori' = mosse che il nostro bot non giocherebbe mai. 'costo fuori' e' quanto")
    print("costano, sulla scala dell'avversario: vicino a 0 = mosse ragionevoli escluse, 'grave' =")
    print("quota di errori gravi fra quelle (soglia Lichess).")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--file", help="file PGN locale (.pgn o .pgn.zst), lo stesso di libro.py")
    ap.add_argument("--mese", default="2026-09", help="senza --file: streaming da Lichess di questo mese")
    ap.add_argument("--stockfish", required=True, help="percorso dell'eseguibile di Stockfish")
    ap.add_argument("--posizioni", type=int, default=1500, help="posizioni per fascia (predefinito 1500)")
    ap.add_argument("--processi", type=int, default=max(1, (os.cpu_count() or 2) - 1),
                    help="motori in parallelo (predefinito: core meno uno)")
    ap.add_argument("--hash", type=int, default=32, help="MB di hash per motore")
    ap.add_argument("--seme", type=int, default=1)
    ap.add_argument("--uscita", default=os.path.join(QUI, "data", "copertura.json"))
    args = ap.parse_args()

    if not os.path.isfile(args.stockfish):
        sys.exit(f"Stockfish non trovato: {args.stockfish}")

    rng = random.Random(args.seme)
    ris = defaultdict(list)
    t0 = time.time()
    totale = args.posizioni * len(FASCE)
    fatte = 0
    print(f"{args.processi} motori, profondita' {PROFONDITA}, MultiPV {MULTIPV}, "
          f"{args.posizioni} posizioni per fascia")
    pool = mp.Pool(args.processi, initializer=_avvia, initargs=(args.stockfish, args.hash))
    try:
        for fascia, rango, costo in pool.imap_unordered(_misura, campioni(args, rng), chunksize=4):
            ris[fascia].append((rango, costo))
            fatte += 1
            if fatte % 500 == 0:
                v = fatte / (time.time() - t0)
                print(f"  {fatte}/{totale} posizioni misurate, {v:.1f}/s, "
                      f"mancano ~{(totale - fatte) / v / 60:.0f} min", flush=True)
    except KeyboardInterrupt:
        print("\nInterrotto a mano: salvo quello che c'e'.")
    except (OSError, zstandard.ZstdError) as e:
        print(f"\nLettura interrotta ({e}): salvo quello che c'e'.")
    finally:
        pool.terminate()
    riepilogo(ris, args, time.time() - t0)


if __name__ == "__main__":
    mp.freeze_support()
    main()
