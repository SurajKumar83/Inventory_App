import express from "express";
import { redisSub } from "../../../config/redis.js";

const router = express.Router();

// In-memory store for latest events (simple implementation)
// In production, use Redis with TTL or dedicated message queue
const recentEvents = [];
const MAX_EVENTS = 100;

// Track active SSE connections
const sseClients = new Set();

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

      // Broadcast to all SSE clients
      const sseData = `event: inventory_update\ndata: ${JSON.stringify(event)}\n\n`;
      sseClients.forEach((client) => {
        try {
          client.write(sseData);
        } catch (err) {
          console.error("Error sending SSE update:", err);
        }
      });
    } catch (error) {
      console.error("Error parsing inventory update event:", error);
    }
  }
});

/**
 * GET /api/v1/events/stream
 * Server-Sent Events stream for real-time inventory updates
 * Replace polling with persistent connection
 */
router.get("/stream", (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Send initial connection event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ timestamp: Date.now(), message: "SSE connected" })}\n\n`,
  );

  // Add client to active connections
  sseClients.add(res);
  console.log(`SSE client connected (total: ${sseClients.size})`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(
        `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`,
      );
    } catch (err) {
      clearInterval(heartbeatInterval);
      sseClients.delete(res);
    }
  }, 30000);

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    sseClients.delete(res);
    console.log(`SSE client disconnected (remaining: ${sseClients.size})`);
  });
});

/**
 * GET /api/v1/events/poll
 * Poll for inventory update events (fallback for non-SSE clients)
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
