# Agent framework examples

Two tools for each framework: `company_preview` (free, no wallet) and `verify_company` ($0.01 USDC per call, paid with x402 from your own wallet, capped at $0.01 by a pre-signature hook).

| Framework | File | Tested |
| --- | --- | --- |
| LangChain.js | `langchain.mjs` | free tool executed; paid path not run |
| Vercel AI SDK | `vercel-ai.mjs` | free tool executed; paid path not run |
| CrewAI | `crewai_tool.py` | syntax check only (CrewAI not installed) |

```bash
(cd ../node && npm install)   # x402 + viem, reused by tools.mjs
npm install
node langchain.mjs 552032534
node vercel-ai.mjs 552032534
export X402_PRIVATE_KEY=0x...   # dedicated wallet, a few cents of USDC on Base; only needed for verify_company
```

## Alternative: through the MCP bridge

If your framework speaks MCP, skip all of this: run the bridge `npx -y github:YILDIZ-TOLGA/verif-entreprise-mcp` as a stdio MCP server (it signs payments itself, with `X402_PRIVATE_KEY` and a per-call cap `VERIF_ENTREPRISE_MAX_USD`), or point an MCP client with x402 support (`@x402/mcp`) at `https://api-production-24833.up.railway.app/mcp` (Streamable HTTP). All tools (`verifier_entreprise`, `rechercher_entreprise`, `procedures_collectives`, ...) become available without writing a tool.
