export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};
