import express from 'express';
import { exportChatHistory } from '../controllers/exportController.js';

const router = express.Router();

// Ruta para exportar el historial de chat
router.get('/chat-history', exportChatHistory);

export default router;
