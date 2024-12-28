import multer from 'multer';
import { join } from 'path';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create a temporary directory for uploads
      const uploadDir = await mkdtemp(join(tmpdir(), 'excel-upload-'));
      console.log(`Created temporary upload directory: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error, '');
    }
  },
  filename: function (req, file, cb) {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Uploaded file details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    encoding: file.encoding
  });

  // Validate file type
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/excel',
    'application/x-excel',
    'application/x-msexcel'
  ];

  // Also check file extension
  const allowedExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
  const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) || 
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    console.error(`Invalid file type: ${file.mimetype}`);
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Limit to single file upload
  }
});