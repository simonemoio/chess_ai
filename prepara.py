#!/usr/bin/env python3
"""
Prepara il sito: sistema i file e scarica le dipendenze.

    python prepara.py

Fa tre cose:
  1. sposta in js/ e data/ i file del progetto scaricati alla rinfusa;
  2. scarica le dipendenze in vendor/;
  3. verifica che non manchi niente, e dice cosa manca se manca.

Si puo' rilanciare quante volte si vuole. I file finiscono nel repository
perche' GitHub Pages serve solo quello che c'e' dentro: sono circa 7 MB, ben
sotto i limiti.

Cosa scarica:
  vendor/chess.js                       regole del gioco     (BSD-2-Clause)
  vendor/pezzi.svg                      pezzi Cburnett       (CC BY-SA 3.0)
  vendor/stockfish-18-lite-single.js    motore, caricatore   (GPL-3.0)
  vendor/stockfish-18-lite-single.wasm  motore, binario      (GPL-3.0)

La build "lite-single" e' monothread di proposito: non richiede
SharedArrayBuffer, quindi non servono gli header COOP/COEP che l'hosting
statico non lascia impostare.
"""
import io
import json
import os
import shutil
import sys
import tarfile
import urllib.request

QUI = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(QUI, "vendor")
DEV = os.path.join(QUI, ".dev")

SF_VERSIONE = "18.0.8"
CHESS_VERSIONE = "1.4.0"
CMB_VERSIONE = "8.15.3"

# Dove va ogni file del progetto. Scaricandoli uno per uno finiscono tutti
# nella stessa cartella: qui li rimettiamo al loro posto.
POSTO = {
    "app.js": "js", "analisi.js": "js", "motore.js": "js",
    "avversario.js": "js", "strutture.js": "js", "aperture.js": "js",
    "aperture.json": "data",
}

ATTESI = [
    "index.html",
    "js/app.js", "js/analisi.js", "js/motore.js",
    "js/avversario.js", "js/strutture.js", "js/aperture.js",
    "data/aperture.json",
    "vendor/chess.js",
    "vendor/pezzi.svg",
    "vendor/stockfish-18-lite-single.js",
    "vendor/stockfish-18-lite-single.wasm",
]


def sistema():
    """Sposta in js/ e data/ i file scaricati alla rinfusa nella cartella."""
    mossi = []
    for nome, cartella in POSTO.items():
        sciolto = os.path.join(QUI, nome)
        if not os.path.isfile(sciolto):
            continue
        dest_dir = os.path.join(QUI, cartella)
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, nome)
        if os.path.isfile(dest) and os.path.getmtime(dest) >= os.path.getmtime(sciolto):
            os.remove(sciolto)          # gia' aggiornato al suo posto
            continue
        shutil.move(sciolto, dest)
        mossi.append(f"{nome} -> {cartella}/")
    if mossi:
        print("Sistemo i file:")
        for m in mossi:
            print("  " + m)
        print()
    return mossi


def verifica():
    """Dice cosa manca ancora, con precisione."""
    mancanti = [f for f in ATTESI if not os.path.isfile(os.path.join(QUI, f))]
    if not mancanti:
        print("\nTutto a posto. Avvia il sito con:\n")
        print("    python serve.py\n")
        return True
    print("\nMancano ancora:")
    for f in mancanti:
        print("  " + f)
    if any(f.startswith("vendor/") for f in mancanti):
        print("\nLa cartella vendor/ si scarica da sola: rilancia questo script.")
    else:
        print("\nQuesti vanno scaricati dalla conversazione e messi in questa cartella;")
        print("poi rilancia questo script, che li sposta al loro posto da solo.")
    return False


def scarica_npm(pacchetto, versione):
    url = f"https://registry.npmjs.org/{pacchetto}"
    print(f"  cerco {pacchetto}@{versione}...")
    with urllib.request.urlopen(url, timeout=60) as r:
        meta = json.load(r)
    if versione not in meta["versions"]:
        raise SystemExit(f"versione {versione} non trovata per {pacchetto}")
    tgz = meta["versions"][versione]["dist"]["tarball"]
    print(f"  scarico {tgz.split('/')[-1]}")
    with urllib.request.urlopen(tgz, timeout=300) as r:
        dati = r.read()
    return tarfile.open(fileobj=io.BytesIO(dati), mode="r:gz")


def estrai(tar, dentro, fuori):
    m = tar.getmember(dentro)
    m.name = os.path.basename(dentro)
    tar.extract(m, fuori)
    p = os.path.join(fuori, m.name)
    print(f"  -> {os.path.relpath(p, QUI)}  ({os.path.getsize(p) // 1024} KB)")


def main():
    sistema()
    os.makedirs(VENDOR, exist_ok=True)

    print("chess.js")
    t = scarica_npm("chess.js", CHESS_VERSIONE)
    estrai(t, "package/dist/esm/chess.js", VENDOR)

    print("pezzi (Cburnett, CC BY-SA 3.0)")
    t = scarica_npm("cm-chessboard", CMB_VERSIONE)
    m = t.getmember("package/assets/pieces/standard.svg")
    m.name = "pezzi.svg"
    t.extract(m, VENDOR)
    p = os.path.join(VENDOR, "pezzi.svg")
    print(f"  -> vendor/pezzi.svg  ({os.path.getsize(p) // 1024} KB)")

    print("stockfish")
    t = scarica_npm("stockfish", SF_VERSIONE)
    for f in ("stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"):
        estrai(t, f"package/bin/{f}", VENDOR)

    # copia completa per la prova in node (non va nel repository)
    if "--con-dev" in sys.argv:
        print(".dev (per prova_logica.mjs)")
        shutil.rmtree(DEV, ignore_errors=True)
        os.makedirs(DEV, exist_ok=True)
        t = scarica_npm("stockfish", SF_VERSIONE)
        t.extractall(DEV, filter="data")
        print(f"  -> .dev/package/")

    verifica()


if __name__ == "__main__":
    main()
