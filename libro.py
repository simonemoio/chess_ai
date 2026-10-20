#!/usr/bin/env python3
"""
Costruisce il libro d'aperture per fascia Elo dalle partite vere di Lichess.

    pip install python-chess zstandard
    python libro.py                      # scarica in streaming il mese indicato
    python libro.py --file partite.pgn.zst
    python libro.py --mese 2026-09 --partite 80000

Per ogni livello dello slider (1100, 1200 ... 1900) scrive data/libro-<elo>.json
con le mosse che i giocatori di quella fascia giocano davvero nelle prime
semimosse, e quante volte. Il bot le campiona per frequenza: a 1200 giochera'
le linee che si giocano a 1200, comprese quelle teoricamente scorrette.

Quali partite entrano nella fascia E:
  - rated, standard, ritmo blitz o piu' lento (il bullet e' un altro gioco);
  - entrambi i giocatori fra E-100 ed E+100 (rating Lichess, non FIDE).
Una partita a 1550 contro 1580 entra sia nella fascia 1500 sia nella 1600:
le fasce si sovrappongono di proposito, cosi' le estreme non restano vuote.

Il file mensile di Lichess pesa decine di GB compressi, ma NON serve
scaricarlo: lo script lo legge in streaming e si ferma appena ogni fascia ha
le sue partite. Con i valori predefiniti legge qualche milione di partite e
ci mette dell'ordine di 10-30 minuti, quasi tutti di rete e decompressione.

Il database Lichess e' CC0: i file generati possono stare nel repository.
"""
import argparse
import http.client
import io
import json
import os
import re
import ssl
import sys
import time
import urllib.request
from collections import Counter, defaultdict

try:
    import chess
    import zstandard
except ImportError:
    sys.exit("Mancano le dipendenze:  pip install python-chess zstandard")

QUI = os.path.dirname(os.path.abspath(__file__))
FASCE = list(range(1100, 2000, 100))  # = valori dello slider in index.html
LARGHEZZA = 100                       # entrambi i giocatori in [E-100, E+100)

PLY_MAX = 24        # oltre la 12a mossa non e' piu' apertura
MIN_POSIZIONE = 40  # partite che devono raggiungere la posizione per fidarsi
MIN_QUOTA = 0.02    # mosse sotto il 2% non entrano (rumore, mouse slip)
MAX_MOSSE = 8

URL = "https://database.lichess.org/standard/lichess_db_standard_rated_{mese}.pgn.zst"

RE_TAG = re.compile(r'^\[(\w+) "(.*)"\]')
RE_GRAFFE = re.compile(r"\{[^}]*\}")
RE_NUMERO = re.compile(r"^\d+\.(\.\.)?$")
RISULTATI = {"1-0", "0-1", "1/2-1/2", "*"}


def chiave(fen):
    """Primi tre campi della FEN, come js/aperture.js: l'en passant e' escluso
    perche' librerie diverse lo scrivono in modo diverso."""
    return " ".join(fen.split(" ")[:3])


def ritmo_ok(tc):
    """Blitz o piu' lento, con la stima di durata di Lichess: base + 40*incremento."""
    if tc in ("-", "", None):
        return False  # corrispondenza
    try:
        base, inc = tc.split("+")
        return int(base) + 40 * int(inc) >= 180
    except ValueError:
        return False


def fasce_di(we, be):
    return [e for e in FASCE
            if e - LARGHEZZA <= we < e + LARGHEZZA and e - LARGHEZZA <= be < e + LARGHEZZA]


# Esito per chi ha mosso: indice in [conteggio, vinte, patte, perse, semimosse]
ESITI = {"1-0": (1, 3), "0-1": (3, 1), "1/2-1/2": (2, 2)}  # (se muove il bianco, se muove il nero)


def lunghezza(testo):
    """Semimosse totali della partita (non solo le prime PLY_MAX)."""
    n = 0
    for t in RE_GRAFFE.sub(" ", testo).split():
        if not (RE_NUMERO.match(t) or t in RISULTATI):
            n += 1
    return n


def mosse_san(testo):
    testo = RE_GRAFFE.sub(" ", testo)
    out = []
    for t in testo.split():
        if RE_NUMERO.match(t) or t in RISULTATI:
            continue
        if t[0].isdigit():          # "12." attaccato, o "12...Nf6"
            t = re.sub(r"^\d+\.+", "", t)
            if not t:
                continue
        out.append(t.rstrip("?!"))
        if len(out) >= PLY_MAX:
            break
    return out


