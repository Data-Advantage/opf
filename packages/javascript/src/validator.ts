import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { catalogSchemaNames, type CatalogKind } from "./catalogs.js";
import type { JsonSchema } from "./json.js";
import { schemas, type SchemaName } from "./schemas.js";
import type { Presentation } from "./types.js";

export interface ValidationIssue {
  path: string;
  message: string;
  keyword: string;
  schemaPath: string;
  params: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  schemaName?: SchemaName;
  catalogKind?: CatalogKind;
}

export type SchemaOrKind = SchemaName | CatalogKind | JsonSchema;

export class OPFValidationError extends Error {
  readonly issues: ValidationIssue[];
  readonly result: ValidationResult;

  constructor(result: ValidationResult) {
    const first = result.errors[0];
    super(first ? `OPF validation failed at ${first.path}: ${first.message}` : "OPF validation failed");
    this.name = "OPFValidationError";
    this.issues = result.errors;
    this.result = result;
  }
}

const schemaNameByCatalogKind = catalogSchemaNames as Record<CatalogKind, SchemaName>;

let ajv: Ajv2020 | undefined;
const dynamicSchemaCache = new WeakMap<JsonSchema, ValidateFunction>();

function getAjv(): Ajv2020 {
  if (ajv) {
    return ajv;
  }

  const instance = new Ajv2020({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
  });
  addFormats(instance);

  for (const schema of Object.values(schemas)) {
    instance.addSchema(schema);
  }

  ajv = instance;
  return instance;
}

function isSchemaName(value: unknown): value is SchemaName {
  return typeof value === "string" && value in schemas;
}

function isCatalogKind(value: unknown): value is CatalogKind {
  return typeof value === "string" && value in schemaNameByCatalogKind;
}

function resolveValidator(schemaOrKind: SchemaOrKind): {
  validate: ValidateFunction;
  schemaName?: SchemaName;
  catalogKind?: CatalogKind;
} {
  const instance = getAjv();

  if (isSchemaName(schemaOrKind)) {
    const schema = schemas[schemaOrKind];
    const validator = instance.getSchema(schema.$id as string) ?? instance.compile(schema);
    return { validate: validator, schemaName: schemaOrKind };
  }

  if (isCatalogKind(schemaOrKind)) {
    const schemaName = schemaNameByCatalogKind[schemaOrKind];
    const schema = schemas[schemaName];
    const validator = instance.getSchema(schema.$id as string) ?? instance.compile(schema);
    return { validate: validator, schemaName, catalogKind: schemaOrKind };
  }

  const cached = dynamicSchemaCache.get(schemaOrKind);
  if (cached) {
    return { validate: cached };
  }

  const validator = instance.compile(schemaOrKind);
  dynamicSchemaCache.set(schemaOrKind, validator);
  return { validate: validator };
}

function toIssue(error: ErrorObject): ValidationIssue {
  return {
    path: error.instancePath || "/",
    message: error.message ?? "failed validation",
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    params: error.params as Record<string, unknown>,
  };
}

export function validate(value: unknown, schemaOrKind: SchemaOrKind = "presentation"): ValidationResult {
  const resolved = resolveValidator(schemaOrKind);
  const valid = resolved.validate(value) === true;
  return {
    valid,
    errors: valid ? [] : (resolved.validate.errors ?? []).map(toIssue),
    schemaName: resolved.schemaName,
    catalogKind: resolved.catalogKind,
  };
}

export function assertValid<T = unknown>(value: T, schemaOrKind: SchemaOrKind = "presentation"): T {
  const result = validate(value, schemaOrKind);
  if (!result.valid) {
    throw new OPFValidationError(result);
  }
  return value;
}

export function validatePresentation(value: unknown): ValidationResult {
  return validate(value, "presentation");
}

export function assertValidPresentation(value: unknown): asserts value is Presentation {
  assertValid(value, "presentation");
}

export function validateCatalogRecord(kind: CatalogKind, value: unknown): ValidationResult {
  return validate(value, kind);
}

export function assertValidCatalogRecord(kind: CatalogKind, value: unknown): void {
  assertValid(value, kind);
}
