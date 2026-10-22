import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { ValidationError } from "../lib/errors.js";

type ValidationTarget = "body" | "query" | "params";

interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

function formatZodIssues(issues: z.ZodIssue[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "general";
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

/**
 * Authoritative system-boundary validation middleware using Zod 4.
 * - Supports validating body, query, and params.
 * - Stores coerced/sanitized data in `req.valid` (Express 5 req.query is read-only).
 * - Translates failures to `ValidationError` with structured `fieldErrors`.
 */
export function validate(
  schemaOrSchemas: z.ZodTypeAny | ValidationSchemas,
  target: ValidationTarget = "body"
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check if passed a multi-target schema object { body?, query?, params? }
    const isMultiTarget =
      typeof schemaOrSchemas === "object" &&
      schemaOrSchemas !== null &&
      ("body" in schemaOrSchemas || "query" in schemaOrSchemas || "params" in schemaOrSchemas);

    if (isMultiTarget) {
      const schemas = schemaOrSchemas as ValidationSchemas;
      const validMap: Record<string, unknown> =
        typeof req.valid === "object" && req.valid !== null
          ? (req.valid as Record<string, unknown>)
          : {};

      const targets: ValidationTarget[] = ["body", "query", "params"];
      for (const t of targets) {
        const schema = schemas[t];
        if (!schema) continue;

        const dataToValidate = t === "body" ? req.body : t === "query" ? req.query : req.params;
        const result = schema.safeParse(dataToValidate);

        if (!result.success) {
          throw new ValidationError("Validasi input gagal", formatZodIssues(result.error.issues));
        }

        validMap[t] = result.data;
      }

      req.valid = validMap;
      next();
      return;
    }

    // Single target validation
    const schema = schemaOrSchemas as z.ZodTypeAny;
    const dataToValidate =
      target === "body" ? req.body : target === "query" ? req.query : req.params;
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      throw new ValidationError("Validasi input gagal", formatZodIssues(result.error.issues));
    }

    const currentValid =
      typeof req.valid === "object" && req.valid !== null
        ? (req.valid as Record<string, unknown>)
        : {};

    req.valid = {
      ...currentValid,
      [target]: result.data,
      // Also assign root valid if body is the sole target for clean access: req.valid
      ...(target === "body" && typeof result.data === "object" && result.data !== null
        ? result.data
        : {}),
    };

    next();
  };
}
