# curl examples (no wallet)

```bash
./apercu.sh 552032534     # free preview: name, status, number of alerts (10 per day)
./lire-402.sh 552032534   # shows what the paid /v1/verify costs, without paying
```

A paid route answers `402 Payment Required` with a `PAYMENT-REQUIRED` header (base64 JSON). Signing and retrying with a `PAYMENT-SIGNATURE` header needs an x402 client: see `../node` or `../python`.
