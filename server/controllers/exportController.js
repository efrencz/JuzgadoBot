import sqlite3 from 'sqlite3';
import { Parser } from 'json2csv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const exportChatHistory = async (req, res) => {
    const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

    try {
        // Obtener todos los registros de la tabla de chat
        db.all(`
            SELECT 
                ch.id,
                ch.user_name,
                ch.phone_number,
                ch.queries,
                ch.responses,
                ch.created_at,
                ch.updated_at
            FROM chat_histories ch
            ORDER BY ch.created_at DESC
        `, [], (err, rows) => {
            if (err) {
                console.error('Error al obtener los datos:', err);
                return res.status(500).json({ error: 'Error al exportar los datos' });
            }

            try {
                // Procesar los datos para el CSV
                const processedRows = rows.map(row => {
                    let queries = [];
                    let responses = [];
                    
                    try {
                        queries = JSON.parse(row.queries);
                        responses = JSON.parse(row.responses);
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }

                    // Combinar queries y responses
                    const conversations = queries.map((query, index) => ({
                        query,
                        response: responses[index] || ''
                    }));

                    return {
                        id: row.id,
                        nombre_usuario: row.user_name,
                        telefono: row.phone_number,
                        consultas: conversations.map(c => c.query).join(' | '),
                        respuestas: conversations.map(c => c.response).join(' | '),
                        fecha_creacion: row.created_at,
                        fecha_actualizacion: row.updated_at
                    };
                });

                // Configurar los campos para el CSV
                const fields = [
                    'id',
                    'nombre_usuario',
                    'telefono',
                    'consultas',
                    'respuestas',
                    'fecha_creacion',
                    'fecha_actualizacion'
                ];

                // Crear el parser con opciones para caracteres especiales
                const json2csvParser = new Parser({ 
                    fields,
                    delimiter: ',',
                    quote: '"',
                    escapedQuote: '""'
                });
                
                // Convertir a CSV
                const csv = json2csvParser.parse(processedRows);

                // Configurar headers para la descarga
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename=chat_history.csv');

                // Enviar el CSV
                res.send(csv);
            } catch (error) {
                console.error('Error al generar CSV:', error);
                res.status(500).json({ error: 'Error al generar el archivo CSV' });
            }
        });
    } catch (error) {
        console.error('Error en exportación:', error);
        res.status(500).json({ error: 'Error en la exportación' });
    } finally {
        db.close();
    }
};

export default { exportChatHistory };
