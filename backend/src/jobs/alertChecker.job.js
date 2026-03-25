import { checkLowStockAlerts } from "../services/alert.service.js";

/**
 * Alert checker job
 * Checks for low-stock conditions and creates alerts
 * Runs every 30 seconds via cron
 */
const runAlertChecker = async () => {
  try {
    console.log("[Alert Checker] Running low-stock check...");
    const alerts = await checkLowStockAlerts();

    if (alerts.length > 0) {
      console.log(`[Alert Checker] Created ${alerts.length} new alert(s)`);
    } else {
      console.log("[Alert Checker] No new alerts");
    }
  } catch (error) {
    console.error("[Alert Checker] Error:", error.message);
  }
};

export { runAlertChecker };
