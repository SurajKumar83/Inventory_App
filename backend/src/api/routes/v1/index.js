import express from "express";
import alertRoutes from "./alerts.routes.js";
import authRoutes from "./auth.routes.js";
import customerRoutes from "./customers.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import devicesRoutes from "./devices.routes.js";
import eventsRoutes from "./events.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import orderRoutes from "./orders.routes.js";
import productRoutes from "./products.routes.js";
import supplierRoutes from "./suppliers.routes.js";

const router = express.Router();

// Mount all v1 routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/alerts", alertRoutes);
router.use("/devices", devicesRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/events", eventsRoutes);

export default router;
