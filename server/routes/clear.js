import express from 'express';
import { clearChatHistory } from '../controllers/clearHistoryController.js';

const router = express.Router();

// Ruta para limpiar el historial de chat
router.delete('/chat-history', clearChatHistory);

export default router;
