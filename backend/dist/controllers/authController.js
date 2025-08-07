"use strict";const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');

// Générer un token JWT
const genererToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Inscription d'un nouvel utilisateur
exports.inscription = async (req, res) => {
  try {
    const { prenom, nom, email, motDePasse, role = 'secretaire', telephone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
      return res.status(400).json({
        succes: false,
        message: 'Erreur de validation',
        erreurs: [
        { champ: 'email', message: 'Cet email est déjà utilisé' }]

      });
    }

    // Créer un nouvel utilisateur
    const utilisateur = await Utilisateur.create({
      prenom,
      nom,
      email,
      motDePasse,
      role,
      telephone
    });

    // Générer le token
    const token = genererToken(utilisateur._id, utilisateur.role);

    // Envoyer la réponse
    res.status(201).json({
      succes: true,
      message: 'Utilisateur enregistré avec succès',
      donnees: {
        utilisateur: {
          _id: utilisateur._id,
          prenom: utilisateur.prenom,
          nom: utilisateur.nom,
          email: utilisateur.email,
          role: utilisateur.role,
          telephone: utilisateur.telephone
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: error.message
    });
  }
};

// Connexion d'un utilisateur
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Vérifier si l'utilisateur existe et est actif
    const utilisateur = await Utilisateur.findOne({ email, actif: true });
    if (!utilisateur) {
      return res.status(401).json({
        succes: false,
        message: 'Identifiants invalides',
        erreurs: [
        { champ: 'email', message: 'Email ou mot de passe incorrect' },
        { champ: 'motDePasse', message: 'Email ou mot de passe incorrect' }]

      });
    }

    // Vérifier le mot de passe
    const estValide = await utilisateur.verifierMotDePasse(motDePasse);
    if (!estValide) {
      return res.status(401).json({
        succes: false,
        message: 'Identifiants invalides',
        erreurs: [
        { champ: 'email', message: 'Email ou mot de passe incorrect' },
        { champ: 'motDePasse', message: 'Email ou mot de passe incorrect' }]

      });
    }

    // Mettre à jour la dernière connexion
    utilisateur.derniereConnexion = Date.now();
    await utilisateur.save();

    // Générer le token
    const token = genererToken(utilisateur._id, utilisateur.role);

    // Envoyer la réponse
    res.status(200).json({
      succes: true,
      message: 'Connexion réussie',
      donnees: {
        utilisateur: {
          _id: utilisateur._id,
          prenom: utilisateur.prenom,
          nom: utilisateur.nom,
          email: utilisateur.email,
          role: utilisateur.role,
          telephone: utilisateur.telephone,
          derniereConnexion: utilisateur.derniereConnexion
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      succes: false,
      message: 'Une erreur est survenue lors de la connexion',
      erreur: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.obtenirProfil = async (req, res) => {
  try {
    // Récupérer l'utilisateur avec les champs nécessaires
    const utilisateur = await Utilisateur.findById(req.user.id).
    select('-motDePasse -__v -dateCreation -dateMiseAJour').
    lean();

    if (!utilisateur) {
      return res.status(404).json({
        succes: false,
        message: 'Utilisateur non trouvé',
        erreurs: [
        { champ: 'utilisateur', message: 'Aucun utilisateur trouvé avec cet identifiant' }]

      });
    }

    // Formater la réponse
    const reponse = {
      _id: utilisateur._id,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
      specialite: utilisateur.specialite,
      actif: utilisateur.actif,
      derniereConnexion: utilisateur.derniereConnexion
    };

    res.status(200).json({
      succes: true,
      message: 'Profil utilisateur récupéré avec succès',
      donnees: {
        utilisateur: reponse
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      succes: false,
      message: 'Une erreur est survenue lors de la récupération du profil',
      erreur: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//# sourceMappingURL=authController.js.map