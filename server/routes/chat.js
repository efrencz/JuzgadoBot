import express from 'express';
import ChatHistory from '../models/chatHistory.js';

const router = express.Router();

// Ruta para procesar consultas
router.post('/query', async (req, res) => {
  try {
    const { query, option, userName, userPhone, sessionId } = req.body;
    console.log('Received query:', { query, option, userName, userPhone, sessionId });

    // Buscar o crear un registro de chat
    let chatHistory = await ChatHistory.findOne({
      where: { sessionId }
    });

    console.log('Existing chat history:', chatHistory ? chatHistory.toJSON() : 'None');

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userName,
        phoneNumber: userPhone,
        sessionId,
        queries: [query],
        responses: [{ option, response: 'Procesando consulta...' }]
      });
      console.log('Created new chat history:', chatHistory.toJSON());
    } else {
      // Obtener los arrays actuales
      const queries = Array.isArray(chatHistory.queries) ? chatHistory.queries : [];
      const responses = Array.isArray(chatHistory.responses) ? chatHistory.responses : [];
      
      // Agregar la nueva consulta y respuesta
      queries.push(query);
      responses.push({ option, response: 'Procesando consulta...' });
      
      // Actualizar el registro
      await chatHistory.update({
        queries,
        responses
      });
      console.log('Updated chat history:', chatHistory.toJSON());
    }

    // Aquí procesarías la consulta y generarías una respuesta
    const response = {
      message: `Respuesta a la consulta: ${query}`,
      option
    };

    // Actualizar la última respuesta
    const responses = Array.isArray(chatHistory.responses) ? chatHistory.responses : [];
    if (responses.length > 0) {
      responses[responses.length - 1].response = response.message;
      await chatHistory.update({ responses });
      console.log('Updated response in chat history:', chatHistory.toJSON());
    }

    res.json(response);
  } catch (error) {
    console.error('Error in chat query:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener el historial de chat
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatHistory = await ChatHistory.findOne({
      where: { sessionId }
    });
    
    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }

    res.json({
      userName: chatHistory.userName,
      phoneNumber: chatHistory.phoneNumber,
      queries: chatHistory.queries,
      responses: chatHistory.responses,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para finalizar chat
router.post('/end', async (req, res) => {
  try {
    const { userName, userPhone, sessionId, queries, responses } = req.body;
    
    // Buscar o crear un registro de chat
    let chatHistory = await ChatHistory.findOne({
      where: { sessionId }
    });

    if (chatHistory) {
      await chatHistory.update({
        queries,
        responses
      });
    } else {
      await ChatHistory.create({
        userName,
        phoneNumber: userPhone,
        sessionId,
        queries,
        responses
      });
    }

    res.json({ message: 'Chat finalizado y guardado correctamente' });
  } catch (error) {
    console.error('Error ending chat:', error);
    res.status(500).json({ error: 'Error al finalizar el chat' });
  }
});

export default router;
