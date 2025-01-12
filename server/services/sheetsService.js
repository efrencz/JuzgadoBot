import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde el directorio raíz
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== Configuración de Google Sheets ===');
console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('GOOGLE_PRIVATE_KEY está presente:', !!process.env.GOOGLE_PRIVATE_KEY);

// Verificar variables de entorno requeridas
const requiredEnvVars = [
  'GOOGLE_SHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Variable de entorno requerida no encontrada: ${envVar}`);
    throw new Error(`Variable de entorno requerida no encontrada: ${envVar}`);
  }
}

// Configurar autenticación de Google
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

console.log('Autenticación de Google configurada');

// Columnas esperadas para eventos
const EXPECTED_COLUMNS = {
  ACTIVIDAD: ['Actividad', 'actividad'],
  FECHA: ['Hora de inicio', 'hora de inicio'],
  HORA: ['hora', 'horainicio', 'hora inicio', 'time', 'hora_inicio', 'hora audiencia'],
  ENLACE: ['Enlace audiencia', 'enlace audiencia']
};

// Mapeo de índices de columnas para la Hoja 1
const COLUMN_INDICES_SHEET1 = {
  RADICADO: 0,        // A
  PREDIO: 1,          // B
  MUNICIPIO: 2,       // C
  SOLICITANTE: 3,     // D
  OPOSITOR: 4,        // E
  ESTADO: 5,          // F
  ULTIMA_ACTUACION: 6, // G
  FECHA_PROVIDENCIA: 7, // H
  FECHA_NOTIFICACION: 8, // I
  DIAS_ULTIMA_ACTUACION: 9, // J
  ENLACE: 10,         // K
  SUSTANCIADOR: 11    // L
};

// Mapeo de índices de columnas para la Hoja 3
const COLUMN_INDICES_SHEET3 = {
  RADICADO: 0,        // A
  PREDIO: 1,          // B
  MUNICIPIO: 2,       // C
  SOLICITANTE: 3,     // D
  FECHA_SENTENCIA: 4, // E
  ENLACE_SENTENCIA: 5 // F
};

