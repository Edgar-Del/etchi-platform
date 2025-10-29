// src/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createError } = require('./error.middleware');

// Garantir que o diretório de uploads existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * @function generateFilename
 * @description Gera nome único para arquivos
 */
const generateFilename = (file) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(file.originalname);
  return `${timestamp}_${randomString}${extension}`;
};

/**
 * @configuration storage
 * @description Configuração de armazenamento para Multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    // Organizar por tipo de arquivo
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('application/pdf')) {
      folder = 'documents';
    }
    
    const destPath = path.join(uploadsDir, folder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  }
});

/**
 * @function fileFilter
 * @description Filtro para tipos de arquivo permitidos
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'application/pdf': true
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(createError(
      `Tipo de arquivo não permitido. Tipos aceitos: ${Object.keys(allowedMimes).join(', ')}`,
      400
    ), false);
  }
};

/**
 * @middleware uploadMiddleware
 * @description Middleware principal de upload com Multer
 * @module middlewares/upload
 */
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // máximo de 5 arquivos
  }
});

/**
 * @middleware singleUpload
 * @description Upload de um único arquivo
 * @param {string} fieldName - Nome do campo do arquivo
 */
const singleUpload = (fieldName) => (req, res, next) => {
  uploadMiddleware.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createError('Arquivo muito grande. Tamanho máximo: 5MB', 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(createError('Muitos arquivos. Máximo: 5 arquivos', 400));
      }
      return next(err);
    }
    next();
  });
};

/**
 * @middleware multipleUpload
 * @description Upload de múltiplos arquivos
 * @param {string} fieldName - Nome do campo dos arquivos
 * @param {number} maxCount - Número máximo de arquivos
 */
const multipleUpload = (fieldName, maxCount = 5) => (req, res, next) => {
  uploadMiddleware.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createError('Arquivo muito grande. Tamanho máximo: 5MB', 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(createError(`Muitos arquivos. Máximo: ${maxCount} arquivos`, 400));
      }
      return next(err);
    }
    next();
  });
};

/**
 * @middleware imageUpload
 * @description Upload específico para imagens
 */
const imageUpload = singleUpload('image');

/**
 * @middleware documentUpload
 * @description Upload específico para documentos
 */
const documentUpload = singleUpload('document');

/**
 * @function deleteFile
 * @description Deleta arquivo do sistema de arquivos
 */
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Erro ao deletar arquivo:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  uploadMiddleware,
  singleUpload,
  multipleUpload,
  imageUpload,
  documentUpload,
  deleteFile
};