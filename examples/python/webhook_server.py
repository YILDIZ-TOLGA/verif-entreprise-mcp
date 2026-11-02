"""Minimal webhook receiver (standard library only) verifying X-Verif-Signature:
sha256=<hex of HMAC-SHA256(raw body, jeton)>. Put it behind HTTPS on a public domain name.

Usage: SURVEILLANCE_JETON=<jeton> PORT=8080 python webhook_server.py
"""

import hashlib
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

JETON = os.environ.get("SURVEILLANCE_JETON")
if not JETON:
    raise SystemExit("Set SURVEILLANCE_JETON (the `jeton` returned by POST /v1/surveillance).")


def signature_valide(corps_brut: bytes, entete: str, jeton: str) -> bool:
    attendu = "sha256=" + hmac.new(jeton.encode(), corps_brut, hashlib.sha256).hexdigest()
    return hmac.compare_digest(attendu, entete or "")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 1_000_000:
            return self.send_response(413), self.end_headers()
        raw = self.rfile.read(length)  # verify on the RAW bytes, before json.loads
        if not signature_valide(raw, self.headers.get("X-Verif-Signature", ""), JETON):
            return self.send_response(401), self.end_headers()
        alert = json.loads(raw)
        print(f"[{alert.get('type')}] SIREN {alert.get('siren')}", (alert.get("annonce") or {}).get("nature", ""))
        self.send_response(204)
        self.end_headers()


HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Handler).serve_forever()
