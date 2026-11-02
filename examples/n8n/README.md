# n8n workflow

`apercu-entreprise.json`: manual trigger, a SIREN field, and an HTTP Request node calling the free `GET /v1/apercu?siren=` (name, status, city, number of alerts; 10 calls per day, no wallet).

Import: in n8n, menu `...` > `Import from File...` and pick the JSON. Edit the SIREN in the "SIREN to check" node, then run.

The paid routes need an x402 signature (USDC on Base) that n8n's HTTP node cannot produce on its own. For paid checks from n8n, call a small service running one of the `../node` examples, or the MCP bridge. The JSON was validated as JSON; it was not imported into a live n8n instance.
