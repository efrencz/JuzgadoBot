import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clearChatHistory = async (req, res) => {
    const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

    try {
        // Eliminar todos los registros de la tabla chat_histories
        db.run(`DELETE FROM chat_histories`, [], function(err) {
            if (err) {
                console.error('Error al limpiar el historial:', err);
                return res.status(500).json({ 
                    error: 'Error al limpiar el historial',
                    details: err.message 
                });
            }

            // Reiniciar el contador de autoincremento
            db.run(`DELETE FROM sqlite_sequence WHERE name='chat_histories'`, [], function(err) {
                if (err) {
                    console.error('Error al reiniciar la secuencia:', err);
                }
            });

            console.log(`Se eliminaron ${this.changes} registros`);
            res.json({ 
                success: true, 
                message: `Se eliminaron ${this.changes} registros del historial` 
            });
        });
    } catch (error) {
        console.error('Error en la limpieza del historial:', error);
        res.status(500).json({ 
            error: 'Error en la limpieza del historial',
            details: error.message 
        });
    } finally {
        db.close();
    }
};
