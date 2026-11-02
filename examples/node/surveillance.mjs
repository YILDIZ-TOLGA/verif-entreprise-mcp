// Monitor a company for 90 days: $0.10 USDC. New BODACC insolvency notices / deregistrations
// are POSTed to your HTTPS webhook (signed) and/or available by polling the returned `suivi` URL.
// The webhook must be a public HTTPS URL on port 443 with a domain name (see webhook-server.mjs).
// Usage: X402_PRIVATE_KEY=0x... node surveillance.mjs 552032534 https://your-agent.example/alerts
// KEEP the returned `jeton`: it is the HMAC key used to verify webhook signatures.
import { BASE_URL, payingFetch, show } from "./client.mjs";

const [siren = "552032534", webhook] = process.argv.slice(2);
if (!/^\d{9}$/.test(siren)) throw new Error("SIREN = 9 digits");

const fetchPay = payingFetch({ maxUsd: 0.1 });
const res = await fetchPay(`${BASE_URL}/v1/surveillance`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(webhook ? { siren, webhook } : { siren }),
});
await show(res);
