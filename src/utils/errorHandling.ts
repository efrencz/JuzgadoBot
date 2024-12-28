export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): Error => {
  console.error('Error handling:', error);

  // If it's already an APIError, return as-is
  if (error instanceof APIError) {
    return error;
  }
  
  // Handle network-related errors
  if (error instanceof TypeError) {
    switch (error.message) {
      case 'Failed to fetch':
        return new APIError(
          'No se pudo conectar al servidor. Por favor, verifica que el servidor esté ejecutándose.',
          503,
          'SERVER_UNREACHABLE'
        );
      case 'NetworkError when attempting to fetch resource':
        return new APIError(
          'Error de red. Comprueba tu conexión y la disponibilidad del servidor.',
          0,
          'NETWORK_ERROR'
        );
      case `Unexpected token '-', "----------"... is not valid JSON`:
        return new APIError(
          'Error al procesar la respuesta del servidor. Posible problema con la carga de archivos.',
          400,
          'INVALID_RESPONSE_FORMAT'
        );
      default:
        return new APIError(
          `Error de red: ${error.message}`,
          0,
          'NETWORK_ERROR'
        );
    }
  }

  // Handle other unexpected errors
  return new APIError(
    error instanceof Error 
      ? `Ocurrió un error inesperado: ${error.message}`
      : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    500,
    'UNEXPECTED_ERROR'
  );
};