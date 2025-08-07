const { Types } = require('mongoose');
const { BadRequestError } = require('../utils/errors');

/**
 * Vérifie si une valeur est un ID MongoDB valide
 * @param {string} value - La valeur à valider
 * @param {Object} helpers - Les helpers Joi
 * @returns {string} L'ID si valide
 * @throws {BadRequestError} Si l'ID n'est pas valide
 */
const objectId = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestError('ID invalide');
  }
  return value;
};

/**
 * Vérifie si une valeur est une adresse email valide
 * @param {string} value - La valeur à valider
 * @param {Object} helpers - Les helpers Joi
 * @returns {string} L'email en minuscules si valide
 */
const email = (value, helpers) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value.toLowerCase();
};

/**
 * Vérifie si une valeur est un numéro de téléphone valide (format français)
 * @param {string} value - La valeur à valider
 * @param {Object} helpers - Les helpers Joi
 * @returns {string} Le numéro de téléphone si valide
 */
const phoneNumber = (value, helpers) => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  if (!phoneRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value.replace(/[\s.-]/g, ''); // Supprime les espaces et tirets
};

/**
 * Vérifie si une valeur est une date de naissance valide (au moins 18 ans)
 * @param {string} value - La valeur à valider
 * @param {Object} helpers - Les helpers Joi
 * @returns {Date} La date de naissance si valide
 */
const birthDate = (value, helpers) => {
  const birthDate = new Date(value);
  const today = new Date();
  const minAgeDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  if (birthDate > minAgeDate) {
    return helpers.error('date.min');
  }
  return value;
};

/**
 * Vérifie si un mot de passe est suffisamment fort
 * - Au moins 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 * @param {string} value - Le mot de passe à valider
 * @param {Object} helpers - Les helpers Joi
 * @returns {string} Le mot de passe si valide
 */
const password = (value, helpers) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

module.exports = {
  objectId,
  email,
  phoneNumber,
  birthDate,
  password,
};
