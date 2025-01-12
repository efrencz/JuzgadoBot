import express from 'express';
import ChatHistory from '../models/chatHistory.js';
import { Op } from 'sequelize';

const router = express.Router();

// POST: Guardar historial del chat
router.post('/chat-history', async (req, res) => {
  try {
    const { userName, phoneNumber, query, response } = req.body;
    console.log('POST /chat-history - Received request body:', req.body);
    
    if (!userName || !phoneNumber || !query) {
      console.error('Missing required fields:', { userName, phoneNumber, query });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          userName: !userName,
          phoneNumber: !phoneNumber,
          query: !query
        }
      });
    }

    // Buscar o crear un registro para este usuario y teléfono
    let chatHistory = await ChatHistory.findOne({
      where: { 
        userName,
        phoneNumber,
        createdAt: {
          // Solo buscar registros de hoy
          [Op.gte]: new Date().setHours(0,0,0,0)
        }
      }
    });

    if (!chatHistory) {
      // Si no existe, crear nuevo registro
      chatHistory = await ChatHistory.create({
        userName,
        phoneNumber,
        sessionId: Date.now().toString(),
        queries: [query],
        responses: response ? [response] : []
      });
    } else {
      // Si existe, actualizar el registro existente
      const queries = chatHistory.queries;
      const responses = chatHistory.responses;
      
      queries.push(query);
      if (response) responses.push(response);
      
      await chatHistory.update({
        queries,
        responses
      });
    }

    console.log('Chat history saved successfully:', chatHistory.toJSON());
    res.status(201).json({ 
      message: 'Chat history saved successfully',
      data: chatHistory
    });
  } catch (error) {
    console.error('Error saving chat history:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Failed to save chat history',
      details: error.message
    });
  }
});

// GET: Obtener historial por usuario
router.get('/chat-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('GET /chat-history/:userId - Fetching history for:', userId);

    const history = await ChatHistory.findAll({
      where: { userId },
      order: [['chatDate', 'DESC']]
    });
    
    console.log(`Found ${history.length} records for user ${userId}`);

    // Si la solicitud acepta JSON, enviar JSON
    if (req.accepts('json')) {
      res.json(history);
    } else {
      // Si no, enviar una página HTML formateada
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chat History for ${userId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .chat-entry { 
              border: 1px solid #ddd; 
              margin: 10px 0; 
              padding: 15px;
              border-radius: 5px;
            }
            .timestamp { color: #666; font-size: 0.9em; }
            .query { margin-top: 10px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Chat History for User: ${userId}</h1>
          ${history.length === 0 ? '<p>No chat history found.</p>' :
            history.map(entry => `
              <div class="chat-entry">
                <div class="timestamp">Date: ${new Date(entry.chatDate).toLocaleString()}</div>
                <div>Phone: ${entry.phoneNumber}</div>
                <div class="query">Query: ${entry.query}</div>
              </div>
            `).join('')}
        </body>
        </html>
      `;
      res.type('html').send(htmlContent);
    }
  } catch (error) {
    console.error('Error fetching chat history:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    
    const errorMessage = error.message || 'Failed to fetch chat history';
    
    if (req.accepts('json')) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>${errorMessage}</p>
        </body>
        </html>
      `);
    }
  }
});

// Ruta para obtener todo el historial (admin)
router.get('/admin/chat-history', async (req, res) => {
  try {
    console.log('Obteniendo historial de chat...');
    
    const chatHistories = await ChatHistory.findAll({
      order: [['updatedAt', 'DESC']]
    });

    console.log(`Se encontraron ${chatHistories.length} registros`);

    // Formatear los resultados para incluir conteo y detalles
    const formattedHistories = chatHistories.map(history => {
      try {
        const queries = Array.isArray(history.queries) ? history.queries : [];
        const responses = Array.isArray(history.responses) ? history.responses : [];
        
        // Crear un array de conversaciones combinando preguntas y respuestas
        const conversations = queries.map((query, index) => {
          let response = null;
          try {
            response = responses[index] ? JSON.parse(responses[index]) : null;
          } catch (e) {
            console.error('Error parsing response:', e);
            response = { data: 'Error al procesar la respuesta' };
          }
          
          return {
            query,
            response: response?.data || 'Sin respuesta'
          };
        });

        return {
          id: history.id,
          userName: history.userName,
          phoneNumber: history.phoneNumber,
          totalConsultas: queries.length,
          fechaUltimaConsulta: history.updatedAt,
          fechaPrimeraConsulta: history.createdAt,
          conversations
        };
      } catch (error) {
        console.error('Error processing history record:', error);
        return {
          id: history.id,
          userName: history.userName || 'Error',
          phoneNumber: history.phoneNumber || 'Error',
          totalConsultas: 0,
          fechaUltimaConsulta: history.updatedAt,
          fechaPrimeraConsulta: history.createdAt,
          conversations: [],
          error: 'Error procesando el registro'
        };
      }
    });

    res.json(formattedHistories);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial',
      details: error.message 
    });
  }
});

// Ruta de prueba para crear registros de ejemplo
router.post('/test-data', async (req, res) => {
  try {
    const testData = [
      {
        userName: 'Juan Pérez',
        phoneNumber: '1234567890',
        sessionId: '1',
        queries: ['¿Cuál es el estado de mi radicado 123?', '¿Cuándo es la próxima audiencia?'],
        responses: ['El radicado 123 está en proceso', 'La próxima audiencia es el 15 de enero']
      },
      {
        userName: 'María López',
        phoneNumber: '0987654321',
        sessionId: '2',
        queries: ['Necesito información sobre el folio 456'],
        responses: ['El folio 456 está pendiente de revisión']
      }
    ];

    for (const data of testData) {
      await ChatHistory.create(data);
    }

    res.json({ message: 'Test data created successfully' });
  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({ error: 'Failed to create test data' });
  }
});

export default router;
