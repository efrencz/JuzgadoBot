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

let doc = null;
let isInitialized = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

export async function initializeSheet(retry = 0) {
    if (isInitialized && doc) {
        try {
            // Verificar si la conexión sigue activa
            await doc.loadInfo();
            return doc;
        } catch (error) {
            console.log('Conexión perdida, intentando reconectar...');
            isInitialized = false;
        }
    }

    try {
        console.log(`Initializing Google Sheets with Sheet ID: ${SHEET_ID}`);
        
        const serviceAccountAuth = new JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        await serviceAccountAuth.authorize();
        doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        isInitialized = true;
        console.log('Google Sheets initialized successfully');
        return doc;
    } catch (error) {
        console.error('Error initializing Google Sheets:', error);
        
        if (retry < MAX_RETRIES) {
            console.log(`Retrying initialization (${retry + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return initializeSheet(retry + 1);
        }
        
        throw new Error(`Failed to initialize Google Sheets after ${MAX_RETRIES} attempts`);
    }
}

async function getSheetData() {
    try {
        // Asegurar que la conexión está activa antes de cada operación
        await initializeSheet();
        
        const sheet = doc.sheetsByIndex[0];
        console.log('Loading first sheet:', sheet.title);
        await sheet.loadCells();
        
        const rows = await sheet.getRows();
        console.log('Total rows found:', rows.length);
        
        // Get headers from the first row
        const headers = rows.length > 0 ? Object.keys(rows[0]._rawData).map((_, index) => rows[0]._rawData[index]) : [];
        console.log('Headers found:', headers);
        console.log('Headers with indices:', headers.map((header, index) => `${index}: ${header}`));
        
        return { sheet, rows, headers };
    } catch (error) {
        console.error('Error getting sheet data:', error);
        throw error;
    }
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