// Función para normalizar texto (remover acentos y convertir a minúsculas)
const normalizeText = (text) => {
  return text.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Función para extraer folios de un texto
const extractFolios = (text) => {
  const folioPattern = /\d{3}-\d{1,6}/g;
  const matches = text.match(folioPattern) || [];
  return matches;
};

// Función para obtener datos de una hoja específica
const getSheetData = async (query, option) => {
  try {
    console.log('\n=== Nueva consulta a Google Sheets ===');
    console.log('Parámetros de búsqueda:', { query, option });
    
    // Obtener datos de ambas hojas
    const [responseSheet1, responseSheet3] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Hoja 1!A2:L',
        valueRenderOption: 'FORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Hoja 3!A2:F',
        valueRenderOption: 'FORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      })
    ]);

    if (!responseSheet1.data || !responseSheet1.data.values) {
      console.error('No se encontraron datos en la Hoja 1');
      throw new Error('No se encontraron datos en la Hoja 1');
    }

    const rowsSheet1 = responseSheet1.data.values;
    const rowsSheet3 = responseSheet3.data?.values || [];

    console.log(`Total de filas encontradas en Hoja 1: ${rowsSheet1.length}`);
    console.log(`Total de filas encontradas en Hoja 3: ${rowsSheet3.length}`);

    // Normalizar el término de búsqueda
    const normalizedQuery = normalizeText(query);

    let results = [];

    if (option === 'radicado') {
      // Buscar en Hoja 1
      const resultsSheet1 = rowsSheet1
        .filter(row => {
          const radicado = normalizeText(row[COLUMN_INDICES_SHEET1.RADICADO] || '');
          return radicado.includes(normalizedQuery);
        })
        .map(row => ({
          source: 'Hoja 1',
          radicado: row[COLUMN_INDICES_SHEET1.RADICADO] || '',
          predio: row[COLUMN_INDICES_SHEET1.PREDIO] || '',
          municipio: row[COLUMN_INDICES_SHEET1.MUNICIPIO] || '',
          solicitante: row[COLUMN_INDICES_SHEET1.SOLICITANTE] || '',
          opositor: row[COLUMN_INDICES_SHEET1.OPOSITOR] || '',
          estado: row[COLUMN_INDICES_SHEET1.ESTADO] || '',
          ultimaActuacion: row[COLUMN_INDICES_SHEET1.ULTIMA_ACTUACION] || '',
          fechaProvidencia: row[COLUMN_INDICES_SHEET1.FECHA_PROVIDENCIA] || '',
          fechaNotificacion: row[COLUMN_INDICES_SHEET1.FECHA_NOTIFICACION] || '',
          diasUltimaActuacion: row[COLUMN_INDICES_SHEET1.DIAS_ULTIMA_ACTUACION] || '',
          enlace: row[COLUMN_INDICES_SHEET1.ENLACE] || '',
          sustanciador: row[COLUMN_INDICES_SHEET1.SUSTANCIADOR] || ''
        }));

      // Buscar en Hoja 3
      const resultsSheet3 = rowsSheet3
        .filter(row => {
          const radicado = normalizeText(row[COLUMN_INDICES_SHEET3.RADICADO] || '');
          return radicado.includes(normalizedQuery);
        })
        .map(row => ({
          source: 'Hoja 3',
          radicado: row[COLUMN_INDICES_SHEET3.RADICADO] || '',
          predio: row[COLUMN_INDICES_SHEET3.PREDIO] || '',
          municipio: row[COLUMN_INDICES_SHEET3.MUNICIPIO] || '',
          solicitante: row[COLUMN_INDICES_SHEET3.SOLICITANTE] || '',
          fechaSentencia: row[COLUMN_INDICES_SHEET3.FECHA_SENTENCIA] || '',
          enlaceSentencia: row[COLUMN_INDICES_SHEET3.ENLACE_SENTENCIA] || ''
        }));

      results = [...resultsSheet1, ...resultsSheet3];
    } else {
      // Para búsqueda por folio, buscar en ambas hojas
      const searchFolio = normalizeText(query);
      
      // Buscar en Hoja 1
      const resultsSheet1 = rowsSheet1
        .filter(row => {
          const predio = normalizeText(row[COLUMN_INDICES_SHEET1.PREDIO] || '');
          return predio.includes(searchFolio);
        })
        .map(row => ({
          source: 'Hoja 1',
          radicado: row[COLUMN_INDICES_SHEET1.RADICADO] || '',
          predio: row[COLUMN_INDICES_SHEET1.PREDIO] || '',
          municipio: row[COLUMN_INDICES_SHEET1.MUNICIPIO] || '',
          solicitante: row[COLUMN_INDICES_SHEET1.SOLICITANTE] || '',
          opositor: row[COLUMN_INDICES_SHEET1.OPOSITOR] || '',
          estado: row[COLUMN_INDICES_SHEET1.ESTADO] || '',
          ultimaActuacion: row[COLUMN_INDICES_SHEET1.ULTIMA_ACTUACION] || '',
          fechaProvidencia: row[COLUMN_INDICES_SHEET1.FECHA_PROVIDENCIA] || '',
          fechaNotificacion: row[COLUMN_INDICES_SHEET1.FECHA_NOTIFICACION] || '',
          diasUltimaActuacion: row[COLUMN_INDICES_SHEET1.DIAS_ULTIMA_ACTUACION] || '',
          enlace: row[COLUMN_INDICES_SHEET1.ENLACE] || '',
          sustanciador: row[COLUMN_INDICES_SHEET1.SUSTANCIADOR] || ''
        }));

      // Buscar en Hoja 3
      const resultsSheet3 = rowsSheet3
        .filter(row => {
          const predio = normalizeText(row[COLUMN_INDICES_SHEET3.PREDIO] || '');
          return predio.includes(searchFolio);
        })
        .map(row => ({
          source: 'Hoja 3',
          radicado: row[COLUMN_INDICES_SHEET3.RADICADO] || '',
          predio: row[COLUMN_INDICES_SHEET3.PREDIO] || '',
          municipio: row[COLUMN_INDICES_SHEET3.MUNICIPIO] || '',
          solicitante: row[COLUMN_INDICES_SHEET3.SOLICITANTE] || '',
          fechaSentencia: row[COLUMN_INDICES_SHEET3.FECHA_SENTENCIA] || '',
          enlaceSentencia: row[COLUMN_INDICES_SHEET3.ENLACE_SENTENCIA] || ''
        }));

      results = [...resultsSheet1, ...resultsSheet3];
    }

    console.log(`Resultados encontrados: ${results.length}`);
    return results;

  } catch (error) {
    console.error('Error al obtener datos de Google Sheets:', error);
    throw error;
  }
};

// Datos de respaldo para cuando no hay conexión con Google Sheets
const fallbackEvents = [
  {
    fecha: new Date().toISOString().split('T')[0],
    actividad: "No hay eventos programados para hoy",
    horaInicio: "09:00",
    enlaceAudiencia: ""
  }
];

