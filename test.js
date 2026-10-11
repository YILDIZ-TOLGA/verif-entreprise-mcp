// Smoke test: starts the bridge over stdio (as an MCP client would) WITHOUT a wallet key.
// Lists the tools, calls the free tool, and checks that a paid tool explains how to enable it.
// No payment can happen: X402_PRIVATE_KEY is removed from the child environment.
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const env = { ...process.env };
delete env.X402_PRIVATE_KEY;

const client = new Client({ name: "smoke-test", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: ["index.js"], env, stderr: "pipe" }),
);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
console.log("tools:", names.join(", "));
assert.ok(names.includes("apercu_entreprise"));
assert.ok(names.includes("verifier_entreprise"));

const free = await client.callTool({ name: "apercu_entreprise", arguments: { siren: "552032534" } });
assert.ok(!free.isError, free.content?.[0]?.text);
const apercu = JSON.parse(free.content[0].text);
console.log("apercu:", apercu.denomination, apercu.etat, `${apercu.alertes} alert(s)`);
assert.equal(apercu.siren, "552032534");

const paid = await client.callTool({ name: "verifier_entreprise", arguments: { siren: "552032534" } });
assert.equal(paid.isError, true);
console.log("paid without key:", paid.content[0].text.slice(0, 90), "…");
assert.match(paid.content[0].text, /X402_PRIVATE_KEY/);

await client.close();
console.log("OK");
