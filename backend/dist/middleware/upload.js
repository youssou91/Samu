"use strict";const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { BadRequestError } = require('../utils/errors');

// Créer le répertoire de téléchargement s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Répertoire de téléchargement créé: ${uploadDir}`);
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtre de fichiers
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  const error = new BadRequestError(
    'Type de fichier non pris en charge. Formats acceptés: jpeg, jpg, png, gif, pdf, doc, docx, txt.'
  );

  cb(error, false);
};

// Configuration de Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Middleware pour gérer les erreurs de téléchargement
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Une erreur Multer s'est produite lors du téléchargement
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError('La taille du fichier dépasse la limite autorisée (5MB)'));
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new BadRequestError('Trop de fichiers téléchargés'));
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new BadRequestError('Champ de fichier inattendu'));
    }

    return next(new BadRequestError(`Erreur lors du téléchargement du fichier: ${err.message}`));
  } else if (err) {
    // Une erreur inattendue s'est produite
    return next(err);
  }

  next();
};

// Middleware pour supprimer un fichier
const deleteFile = (filePath) => {
  const fullPath = path.join(uploadDir, filePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      logger.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
      return false;
    }

    logger.info(`Fichier supprimé avec succès: ${filePath}`);
    return true;
  });
};

// Middleware pour supprimer plusieurs fichiers
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }

  filePaths.forEach((filePath) => {
    if (filePath) {
      deleteFile(filePath);
    }
  });
};

// Middleware pour valider la présence d'un fichier
const requireFile = (fieldName) => {
  return (req, res, next) => {
    if (!req.file) {
      return next(new BadRequestError(`Le fichier '${fieldName}' est requis`));
    }

    next();
  };
};

// Middleware pour valider la présence de plusieurs fichiers
const requireFiles = (fieldName, minCount = 1) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName] || req.files[fieldName].length < minCount) {
      return next(new BadRequestError(`Au moins ${minCount} fichier(s) '${fieldName}' est/sont requis`));
    }

    next();
  };
};

// Middleware pour télécharger un seul fichier
const uploadSingle = (fieldName) => {
  return [
  upload.single(fieldName),
  handleUploadError];

};

// Middleware pour télécharger plusieurs fichiers
const uploadMultiple = (fieldName, maxCount = 5) => {
  return [
  upload.array(fieldName, maxCount),
  handleUploadError];

};

// Middleware pour télécharger des fichiers avec des champs spécifiques
const uploadFields = (fields) => {
  return [
  upload.fields(fields),
  handleUploadError];

};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  deleteFiles,
  requireFile,
  requireFiles,
  uploadDir
};
//# sourceMappingURL=upload.js.map