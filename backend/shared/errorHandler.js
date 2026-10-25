export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err.message || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    statusCode: status,
    service: req.app?.get('serviceName') || 'Microservice',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};
