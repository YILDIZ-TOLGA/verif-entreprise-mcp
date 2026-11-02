// Verify a French company (KYB) by SIREN. Cost: $0.01 USDC, charged only if the call succeeds (HTTP < 400).
// Usage: X402_PRIVATE_KEY=0x... node verify.mjs 552032534
import { BASE_URL, payingFetch, show } from "./client.mjs";

const siren = process.argv[2] ?? "552032534";
if (!/^\d{9}$/.test(siren)) throw new Error("SIREN = 9 digits");

const fetchPay = payingFetch({ maxUsd: 0.01 });
const res = await fetchPay(`${BASE_URL}/v1/verify?siren=${siren}`);
await show(res);
