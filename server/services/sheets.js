import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'GOOGLE_SHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export async function initializeSheet() {
    try {
        console.log(`Initializing Google Sheets with Sheet ID: ${SHEET_ID}`);
        console.log('Loading Google Sheet...');
        
        // Verificar las variables de entorno
        console.log('Environment variables:');
        console.log('- Sheet ID:', SHEET_ID);
        console.log('- Service Account:', SERVICE_ACCOUNT_EMAIL);
        console.log('- Private Key length:', PRIVATE_KEY?.length || 0);
        
        const serviceAccountAuth = new JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Verificar autenticación
        const tokens = await serviceAccountAuth.authorize();
        console.log('Authentication successful');
        console.log('Token type:', tokens.token_type);
        console.log('Access token:', tokens.access_token?.substring(0, 50) + '...');

        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        
        console.log('Loading document info...');
        await doc.loadInfo();
        
        console.log('Document loaded successfully');
        console.log('Title:', doc.title);
        console.log('Sheet count:', doc.sheetCount);
        
        const sheet = doc.sheetsByIndex[0];
        console.log('Loading first sheet:', sheet.title);
        await sheet.loadCells();
        
        return sheet;
    } catch (error) {
        console.error('Failed to initialize Google Sheets');
        if (error.response?.data) {
            console.error('API Error:', error.response.data);
        }
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status
        });
        throw error;
    }
}

async function getSheetData() {
  const sheet = await initializeSheet();
  console.log('Using sheet:', sheet.title);
  
  const rows = await sheet.getRows();
  console.log('Total rows found:', rows.length);
  
  // Get headers from the first row
  const headers = rows.length > 0 ? Object.keys(rows[0]._rawData).map((_, index) => rows[0]._rawData[index]) : [];
  console.log('Headers found:', headers);
  console.log('Headers with indices:', headers.map((header, index) => `${index}: ${header}`));
  
  return { sheet, rows, headers };
}

export async function searchByRadicado(radicado) {
  try {
    console.log('Searching for radicado:', radicado);
    const { rows } = await getSheetData();
    
    const result = rows.find(row => {
      const rowRadicado = String(row._rawData[0] || '').trim();
      const searchRadicado = String(radicado).trim();
      console.log('Comparing:', `"${rowRadicado}"`, 'with:', `"${searchRadicado}"`);
      return rowRadicado === searchRadicado;
    });
    
    if (!result) {
      console.log('No matching radicado found');
      return { found: false, message: 'No se encontró ningún registro con ese número de radicado.' };
    }
    
    console.log('Found matching radicado:', result._rawData[0]);
    return {
      found: true,
      data: {
        source: 'Hoja 1',
        radicado: result._rawData[0],
        predio: result._rawData[1],
        municipio: result._rawData[2],
        solicitante: result._rawData[3],
        opositor: result._rawData[4],
        estado: result._rawData[5],
        ultimaActuacion: result._rawData[6],
        fechaProvidencia: result._rawData[7],
        fechaNotificacion: result._rawData[8],
        diasUltimaActuacion: result._rawData[9],
        enlace: result._rawData[10],
        sustanciador: result._rawData[11]
      }
    };
  } catch (error) {
    console.error('Error in searchByRadicado:', error);
    throw error;
  }
}

export async function searchByFolio(folio) {
  try {
    console.log('Searching for folio:', folio);
    const { rows } = await getSheetData();
    
    // Validar el formato del folio ingresado
    const folioFormat = /^\d{3}-\d{2,6}$/;
    if (!folioFormat.test(folio.trim())) {
      return {
        found: false,
        message: 'El formato del Folio de Matrícula debe ser 000-0000 o 000-00000. Por ejemplo: 060-XXXX o 062-XXXXX'
      };
    }

    // Buscar en la columna del predio (índice 1)
    const results = rows.filter(row => {
      const predioText = String(row._rawData[1] || '').trim();
      console.log('Checking predio text:', predioText);
      
      // Buscar específicamente el patrón "FMI" seguido del número
      const fmiPattern = new RegExp(`FMI\\s*${folio.trim()}`, 'i');
      const found = fmiPattern.test(predioText);
      if (found) {
        console.log('Match found for folio:', folio, 'in:', predioText);
      }
      return found;
    });
    
    console.log('Total results found:', results.length);
    
    if (results.length === 0) {
      return {
        found: false,
        message: 'No se encontraron registros con ese número de Folio de Matrícula.'
      };
    }

    return {
      found: true,
      data: results.map(row => ({
        source: 'Hoja 1',
        radicado: row._rawData[0],
        predio: row._rawData[1],
        municipio: row._rawData[2],
        solicitante: row._rawData[3],
        opositor: row._rawData[4],
        estado: row._rawData[5],
        ultimaActuacion: row._rawData[6],
        fechaProvidencia: row._rawData[7],
        fechaNotificacion: row._rawData[8],
        diasUltimaActuacion: row._rawData[9],
        enlace: row._rawData[10],
        sustanciador: row._rawData[11]
      }))
    };
  } catch (error) {
    console.error('Error searching by folio:', error);
    throw error;
  }
}
