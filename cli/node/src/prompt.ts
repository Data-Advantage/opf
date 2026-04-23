import { createInterface } from "node:readline";

/**
 * Minimal interactive prompt that reads a line from stdin with optional
 * terminal echo masking for secret values. Avoids pulling in a heavy
 * prompts dependency.
 */
export async function promptSecret(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return readLinePlain(question);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  process.stdout.write(question);

  const orig = process.stdout.write.bind(process.stdout);
  type Writer = typeof process.stdout.write;
  const mutedWriter = ((): Writer => {
    const fn = ((chunk: unknown, ...rest: unknown[]) => {
      if (typeof chunk === "string") {
        return orig("", ...(rest as [])) as boolean;
      }
      return orig(chunk as Uint8Array, ...(rest as [])) as boolean;
    }) as unknown as Writer;
    return fn;
  })();
  process.stdout.write = mutedWriter;

  return new Promise<string>((resolve) => {
    rl.question("", (answer) => {
      process.stdout.write = orig;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

async function readLinePlain(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
