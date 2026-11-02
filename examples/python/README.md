# Python examples

The official [`x402` package on PyPI](https://pypi.org/project/x402/) (v2.x, Python >= 3.10) exists and supports `requests` and `httpx` clients plus EVM signers. These examples use its sync `requests` flavour.

```bash
pip install -r requirements.txt
python apercu.py 552032534                           # free, no wallet
export X402_PRIVATE_KEY=0x...                        # DEDICATED wallet, a few cents of USDC on Base
python verify.py 552032534                           # $0.01
SURVEILLANCE_JETON=... python webhook_server.py      # webhook receiver with HMAC check
```

`client.py` registers the `exact` scheme on Base and an `on_before_payment_creation` hook that refuses to sign if the network, the asset (USDC) or the price (cap in `max_usd`) is not what you expect.

Limits, stated honestly:

- Only the `exact` scheme is shown. The batch routes (`/v1/verify/batch`, `/v1/surveillance/lot`) prefer the `upto` (Permit2) scheme; the Node examples show it. The server also accepts `exact` for batches (all or nothing, `$0.008 x n`).
- Single surveillance (`POST /v1/surveillance`, $0.10) works the same way as `verify.py` with `session.post(..., json={"siren": ..., "webhook": ...})`; remember to raise `max_usd` to `0.10`.
- `verify.py` was syntax-checked but not executed against the paid route (no mainnet transaction was made while writing these examples).
