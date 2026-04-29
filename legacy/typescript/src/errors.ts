export class PptxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PptxError";
  }
}

export class PptxNetworkError extends PptxError {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "PptxNetworkError";
    this.cause = cause;
  }
}

export interface PptxApiErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface PptxApiErrorBody {
  error?: PptxApiErrorEnvelope;
  [key: string]: unknown;
}

export class PptxApiError extends PptxError {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;
  readonly requestId: string | undefined;
  readonly body: PptxApiErrorBody | string | null;

  constructor(
    message: string,
    status: number,
    body: PptxApiErrorBody | string | null,
    requestId?: string,
  ) {
    super(message);
    this.name = "PptxApiError";
    this.status = status;
    this.body = body;
    const envelope =
      body && typeof body === "object" && typeof body.error === "object"
        ? body.error
        : undefined;
    this.code = envelope?.code;
    this.details = envelope?.details;
    this.requestId = requestId ?? envelope?.requestId;
  }
}

export class PptxValidationError extends PptxApiError {
  readonly validationErrors: string[];

  constructor(
    message: string,
    status: number,
    body: PptxApiErrorBody | null,
    requestId: string | undefined,
    validationErrors: string[],
  ) {
    super(message, status, body, requestId);
    this.name = "PptxValidationError";
    this.validationErrors = validationErrors;
  }
}

export class PptxRateLimitError extends PptxApiError {
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    body: PptxApiErrorBody | null,
    requestId: string | undefined,
    retryAfterSeconds: number | undefined,
  ) {
    super(message, 429, body, requestId);
    this.name = "PptxRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
