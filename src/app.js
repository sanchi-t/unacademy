const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger.js");
const client = require("prom-client");

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "hhttp://localhost:3001",
  "http://localhost:9090",
];

app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "full_path", "status_code", "cache_status"],
  buckets: [50, 100, 300, 500, 1000, 3000],
});

register.registerMetric(httpRequestDurationMicroseconds);

// Metrics middleware
function metricsMiddleware(req, res, next) {
  const startEpoch = Date.now();

  res.on("finish", () => {
    const responseTimeInMs = Date.now() - startEpoch;

    const fullPath = req.originalUrl || req.url || "unknown_path";

    // Normalize route: strip query params and mask IDs
    let normalizedRoute = fullPath.split("?")[0];
    normalizedRoute = normalizedRoute.replace(
      /\/api\/products\/\d+/g,
      "/api/products/:id",
    );

    const cacheStatus = res.locals.cached === true ? "hit" : "miss";

    httpRequestDurationMicroseconds
      .labels(
        req.method,
        normalizedRoute,
        fullPath,
        res.statusCode.toString(),
        cacheStatus,
      )
      .observe(responseTimeInMs);
  });

  next();
}

app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = app;
