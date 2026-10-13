# Webhooks and signed attestations

Vérif Entreprise FR is paid per call with [x402](https://www.x402.org) (USDC on Base or Solana). This page shows how to consume the two trust features from your own code: **BODACC monitoring webhooks** and **signed verification attestations**.

Base URL: `https://api-production-24833.up.railway.app`

## 1. Monitor a company or a portfolio

| Call | Price | What you get |
| --- | --- | --- |
| `POST /v1/surveillance` `{"siren":"552032534","webhook":"https://your-agent.example/alerts"}` | $0.10, 90 days | `id`, `jeton`, `suivi`, `expireLe` |
| `POST /v1/surveillance/lot` `{"sirens":["552032534","508927373"],"webhook":"…"}` | up to $0.08 × n (`upto`), only companies found are charged | one `id` / `jeton` / `suivi` per company |
| MCP tool `surveiller_entreprise` | $0.10 | same as the single call |

BODACC (the French official bulletin of insolvency proceedings and deregistrations) is checked every 3 hours. Each **new** notice published after the start creates an alert. Notices already published are not alerted: call `/v1/verify` for the current state.

- **Polling (free):** `GET` the returned `suivi` URL. It already contains `?jeton=…`. Alerts are listed newest first.
- **Webhook:** each alert is POSTed as JSON to your HTTPS URL, with up to 5 attempts.
- **Test delivery:** `POST /v1/surveillance/{id}/test?jeton=…` sends a signed sample alert (`"type": "test"`).

Webhook URLs must be public HTTPS on port 443, given as a domain name (not an IP address). Private, local and reserved addresses are refused when you register and again at every delivery.

### Alert body

```json
{
  "type": "procedure_collective",
  "siren": "508927373",
  "surveillanceId": "3f2a9c1b7d4e5f60718293a4",
  "annonce": {
    "id": "A20260123456",
    "dateParution": "2026-10-12",
    "nature": "Jugement d'ouverture de liquidation judiciaire",
    "dateJugement": "2026-10-08",
    "tribunal": "Tribunal des activités économiques de Lyon",
    "url": "https://www.bodacc.fr/…"
  },
  "detail": "/v1/verify?siren=508927373",
  "envoyeeLe": "2026-10-12T09:00:00.000Z"
}
```

`type` is `procedure_collective`, `radiation` (deregistration) or `test`.

### Verify the webhook signature

Header: `X-Verif-Signature: sha256=<hex>`, the HMAC-SHA256 of the **raw request body** keyed with the surveillance `jeton`. Compute it on the raw bytes, before any JSON parsing.

Node.js:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function signatureValide(corpsBrut, entete, jeton) {
  const attendu = "sha256=" + createHmac("sha256", jeton).update(corpsBrut).digest("hex");
  const a = Buffer.from(attendu);
  const b = Buffer.from(entete ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}
```

Python:

```python
import hmac, hashlib

def signature_valide(corps_brut: bytes, entete: str, jeton: str) -> bool:
    attendu = "sha256=" + hmac.new(jeton.encode(), corps_brut, hashlib.sha256).hexdigest()
    return hmac.compare_digest(attendu, entete or "")
```

## 2. Signed attestations

Every paid `/v1/verify` response, and every `verifier_entreprise` MCP result, contains an `attestation` field: an **Ed25519 signature of the response**. Store the response as proof that you checked the company at that date (KYB / supplier due diligence).

- Signed message: the response **without** the `attestation` field, serialized as canonical JSON (object keys sorted recursively, no spaces, `undefined` values omitted).
- Public key: `GET /.well-known/jwks.json`, a JWK of type `OKP` / `Ed25519`; match it with `attestation.kid`.

Node.js:

```js
import { createPublicKey, verify } from "node:crypto";

const canonique = (v) =>
  v === null || typeof v !== "object"
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? `[${v.map(canonique).join(",")}]`
      : `{${Object.keys(v)
          .filter((k) => v[k] !== undefined)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonique(v[k])}`)
          .join(",")}}`;

export async function attestationValide(reponse) {
  const { keys } = await (
    await fetch("https://api-production-24833.up.railway.app/.well-known/jwks.json")
  ).json();
  const jwk = keys.find((k) => k.kid === reponse.attestation?.kid);
  if (!jwk) return false;
  const { attestation, ...signe } = reponse;
  const cle = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwk.x }, format: "jwk" });
  return verify(null, Buffer.from(canonique(signe)), cle, Buffer.from(attestation.signature, "base64url"));
}
```

Python (with `cryptography`):

```python
import base64, json, urllib.request
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

def b64url(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def attestation_valide(reponse: dict) -> bool:
    jwks = json.load(urllib.request.urlopen("https://api-production-24833.up.railway.app/.well-known/jwks.json"))
    att = reponse.get("attestation") or {}
    jwk = next((k for k in jwks["keys"] if k["kid"] == att.get("kid")), None)
    if not jwk:
        return False
    signe = {k: v for k, v in reponse.items() if k != "attestation"}
    message = json.dumps(signe, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    try:
        Ed25519PublicKey.from_public_bytes(b64url(jwk["x"])).verify(b64url(att["signature"]), message)
        return True
    except Exception:
        return False
```

Python's `json.dumps(..., sort_keys=True, separators=(",", ":"), ensure_ascii=False)` produces the same canonical form, as long as the response contains no floating-point numbers written differently by the two languages. The only numbers in a response are integers and simple decimals such as `ancienneteAnnees`.