// Función para obtener eventos de la hoja de eventos
const getEventsFromSheet = async () => {
  try {
    console.log('Iniciando obtención de eventos...');
    
    // Verificar variables de entorno
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Variables de entorno de Google Sheets no configuradas, usando datos de respaldo');
      return { events: fallbackEvents };
    }

    try {
      // Obtener información de la hoja de cálculo
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID
      });
      
      // Obtener el nombre de la segunda hoja
      const hoja2 = sheetsResponse.data.sheets[1]?.properties.title;
      if (!hoja2) {
        console.log('No se encontró la segunda hoja, usando datos de respaldo');
        return { events: fallbackEvents };
      }

      console.log('Nombre de la segunda hoja:', hoja2);
      
      // Leer los datos de la hoja
      console.log('Obteniendo datos de la hoja:', hoja2);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `'${hoja2}'!A1:Z1000`, // Leer hasta 1000 filas
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      console.log('Respuesta completa de la hoja:', JSON.stringify(response.data, null, 2));
      console.log('Número total de filas:', response.data.values ? response.data.values.length : 0);

      if (!response.data.values || response.data.values.length === 0) {
        console.log('No se encontraron eventos en la hoja, usando datos de respaldo');
        return { events: fallbackEvents };
      }

      // Obtener los encabezados de las columnas y normalizarlos
      const headers = response.data.values[0].map(header => 
        header ? normalizeText(header) : ''
      );
      console.log('Encabezados de columnas:', headers);

      // Filtrar las filas vacías y mapear los eventos
      const events = response.data.values.slice(1)
        .filter(row => row.length > 0 && row.some(cell => cell !== '' && cell !== null && cell !== undefined))
        .map((row, index) => {
          console.log(`Procesando fila ${index + 1}:`, row);
          
          // Crear un objeto que mapee los encabezados con los valores
          const eventData = {};
          headers.forEach((header, idx) => {
            if (header && row[idx] !== undefined && row[idx] !== null) {
              eventData[normalizeText(header)] = row[idx].toString().trim();
            }
          });

          console.log(`Datos procesados de la fila ${index + 1}:`, eventData);

          // Encontrar las columnas correctas basadas en los nombres esperados
          const getValueFromColumns = (columnNames) => {
            const foundColumn = columnNames.map(normalizeText).find(name => eventData[name]);
            return foundColumn ? eventData[foundColumn] : null;
          };

          // Obtener la fecha y convertirla al formato correcto
          let fechaHora = getValueFromColumns(EXPECTED_COLUMNS.FECHA);
          let fecha = null;
          let horaInicio = '00:00';
          
          if (fechaHora) {
            try {
              console.log('=== PROCESANDO FECHA ===');
              console.log('Fecha original del Excel:', fechaHora);
              
              // El formato es DD/MM/YYYY HH:mm:ss
              const [fechaParte, horaParte] = fechaHora.split(' ');
              const [dia, mes, anio] = fechaParte.split('/').map(str => str.trim());
              
              // Asegurarnos de que el mes y día tengan dos dígitos
              const mesFormateado = mes.toString().padStart(2, '0');
              const diaFormateado = dia.toString().padStart(2, '0');
              
              // Crear la fecha en formato ISO YYYY-MM-DD
              fecha = `${anio}-${mesFormateado}-${diaFormateado}`;
              
              // Extraer la hora (si existe)
              if (horaParte) {
                horaInicio = horaParte.split(':').slice(0, 2).join(':');
              }
              
              console.log('Fecha procesada:', {
                fechaOriginal: fechaHora,
                componentes: {
                  dia: diaFormateado,
                  mes: mesFormateado,
                  anio: anio
                },
                fechaFinal: fecha,
                hora: horaInicio
              });
              console.log('=== FIN PROCESAMIENTO ===');
            } catch (error) {
              console.error('Error al procesar la fecha y hora:', {
                fechaOriginal: fechaHora,
                error: error.message,
                stack: error.stack
              });
              fecha = new Date().toISOString().split('T')[0];
            }
          }

          // Construir el objeto del evento con los campos requeridos
          const event = {
            actividad: getValueFromColumns(EXPECTED_COLUMNS.ACTIVIDAD) || 'Sin descripción',
            fecha: fecha || new Date().toISOString().split('T')[0],
            horaInicio: horaInicio,
            enlaceAudiencia: getValueFromColumns(EXPECTED_COLUMNS.ENLACE) || ''
          };

          console.log('Evento creado:', event);
          return event;
        })
        .filter(event => {
          // Validar que la fecha sea válida
          try {
            const fecha = new Date(event.fecha);
            return !isNaN(fecha.getTime());
          } catch (error) {
            console.warn('Fecha inválida encontrada:', event.fecha);
            return false;
          }
        });

      console.log('Total de eventos procesados:', events.length);
      console.log('Lista final de eventos:', JSON.stringify(events, null, 2));
      return { events };
    } catch (error) {
      console.error('Error al obtener datos de Google Sheets:', error);
      return { events: fallbackEvents };
    }
  } catch (error) {
    console.error('Error general en getEventsFromSheet:', error);
    return { events: fallbackEvents };
  }
};

// Exportar todas las funciones necesarias
export {
  getSheetData,
  getEventsFromSheet,
  fallbackEvents
};
