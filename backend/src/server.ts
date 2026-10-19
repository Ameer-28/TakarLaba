import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`TakarLaba API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = () => {
  logger.info("Gracefully shutting down...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { server };
