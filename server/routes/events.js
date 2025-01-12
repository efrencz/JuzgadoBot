import express from 'express';
import { getEventsFromSheet } from '../services/sheetsService.js';

const router = express.Router();

// Datos de respaldo
const fallbackEvents = [
  {
    fecha: new Date().toISOString().split('T')[0],
    actividad: "No hay eventos programados para hoy",
    horaInicio: "09:00",
    enlaceAudiencia: ""
  }
];

// GET /api/events - Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    console.log('Recibida solicitud de eventos');
    let events;
    
    try {
      events = await getEventsFromSheet();
    } catch (error) {
      console.error('Error al obtener eventos de la hoja:', error);
      events = { events: fallbackEvents };
    }

    if (!events || !events.events || events.events.length === 0) {
      console.log('No se encontraron eventos, usando datos de respaldo');
      events = { events: fallbackEvents };
    }

    console.log('Enviando eventos:', events);
    res.json(events);
  } catch (error) {
    console.error('Error detallado al obtener eventos:', error);
    res.status(200).json({ events: fallbackEvents });
  }
});

export default router;
