import type { Response } from "express";

export interface EnvelopeSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface EnvelopeError {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): Response {
  const body: EnvelopeSuccess<T> = {
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  fieldErrors?: Record<string, string[]>
): Response {
  const body: EnvelopeError = {
    ok: false,
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
  return res.status(statusCode).json(body);
}
