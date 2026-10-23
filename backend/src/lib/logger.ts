import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    env.NODE_ENV !== "production" && process.env.LOG_LEVEL !== "silent"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
});
