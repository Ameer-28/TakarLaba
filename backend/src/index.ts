import express from "express";
import { createApp } from "./create-app.js";

// Explicit express reference to satisfy Vercel serverless builder detection and prevent import elision
void express;

const app: express.Express = createApp();

export default app;
