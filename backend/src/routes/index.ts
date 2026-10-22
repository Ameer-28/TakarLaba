import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { ingredientRouter } from "./ingredient.routes.js";
import { purchaseRouter } from "./purchase.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(ingredientRouter);
apiRouter.use(purchaseRouter);
