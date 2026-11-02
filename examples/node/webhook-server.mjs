// Minimal webhook receiver that verifies the X-Verif-Signature header:
//   sha256=<hex of HMAC-SHA256(raw body, jeton)>, where `jeton` is returned when you create a surveillance.
// Zero dependencies. Put it behind HTTPS (reverse proxy, tunnel...) on a public domain name.
// Usage: SURVEILLANCE_JETON=<jeton> PORT=8080 node webhook-server.mjs
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const JETON = process.env.SURVEILLANCE_JETON;
if (!JETON) throw new Error("Set SURVEILLANCE_JETON (the `jeton` returned by POST /v1/surveillance).");

export function signatureValide(corpsBrut, entete, jeton) {
  const attendu = "sha256=" + createHmac("sha256", jeton).update(corpsBrut).digest("hex");
  const a = Buffer.from(attendu);
  const b = Buffer.from(entete ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

const server = createServer(async (req, res) => {
  if (req.method !== "POST") return res.writeHead(405).end();
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 1_000_000) return res.writeHead(413).end();
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks); // verify on the RAW bytes, before JSON.parse
  if (!signatureValide(raw, req.headers["x-verif-signature"], JETON)) return res.writeHead(401).end();
  const alert = JSON.parse(raw.toString("utf8"));
  console.log(`[${alert.type}] SIREN ${alert.siren}`, alert.annonce?.nature ?? "");
  res.writeHead(204).end(); // answer 2xx quickly: the sender retries up to 5 times otherwise
});

server.listen(Number(process.env.PORT ?? 8080), () => console.log("webhook listening"));
