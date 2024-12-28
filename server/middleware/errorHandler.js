export const errorHandler = (err, req, res, next) => {
  // Log del error para debugging
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    type: err.name,
    path: req.path
  });

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      error: 'Error de base de datos',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      details: 'La sesión ha expirado o el token es inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      details: 'La sesión ha expirado'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Handle unauthorized errors
  if (err.status === 401) {
    return res.status(401).json({
      error: 'No autorizado',
      details: err.message || 'No tiene permisos para realizar esta acción'
    });
  }

  // Default error response
  const status = err.status || 500;
  const response = {
    error: err.message || 'Error interno del servidor',
    status: status
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};