class Cache:
    """(fen, san) -> (fen dopo, uci). Le aperture si ripetono in milioni di
    partite: senza cache python-chess rifarebbe le stesse mosse ogni volta."""

    def __init__(self):
        self.d = {}

    def mossa(self, fen, san):
        k = (fen, san)
        r = self.d.get(k)
        if r is None:
            b = chess.Board(fen)
            m = b.parse_san(san)
            uci = m.uci()
            b.push(m)
            r = (b.fen(en_passant="fen"), uci)
            if len(self.d) > 3_000_000:
                self.d.clear()
            self.d[k] = r
        return r


def partite(flusso):
    """Genera (tag, movetext) leggendo il PGN riga per riga."""
    tag = {}
    for riga in flusso:
        riga = riga.strip()
        if not riga:
            continue
        if riga.startswith("["):
            m = RE_TAG.match(riga)
            if m:
                tag[m.group(1)] = m.group(2)
        else:
            yield tag, riga
            tag = {}


def contesto_ssl():
    """Verifica del certificato sempre attiva, ma senza il controllo "strict"
    che Python 3.13 accende di default. Dietro un proxy aziendale che ispeziona
    il TLS, la CA del proxy spesso non ha l'Authority Key Identifier e Python
    3.13 la rifiuta ("Missing Authority Key Identifier") anche se e' nel
    certificate store di Windows. I certificati restano verificati: si toglie
    solo il controllo di conformita' piu' severo."""
    ctx = ssl.create_default_context()
    ctx.verify_flags &= ~getattr(ssl, "VERIFY_X509_STRICT", 0)
    return ctx


class Ripresa(io.RawIOBase):
    """Flusso HTTP che si riaggancia da solo se la connessione cade.

    Su uno streaming di molti minuti un reset (proxy, rete, server) prima o poi
    arriva. Si riapre con un header Range dal byte esatto in cui si era rimasti:
    il decompressore zstd non se ne accorge, perche' riceve gli stessi byte
    nello stesso ordine."""

    TENTATIVI = 8

    def __init__(self, url):
        self.url = url
        self.pos = 0
        self.totale = None
        self.r = None
        self._apri()

    def _apri(self):
        h = {"User-Agent": "chess_ai libro.py"}
        if self.pos:
            h["Range"] = f"bytes={self.pos}-"
        self.r = urllib.request.urlopen(urllib.request.Request(self.url, headers=h),
                                        context=contesto_ssl(), timeout=60)
        if self.pos and self.r.status != 206:
            raise OSError("il server non accetta la ripresa (Range): rilancia da capo")
        if self.totale is None and self.r.headers.get("Content-Length"):
            self.totale = int(self.r.headers["Content-Length"])

    def readable(self):
        return True

    def readinto(self, b):
        for t in range(self.TENTATIVI):
            try:
                n = self.r.readinto(b)
                if n == 0 and len(b) and self.totale and self.pos < self.totale:
                    # chiusura "pulita" prima della fine: e' comunque una caduta
                    raise ConnectionResetError("flusso chiuso prima della fine")
                self.pos += n
                return n
            except (OSError, http.client.HTTPException) as e:
                attesa = min(60, 2 ** t)
                print(f"  connessione caduta a {self.pos // 2**20} MB ({e}); riprovo fra {attesa}s", flush=True)
                time.sleep(attesa)
                try:
                    self.r.close()
                except Exception:
                    pass
                try:
                    self._apri()
                except (OSError, http.client.HTTPException) as e2:
                    print(f"  riapertura fallita: {e2}", flush=True)
        raise OSError(f"connessione persa {self.TENTATIVI} volte di fila, mi fermo")


def apri(args):
    if args.file:
        f = open(args.file, "rb")
        nome = args.file
    else:
        nome = URL.format(mese=args.mese)
        print("Leggo in streaming", nome)
        f = io.BufferedReader(Ripresa(nome), buffer_size=1 << 20)
    if nome.endswith(".zst"):
        f = zstandard.ZstdDecompressor().stream_reader(f)
    return io.TextIOWrapper(f, encoding="utf-8", errors="replace")


