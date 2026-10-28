import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { ingredientRouter } from "./ingredient.routes.js";
import { purchaseRouter } from "./purchase.routes.js";
import { inventoryRouter } from "./inventory.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { overheadRouter } from "./overhead.routes.js";
import { menuRouter } from "./menu.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(ingredientRouter);
apiRouter.use(purchaseRouter);
apiRouter.use(inventoryRouter);
apiRouter.use(settingsRouter);
apiRouter.use(overheadRouter);
apiRouter.use(menuRouter);
