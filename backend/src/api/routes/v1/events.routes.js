import express from "express";
import { redisSub } from "../../../config/redis.js";

const router = express.Router();

// In-memory store for latest events (simple implementation)
// In production, use Redis with TTL or dedicated message queue
const recentEvents = [];
const MAX_EVENTS = 100;

// Subscribe to inventory updates
redisSub.subscribe("inventory:updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to inventory updates:", err);
  } else {
    console.log("Subscribed to inventory:updates channel");
  }
});

redisSub.on("message", (channel, message) => {
  if (channel === "inventory:updates") {
    try {
      const event = JSON.parse(message);
      event.id = Date.now().toString();
      recentEvents.unshift(event);

      // Keep only most recent events
      if (recentEvents.length > MAX_EVENTS) {
        recentEvents.length = MAX_EVENTS;
      }
    } catch (error) {
      console.error("Error parsing inventory update event:", error);
    }
  }
});

/**
 * GET /api/v1/events/poll
 * Poll for inventory update events
 * Query params: since (timestamp in ms)
 */
router.get("/poll", (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since) : 0;

    // Filter events newer than 'since' timestamp
    const newEvents = recentEvents.filter((event) => {
      const eventTimestamp = new Date(event.timestamp).getTime();
      return eventTimestamp > since;
    });

    res.json({
      events: newEvents,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Events poll error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

export default router;
