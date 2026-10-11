// Paid-path test on Base Sepolia TESTNET only (test USDC, no real money).
// Usage: X402_PRIVATE_KEY=<test wallet> VERIF_ENTREPRISE_URL=http://localhost:3911/mcp node test-testnet.js
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const env = { ...process.env, VERIF_ENTREPRISE_NETWORK: "eip155:84532" };
assert.ok(env.X402_PRIVATE_KEY, "X402_PRIVATE_KEY (TEST wallet) required");
assert.ok(env.VERIF_ENTREPRISE_URL, "VERIF_ENTREPRISE_URL (testnet server) required");

const client = new Client({ name: "testnet-test", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: ["index.js"], env, stderr: "inherit" }),
);
const r = await client.callTool({ name: "verifier_entreprise", arguments: { siren: "552032534" } });
assert.ok(!r.isError, r.content?.map((c) => c.text).join("\n"));
const report = JSON.parse(r.content[0].text);
console.log("report:", report.entreprise.denomination, report.verdict.niveau);
const receipt = r.content.find((c) => c.text?.startsWith("Paid with x402"));
assert.ok(receipt, "payment receipt line expected");
console.log(receipt.text);

// Cap below the price: the bridge must refuse to pay.
await client.close();
const capped = new Client({ name: "testnet-test", version: "1.0.0" });
await capped.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: ["index.js"],
    env: { ...env, VERIF_ENTREPRISE_MAX_USD: "0.005" },
    stderr: "inherit",
  }),
);
const refused = await capped.callTool({ name: "verifier_entreprise", arguments: { siren: "552032534" } });
assert.equal(refused.isError, true);
console.log("capped:", refused.content[0].text);
await capped.close();
console.log("OK");
