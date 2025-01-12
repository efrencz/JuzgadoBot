import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import ChatHistory from '../models/chatHistory.js';
import { Op } from 'sequelize';
import { getSheetData } from '../services/sheetsService.js';

const router = express.Router();

// Middleware para verificar token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
    const admin = await Admin.findByPk(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Ruta para verificar token
router.get('/verify-token', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Ruta para login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const isValid = await admin.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para manejar consultas
router.post('/query', async (req, res) => {
  try {
    const { query, option, userName, userPhone } = req.body;
    console.log('Received query:', { query, option, userName, userPhone });

    // Validar datos requeridos
    if (!query || !option) {
      console.error('Missing required data');
      return res.status(400).json({ 
        error: 'Missing required data. Need at least: query and option' 
      });
    }

    // Validar que la consulta no esté vacía
    if (query.trim() === '') {
      console.error('Empty query');
      return res.status(400).json({ error: 'Query cannot be empty' });
    }

    // Validar la opción
    if (!['radicado', 'predio', 'folio'].includes(option)) {
      console.error('Invalid search option:', option);
      return res.status(400).json({ error: 'Invalid search option' });
    }

    try {
      // Buscar en Google Sheets
      console.log('Iniciando búsqueda en Google Sheets...');
      const resultado = await getSheetData(query, option);
      console.log('Resultado de la búsqueda:', resultado);

      if (!resultado || (Array.isArray(resultado) && resultado.length === 0)) {
        console.log('No se encontraron resultados');
        return res.json({
          data: null,
          message: 'No se encontraron resultados para la búsqueda.'
        });
      }

      // Guardar el historial de chat
      if (userName && userPhone) {
        const sessionId = Date.now().toString(); // Generar un sessionId único
        await ChatHistory.create({
          userName,
          phoneNumber: userPhone,
          sessionId,
          queries: [query],
          responses: [JSON.stringify(resultado)]
        });
      }

      // Enviar respuesta
      return res.json({
        data: resultado,
        message: 'Búsqueda exitosa'
      });

    } catch (error) {
      console.error('Error searching in Google Sheets:', error);
      return res.status(500).json({ 
        error: 'Error al buscar en la base de datos' 
      });
    }
  } catch (error) {
    console.error('Error in query endpoint:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener estadísticas (protegida)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const chatHistories = await ChatHistory.findAll({
      order: [['createdAt', 'DESC']],
      raw: true
    });

    // Procesar los datos antes de enviarlos
    const processedHistories = chatHistories.map(history => ({
      ...history,
      queries: JSON.parse(history.queries || '[]'),
      responses: JSON.parse(history.responses || '[]')
    }));

    res.json(processedHistories);
  } catch (error) {
    console.error('Error fetching chat statistics:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Ruta para buscar chat por número de teléfono (protegida)
router.get('/chat-history/:phone', verifyToken, async (req, res) => {
  try {
    const { phone } = req.params;
    const chatHistories = await ChatHistory.findAll({
      where: {
        phoneNumber: phone
      },
      order: [['createdAt', 'DESC']],
      raw: true
    });

    if (!chatHistories.length) {
      return res.status(404).json({ error: 'No se encontró historial para este número' });
    }

    // Procesar los datos antes de enviarlos
    const processedHistories = chatHistories.map(history => ({
      ...history,
      queries: JSON.parse(history.queries || '[]'),
      responses: JSON.parse(history.responses || '[]')
    }));

    res.json(processedHistories);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Ruta protegida para obtener estadísticas
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('Fetching statistics...');

    const allChats = await ChatHistory.findAll({
      attributes: ['userName', 'phoneNumber', 'sessionId', 'queries', 'responses', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log('Found chats:', allChats.length);

    const stats = allChats.map(chat => {
      try {
        const chatData = chat.get({ plain: true });
        return {
          userName: chatData.userName || 'Anónimo',
          phoneNumber: chatData.phoneNumber || 'No disponible',
          sessionId: chatData.sessionId,
          queries: chatData.queries,
          responses: chatData.responses,
          createdAt: chatData.createdAt
        };
      } catch (error) {
        console.error('Error processing chat:', error);
        return null;
      }
    }).filter(Boolean);

    console.log('Processed stats:', stats.length);
    res.json(stats);

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener historial de chat
router.get('/chat-history/:phoneNumber', verifyToken, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const chatHistory = await ChatHistory.findAll({
      where: { phoneNumber },
      order: [['createdAt', 'DESC']]
    });

    res.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

// Ruta para cambiar contraseña del admin
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    console.log('Changing password for user:', req.user.username);
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      console.log('Admin not found');
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    const isValid = await admin.validatePassword(currentPassword);
    console.log('Current password validation:', isValid);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    await admin.update({ password: newPassword });
    console.log('Password updated successfully');
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
});

export default router;
