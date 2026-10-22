import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { ingredientRouter } from "./ingredient.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(ingredientRouter);
