import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDuration } from "../../config/metrics";

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path === "/metrics") {
    return next();
  }

  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;

    const route = req.route
      ? `${req.baseUrl}${req.route.path}` || "/"
      : "unknown";

    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration,
    );
  });

  next();
};

export default metricsMiddleware;
