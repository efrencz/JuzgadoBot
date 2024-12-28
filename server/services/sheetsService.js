import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde el directorio raíz
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Verificar variables de entorno requeridas
const requiredEnvVars = [
  'GOOGLE_SHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable de entorno requerida no encontrada: ${envVar}`);
  }
}

// Configurar autenticación de Google
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? 
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
      undefined,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Mapeo de índices de columnas
const COLUMN_INDICES = {
  RADICADO: 0,
  PREDIO: 1,
  MUNICIPIO: 2,
  SOLICITANTE: 3,
  OPOSITOR: 4,
  ESTADO: 5,
  ULTIMA_ACTUACION: 6,
  FECHA_PROVIDENCIA: 7,
  FECHA_NOTIFICACION: 8,
  DIAS_ULTIMA_ACTUACION: 9,
  ENLACE: 10,
  SUSTANCIADOR: 11
};

export async function searchInSheets(query, option) {
  try {
    console.log('Iniciando búsqueda en la hoja...');
    console.log('ID de la hoja:', process.env.GOOGLE_SHEET_ID);
    console.log('Consulta:', query);
    console.log('Opción:', option);

    // Primero, obtener información sobre la hoja de cálculo
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID
    });
    
    console.log('Hojas disponibles:', spreadsheet.data.sheets.map(sheet => sheet.properties.title));

    // Obtener todos los datos de la hoja
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Hoja 1'!A:L",  // Nombre correcto de la hoja con comillas simples para manejar el espacio
    });

    console.log('Datos crudos de la hoja:', response.data.values);

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron datos en la hoja de cálculo');
    }

    console.log(`Se encontraron ${rows.length} filas de datos`);

    // Buscar la fila que coincida con la consulta
    const foundRow = rows.find((row, index) => {
      if (index === 0) return false; // Ignorar la fila de encabezados
      
      if (option === '1') {
        // Búsqueda por radicado
        return row[COLUMN_INDICES.RADICADO] && 
               row[COLUMN_INDICES.RADICADO].toString().toLowerCase() === query.toLowerCase();
      } else {
        // Búsqueda por folio de matrícula
        if (!row[COLUMN_INDICES.PREDIO]) return false;
        
        // Extraer el número de folio del campo PREDIO
        const predioText = row[COLUMN_INDICES.PREDIO].toString();
        const folioMatch = predioText.match(/FMI\s*(\d{3}-\d{2,6})/i);
        
        if (folioMatch) {
          const folioInSheet = folioMatch[1];
          console.log(`Comparando folio: ${folioInSheet} con consulta: ${query}`);
          return folioInSheet === query;
        }
        return false;
      }
    });

    if (!foundRow) {
      throw new Error(option === '1' 
        ? 'No se encontró el radicado especificado'
        : 'No se encontró el folio de matrícula especificado');
    }

    console.log('Fila encontrada:', foundRow);

    // Formatear la respuesta con los datos encontrados
    const formatDate = (dateStr) => {
      if (!dateStr) return 'No disponible';
      return dateStr;
    };

    const result = {
      radicado: foundRow[COLUMN_INDICES.RADICADO] || 'No disponible',
      predio: foundRow[COLUMN_INDICES.PREDIO] || 'No disponible',
      municipio: foundRow[COLUMN_INDICES.MUNICIPIO] || 'No disponible',
      solicitante: foundRow[COLUMN_INDICES.SOLICITANTE] || 'No disponible',
      opositor: foundRow[COLUMN_INDICES.OPOSITOR] || 'No disponible',
      estado: foundRow[COLUMN_INDICES.ESTADO] || 'No disponible',
      ultimaActuacion: foundRow[COLUMN_INDICES.ULTIMA_ACTUACION] || 'No disponible',
      fechaProvidencia: formatDate(foundRow[COLUMN_INDICES.FECHA_PROVIDENCIA]),
      fechaNotificacion: formatDate(foundRow[COLUMN_INDICES.FECHA_NOTIFICACION]),
      diasUltimaActuacion: foundRow[COLUMN_INDICES.DIAS_ULTIMA_ACTUACION] || 'No disponible',
      enlace: foundRow[COLUMN_INDICES.ENLACE] || '',
      sustanciador: foundRow[COLUMN_INDICES.SUSTANCIADOR] || 'No disponible'
    };

    console.log('Resultado final:', result);
    
    return result;
  } catch (error) {
    console.error('Error al buscar en Google Sheets:', error);
    throw error;
  }
}

// Función para obtener eventos de la hoja de eventos
export const getEventsFromSheet = async () => {
  try {
    console.log('Iniciando obtención de eventos...');
    console.log('ID de la hoja:', process.env.GOOGLE_SHEET_ID);

    // Primero, obtener información sobre las hojas del documento
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID
    });
    
    const sheetNames = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
    console.log('Hojas disponibles:', sheetNames);
    
    // Obtener el nombre real de la segunda hoja
    const hoja2 = sheetsResponse.data.sheets[1]?.properties.title;
    if (!hoja2) {
      throw new Error('No se encontró la segunda hoja');
    }

    console.log('Nombre de la segunda hoja:', hoja2);
    const range = `${hoja2}!A2:D`;
    console.log('Intentando obtener eventos de la hoja:', range);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range,
    });

    console.log('Datos crudos de la hoja:', response.data.values);

    if (!response.data.values) {
      console.log('No se encontraron datos en la hoja');
      return [];
    }

    const rows = response.data.values;
    console.log(`Se encontraron ${rows.length} filas de datos`);

    const events = rows.map((row, index) => {
      console.log(`\nProcesando fila ${index + 2}:`, row);
      
      // Verificar que tengamos título y fecha
      if (!row[0] || !row[1]) {
        console.log(`Fila ${index + 2} sin título o fecha, saltando...`);
        return null;
      }

      // Parsear la fecha que viene en formato DD/MM/YYYY HH:mm:ss
      const fechaStr = row[1].trim();
      let fecha;
      try {
        const [datePart, timePart = '00:00:00'] = fechaStr.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
        
        // Crear fecha en formato ISO
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        fecha = new Date(isoDate);
        
        if (isNaN(fecha.getTime())) {
          console.log(`Fecha inválida en fila ${index + 2}:`, fechaStr);
          return null;
        }

        // Devolver el objeto con la fecha en formato ISO
        return {
          actividad: row[0],
          fecha: isoDate,
          horaInicio: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`,
          enlaceAudiencia: row[2] || ''
        };
      } catch (error) {
        console.log(`Error al parsear fecha en fila ${index + 2}:`, error);
        return null;
      }
    })
    .filter(event => event !== null)
    // Eliminar duplicados basándose en título y fecha
    .filter((event, index, self) => 
      index === self.findIndex((e) => 
        e.actividad === event.actividad && e.fecha === event.fecha
      )
    );

    console.log('Total de eventos encontrados:', events.length);
    console.log('Eventos finales:', events);

    return events;
  } catch (error) {
    console.error('Error detallado al obtener eventos de Google Sheets:', error);
    throw error;
  }
};
