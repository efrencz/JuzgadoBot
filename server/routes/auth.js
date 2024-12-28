import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import ChatHistory from '../models/chatHistory.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { searchInSheets } from '../services/sheetsService.js';

const router = express.Router();

// Ruta para manejar consultas
router.post('/query', async (req, res) => {
  const { query, option, userName, userPhone } = req.body;

  try {
    console.log('Recibida consulta:', { query, option, userName, userPhone });

    // Validar que la consulta no esté vacía
    if (!query || query.trim() === '') {
      throw new Error('La consulta no puede estar vacía');
    }

    // Buscar en Google Sheets
    const resultado = await searchInSheets(query, option);
    console.log('Resultado de búsqueda:', resultado);

    // Formatear la respuesta antes de guardarla
    const respuestaFormateada = {
      radicado: resultado.radicado || query,
      predio: resultado.predio || 'No disponible',
      municipio: resultado.municipio || 'No disponible',
      solicitante: resultado.solicitante || 'No disponible',
      opositor: resultado.opositor || 'No disponible',
      estado: resultado.estado || 'No disponible',
      ultimaActuacion: resultado.ultimaActuacion || 'No disponible',
      fechaProvidencia: resultado.fechaProvidencia || 'No disponible',
      fechaNotificacion: resultado.fechaNotificacion || 'No disponible',
      enlace: resultado.enlace || ''
    };

    // Guardar en el historial si el usuario proporcionó su información
    if (userName && userPhone) {
      // Asegurarse de que la consulta sea almacenada exactamente como fue ingresada
      const chatEntry = {
        userId: userName,
        phoneNumber: userPhone,
        query: query.trim(), // Guardar la consulta original limpia
        response: JSON.stringify(respuestaFormateada),
        createdAt: new Date()
      };

      console.log('Guardando en historial:', chatEntry);

      await ChatHistory.create(chatEntry);
    } else {
      console.log('No se guardó en historial - falta userName o userPhone:', { userName, userPhone });
    }
    
    // Retornar el resultado
    res.json(respuestaFormateada);
  } catch (error) {
    console.error('Error al procesar la consulta:', error);
    
    // Crear una respuesta de error formateada
    const respuestaError = {
      radicado: query || 'No disponible',
      predio: 'Error al procesar',
      municipio: 'Error al procesar',
      solicitante: 'Error al procesar',
      opositor: 'Error al procesar',
      estado: 'Error al procesar',
      ultimaActuacion: 'Error al procesar',
      fechaProvidencia: 'Error al procesar',
      fechaNotificacion: 'Error al procesar',
      enlace: ''
    };

    if (userName && userPhone) {
      // También guardar los intentos fallidos en el historial
      await ChatHistory.create({
        userId: userName,
        phoneNumber: userPhone,
        query: query ? query.trim() : 'Consulta inválida',
        response: JSON.stringify(respuestaError),
        createdAt: new Date()
      });
    }

    res.status(500).json(respuestaError);
  }
});

// Ruta para guardar el historial del chat
router.post('/chat-history', async (req, res) => {
  const { userId, phoneNumber, query, chatDate } = req.body;

  try {
    // Aquí puedes implementar la lógica para guardar el historial en la base de datos
    await ChatHistory.create({
      userId,
      phoneNumber,
      query,
      chatDate,
    });

    res.status(201).json({ message: 'Chat history saved successfully' });
  } catch (error) {
    console.error('Error al guardar el historial del chat:', error);
    res.status(500).json({ message: 'Error al guardar el historial del chat' });
  }
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
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
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    console.log('Login attempt for username:', username);
    
    // Buscar el usuario
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      console.log('Admin user not found');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña
    const isValid = await admin.validatePassword(password);
    console.log('Password validation result:', isValid);
    
    if (!isValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '24h' } // Aumentamos el tiempo de expiración a 24 horas
    );

    console.log('Login successful for user:', username);
    res.json({ 
      token,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    console.error(error.stack);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta protegida para obtener estadísticas
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('Fetching statistics...');

    // Obtener todas las consultas con el contenido
    const allChats = await ChatHistory.findAll({
      attributes: [
        'userId',
        'phoneNumber',
        'query',
        'response',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('Found chats:', allChats.length);

    // Procesar los datos para agruparlos por usuario y fecha
    const statsMap = new Map();
    
    allChats.forEach(chat => {
      try {
        const date = chat.createdAt.toISOString().split('T')[0];
        const key = `${date}-${chat.userId}-${chat.phoneNumber}`;
        
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            date: chat.createdAt,
            userId: chat.userId,
            phoneNumber: chat.phoneNumber,
            conversations: []
          });
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(chat.response);
        } catch (e) {
          console.error('Error parsing response:', e);
          parsedResponse = { error: 'Error al procesar la respuesta' };
        }

        // Agregar la conversación al array
        statsMap.get(key).conversations.push({
          query: chat.query || 'No disponible',  // Asegurarse de que la consulta tenga un valor
          response: parsedResponse
        });
      } catch (error) {
        console.error('Error processing chat entry:', error);
      }
    });

    // Convertir el Map a un array de resultados
    const stats = Array.from(statsMap.values())
      .sort((a, b) => b.date - a.date) // Ordenar por fecha descendente
      .map(stat => ({
        date: stat.date,
        userId: stat.userId,
        phoneNumber: stat.phoneNumber,
        messageCount: stat.conversations.length,
        conversations: stat.conversations
      }));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'El servidor está funcionando correctamente!' });
});

export default router;
