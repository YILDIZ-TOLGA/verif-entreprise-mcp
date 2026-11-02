"""Shared helper: a requests.Session that pays x402 challenges in USDC on Base, with a hard cap.

Uses the official `x402` package (PyPI, maintained by the x402 foundation: https://pypi.org/project/x402/).

Safety:
  - X402_PRIVATE_KEY comes from the environment, never from source code. Use a DEDICATED wallet
    holding a few cents of USDC on Base, not your main wallet. No ETH needed for gas.
  - The hook runs BEFORE anything is signed and aborts if network, asset or price is unexpected.
"""

import os

import requests
from eth_account import Account
from x402 import AbortResult, x402ClientSync
from x402.http.clients import wrapRequestsWithPayment
from x402.mechanisms.evm.exact import register_exact_evm_client
from x402.mechanisms.evm.signers import EthAccountSigner

BASE_URL = os.environ.get("VERIF_ENTREPRISE_URL", "https://api-production-24833.up.railway.app")
NETWORK = "eip155:8453"  # Base mainnet
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"


def paying_session(max_usd: float) -> requests.Session:
    key = os.environ.get("X402_PRIVATE_KEY")
    if not key:
        raise SystemExit("Set X402_PRIVATE_KEY (private key of a dedicated wallet holding USDC on Base).")
    account = Account.from_key(key)

    client = x402ClientSync()
    register_exact_evm_client(client, EthAccountSigner(account), networks=NETWORK)

    def cap(ctx):
        req = ctx.selected_requirements
        usd = int(req.amount) / 1e6  # USDC has 6 decimals
        if req.network != NETWORK:
            return AbortResult(reason=f"unexpected network {req.network}")
        if req.asset.lower() != USDC_BASE.lower():
            return AbortResult(reason=f"unexpected asset {req.asset}")
        if usd > max_usd:
            return AbortResult(reason=f"price ${usd} above cap ${max_usd}")
        print(f"[x402] signing a payment of ${usd} (cap ${max_usd}) to {req.pay_to}")
        return None

    client.on_before_payment_creation(cap)
    return wrapRequestsWithPayment(requests.Session(), client)
