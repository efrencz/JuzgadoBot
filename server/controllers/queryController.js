import { excelService } from '../services/excelService.js';

export const handleQuery = (query) => {
  try {
    console.log('Handling query:', {
      query: query,
      queryType: typeof query,
      queryLength: query ? query.length : 'N/A'
    });

    // Validate query input
    if (!query || typeof query !== 'string') {
      console.error('Invalid query input:', query);
      throw new Error('Consulta inválida');
    }

    // Check if Excel data is loaded
    if (!excelService.excelData || excelService.excelData.length === 0) {
      console.error('No Excel data loaded');
      throw new Error('No se ha cargado ningún archivo Excel');
    }

    // Log data overview for debugging
    console.log('Excel Data Overview:', {
      totalRows: excelService.excelData.length,
      headers: excelService.headers
    });

    // Normalize query
    const queryLower = query.toLowerCase().trim();

    // First, try exact radicado match
    const radicadoResult = excelService.searchByRadicado(queryLower);
    if (radicadoResult.found) {
      return `Detalles completos del radicado ${query}:\n` +
             excelService.getFullRowDetails(radicadoResult.data);
    }

    // If no radicado match, try asunto search
    const asuntoResult = excelService.searchByAsunto(queryLower);
    if (asuntoResult.found) {
      if (asuntoResult.count === 1) {
        return `Encontrado 1 resultado para "${query}":\n` +
               excelService.getFullRowDetails(asuntoResult.data[0]);
      }
      return `Encontrados ${asuntoResult.count} resultados para "${query}":\n` +
             asuntoResult.data
               .map((row, index) => 
                 `Resultado ${index + 1}:\n${excelService.getFullRowDetails(row)}\n`
               )
               .join('\n');
    }

    // If no results in either radicado or asunto, try a broader search
    const broadSearchResults = excelService.excelData.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(queryLower)
      )
    );

    if (broadSearchResults.length > 0) {
      if (broadSearchResults.length === 1) {
        return `Encontrado 1 resultado para "${query}":\n` +
               excelService.getFullRowDetails(broadSearchResults[0]);
      }
      return `Encontrados ${broadSearchResults.length} resultados para "${query}":\n` +
             broadSearchResults
               .map((row, index) => 
                 `Resultado ${index + 1}:\n${excelService.getFullRowDetails(row)}\n`
               )
               .join('\n');
    }

    // Default response for unrecognized queries
    console.warn('No results found for query:', query);
    return 'Lo siento, no pude encontrar resultados para tu búsqueda. ' +
           'Intenta con un número de radicado, palabras clave del asunto o términos específicos.';
  } catch (error) {
    console.error('Error in query handler:', {
      errorMessage: error.message,
      errorStack: error.stack,
      query: query
    });
    throw error;
  }
};