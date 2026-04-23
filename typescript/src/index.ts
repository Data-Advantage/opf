export { PptxClient, DEFAULT_BASE_URL } from "./client.js";
export type { PptxClientOptions } from "./client.js";

export {
  PptxError,
  PptxApiError,
  PptxNetworkError,
  PptxRateLimitError,
  PptxValidationError,
} from "./errors.js";
export type {
  PptxApiErrorBody,
  PptxApiErrorEnvelope,
} from "./errors.js";

export type {
  ApiErrorEnvelope,
  ApiErrorResponse,
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
  TextRun,
  ValidationErrorDetails,
  ValidateResponse,
  ValidationIssue,
} from "./types.js";

export type * from "./opf.js";
