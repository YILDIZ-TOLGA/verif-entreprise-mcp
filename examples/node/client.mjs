// Shared helper: a fetch() that pays x402 challenges in USDC on Base, with a hard spending cap.
//
// Safety:
//  - X402_PRIVATE_KEY comes from the environment, never from source code. Use a DEDICATED wallet
//    funded with a few cents of USDC on Base, not your main wallet. No ETH needed for gas.
//  - The hook below runs BEFORE anything is signed and aborts if the price, network or asset
//    is not what you expect.
import { x402Client } from "@x402/core/client";
import { toClientEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { UptoEvmScheme } from "@x402/evm/upto/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export const BASE_URL = process.env.VERIF_ENTREPRISE_URL ?? "https://api-production-24833.up.railway.app";
const NETWORK = "eip155:8453"; // Base mainnet
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/** @param {{ maxUsd: number, upto?: boolean }} opts maxUsd: highest amount accepted per request. */
export function payingFetch({ maxUsd, upto = false }) {
  const key = process.env.X402_PRIVATE_KEY;
  if (!key) throw new Error("Set X402_PRIVATE_KEY (private key of a dedicated wallet holding USDC on Base).");
  const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);

  const client = new x402Client();
  if (upto) {
    // "upto" (Permit2) needs a signer that can read the chain (allowance, nonce).
    const chain = createPublicClient({ chain: base, transport: http() });
    client.register(NETWORK, new UptoEvmScheme(toClientEvmSigner(account, chain)));
  } else {
    registerExactEvmScheme(client, { signer: account, networks: [NETWORK] });
  }

  client.onBeforePaymentCreation(async ({ selectedRequirements: req }) => {
    const usd = Number(req.amount) / 1e6; // USDC has 6 decimals
    if (req.network !== NETWORK) return { abort: true, reason: `unexpected network ${req.network}` };
    if (req.asset.toLowerCase() !== USDC_BASE.toLowerCase()) return { abort: true, reason: `unexpected asset ${req.asset}` };
    if (!(usd <= maxUsd)) return { abort: true, reason: `price $${usd} above cap $${maxUsd}` };
    console.error(`[x402] signing a payment of up to $${usd} (cap $${maxUsd}) to ${req.payTo}`);
  });

  return wrapFetchWithPayment(fetch, client);
}

export async function show(res) {
  const body = await res.text();
  console.log(`HTTP ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log(body);
  }
}
