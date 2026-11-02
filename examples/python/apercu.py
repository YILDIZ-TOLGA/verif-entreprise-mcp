"""Free preview: no wallet, no payment, no x402 package needed (10 calls per day).

Usage: python apercu.py 552032534
"""

import json
import sys
import urllib.parse
import urllib.request

siren = sys.argv[1] if len(sys.argv) > 1 else "552032534"
url = "https://api-production-24833.up.railway.app/v1/apercu?" + urllib.parse.urlencode({"siren": siren})
with urllib.request.urlopen(url, timeout=30) as res:
    print(json.dumps(json.load(res), indent=2, ensure_ascii=False))
