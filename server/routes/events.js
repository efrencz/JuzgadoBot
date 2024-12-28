import express from 'express';
import { getEventsFromSheet } from '../services/sheetsService.js';

const router = express.Router();

// GET /api/events - Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    console.log('Recibida solicitud de eventos');
    const events = await getEventsFromSheet();
    console.log('Eventos obtenidos:', events);
    res.json({ events });
  } catch (error) {
    console.error('Error detallado al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message 
    });
  }
});

export default router;
