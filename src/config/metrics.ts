import client from "prom-client";

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
});

export const usersRegisteredTotal = new client.Counter({
  name: "users_registered_total",
  help: "Total number of users successfully registered",
});

export default client;
