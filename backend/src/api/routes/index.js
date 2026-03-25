import express from "express";
import v1Routes from "./v1/index.js";

const router = express.Router();

// API version routing
router.use("/v1", v1Routes);

export default router;
