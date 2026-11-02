#!/usr/bin/env sh
# Free preview: no wallet, no payment. 10 calls per day per IP.
# Usage: ./apercu.sh 552032534
set -eu
SIREN="${1:-552032534}"
curl -sS "https://api-production-24833.up.railway.app/v1/apercu?siren=${SIREN}"
echo
