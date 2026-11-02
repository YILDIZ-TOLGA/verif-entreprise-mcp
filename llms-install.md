# Installing Vérif Entreprise FR (MCP) — guide for AI agents

This server verifies French companies by SIREN/SIRET: legal status, insolvency proceedings (BODACC), RGE certifications, LEI, asset-freeze screening and BODACC monitoring. `apercu_entreprise` is free; the other tools are paid per call in USDC on Base via x402 (no account, no API key).

## Option 1: remote server (no install, free tool only unless the client pays x402)

Add a streamable HTTP server with this URL:

```
https://api-production-24833.up.railway.app/mcp
```

## Option 2: local bridge (pays x402 from the user's own wallet)

Requirements: Node.js 20 or newer, and a wallet private key holding a little USDC on Base. Ask the user for the key; never invent one, never print it back.

Add this to the client's MCP configuration (for Cline: `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "verif-entreprise": {
      "command": "npx",
      "args": ["-y", "github:YILDIZ-TOLGA/verif-entreprise-mcp"],
      "env": {
        "X402_PRIVATE_KEY": "<ask the user>",
        "VERIF_ENTREPRISE_MAX_USD": "0.10"
      }
    }
  }
}
```

`VERIF_ENTREPRISE_MAX_USD` is the highest price accepted per call (default `0.01`): `0.02` enables `gel_avoirs`, `0.10` enables `surveiller_entreprise`. Without `X402_PRIVATE_KEY`, only the free `apercu_entreprise` tool works.

## Check

Call `apercu_entreprise` with `{"siren": "552032534"}`: it should return DANONE's free preview.
