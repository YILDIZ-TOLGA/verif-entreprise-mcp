// Vercel AI SDK tools (package `ai`). Use with generateText({ model, tools, prompt }).
// Run a smoke test of the free tool:  node vercel-ai.mjs 552032534
import { tool } from "ai";
import { z } from "zod";
import { companyPreview, DESCRIPTIONS, verifyCompany } from "./tools.mjs";

const inputSchema = z.object({ siren: z.string().describe("SIREN, 9 digits") });

export const tools = {
  company_preview: tool({
    description: DESCRIPTIONS.preview,
    inputSchema,
    execute: ({ siren }) => companyPreview(siren),
  }),
  verify_company: tool({
    description: DESCRIPTIONS.verify,
    inputSchema,
    execute: ({ siren }) => verifyCompany(siren),
  }),
};

if (process.argv[1]?.endsWith("vercel-ai.mjs")) {
  console.log(await tools.company_preview.execute({ siren: process.argv[2] ?? "552032534" }, { toolCallId: "t", messages: [] }));
}
