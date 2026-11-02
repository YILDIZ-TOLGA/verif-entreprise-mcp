#!/usr/bin/env sh
# Reads the x402 payment request of a paid route WITHOUT paying: you only get an HTTP 402
# and a base64 JSON PAYMENT-REQUIRED header (price, network, asset, payTo).
# Requires: curl and node (to decode the header).
# Usage: ./lire-402.sh [siren]
set -eu
SIREN="${1:-552032534}"
URL="https://api-production-24833.up.railway.app/v1/verify?siren=${SIREN}"

HEADERS="$(curl -sS -D - -o /dev/null "$URL")"
echo "$HEADERS" | head -n 1
RAW="$(echo "$HEADERS" | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r')"
[ -n "$RAW" ] || { echo "No PAYMENT-REQUIRED header" >&2; exit 1; }

echo "$RAW" | node -e '
const j = JSON.parse(Buffer.from(require("fs").readFileSync(0, "utf8").trim(), "base64").toString());
for (const a of j.accepts) {
  console.log("scheme=" + a.scheme + " network=" + a.network + " asset=" + a.asset);
  console.log("price=" + Number(a.amount) / 1e6 + " USDC  payTo=" + a.payTo);
}'
