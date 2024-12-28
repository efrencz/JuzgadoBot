import express from 'express';
import { searchByRadicado, searchByFolio, initializeSheet } from '../services/sheets.js';

const router = express.Router();

// Initialize Google Sheets connection
initializeSheet().catch(error => {
  console.error('Failed to initialize Google Sheets:', error);
  process.exit(1);
});

// Middleware to log all requests
router.use((req, res, next) => {
  console.log('------- Incoming Request -------');
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Query endpoint
router.post('/query', async (req, res) => {
  try {
    const { query, option } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'La consulta no puede estar vacía' 
      });
    }

    let result;
    const isRadicadoFormat = /^\d{4}-\d{5}$/.test(query.trim());

    // Opción 1 o búsqueda por radicado
    if (option === '1' || option === 'uno' || isRadicadoFormat) {
      if (!isRadicadoFormat) {
        return res.json({
          response: 'Para buscar un radicado, por favor ingresa el número completo en el formato correcto.\nEjemplo: 2014-00008'
        });
      }
      result = await searchByRadicado(query.trim());
    } 
    // Opción 2 o búsqueda por folio de matrícula
    else if (option === '2' || option === 'dos') {
      result = await searchByFolio(query);
    }
    else {
      return res.status(400).json({
        error: 'Por favor especifica una opción válida:\n1 o "uno" para buscar por radicado\n2 o "dos" para buscar por folio de matrícula'
      });
    }

    if (!result.found) {
      return res.json({ 
        response: result.message 
      });
    }

    // Format the response based on whether it's a single result or multiple
    let responseText;
    if (Array.isArray(result.data)) {
      // Multiple results (folio de matrícula search)
      responseText = 'Encontré los siguientes resultados:\n\n' +
        result.data.map((item, index) => 
          `${index + 1}. Radicado: ${item.radicado}\n` +
          `   Predio: ${item.predio}\n` +
          `   Municipio: ${item.municipio}\n` +
          `   Solicitante: ${item.solicitante}\n` +
          `   Opositor: ${item.opositor}\n` +
          `   Estado: ${item.estado}\n` +
          `   Última actuación: ${item.ultimaActuacion}\n` +
          `   Fecha Providencia: ${item.fechaProvidencia}\n` +
          `   Fecha notificación: ${item.fechaNotificacion}\n` +
          `   Días de última actuación: ${item.diasUltimaActuacion}\n` +
          `   Enlace: ${item.enlace}\n` +
          `   Sustanciador: ${item.sustanciador}`
        ).join('\n\n');
    } else {
      // Single result (radicado search)
      const data = result.data;
      responseText = 'Aquí está la información del radicado:\n\n' +
        `Radicado: ${data.radicado}\n` +
        `Predio: ${data.predio}\n` +
        `Municipio: ${data.municipio}\n` +
        `Solicitante: ${data.solicitante}\n` +
        `Opositor: ${data.opositor}\n` +
        `Estado: ${data.estado}\n` +
        `Última actuación: ${data.ultimaActuacion}\n` +
        `Fecha Providencia: ${data.fechaProvidencia}\n` +
        `Fecha notificación: ${data.fechaNotificacion}\n` +
        `Días de última actuación: ${data.diasUltimaActuacion}\n` +
        `Enlace: ${data.enlace}\n` +
        `Sustanciador: ${data.sustanciador}`;
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ 
      error: 'Error al procesar la consulta',
      details: error.message 
    });
  }
});

export default router;