"use strict";const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError
} = require('./errors');

/**
 * Génère un token JWT
 * @param {string} userId - L'ID de l'utilisateur
 * @param {string} role - Le rôle de l'utilisateur
 * @param {string} expiresIn - La durée de validité du token (ex: '1d', '7d')
 * @returns {Promise<string>} Le token JWT
 */
const generateToken = async (userId, role, expiresIn = '1d') => {
  try {
    const payload = {
      sub: userId,
      role,
      iat: Math.floor(Date.now() / 1000)
    };

    const signAsync = promisify(jwt.sign).bind(jwt);
    return await signAsync(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error('Erreur lors de la génération du token:', error);
    throw new InternalServerError('Erreur lors de la génération du token');
  }
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Le token JWT à vérifier
 * @returns {Promise<Object>} Le payload décodé
 */
const verifyToken = async (token) => {
  try {
    const verifyAsync = promisify(jwt.verify).bind(jwt);
    return await verifyAsync(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Token invalide');
    }
    logger.error('Erreur lors de la vérification du token:', error);
    throw new InternalServerError('Erreur lors de la vérification du token');
  }
};

/**
 * Génère un hash de mot de passe avec bcrypt
 * @param {string} password - Le mot de passe à hacher
 * @returns {Promise<string>} Le mot de passe haché
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Erreur lors du hachage du mot de passe:', error);
    throw new InternalServerError('Erreur lors du hachage du mot de passe');
  }
};

/**
 * Compare un mot de passe avec un hash
 * @param {string} password - Le mot de passe en clair
 * @param {string} hashedPassword - Le mot de passe haché
 * @returns {Promise<boolean>} True si les mots de passe correspondent
 */
const comparePasswords = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Erreur lors de la comparaison des mots de passe:', error);
    throw new InternalServerError('Erreur lors de la vérification du mot de passe');
  }
};

/**
 * Génère un token de réinitialisation de mot de passe
 * @returns {string} Un token sécurisé
 */
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.
  createHash('sha256').
  update(resetToken).
  digest('hex');

  return { resetToken, hashedToken };
};

/**
 * Formate une date au format français
 * @param {Date} date - La date à formater
 * @param {boolean} withTime - Inclure l'heure dans le formatage
 * @returns {string} La date formatée
 */
const formatFrenchDate = (date, withTime = false) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Calcule la durée entre deux dates en minutes
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {number} Durée en minutes
 */
const getDurationInMinutes = (startDate, endDate) => {
  return Math.round((endDate - startDate) / (1000 * 60));
};

/**
 * Vérifie si une date est un jour ouvré (du lundi au vendredi)
 * @param {Date} date - La date à vérifier
 * @returns {boolean} True si c'est un jour ouvré
 */
const isWorkingDay = (date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = lundi, 5 = vendredi
};

/**
 * Vérifie si une heure est dans les heures ouvrables (9h-18h)
 * @param {Date} date - La date avec l'heure à vérifier
 * @returns {boolean} True si c'est une heure ouvrable
 */
const isWorkingHour = (date) => {
  const hours = date.getHours();
  return hours >= 9 && hours < 18;
};

/**
 * Génère un numéro de dossier unique
 * @returns {string} Un numéro de dossier unique
 */
const generateDossierNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DOS-${year}${month}-${random}`;
};

module.exports = {
  // Génération et vérification
  generateToken,
  verifyToken,
  hashPassword,
  comparePasswords,
  generateResetToken,

  // Dates
  formatFrenchDate,
  getDurationInMinutes,
  isWorkingDay,
  isWorkingHour,

  // Utilitaires
  generateDossierNumber,

  // Erreurs
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,

  // Autres
  uuidv4,
  moment,
  logger
};
//# sourceMappingURL=index.js.map