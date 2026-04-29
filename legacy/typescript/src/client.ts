import {
  PptxApiError,
  PptxNetworkError,
  PptxRateLimitError,
  PptxValidationError,
  type PptxApiErrorBody,
} from "./errors.js";
import type { OPFDocument } from "./opf.js";
import type {
  GenerateAcceptedResponse,
  GenerateFormat,
  HealthResponse,
  ParseAcceptedResponse,
  ParseMetadataResponse,
  ParseSlideResponse,
  ParseTextResponse,
  PptxFile,
  RenderAcceptedResponse,
  RenderFormat,
  RenderWebResponse,
  ValidateResponse,
} from "./types.js";

export const DEFAULT_BASE_URL = "https://api.pptx.dev";

export interface PptxClientOptions {
  /**
   * Bearer token for authenticated requests. Falls back to `PPTX_API_KEY`
   * environment variable on server runtimes (Node, Bun). In the browser,
   * supply the key explicitly.
   */
  apiKey?: string;

  /**
   * Override the API base URL. Defaults to `https://api.pptx.dev`. Paths are
   * always `/v1/...`. For local development set this to
   * `http://localhost:3000/api`.
   */
  baseUrl?: string;

  /**
   * Custom `fetch` implementation. Defaults to global `fetch`. Useful for
   * proxies, retries, or test doubles.
   */
  fetch?: typeof fetch;

  /** Extra headers sent on every request. */
  defaultHeaders?: Record<string, string>;
}

interface RequestOptions {
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  path: string;
  query?: Record<string, string | number | boolean | undefined | string[]>;
  body?: unknown;
  /** Sent as multipart/form-data. Takes precedence over `body`. */
  formData?: FormData;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /**
   * When true, response is parsed as JSON regardless of content-type.
   * When false, raw Response is returned.
   */
  parseJson?: boolean;
}

function resolveApiKey(explicit: string | undefined): string | undefined {
  if (explicit !== undefined) return explicit;
  if (typeof process !== "undefined" && process?.env?.PPTX_API_KEY) {
    return process.env.PPTX_API_KEY;
  }
  return undefined;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(cleanBase + cleanPath);
  if (query) {
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      if (Array.isArray(raw)) {
        if (raw.length > 0) url.searchParams.set(key, raw.join(","));
      } else {
        url.searchParams.set(key, String(raw));
      }
    }
  }
  return url.toString();
}

function toFilePart(file: PptxFile): { blob: Blob; filename: string } {
  const filename = file.filename ?? "upload.pptx";
  const { data } = file;
  if (data instanceof Blob) return { blob: data, filename };
  const type =
    "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data);
    return { blob: new Blob([copy.buffer], { type }), filename };
  }
  return { blob: new Blob([data], { type }), filename };
}

async function parseErrorBody(
  response: Response,
): Promise<PptxApiErrorBody | string | null> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as PptxApiErrorBody;
  } catch {
    return text;
  }
}

function apiErrorEnvelope(body: PptxApiErrorBody | string | null) {
  if (
    body &&
    typeof body === "object" &&
    body.error &&
    typeof body.error === "object" &&
    typeof body.error.message === "string"
  ) {
    return body.error;
  }
  return undefined;
}

function errorMessage(
  status: number,
  body: PptxApiErrorBody | string | null,
): string {
  const envelope = apiErrorEnvelope(body);
  if (envelope) {
    return `pptx.dev API ${status}: ${envelope.message}`;
  }
  if (typeof body === "string" && body.length > 0) {
    return `pptx.dev API ${status}: ${body}`;
  }
  return `pptx.dev API ${status}`;
}

