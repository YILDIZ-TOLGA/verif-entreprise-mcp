#!/usr/bin/env node
/**
 * verif-entreprise-mcp — local (stdio) MCP server for Vérif Entreprise FR.
 *
 * Bridges any MCP client (Claude Desktop, Cursor, VS Code…) to the remote Vérif Entreprise FR
 * MCP server and pays each paid tool call with x402 (USDC on Base) from YOUR wallet.
 *
 *   X402_PRIVATE_KEY           hex private key of a wallet holding USDC on Base (optional:
 *                              without it, only the free tool apercu_entreprise works)
 *   VERIF_ENTREPRISE_MAX_USD   maximum price accepted per call, default 0.01
 *   VERIF_ENTREPRISE_URL       remote MCP endpoint, default the production server
 *   VERIF_ENTREPRISE_NETWORK   CAIP-2 network, default eip155:8453 (Base mainnet)
 *
 * The key never leaves your machine: it only signs an EIP-3009 USDC authorization for the
 * exact amount requested, after checking it against VERIF_ENTREPRISE_MAX_USD. No gas needed.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { x402MCPClient } from "@x402/mcp";
import { privateKeyToAccount } from "viem/accounts";

const VERSION = "1.0.0";
const ENDPOINT =
  process.env.VERIF_ENTREPRISE_URL ?? "https://api-production-24833.up.railway.app/mcp";
const NETWORK = process.env.VERIF_ENTREPRISE_NETWORK ?? "eip155:8453";
const MAX_USD = Number(process.env.VERIF_ENTREPRISE_MAX_USD ?? "0.01");
/** USDC contracts by network (6 decimals). */
const USDC = {
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};
const FREE_TOOL = "apercu_entreprise";

const log = (msg) => process.stderr.write(`[verif-entreprise-mcp] ${msg}\n`);

if (!Number.isFinite(MAX_USD) || MAX_USD <= 0 || MAX_USD > 1) {
  log("VERIF_ENTREPRISE_MAX_USD must be a number between 0 and 1 (USD per call).");
  process.exit(1);
}

function loadAccount() {
  const raw = process.env.X402_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    log("X402_PRIVATE_KEY is not a 32-byte hex private key: paid tools are disabled.");
    return null;
  }
  return privateKeyToAccount(key);
}

const account = loadAccount();
let remote = null;

/** Connects (or reconnects) to the remote server, paying through the local wallet if any. */
async function getRemote() {
  if (remote) return remote;
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
  if (!account) {
    // No wallet: a plain MCP client, so paid tools return the raw x402 offer (no payment).
    const plain = new Client({ name: "verif-entreprise-mcp", version: VERSION });
    await plain.connect(transport);
    remote = {
      listTools: () => plain.listTools(),
      callTool: async (name, args) => ({
        ...(await plain.callTool({ name, arguments: args })),
        paymentMade: false,
      }),
    };
    return remote;
  }
  const paymentClient = new x402Client();
  registerExactEvmScheme(paymentClient, { signer: account, networks: [NETWORK] });
  const client = new x402MCPClient(
    new Client({ name: "verif-entreprise-mcp", version: VERSION }),
    paymentClient,
    {
      autoPayment: true,
      onPaymentRequested: ({ toolName, paymentRequired }) => {
        const offer = paymentRequired.accepts.find(
          (a) => a.network === NETWORK && a.scheme === "exact",
        );
        if (!offer) throw new Error(`No ${NETWORK} offer for ${toolName}.`);
        if (USDC[NETWORK] && offer.asset.toLowerCase() !== USDC[NETWORK].toLowerCase()) {
          throw new Error(`Unexpected asset ${offer.asset} for ${toolName}: payment refused.`);
        }
        const usd = Number(offer.amount) / 1e6;
        if (!(usd <= MAX_USD)) {
          throw new Error(
            `${toolName} costs $${usd}, above VERIF_ENTREPRISE_MAX_USD ($${MAX_USD}): payment refused.`,
          );
        }
        return true;
      },
    },
  );
  await client.connect(transport);
  remote = client;
  return client;
}

/** Turns a remote x402 payment request (no wallet configured) into a helpful message. */
function paymentNeeded(name, result) {
  let price = "";
  try {
    const pr = JSON.parse(result.content?.[0]?.text ?? "");
    const offer = pr.accepts?.find((a) => a.network === NETWORK) ?? pr.accepts?.[0];
    if (offer) price = ` ($${Number(offer.amount) / 1e6} in USDC)`;
  } catch {
    return null;
  }
  return {
    content: [
      {
        type: "text",
        text:
          `${name} is a paid tool${price}, paid per call with x402. ` +
          "To enable it, set X402_PRIVATE_KEY in this MCP server's environment to the private key of a " +
          "wallet holding a little USDC on Base (no ETH needed). " +
          `Free alternative: ${FREE_TOOL} gives the company's status and number of alerts (10 calls per day).`,
      },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "verif-entreprise-fr", version: VERSION },
  {
    capabilities: { tools: {} },
    instructions:
      "French company verification (KYB) by SIREN from official open data. Start with apercu_entreprise " +
      "(free) to triage; use verifier_entreprise for the full report (verdict, sourced signals, insolvency " +
      "history, VAT checked in VIES). Paid calls are settled only when the tool succeeds.",
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const client = await getRemote();
  return client.listTools();
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    const client = await getRemote();
    const result = await client.callTool(name, args);
    if (!account && result.isError && name !== FREE_TOOL) {
      const help = paymentNeeded(name, result);
      if (help) return help;
    }
    const content = [...result.content];
    if (result.paymentMade && result.paymentResponse?.success) {
      content.push({
        type: "text",
        text: `Paid with x402 on ${NETWORK}: transaction ${result.paymentResponse.transaction}`,
      });
    }
    return { content, ...(result.isError ? { isError: true } : {}) };
  } catch (err) {
    remote = null; // reconnect on the next call
    return {
      content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
      isError: true,
    };
  }
});

await server.connect(new StdioServerTransport());
log(
  account
    ? `ready — paying from ${account.address} on ${NETWORK}, max $${MAX_USD} per call`
    : `ready — no X402_PRIVATE_KEY: only the free tool ${FREE_TOOL} works`,
);
