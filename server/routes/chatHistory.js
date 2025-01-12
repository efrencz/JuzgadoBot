import express from 'express';
import ChatHistory from '../models/chatHistory.js';
import { Op } from 'sequelize';

const router = express.Router();

// POST: Guardar historial del chat
router.post('/', async (req, res) => {
  try {
    const { userName, phoneNumber, query, response } = req.body;
    console.log('POST / - Received request body:', req.body);
    
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
router.get('/user/:userName', async (req, res) => {
  try {
    const { userName } = req.params;
    console.log('GET /user/:userName - Fetching history for:', userName);

    const history = await ChatHistory.findAll({
      where: { userName },
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${history.length} records for user ${userName}`);

    // Si se solicita formato HTML
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Chat History for ${userName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .chat-item { margin-bottom: 20px; }
              .query { color: #2c3e50; }
              .response { color: #27ae60; margin-left: 20px; }
            </style>
          </head>
          <body>
            <h1>Chat History for User: ${userName}</h1>
            ${history.map(chat => `
              <div class="chat-item">
                <p class="query"><strong>Query:</strong> ${chat.queries.join(', ')}</p>
                <p class="response"><strong>Response:</strong> ${chat.responses.join(', ')}</p>
                <small>Date: ${new Date(chat.createdAt).toLocaleString()}</small>
              </div>
            `).join('')}
          </body>
        </html>
      `;
      res.send(htmlContent);
    } else {
      // Si se solicita JSON
      res.json({
        success: true,
        userName: req.params.userName,
        data: history
      });
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      error: 'Error fetching chat history',
      details: error.message 
    });
  }
});

// GET: Obtener todo el historial (ruta admin)
router.get('/admin', async (req, res) => {
  try {
    console.log('GET /admin - Fetching all chat history');

    const history = await ChatHistory.findAll({
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${history.length} total records`);

    // Si se solicita formato HTML
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>All Chat History</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .chat-item { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              .user-info { color: #2c3e50; font-weight: bold; }
              .query { color: #2c3e50; margin-left: 20px; }
              .response { color: #27ae60; margin-left: 40px; }
              .timestamp { color: #7f8c8d; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <h1>All Chat History</h1>
            ${history.map(chat => `
              <div class="chat-item">
                <p class="user-info">User: ${chat.userName} (${chat.phoneNumber})</p>
                <p class="query"><strong>Queries:</strong> ${chat.queries.join(', ')}</p>
                <p class="response"><strong>Responses:</strong> ${chat.responses.join(', ')}</p>
                <p class="timestamp">Date: ${new Date(chat.createdAt).toLocaleString()}</p>
              </div>
            `).join('')}
          </body>
        </html>
      `;
      res.send(htmlContent);
    } else {
      // Si se solicita JSON
      res.json({
        success: true,
        data: history
      });
    }
  } catch (error) {
    console.error('Error fetching all chat history:', error);
    res.status(500).json({ 
      error: 'Error fetching chat history',
      details: error.message 
    });
  }
});

// DELETE: Limpiar todo el historial
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('DELETE /clear-all - Limpiando todo el historial');
    
    // Eliminar todos los registros
    await ChatHistory.destroy({
      where: {},
      truncate: true
    });

    console.log('Historial limpiado exitosamente');
    res.json({ 
      success: true, 
      message: 'Historial limpiado exitosamente' 
    });
  } catch (error) {
    console.error('Error al limpiar el historial:', error);
    res.status(500).json({ 
      error: 'Error al limpiar el historial',
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
