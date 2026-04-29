#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPptxMcpServer } from "./server.js";

async function main(): Promise<void> {
  const apiKey = process.env.PPTX_API_KEY;
  const baseUrl = process.env.PPTX_API_BASE_URL;

  const opts: { apiKey?: string; baseUrl?: string } = {};
  if (apiKey) opts.apiKey = apiKey;
  if (baseUrl) opts.baseUrl = baseUrl;
  const server = createPptxMcpServer(opts);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // MCP over stdio keeps the process alive via the transport. We log a
  // single line to stderr so `npx pptx-mcp` users see the server is up
  // without polluting the stdio protocol channel on stdout.
  process.stderr.write(`pptx-mcp: ready (${baseUrl ?? "https://api.pptx.dev"})\n`);
}

main().catch((err) => {
  process.stderr.write(`pptx-mcp: fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
