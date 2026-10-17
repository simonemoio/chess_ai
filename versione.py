#!/usr/bin/env python3
"""
Aggiorna il numero di versione dei file in index.html.

    python versione.py

Ogni file del sito viene caricato come "js/app.js?v=NUMERO": cambiando il
numero a ogni pubblicazione, il browser e' costretto a riscaricarli tutti
insieme invece di mescolare file vecchi in cache con quelli nuovi (e' quello
che faceva fallire l'avvio dopo un aggiornamento, soprattutto sui telefoni).

Non serve lanciarlo a mano se e' installato il hook di git:

    python versione.py --installa

Da li' in poi parte da solo a ogni commit.
"""
import datetime
import os
import re
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(QUI, "index.html")

HOOK = """#!/bin/sh
# Installato da versione.py: aggiorna la versione dei file a ogni commit.
cd "$(git rev-parse --show-toplevel)" || exit 0
if command -v python >/dev/null 2>&1; then python versione.py
elif command -v py >/dev/null 2>&1; then py versione.py
elif command -v python3 >/dev/null 2>&1; then python3 versione.py
else echo "versione.py: Python non trovato, versione non aggiornata"; exit 0
fi
git add index.html
"""


def aggiorna():
    v = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    with open(INDEX, encoding="utf-8") as f:
        testo = f.read()
    nuovo, n = re.subn(r"\?v=\d+", "?v=" + v, testo)
    nuovo, m = re.subn(r'(<meta name="versione" content=")\d+(")', r"\g<1>" + v + r"\g<2>", nuovo)
    if n == 0:
        sys.exit("versione.py: in index.html non ho trovato nessun ?v=… da aggiornare")
    with open(INDEX, "w", encoding="utf-8", newline="") as f:
        f.write(nuovo)
    print(f"versione {v}: aggiornati {n + m} riferimenti in index.html")


def installa():
    hooks = os.path.join(QUI, ".git", "hooks")
    if not os.path.isdir(hooks):
        sys.exit("versione.py: non trovo .git/hooks, lancialo dalla cartella del repository")
    dest = os.path.join(hooks, "pre-commit")
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(HOOK)
    try:
        os.chmod(dest, 0o755)
    except OSError:
        pass
    print("hook installato: da ora la versione si aggiorna da sola a ogni commit")


if __name__ == "__main__":
    if "--installa" in sys.argv:
        installa()
    aggiorna()
