import XLSX from 'xlsx';
import { access, constants, stat } from 'fs/promises';
import path from 'path';

class ExcelService {
  constructor() {
    this.excelData = [];
    this.headers = [];
  }

  loadExcelFile(filePath) {
    try {
      // Verify file is readable
      this._verifyFileReadable(filePath);

      // Read the workbook
      const workbook = XLSX.readFile(filePath);
      
      // Get the first sheet name
      const sheetName = workbook.SheetNames[0];
      
      // Convert sheet to JSON
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,  // Treat first row as headers
        defval: '',  // Use empty string for undefined cells
      });

      // Validate data
      if (!jsonData || jsonData.length < 2) {
        throw new Error('El archivo Excel está vacío o no tiene datos');
      }

      // Extract headers (first row)
      this.headers = jsonData[0].map(header => 
        typeof header === 'string' ? header.trim().toLowerCase() : header
      );

      // Validate required columns
      const requiredColumns = ['radicado', 'fecha', 'estado', 'vencimiento'];
      const missingColumns = requiredColumns.filter(
        col => !this.headers.includes(col)
      );

      if (missingColumns.length > 0) {
        throw new Error(`Columnas requeridas no encontradas: ${missingColumns.join(', ')}`);
      }

      // Convert to objects, skipping header row
      this.excelData = jsonData.slice(1).map(row => 
        this._createRowObject(row)
      );

      console.log(`Loaded ${this.excelData.length} rows from Excel file`);
      return this.excelData;
    } catch (error) {
      console.error('Error loading Excel file:', error);
      throw error;
    }
  }

  async _verifyFileReadable(filePath) {
    try {
      // Verify file exists and is readable
      const resolvedPath = path.resolve(filePath);
      
      // Check file accessibility using fs/promises
      const fileStats = await stat(resolvedPath);
      
      if (fileStats.size === 0) {
        throw new Error('El archivo está vacío');
      }

      console.log(`File verified: ${resolvedPath}, Size: ${fileStats.size} bytes`);
    } catch (error) {
      console.error('File accessibility error:', error);
      throw new Error(`No se puede leer el archivo: ${error.message}`);
    }
  }

  _createRowObject(row) {
    // Create an object mapping headers to row values
    const rowObject = {};
    this.headers.forEach((header, index) => {
      let value = row[index];
      
      // Special handling for dates
      if (header === 'fecha' || header === 'vencimiento') {
        // If it's an Excel date serial number, convert it
        if (typeof value === 'number') {
          value = this._convertExcelDate(value);
        }
      }
      
      // Trim and convert to string, preserving original formatting
      rowObject[header] = value !== undefined ? String(value).trim() : '';
    });
    
    return rowObject;
  }

  _convertExcelDate(serial) {
    // Excel stores dates as number of days since 1900-01-01
    const excelEpoch = new Date(1900, 0, -1);
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    
    // Format date as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  printAllRadicados() {
    console.log('All Radicados:');
    this.excelData.forEach((row, index) => {
      console.log(`Row ${index + 1}: "${row.radicado}"`);
    });
    console.log(`Total Radicados: ${this.excelData.length}`);
  }

  searchByRadicado(query) {
    // Normalize query to handle case-insensitive and trim
    const normalizedQuery = String(query).trim().toLowerCase();

    console.log('Searching Radicado:', {
      query: query,
      normalizedQuery: normalizedQuery,
      totalRows: this.excelData.length,
      headers: this.headers
    });

    // Print all radicados for debugging
    this.printAllRadicados();

    // Find match supporting partial and full matches
    const result = this.excelData.find(row => {
      const normalizedRowRadicado = String(row.radicado).trim().toLowerCase();
      
      console.log('Comparing:', {
        rowRadicado: row.radicado,
        normalizedRowRadicado: normalizedRowRadicado,
        query: normalizedQuery
      });
      
      // Check for exact match
      if (normalizedRowRadicado === normalizedQuery) return true;
      
      // Check for partial match (useful for hyphenated or complex radicados)
      if (normalizedRowRadicado.includes(normalizedQuery)) return true;
      
      return false;
    });

    console.log('Search Result:', {
      found: !!result,
      resultDetails: result
    });

    return result 
      ? { found: true, data: result }
      : { found: false, data: null };
  }

  searchByAsunto(query) {
    // Normalize query to handle case-insensitive and partial matches
    const normalizedQuery = String(query).trim().toLowerCase();

    console.log('Searching Asunto:', {
      query: query,
      normalizedQuery: normalizedQuery,
      totalRows: this.excelData.length
    });

    // Find matches where asunto contains the query
    const results = this.excelData.filter(row => {
      // Ensure asunto exists and convert to lowercase
      const asunto = String(row.asunto || '').trim().toLowerCase();
      
      console.log('Comparing Asunto:', {
        rowAsunto: row.asunto,
        normalizedAsunto: asunto,
        query: normalizedQuery
      });

      // Check if the normalized query is a substring of the normalized asunto
      return asunto.includes(normalizedQuery);
    });

    console.log('Asunto Search Results:', {
      found: results.length > 0,
      count: results.length
    });

    return {
      found: results.length > 0,
      count: results.length,
      data: results
    };
  }

  getFullRowDetails(row) {
    // Ensure row is an object with expected properties
    if (!row || typeof row !== 'object') {
      return 'Información no disponible';
    }

    // Define a mapping of display names for better readability
    const displayNames = {
      radicado: 'Radicado',
      fecha: 'Fecha',
      asunto: 'Asunto',
      asignadoA: 'Asignado A',
      vencimiento: 'Fecha de Vencimiento',
      respuesta: 'Respuesta',
      estado: 'Estado',
      enlace: 'Enlace'
    };

    // Format the row details with line breaks and consistent formatting
    return Object.entries(displayNames)
      .filter(([key]) => row[key]) // Only include keys with values
      .map(([key, displayName]) => 
        `${displayName}: ${row[key]}`
      )
      .join('\n\n'); // Double line break for better readability
  }

  getStatusSummary() {
    const statusCounts = {};
    this.excelData.forEach(row => {
      const status = row.estado || 'Sin estado';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return statusCounts;
  }

  getUpcomingDeadlines(daysAhead = 7) {
    const today = new Date();
    return this.excelData.filter(row => {
      try {
        const vencimientoDate = new Date(row.vencimiento);
        const daysDiff = (vencimientoDate - today) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= daysAhead;
      } catch {
        return false;
      }
    }).map(row => ({
      ...row,
      diasRestantes: Math.ceil((new Date(row.vencimiento) - today) / (1000 * 60 * 60 * 24))
    }));
  }

  printAllData() {
    console.log('Excel Data Overview:', {
      totalRows: this.excelData.length,
      headers: this.headers,
      sampleRows: this.excelData.slice(0, 10)
    });
  }
}

export const excelService = new ExcelService();