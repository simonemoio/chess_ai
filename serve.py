#!/usr/bin/env python3
"""
Server locale per provare il sito prima di pubblicarlo.

    python serve.py

Poi apri http://localhost:8000

Serve perche' aprire index.html dal disco NON funziona: i browser bloccano
WebAssembly, i moduli ES e i Worker sotto file://. Questo e' solo per lo
sviluppo; una volta su GitHub Pages ci pensa GitHub.
"""
import http.server
import os
import socketserver
import webbrowser

PORTA = int(os.environ.get("PORTA", 8000))


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".json": "application/json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("127.0.0.1", PORTA), H) as s:
    url = f"http://localhost:{PORTA}"
    print(f"  {url}   (Ctrl-C per fermare)")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    s.serve_forever()
