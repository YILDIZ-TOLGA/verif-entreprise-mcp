"""Verify a French company (KYB) by SIREN. Cost: $0.01 USDC, charged only if the call succeeds.

Usage: X402_PRIVATE_KEY=0x... python verify.py 552032534
"""

import json
import sys

from client import BASE_URL, paying_session

siren = sys.argv[1] if len(sys.argv) > 1 else "552032534"
if not (siren.isdigit() and len(siren) == 9):
    raise SystemExit("SIREN = 9 digits")

session = paying_session(max_usd=0.01)
res = session.get(f"{BASE_URL}/v1/verify", params={"siren": siren}, timeout=60)
print("HTTP", res.status_code)
try:
    print(json.dumps(res.json(), indent=2, ensure_ascii=False))
except ValueError:
    print(res.text)