function validationErrorsFromBody(
  body: PptxApiErrorBody | string | null,
): string[] | null {
  const envelope = apiErrorEnvelope(body);
  const details = envelope?.details as { errors?: unknown } | undefined;
  if (!details || !Array.isArray(details.errors)) return null;

  return details.errors.map((issue) => {
    if (typeof issue === "string") return issue;
    if (
      issue &&
      typeof issue === "object" &&
      typeof issue.path === "string" &&
      typeof issue.message === "string"
    ) {
      return `${issue.path}: ${issue.message}`;
    }
    return String(issue);
  });
}

export class PptxClient {
  readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchFn: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  readonly opf: OpfNamespace;
  readonly parse: ParseNamespace;
  readonly render: RenderNamespace;
  readonly convert: ConvertNamespace;

  constructor(options: PptxClientOptions = {}) {
    this.apiKey = resolveApiKey(options.apiKey);
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const explicitFetch = options.fetch;
    if (explicitFetch) {
      this.fetchFn = explicitFetch;
    } else if (typeof fetch === "function") {
      this.fetchFn = fetch;
    } else {
      throw new Error(
        "pptx.dev SDK: no global fetch available. Pass { fetch } in PptxClient options.",
      );
    }
    this.defaultHeaders = { ...(options.defaultHeaders ?? {}) };

    this.opf = new OpfNamespace(this);
    this.parse = new ParseNamespace(this);
    this.render = new RenderNamespace(this);
    this.convert = new ConvertNamespace(this);
  }

  async health(signal?: AbortSignal): Promise<HealthResponse> {
    return this.request<HealthResponse>({
      method: "GET",
      path: "/v1/health",
      signal,
    });
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const url = buildUrl(this.baseUrl, options.path, options.query);
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    if (options.headers) Object.assign(headers, options.headers);

    let fetchBody: BodyInit | undefined;
    if (options.formData) {
      fetchBody = options.formData;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      fetchBody =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: options.method,
        headers,
        body: fetchBody,
        signal: options.signal,
      });
    } catch (cause) {
      throw new PptxNetworkError(
        `pptx.dev SDK: network error calling ${options.method} ${url}`,
        cause,
      );
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;

    if (!response.ok) {
      const body = await parseErrorBody(response);
      const bodyRequestId =
        typeof body === "object" ? apiErrorEnvelope(body)?.requestId : undefined;
      const errorRequestId = requestId ?? bodyRequestId;

      const validationErrors =
        response.status === 422 ? validationErrorsFromBody(body) : null;
      if (validationErrors) {
        throw new PptxValidationError(
          errorMessage(response.status, body),
          response.status,
          body as PptxApiErrorBody,
          errorRequestId,
          validationErrors,
        );
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader
          ? Number.parseInt(retryAfterHeader, 10)
          : undefined;
        throw new PptxRateLimitError(
          errorMessage(response.status, body),
          typeof body === "object" ? body : null,
          errorRequestId,
          Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
        );
      }

      throw new PptxApiError(
        errorMessage(response.status, body),
        response.status,
        body,
        errorRequestId,
      );
    }

    if (options.parseJson === false) {
      return response as unknown as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch (cause) {
      throw new PptxNetworkError(
        `pptx.dev SDK: invalid JSON response from ${options.method} ${url}`,
        cause,
      );
    }
  }
}

// ─── opf.* ──────────────────────────────────────────────────────────────

class OpfNamespace {
  constructor(private readonly client: PptxClient) {}

  /**
   * Validate an OPF document against the schema. Validation is always free.
   */
  async validate(
    document: OPFDocument | Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ValidateResponse> {
    return this.client.request<ValidateResponse>({
      method: "POST",
      path: "/v1/validate",
      body: document,
      signal,
    });
  }

  /**
   * Submit an OPF document for generation. Returns 202 with job metadata;
   * poll render/status endpoints for completion. Throws `PptxValidationError`
   * on schema failures (HTTP 422).
   */
  async generate(
    document: OPFDocument | Record<string, unknown>,
    options?: { format?: GenerateFormat; signal?: AbortSignal },
  ): Promise<GenerateAcceptedResponse> {
    return this.client.request<GenerateAcceptedResponse>({
      method: "POST",
      path: "/v1/generate",
      query: options?.format ? { format: options.format } : undefined,
      body: document,
      signal: options?.signal,
    });
  }
}

// ─── parse.* ────────────────────────────────────────────────────────────

class ParseNamespace {
  constructor(private readonly client: PptxClient) {}

