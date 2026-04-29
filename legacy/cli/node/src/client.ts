import { PptxClient } from "@pptx/sdk";
import { resolveApiKey, resolveBaseUrl } from "./config.js";

export interface GlobalOptions {
  apiKey?: string;
  baseUrl?: string;
}

export function buildClient(opts: GlobalOptions = {}): PptxClient {
  const apiKey = resolveApiKey(opts.apiKey);
  const baseUrl = resolveBaseUrl(opts.baseUrl);
  const clientOpts: ConstructorParameters<typeof PptxClient>[0] = {};
  if (apiKey) clientOpts.apiKey = apiKey;
  if (baseUrl) clientOpts.baseUrl = baseUrl;
  return new PptxClient(clientOpts);
}

export function requireApiKey(opts: GlobalOptions = {}): string {
  const key = resolveApiKey(opts.apiKey);
  if (!key) {
    throw new CliError(
      "No API key found. Run `pptx login` or set PPTX_API_KEY.",
      2,
    );
  }
  return key;
}

export class CliError extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}
