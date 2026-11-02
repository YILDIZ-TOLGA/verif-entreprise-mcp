# Examples

Short, runnable examples for [Vérif Entreprise FR](https://api-production-24833.up.railway.app): French company verification (KYB) paid per call with [x402](https://www.x402.org) in USDC on Base. No account, no API key.

| Folder | What | Wallet needed |
| --- | --- | --- |
| [`curl/`](curl) | Free preview; read a 402 payment request without paying | no |
| [`node/`](node) | `@x402/fetch` + `@x402/evm`: verify a SIREN, batch (`upto`), surveillance, webhook receiver with HMAC check | for paid calls |
| [`python/`](python) | Official `x402` PyPI package (`requests`): verify a SIREN, webhook receiver with HMAC check | for paid calls |
| [`agents/`](agents) | LangChain.js tool, Vercel AI SDK tool, CrewAI tool; or use the MCP bridge | for the paid tool |
| [`n8n/`](n8n) | Importable workflow on the free preview | no |

## Prices

| Route | Price (USDC) |
| --- | --- |
| `GET /v1/apercu?siren=` | free, 10 per day |
| `GET /v1/verify?siren=` | $0.01 |
| `GET /v1/search?q=` | $0.002 |
| `GET /v1/procedures?siren=` | $0.005 |
| `GET /v1/gels?nom=` | $0.02 |
| `POST /v1/verify/batch` | up to $0.008 per SIREN (`upto`: only successes are charged) |
| `POST /v1/surveillance` | $0.10 for 90 days |

A paid call is charged only if the response status is below 400.

## Safety rules used in every paid example

- The private key is read from the `X402_PRIVATE_KEY` environment variable, never written in code or committed.
- Use a **dedicated wallet** holding a few cents of USDC on Base, never your main wallet. No ETH is needed for gas.
- A hook runs **before signing** (`onBeforePaymentCreation` in Node, `on_before_payment_creation` in Python) and refuses a payment whose network is not Base, whose asset is not USDC, or whose price is above a cap you set.

## What was tested

Syntax checks (`node --check`, `python -m py_compile`), JSON validity, the free preview against production, the 402 reader, the free LangChain and Vercel AI tools, the HMAC webhook receivers (Node and Python, valid and invalid signature), and the price cap against a local fake 402 server (payment refused above the cap, Node and Python). The paid routes were not exercised from these examples (no mainnet transaction). The CrewAI tool and the n8n workflow were not run in their host applications.
