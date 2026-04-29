/* eslint-disable no-console */
import { PptxApiError, PptxValidationError } from "@pptx/sdk";
import { CliError } from "./client.js";

export function info(msg: string): void {
  process.stderr.write(`${msg}\n`);
}

export function success(msg: string): void {
  process.stderr.write(`${msg}\n`);
}

export function warn(msg: string): void {
  process.stderr.write(`warning: ${msg}\n`);
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(err.exitCode);
  }
  if (err instanceof PptxValidationError) {
    process.stderr.write(`error: ${err.message}\n`);
    for (const issue of err.validationErrors) {
      process.stderr.write(`  - ${issue}\n`);
    }
    process.exit(1);
  }
  if (err instanceof PptxApiError) {
    process.stderr.write(`error: ${err.message}\n`);
    if (err.requestId) {
      process.stderr.write(`  request id: ${err.requestId}\n`);
    }
    process.exit(1);
  }
  if (err instanceof Error) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`error: ${String(err)}\n`);
  process.exit(1);
}
