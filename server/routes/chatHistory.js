import express from 'express';
import ChatHistory from '../models/chatHistory.js';

const router = express.Router();

// POST: Guardar historial del chat
router.post('/chat-history', async (req, res) => {
  try {
    const { userId, phoneNumber, query, chatDate } = req.body;
    console.log('POST /chat-history - Received request body:', req.body);
    
    if (!userId || !phoneNumber || !query) {
      console.error('Missing required fields:', { userId, phoneNumber, query });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          userId: !userId,
          phoneNumber: !phoneNumber,
          query: !query
        }
      });
    }

    const chatHistory = await ChatHistory.create({
      userId,
      phoneNumber,
      query,
      chatDate: chatDate || new Date()
    });

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

export default router;
