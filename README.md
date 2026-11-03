# verif-entreprise-mcp

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-verif--entreprise--fr-6f42c1)](https://registry.modelcontextprotocol.io/v0/servers?search=verif-entreprise-fr)
[![Glama](https://img.shields.io/badge/Glama-connector-orange)](https://glama.ai/mcp/connectors/app.railway.up.api-production-24833/verif-entreprise-fr)
[![Payments: x402 on Base](https://img.shields.io/badge/payments-x402%20USDC%20on%20Base-0052ff)](https://www.x402.org)

Local MCP server for **[Vérif Entreprise FR](https://api-production-24833.up.railway.app)**: verify a French company (KYB) by SIREN from Claude Desktop, Cursor, VS Code or any MCP client, and pay each call with [x402](https://www.x402.org) in USDC from **your own wallet**. No account, no API key, no subscription.

## Tools

| Tool | Price (USDC) | What it does |
| --- | --- | --- |
| `apercu_entreprise` | free (10 calls/day) | Official name, active/closed status, head-office city, number of alerts. No wallet needed. |
| `rechercher_entreprise` | $0.002 | Find a SIREN from a company name. |
| `verifier_entreprise` | $0.01 | Full KYB report: explained verdict (favorable / vigilance / defavorable), stable signal codes with links to official notices, BODACC insolvency history, intra-EU VAT number checked in VIES, headcount, establishments, labels. |
| `qualifications_rge` | $0.01 | RGE (energy renovation) certifications of an establishment by SIRET. |
| `procedures_collectives` | $0.005 | Insolvency proceedings (BODACC) of a company. |
| `entite_lei` | $0.01 | Legal Entity Identifier (LEI) record from GLEIF. |
| `gel_avoirs` | $0.02 | Check the French national asset-freeze register (DG Tresor) for sanctions screening. |
| `marches_publics` | $0.02 | French public procurement awards by SIREN (DECP, last 24 months): count, value, buyers, CPV sectors, latest contracts. |
| `surveiller_entreprise` | $0.10 per company | Monitors a company for 90 days and alerts you (signed webhook, or polling) when a new insolvency proceeding or deregistration is published in BODACC. |

Payment is in **USDC on Base only**, through [x402](https://www.x402.org). The tool list is fetched live from the server, so new tools appear without updating the bridge.

A paid call is settled **only if the tool succeeds**: an unknown company or a source outage costs nothing. Data comes from official French open data (Annuaire des Entreprises, BODACC, ADEME) and the European Commission's VIES. No personal data about company officers is returned.

## Install

Requires Node.js 20 or newer. The same command works in every client: `npx -y github:YILDIZ-TOLGA/verif-entreprise-mcp`, configured with these environment variables:

- `X402_PRIVATE_KEY`: private key of a dedicated wallet holding USDC on Base (optional: without it only the free tool works).
- `VERIF_ENTREPRISE_MAX_USD`: highest price accepted per call (default `0.01`). Set `0.02` to enable `gel_avoirs` and `marches_publics`, `0.10` to enable `surveiller_entreprise`.

### Claude Desktop

Add this to `claude_desktop_config.json`, then restart Claude Desktop:

```json
{
  "mcpServers": {
    "verif-entreprise": {
      "command": "npx",
      "args": ["-y", "github:YILDIZ-TOLGA/verif-entreprise-mcp"],
      "env": {
        "X402_PRIVATE_KEY": "0x… private key of a wallet holding USDC on Base",
        "VERIF_ENTREPRISE_MAX_USD": "0.10"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add verif-entreprise   --env X402_PRIVATE_KEY=0x...   --env VERIF_ENTREPRISE_MAX_USD=0.10   -- npx -y github:YILDIZ-TOLGA/verif-entreprise-mcp
```

### Cursor

In `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project), use the same `mcpServers` block as Claude Desktop.

### VS Code

In `.vscode/mcp.json`:

```json
{
  "servers": {
    "verif-entreprise": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:YILDIZ-TOLGA/verif-entreprise-mcp"],
      "env": {
        "X402_PRIVATE_KEY": "0x…",
        "VERIF_ENTREPRISE_MAX_USD": "0.10"
      }
    }
  }
}
```

### Windsurf

In `~/.codeium/windsurf/mcp_config.json`, use the same `mcpServers` block as Claude Desktop.

Leave out `X402_PRIVATE_KEY` to try it for free: only `apercu_entreprise` works, and the paid tools explain how to enable them.

## Wallet and safety

- Use a **dedicated wallet** holding a few dollars of **USDC on Base**. No ETH is needed: payments are gasless EIP-3009 authorizations, settled by the Coinbase facilitator.
- The key stays on your machine. It only signs a USDC authorization for the exact amount the server asks, after the bridge checks it is USDC on Base and at most `VERIF_ENTREPRISE_MAX_USD` (default `0.01`, maximum `1`). The default refuses anything above $0.01, so `gel_avoirs` and `marches_publics` ($0.02) need `VERIF_ENTREPRISE_MAX_USD=0.02` and `surveiller_entreprise` ($0.10) needs `0.10`.
- Each successful payment adds a line with its Base transaction hash to the tool result.
- Do not use a wallet converted into a smart account (EIP-7702 delegation, which some wallets apply after a swap): USDC rejects its signature. A plain address works.

| Variable | Default | Role |
| --- | --- | --- |
| `X402_PRIVATE_KEY` | none | Wallet that pays. Without it, only the free tool works. |
| `VERIF_ENTREPRISE_MAX_USD` | `0.01` | Highest price accepted per call (`0.02` for `gel_avoirs` and `marches_publics`, `0.10` for `surveiller_entreprise`). |
| `VERIF_ENTREPRISE_URL` | production server | Remote MCP endpoint. |
| `VERIF_ENTREPRISE_NETWORK` | `eip155:8453` | Network used to pay (Base mainnet; `eip155:84532` for Base Sepolia tests). |

## Webhooks and attestations

Monitoring alerts are signed (`X-Verif-Signature`) and every paid verification carries an Ed25519 attestation you can keep as KYB proof. Verification code in Node.js and Python: [docs/webhooks-et-attestations.md](docs/webhooks-et-attestations.md).

## Without this bridge

If your agent already speaks x402, call the service directly:

- Remote MCP server: `https://api-production-24833.up.railway.app/mcp` (streamable HTTP, x402 payment inside MCP). Clients that support remote servers can use this URL directly, e.g. `claude mcp add --transport http verif-entreprise https://api-production-24833.up.railway.app/mcp` (free tool only unless your client pays x402).
- HTTP API: `GET https://api-production-24833.up.railway.app/v1/verify?siren=552032534` returns `402` with the payment terms; any x402 client pays and retries.
- Free preview over HTTP: `GET https://api-production-24833.up.railway.app/v1/apercu?siren=552032534`.
- Documentation for agents: [llms.txt](https://api-production-24833.up.railway.app/llms.txt), [OpenAPI](https://api-production-24833.up.railway.app/openapi.json).

Also listed in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=verif-entreprise-fr) and on [Glama](https://glama.ai/mcp/connectors/app.railway.up.api-production-24833/verif-entreprise-fr).

## Examples

Runnable code in [`examples/`](examples): curl (free preview, reading a 402), Node (`@x402/fetch`: verify, batch, surveillance, webhook HMAC check), Python (official `x402` package), LangChain / Vercel AI SDK / CrewAI tools, and an importable n8n workflow. Every paid example reads the key from `X402_PRIVATE_KEY`, recommends a dedicated wallet and refuses to sign above a price cap.

## En français

Serveur MCP local pour vérifier une entreprise française par son SIREN depuis Claude Desktop, Cursor ou VS Code : statut, procédures collectives (BODACC), numéro de TVA vérifié auprès de VIES, qualifications RGE, LEI (GLEIF), registre des gels d'avoirs et verdict expliqué. L'aperçu (`apercu_entreprise`) est gratuit, 10 appels par jour. Le rapport complet coûte 0,01 $ par appel (de 0,002 $ à 0,10 $ selon l'outil), payé en USDC sur Base uniquement avec x402 depuis votre propre wallet, sans compte ni abonnement, et n'est jamais facturé en cas d'erreur.

## Development

```bash
npm install
npm test                      # free calls only, no wallet needed
```

`test-testnet.js` checks the paid path and the price cap on Base Sepolia (test USDC) against a testnet server.

## License

MIT. Data: Licence Ouverte Etalab 2.0 (French open data), VIES (European Commission). Information is provided for guidance only and is not advice.