def sfoltisci(conti):
    """Durante la lettura: butta le posizioni viste una volta sola oltre la 8a
    semimossa. Sono quasi tutte partite uscite dalla teoria, e tenerle tutte
    riempirebbe la memoria. Una posizione che arrivera' a MIN_POSIZIONE perde
    al massimo un'occorrenza, cioe' niente."""
    for pos in conti.values():
        via = [k for k, (ply, c) in pos.items() if ply >= 8 and sum(v[0] for v in c.values()) == 1]
        for k in via:
            del pos[k]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--mese", default="2026-09", help="mese del database Lichess, AAAA-MM")
    ap.add_argument("--file", help="file PGN locale (.pgn o .pgn.zst) invece dello streaming")
    ap.add_argument("--partite", type=int, default=60000, help="partite per fascia (predefinito 60000)")
    ap.add_argument("--uscita", default=os.path.join(QUI, "data"))
    args = ap.parse_args()

    # fascia -> chiave posizione -> [ply minimo, {uci: [conteggio, vinte, patte, perse, semimosse]}]
    # vinte/patte/perse sono dal punto di vista di chi ha giocato la mossa;
    # semimosse e' la somma delle lunghezze delle partite, per la media.
    # Servono agli stili: un aggressivo sceglie linee con poche patte e
    # partite corte, un conservatore il contrario.
    conti = {e: defaultdict(lambda: [PLY_MAX, {}]) for e in FASCE}
    usate = Counter()
    lette = 0
    cache = Cache()
    t0 = time.time()
    inizio = chess.Board().fen(en_passant="fen")

    try:
        for tag, testo in partite(apri(args)):
            lette += 1
            if lette % 200000 == 0:
                stato = " ".join(f"{e}:{usate[e] // 1000}k" for e in FASCE)
                print(f"  {lette // 1000}k lette, {time.time() - t0:.0f}s  {stato}", flush=True)
                sfoltisci(conti)
            if "Rated" not in tag.get("Event", "") or tag.get("Variant", "Standard") != "Standard":
                continue
            if not ritmo_ok(tag.get("TimeControl")):
                continue
            try:
                we, be = int(tag["WhiteElo"]), int(tag["BlackElo"])
            except (KeyError, ValueError):
                continue
            fasce = [e for e in fasce_di(we, be) if usate[e] < args.partite]
            if not fasce:
                if all(usate[e] >= args.partite for e in FASCE):
                    break
                continue

            fine = testo.rsplit(None, 1)[-1] if testo.strip() else ""
            esito = ESITI.get(tag.get("Result")) or ESITI.get(fine)  # header o fondo del movetext
            durata = lunghezza(testo)
            fen = inizio
            try:
                for ply, san in enumerate(mosse_san(testo)):
                    dopo, uci = cache.mossa(fen, san)
                    k = chiave(fen)
                    for e in fasce:
                        voce = conti[e][k]
                        voce[0] = min(voce[0], ply)
                        st = voce[1].get(uci)
                        if st is None:
                            st = voce[1][uci] = [0, 0, 0, 0, 0]
                        st[0] += 1
                        st[4] += durata
                        if esito:
                            st[esito[ply % 2]] += 1
                    fen = dopo
            except ValueError:
                pass  # mossa illeggibile: teniamo quello che c'era prima
            for e in fasce:
                usate[e] += 1
    except (OSError, zstandard.ZstdError) as e:
        # anche se lo streaming muore, quello che e' stato contato si salva
        print(f"\nLettura interrotta: {e}\nScrivo il libro con le partite raccolte finora.")
    except KeyboardInterrupt:
        print("\nInterrotto a mano: scrivo il libro con le partite raccolte finora.")

    os.makedirs(args.uscita, exist_ok=True)
    print(f"\n{lette} partite lette in {time.time() - t0:.0f}s")
    for e in FASCE:
        pos = {}
        for k, (ply, c) in conti[e].items():
            n = sum(v[0] for v in c.values())
            if n < MIN_POSIZIONE:
                continue
            ordinate = sorted(c.items(), key=lambda kv: -kv[1][0])[:MAX_MOSSE]
            tenute = [(u, v) for u, v in ordinate if v[0] / n >= MIN_QUOTA]
            if not tenute:
                continue
            riga = [n]
            for u, (x, vi, pa, pe, sm) in tenute:
                riga += [u, x, vi, pa, pe, round(sm / x)]
            pos[k] = riga
        dati = {
            "meta": {
                "fonte": args.file or URL.format(mese=args.mese),
                "licenza": "CC0 (database.lichess.org)",
                "fascia": [e - LARGHEZZA, e + LARGHEZZA],
                "partite": usate[e],
                "min_posizione": MIN_POSIZIONE,
                "ply_max": PLY_MAX,
                "formato": 2,
                "campi": ["uci", "partite", "vinte", "patte", "perse", "semimosse_medie"],
            },
            # chiave -> [partite che raggiungono la posizione, poi per ogni mossa i 6 "campi"]
            "pos": pos,
        }
        nome = os.path.join(args.uscita, f"libro-{e}.json")
        with open(nome, "w", encoding="utf-8") as f:
            json.dump(dati, f, separators=(",", ":"))
        kb = os.path.getsize(nome) // 1024
        avviso = "   <-- poche partite, alza --partite o cambia mese" if usate[e] < args.partite else ""
        print(f"  {nome}: {usate[e]} partite, {len(pos)} posizioni, {kb} KB{avviso}")


if __name__ == "__main__":
    main()