  /** Upload a .pptx file. Returns a parseId for follow-up reads. */
  async upload(
    file: PptxFile,
    signal?: AbortSignal,
  ): Promise<ParseAcceptedResponse> {
    const form = new FormData();
    const { blob, filename } = toFilePart(file);
    form.append("file", blob, filename);
    return this.client.request<ParseAcceptedResponse>({
      method: "POST",
      path: "/v1/parse",
      formData: form,
      signal,
    });
  }

  async metadata(
    parseId: string,
    signal?: AbortSignal,
  ): Promise<ParseMetadataResponse> {
    return this.client.request<ParseMetadataResponse>({
      method: "GET",
      path: `/v1/parse/${encodeURIComponent(parseId)}/metadata`,
      signal,
    });
  }

  async slide(
    parseId: string,
    index: number,
    signal?: AbortSignal,
  ): Promise<ParseSlideResponse> {
    return this.client.request<ParseSlideResponse>({
      method: "GET",
      path: `/v1/parse/${encodeURIComponent(parseId)}/slides/${index}`,
      signal,
    });
  }

  async text(
    parseId: string,
    signal?: AbortSignal,
  ): Promise<ParseTextResponse> {
    return this.client.request<ParseTextResponse>({
      method: "GET",
      path: `/v1/parse/${encodeURIComponent(parseId)}/text`,
      signal,
    });
  }
}

// ─── render.* ───────────────────────────────────────────────────────────

class RenderNamespace {
  constructor(private readonly client: PptxClient) {}

  /** Render a .pptx to web slides (interactive HTML viewer). */
  async web(
    file: PptxFile,
    options?: { slides?: number[]; signal?: AbortSignal },
  ): Promise<RenderWebResponse> {
    const form = new FormData();
    const { blob, filename } = toFilePart(file);
    form.append("file", blob, filename);
    const query: Record<string, string | string[]> = { format: "web" };
    if (options?.slides && options.slides.length > 0) {
      query.slides = options.slides.map(String);
    }
    return this.client.request<RenderWebResponse>({
      method: "POST",
      path: "/v1/render",
      query,
      formData: form,
      signal: options?.signal,
    });
  }

  /** Render a .pptx to an export format (svg, png). Returns a 202 job. */
  async export(
    file: PptxFile,
    format: Exclude<RenderFormat, "web">,
    options?: { slides?: number[]; signal?: AbortSignal },
  ): Promise<RenderAcceptedResponse> {
    const form = new FormData();
    const { blob, filename } = toFilePart(file);
    form.append("file", blob, filename);
    const query: Record<string, string | string[]> = { format };
    if (options?.slides && options.slides.length > 0) {
      query.slides = options.slides.map(String);
    }
    return this.client.request<RenderAcceptedResponse>({
      method: "POST",
      path: "/v1/render",
      query,
      formData: form,
      signal: options?.signal,
    });
  }
}

// ─── convert.* ──────────────────────────────────────────────────────────

class ConvertNamespace {
  constructor(private readonly client: PptxClient) {}

  /** Convert a .pptx to OPF JSON. */
  async pptxToOpf(
    file: PptxFile,
    signal?: AbortSignal,
  ): Promise<OPFDocument | Record<string, unknown>> {
    const form = new FormData();
    const { blob, filename } = toFilePart(file);
    form.append("file", blob, filename);
    return this.client.request<OPFDocument | Record<string, unknown>>({
      method: "POST",
      path: "/v1/convert",
      formData: form,
      signal,
    });
  }
}
