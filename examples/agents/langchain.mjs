// LangChain.js tools (@langchain/core). Pass them to any agent / model.bindTools([...]).
// Run a smoke test of the free tool:  node langchain.mjs 552032534
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { companyPreview, DESCRIPTIONS, verifyCompany } from "./tools.mjs";

const input = z.object({ siren: z.string().describe("SIREN, 9 digits") });

export const companyPreviewTool = tool(({ siren }) => companyPreview(siren), {
  name: "company_preview",
  description: DESCRIPTIONS.preview,
  schema: input,
});

export const verifyCompanyTool = tool(({ siren }) => verifyCompany(siren), {
  name: "verify_company",
  description: DESCRIPTIONS.verify,
  schema: input,
});

export const tools = [companyPreviewTool, verifyCompanyTool];

if (process.argv[1]?.endsWith("langchain.mjs")) {
  console.log(await companyPreviewTool.invoke({ siren: process.argv[2] ?? "552032534" }));
}
