# verif-entreprise-mcp

Local MCP server for **[Vérif Entreprise FR](https://api-production-24833.up.railway.app)**: verify a French company (KYB) by SIREN from Claude Desktop, Cursor, VS Code or any MCP client, and pay each call with [x402](https://www.x402.org) in USDC from **your own wallet**. No account, no API key, no subscription.

- **Free:** `apercu_entreprise` gives the official name, active/closed status, head-office city and the number of alerts (insolvency proceedings, closure…). 10 calls per day, no wallet needed.
- **$0.01 per call:** `verifier_entreprise` returns the full report: an explained verdict (favorable / vigilance / defavorable), stable signal codes with links to the official notices, insolvency history from BODACC, the intra-EU VAT number checked in VIES, headcount, establishments and labels.
- **$0.002 per call:** `rechercher_entreprise` finds a SIREN from a company name.
- **$0.01 per call:** `qualifications_rge` lists the RGE (energy renovation) certifications of an establishment by SIRET.
- **$0.10 per company:** `surveiller_entreprise` monitors a company for 90 days and alerts you (signed webhook, or polling) whenever a new insolvency proceeding or deregistration is published in BODACC.

A paid call is settled **only if the tool succeeds**: an unknown company or a source outage costs nothing. Data comes from official French open data (Annuaire des Entreprises, BODACC, ADEME) and the European Commission's VIES. No personal data about company officers is returned.

## Install

Requires Node.js 20 or newer.

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

### Cursor, VS Code and other clients

Same command: `npx -y github:YILDIZ-TOLGA/verif-entreprise-mcp`, with the same environment variables.

Leave out `X402_PRIVATE_KEY` to try it for free: only `apercu_entreprise` works, and the paid tools explain how to enable them.

## Wallet and safety

- Use a **dedicated wallet** holding a few dollars of **USDC on Base**. No ETH is needed: payments are gasless EIP-3009 authorizations, settled by the Coinbase facilitator.
- The key stays on your machine. It only signs a USDC authorization for the exact amount the server asks, after the bridge checks it is USDC on Base and at most `VERIF_ENTREPRISE_MAX_USD` (default `0.01`, maximum `1`).
- Each successful payment adds a line with its Base transaction hash to the tool result.
- Do not use a wallet converted into a smart account (EIP-7702 delegation, which some wallets apply after a swap): USDC rejects its signature. A plain address works.

| Variable | Default | Role |
| --- | --- | --- |
| `X402_PRIVATE_KEY` | none | Wallet that pays. Without it, only the free tool works. |
| `VERIF_ENTREPRISE_MAX_USD` | `0.01` | Highest price accepted per call (set `0.10` to enable `surveiller_entreprise`). |
| `VERIF_ENTREPRISE_URL` | production server | Remote MCP endpoint. |
| `VERIF_ENTREPRISE_NETWORK` | `eip155:8453` | Network used to pay (Base mainnet). |

## Without this bridge

If your agent already speaks x402, call the service directly:

- Remote MCP server: `https://api-production-24833.up.railway.app/mcp` (streamable HTTP, x402 payment inside MCP).
- HTTP API: `GET https://api-production-24833.up.railway.app/v1/verify?siren=552032534` returns `402` with the payment terms; any x402 client pays and retries.
- Free preview over HTTP: `GET https://api-production-24833.up.railway.app/v1/apercu?siren=552032534`.
- Documentation for agents: [llms.txt](https://api-production-24833.up.railway.app/llms.txt), [OpenAPI](https://api-production-24833.up.railway.app/openapi.json).

Also listed in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=verif-entreprise-fr) and on [Glama](https://glama.ai/mcp/connectors/app.railway.up.api-production-24833/verif-entreprise-fr).

## En français

Serveur MCP local pour vérifier une entreprise française par son SIREN depuis Claude Desktop, Cursor ou VS Code : statut, procédures collectives (BODACC), numéro de TVA vérifié auprès de VIES, qualifications RGE et verdict expliqué. L'aperçu (`apercu_entreprise`) est gratuit, 10 appels par jour. Le rapport complet coûte 0,01 $ par appel, payé en USDC sur Base avec x402 depuis votre propre wallet, sans compte ni abonnement, et n'est jamais facturé en cas d'erreur.

## Development

```bash
npm install
npm test                      # free calls only, no wallet needed
```

`test-testnet.js` checks the paid path and the price cap on Base Sepolia (test USDC) against a testnet server.

## License

MIT. Data: Licence Ouverte Etalab 2.0 (French open data), VIES (European Commission). Information is provided for guidance only and is not advice.
