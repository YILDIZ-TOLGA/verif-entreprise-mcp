// Framework-neutral core shared by the LangChain and Vercel AI SDK examples.
// Two tools: a FREE preview (no wallet) and the PAID KYB report ($0.01 USDC, x402 on Base).
import { BASE_URL, payingFetch } from "../node/client.mjs";

const SIREN = /^\d{9}$/;

export async function companyPreview(siren) {
  if (!SIREN.test(siren)) throw new Error("SIREN = 9 digits");
  const res = await fetch(`${BASE_URL}/v1/apercu?siren=${siren}`);
  return await res.text();
}

let paid; // created lazily so the free tool works without a wallet
export async function verifyCompany(siren) {
  if (!SIREN.test(siren)) throw new Error("SIREN = 9 digits");
  paid ??= payingFetch({ maxUsd: 0.01 }); // reads X402_PRIVATE_KEY; refuses to sign above $0.01
  const res = await paid(`${BASE_URL}/v1/verify?siren=${siren}`);
  const body = await res.text();
  return res.ok ? body : `Error HTTP ${res.status}: ${body.slice(0, 500)}`;
}

export const DESCRIPTIONS = {
  preview: "Free preview of a French company by SIREN (9 digits): official name, active/closed status, city, number of alerts.",
  verify:
    "Full KYB report of a French company by SIREN (9 digits): explained verdict, insolvency history (BODACC), EU VAT (VIES). Costs $0.01 USDC per call, paid automatically.",
};
