// Batch KYB: POST /v1/verify/batch. Scheme "upto": you authorise up to $0.008 x n, and only the
// successful checks are charged (n <= 50).
// Usage: X402_PRIVATE_KEY=0x... node batch.mjs 552032534 508927373
import { BASE_URL, payingFetch, show } from "./client.mjs";

const sirens = process.argv.slice(2);
if (sirens.length === 0) sirens.push("552032534", "508927373");
if (sirens.length > 50 || sirens.some((s) => !/^\d{9}$/.test(s))) throw new Error("1 to 50 SIREN of 9 digits");

const maxUsd = 0.008 * sirens.length;
const fetchPay = payingFetch({ maxUsd: maxUsd + 1e-9, upto: true });
const res = await fetchPay(`${BASE_URL}/v1/verify/batch`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sirens }),
});
await show(res);
