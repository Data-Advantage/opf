export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ParseAcceptedResponse {
  parseId: string;
  slideCount: number;
  width: number;
  height: number;
}

export type GenerateFormat = "pptx" | "pdf" | "png" | "svg";

export interface GenerateAcceptedResponse {
  status: string;
  message: string;
  format: GenerateFormat | string;
  filename?: string;
  slideCount: number;
  validationWarnings: string[];
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorEnvelope;
}

export interface ValidationErrorDetails {
  errors: ValidationIssue[];
}

export interface TextRun {
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  alignment?: string;
}

export interface ParseSlideResponse {
  index: number;
  slideNumber: number;
  hidden: boolean;
  width: number;
  height: number;
  textRuns: TextRun[];
  speakerNotes?: string;
}

export interface ParseMetadataResponse {
  parseId: string;
  core: unknown;
  app: unknown;
  custom: unknown;
}

export interface ParseTextResponse {
  parseId: string;
  slides: unknown[];
}

export type RenderFormat = "web" | "svg" | "png";

export interface RenderWebResponse {
  parseId: string;
  format: "web";
  dimensions: unknown;
  slideCount: number;
  slides: unknown;
  metadata: unknown;
  viewerUrl: string;
}

export interface RenderAcceptedResponse {
  status: string;
  message: string;
  parseId: string;
  format: RenderFormat | string;
  slideCount: number;
  viewerUrl: string;
}

export interface HealthResponse {
  status: string;
  version?: string;
  [key: string]: unknown;
}

export interface PptxFile {
  /** Binary contents of the .pptx file */
  data: Blob | ArrayBuffer | Uint8Array;
  /** Filename sent as the multipart field name (defaults to "upload.pptx") */
  filename?: string;
}
