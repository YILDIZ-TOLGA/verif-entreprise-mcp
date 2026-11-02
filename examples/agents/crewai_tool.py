"""CrewAI tools using the `@tool` decorator from `crewai.tools`.

NOT executed by the author: CrewAI was not installed when writing this example, only
syntax-checked. The payment part (../python/client.py) is the same code as the plain Python example.

Usage in a crew: Agent(role=..., tools=[company_preview, verify_company], ...)
"""

import sys
import urllib.parse
import urllib.request
from pathlib import Path

from crewai.tools import tool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))
from client import BASE_URL, paying_session  # noqa: E402

_session = None


@tool("company_preview")
def company_preview(siren: str) -> str:
    """Free preview of a French company by SIREN (9 digits): name, status, city, number of alerts."""
    url = f"{BASE_URL}/v1/apercu?" + urllib.parse.urlencode({"siren": siren})
    with urllib.request.urlopen(url, timeout=30) as res:
        return res.read().decode()


@tool("verify_company")
def verify_company(siren: str) -> str:
    """Full KYB report of a French company by SIREN (9 digits). Costs $0.01 USDC per call, paid via x402."""
    global _session
    if not (siren.isdigit() and len(siren) == 9):
        return "SIREN must be 9 digits"
    if _session is None:
        _session = paying_session(max_usd=0.01)  # reads X402_PRIVATE_KEY, refuses to sign above $0.01
    res = _session.get(f"{BASE_URL}/v1/verify", params={"siren": siren}, timeout=60)
    return res.text if res.ok else f"Error HTTP {res.status_code}: {res.text[:500]}"
